package attention

import (
	"net/http"
	"time"

	"github.com/raiden0456/pulse/internal/httpx"
	"github.com/raiden0456/pulse/internal/store/db"
)

const (
	maxKeyLen = 128
	retention = 30 * 24 * time.Hour
)

type Resolved struct {
	Key        string `json:"key"`
	ResolvedAt int64  `json:"resolved_at"`
}

type Service struct {
	q *db.Queries
}

func New(q *db.Queries) *Service {
	return &Service{q: q}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/attention/resolved", httpx.Handle(s.list))
	mux.HandleFunc("PUT /api/attention/resolved/{key}", httpx.Handle(s.resolve))
	mux.HandleFunc("DELETE /api/attention/resolved/{key}", httpx.Handle(s.unresolve))
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) error {
	rows, err := s.q.ListResolvedItems(r.Context())
	if err != nil {
		return err
	}
	out := make([]Resolved, len(rows))
	for i, row := range rows {
		out[i] = Resolved{Key: row.Key, ResolvedAt: row.ResolvedAt}
	}
	httpx.JSON(w, http.StatusOK, out)
	return nil
}

func (s *Service) resolve(w http.ResponseWriter, r *http.Request) error {
	key, err := pathKey(r)
	if err != nil {
		return err
	}
	if err := s.q.DeleteResolvedBefore(r.Context(), time.Now().Add(-retention).Unix()); err != nil {
		return err
	}
	if err := s.q.ResolveItem(r.Context(), key); err != nil {
		return err
	}
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (s *Service) unresolve(w http.ResponseWriter, r *http.Request) error {
	key, err := pathKey(r)
	if err != nil {
		return err
	}
	if err := s.q.UnresolveItem(r.Context(), key); err != nil {
		return err
	}
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func pathKey(r *http.Request) (string, error) {
	key := r.PathValue("key")
	if key == "" || len(key) > maxKeyLen {
		return "", httpx.Errorf(http.StatusBadRequest, "invalid key")
	}
	return key, nil
}
