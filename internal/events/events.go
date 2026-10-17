package events

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/raiden0456/pulse/internal/httpx"
	"github.com/raiden0456/pulse/internal/store/db"
)

const (
	defaultLimit = 50
	maxLimit     = 200
)

type Input struct {
	Source  string
	Task    string
	Status  string
	Summary string
	Payload string
	RunAt   time.Time
}

type Event struct {
	ID      int64           `json:"id"`
	Source  string          `json:"source"`
	Task    string          `json:"task"`
	Status  string          `json:"status"`
	Summary string          `json:"summary"`
	Payload json.RawMessage `json:"payload"`
	RunAt   int64           `json:"run_at"`
}

type Service struct {
	q *db.Queries
}

func New(q *db.Queries) *Service {
	return &Service{q: q}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/events", httpx.Handle(s.list))
	mux.HandleFunc("GET /api/events/latest", httpx.Handle(s.latest))
}

// Ingest stores the event unless one with the same source, task and run time exists, reporting whether it was new.
func (s *Service) Ingest(ctx context.Context, in Input) (bool, error) {
	n, err := s.q.InsertEvent(ctx, db.InsertEventParams{
		Source:  in.Source,
		Task:    in.Task,
		Status:  in.Status,
		Summary: in.Summary,
		Payload: NormalizePayload(in.Payload),
		RunAt:   in.RunAt.Unix(),
	})
	return n > 0, err
}

// NormalizePayload strips markdown code fences LLMs like to add and maps invalid JSON to null.
func NormalizePayload(raw string) string {
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, "```") {
		raw = strings.TrimPrefix(raw, "```json")
		raw = strings.TrimPrefix(raw, "```")
		raw = strings.TrimSuffix(raw, "```")
		raw = strings.TrimSpace(raw)
	}
	if raw == "" || !json.Valid([]byte(raw)) {
		return "null"
	}
	return raw
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) error {
	limit := defaultLimit
	if v := r.URL.Query().Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			return httpx.Errorf(http.StatusBadRequest, "invalid limit")
		}
		limit = min(n, maxLimit)
	}
	rows, err := s.q.ListEvents(r.Context(), int64(limit))
	if err != nil {
		return err
	}
	httpx.JSON(w, http.StatusOK, toEvents(rows))
	return nil
}

func (s *Service) latest(w http.ResponseWriter, r *http.Request) error {
	rows, err := s.q.LatestEventPerTask(r.Context())
	if err != nil {
		return err
	}
	httpx.JSON(w, http.StatusOK, toEvents(rows))
	return nil
}

func toEvents(rows []db.Event) []Event {
	out := make([]Event, len(rows))
	for i, e := range rows {
		out[i] = Event{
			ID:      e.ID,
			Source:  e.Source,
			Task:    e.Task,
			Status:  e.Status,
			Summary: e.Summary,
			Payload: json.RawMessage(e.Payload),
			RunAt:   e.RunAt,
		}
	}
	return out
}
