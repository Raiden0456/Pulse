package apps

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/raiden0456/pulse/internal/config"
	"github.com/raiden0456/pulse/internal/httpx"
)

const probeTimeout = 4 * time.Second

type Status struct {
	config.App
	Up        bool  `json:"up"`
	LatencyMs int64 `json:"latency_ms"`
}

type Service struct {
	apps   []config.App
	client *http.Client
}

func New(apps []config.App) *Service {
	return &Service{
		apps: apps,
		client: &http.Client{
			Timeout:       probeTimeout,
			CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
		},
	}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/apps", httpx.Handle(s.list))
}

func (s *Service) list(w http.ResponseWriter, r *http.Request) error {
	out := make([]Status, len(s.apps))
	var wg sync.WaitGroup
	for i, app := range s.apps {
		wg.Go(func() {
			out[i] = s.probe(r.Context(), app)
		})
	}
	wg.Wait()
	httpx.JSON(w, http.StatusOK, out)
	return nil
}

func (s *Service) probe(ctx context.Context, app config.App) Status {
	st := Status{App: app}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, app.URL, nil)
	if err != nil {
		return st
	}
	start := time.Now()
	resp, err := s.client.Do(req)
	if err != nil {
		return st
	}
	resp.Body.Close()
	st.LatencyMs = time.Since(start).Milliseconds()
	st.Up = resp.StatusCode < http.StatusInternalServerError
	return st
}
