package jobsearch

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/raiden0456/pulse/internal/httpx"
)

const (
	requestTimeout = 5 * time.Second
	staleAfter     = 10 * 24 * time.Hour
)

var errUnauthorized = errors.New("unauthorized")

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
	base     string
	password string
	client   *http.Client
	loginMu  sync.Mutex
}

func New(base, password string) *Service {
	jar, _ := cookiejar.New(nil)
	return &Service{
		base:     strings.TrimRight(base, "/"),
		password: password,
		client:   &http.Client{Jar: jar, Timeout: requestTimeout},
	}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/summary/jobsearch", httpx.Handle(s.summary))
}

func (s *Service) summary(w http.ResponseWriter, r *http.Request) error {
	if s.base == "" {
		httpx.JSON(w, http.StatusOK, Summary{})
		return nil
	}
	sum, err := s.Summary(r.Context(), time.Now())
	if err != nil {
		slog.Warn("job search summary unavailable", "err", err)
		httpx.JSON(w, http.StatusOK, Summary{URL: s.base, Configured: true})
		return nil
	}
	httpx.JSON(w, http.StatusOK, sum)
	return nil
}

func (s *Service) Summary(ctx context.Context, now time.Time) (Summary, error) {
	var apps []application
	if err := s.get(ctx, "/api/applications", &apps); err != nil {
		return Summary{}, err
	}
	var jobs []job
	if err := s.get(ctx, "/api/jobs", &jobs); err != nil {
		return Summary{}, err
	}
	sum := summarize(apps, jobs, now)
	sum.URL = s.base
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

func (s *Service) get(ctx context.Context, path string, out any) error {
	err := s.fetch(ctx, path, out)
	if errors.Is(err, errUnauthorized) && s.password != "" {
		if err := s.login(ctx); err != nil {
			return err
		}
		err = s.fetch(ctx, path, out)
	}
	return err
}

func (s *Service) fetch(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.base+path, nil)
	if err != nil {
		return err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch {
	case resp.StatusCode == http.StatusUnauthorized:
		return errUnauthorized
	case resp.StatusCode != http.StatusOK:
		return fmt.Errorf("GET %s: %s", path, resp.Status)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func (s *Service) login(ctx context.Context) error {
	s.loginMu.Lock()
	defer s.loginMu.Unlock()
	body, _ := json.Marshal(map[string]string{"password": s.password})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.base+"/api/auth/login", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("job search login: %s", resp.Status)
	}
	return nil
}
