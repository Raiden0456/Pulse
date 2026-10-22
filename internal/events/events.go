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
		Task:    CanonicalTask(in.Task),
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
	if task := r.URL.Query().Get("task"); task != "" {
		return s.listTask(w, r, task)
	}
	limit := defaultLimit
	if v := r.URL.Query().Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			return httpx.Errorf(http.StatusBadRequest, "invalid limit")
		}
		limit = min(n, maxLimit)
	}
	var rows []db.Event
	var err error
	if before := r.URL.Query().Get("before"); before != "" {
		runAt, id, ok := parseCursor(before)
		if !ok {
			return httpx.Errorf(http.StatusBadRequest, "before must be <run_at>:<id>")
		}
		rows, err = s.q.ListEventsBefore(r.Context(), db.ListEventsBeforeParams{BeforeRunAt: runAt, BeforeID: id, RowLimit: int64(limit)})
	} else {
		rows, err = s.q.ListEvents(r.Context(), int64(limit))
	}
	if err != nil {
		return err
	}
	httpx.JSON(w, http.StatusOK, toEvents(rows))
	return nil
}

func parseCursor(v string) (int64, int64, bool) {
	a, b, ok := strings.Cut(v, ":")
	if !ok {
		return 0, 0, false
	}
	runAt, err1 := strconv.ParseInt(a, 10, 64)
	id, err2 := strconv.ParseInt(b, 10, 64)
	return runAt, id, err1 == nil && err2 == nil
}

func (s *Service) listTask(w http.ResponseWriter, r *http.Request, task string) error {
	since, err := strconv.ParseInt(r.URL.Query().Get("since"), 10, 64)
	if err != nil {
		return httpx.Errorf(http.StatusBadRequest, "since must be a unix timestamp")
	}
	rows, err := s.q.ListTaskEventsSince(r.Context(), db.ListTaskEventsSinceParams{Task: task, RunAt: since})
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
