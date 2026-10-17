package jobsearch

import (
	"context"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/raiden0456/pulse/internal/httpx"
	"github.com/raiden0456/pulse/internal/remote"
)

const staleAfter = 10 * 24 * time.Hour

type application struct {
	Date   string `json:"date"`
	Status string `json:"status"`
	Notes  string `json:"notes"`
}

type job struct {
	Status      string `json:"status"`
	Verdict     string `json:"verdict"`
	AppliedSlug string `json:"appliedSlug"`
	Dismissed   any    `json:"dismissed"`
}

type Shortlist struct {
	Total  int `json:"total"`
	Strong int `json:"strong"`
	Good   int `json:"good"`
}

type Summary struct {
	URL        string         `json:"url"`
	Configured bool           `json:"configured"`
	Available  bool           `json:"available"`
	Statuses   map[string]int `json:"statuses"`
	Stale      int            `json:"stale"`
	Shortlist  Shortlist      `json:"shortlist"`
}

type Service struct {
	client *remote.Client
}

func New(base, password string) *Service {
	return &Service{client: remote.New(base, password)}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/summary/jobsearch", httpx.Handle(s.summary))
}

func (s *Service) summary(w http.ResponseWriter, r *http.Request) error {
	if !s.client.Configured() {
		httpx.JSON(w, http.StatusOK, Summary{})
		return nil
	}
	sum, err := s.Summary(r.Context(), time.Now())
	if err != nil {
		slog.Warn("job search summary unavailable", "err", err)
		httpx.JSON(w, http.StatusOK, Summary{URL: s.client.Base(), Configured: true})
		return nil
	}
	httpx.JSON(w, http.StatusOK, sum)
	return nil
}

func (s *Service) Summary(ctx context.Context, now time.Time) (Summary, error) {
	var apps []application
	if err := s.client.Get(ctx, "/api/applications", &apps); err != nil {
		return Summary{}, err
	}
	var jobs []job
	if err := s.client.Get(ctx, "/api/jobs", &jobs); err != nil {
		return Summary{}, err
	}
	sum := summarize(apps, jobs, now)
	sum.URL = s.client.Base()
	return sum, nil
}

func summarize(apps []application, jobs []job, now time.Time) Summary {
	sum := Summary{Configured: true, Available: true, Statuses: map[string]int{}}
	for _, a := range apps {
		status := normalizeStatus(a.Status)
		sum.Statuses[status]++
		if (status == "applied" || status == "interview") && now.Sub(lastActivity(a)) >= staleAfter {
			sum.Stale++
		}
	}
	for _, j := range jobs {
		if j.Status != "ranked" || j.Dismissed != nil || j.AppliedSlug != "" {
			continue
		}
		sum.Shortlist.Total++
		switch j.Verdict {
		case "Strong Fit":
			sum.Shortlist.Strong++
		case "Good Fit":
			sum.Shortlist.Good++
		}
	}
	return sum
}

func normalizeStatus(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		return "unknown"
	}
	return strings.ReplaceAll(s, " ", "_")
}

var noteDate = regexp.MustCompile(`\d{4}-\d{2}-\d{2}`)

// lastActivity mirrors /outcome's "days quiet": the later of the row date and the newest date mentioned in notes.
func lastActivity(a application) time.Time {
	latest, _ := time.Parse(time.DateOnly, a.Date)
	for _, m := range noteDate.FindAllString(a.Notes, -1) {
		if d, err := time.Parse(time.DateOnly, m); err == nil && d.After(latest) {
			latest = d
		}
	}
	return latest
}
