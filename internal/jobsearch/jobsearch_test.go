package jobsearch

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestSummaryLogsInAndCounts(t *testing.T) {
	logins := 0
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		var body struct{ Password string }
		json.NewDecoder(r.Body).Decode(&body)
		if body.Password != "secret" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		logins++
		http.SetCookie(w, &http.Cookie{Name: "ajs_session", Value: "ok", Path: "/"})
		w.Write([]byte(`{"ok":true}`))
	})
	guard := func(payload string) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if c, err := r.Cookie("ajs_session"); err != nil || c.Value != "ok" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.Write([]byte(payload))
		}
	}
	mux.HandleFunc("GET /api/applications", guard(`[
		{"date":"2026-10-16","status":"drafted","notes":""},
		{"date":"2026-09-01","status":"applied","notes":"followed up 2026-10-15"},
		{"date":"2026-09-01","status":"applied","notes":""},
		{"date":"2026-09-20","status":"No Response","notes":""}
	]`))
	mux.HandleFunc("GET /api/jobs", guard(`[
		{"status":"ranked","verdict":"Strong Fit"},
		{"status":"ranked","verdict":"Good Fit"},
		{"status":"ranked","verdict":"Good Fit","appliedSlug":"x"},
		{"status":"ranked","verdict":"Strong Fit","dismissed":{"reason":"r"}},
		{"status":"skipped"}
	]`))
	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)

	s := New(srv.URL+"/", "secret")
	now := time.Date(2026, 10, 17, 12, 0, 0, 0, time.UTC)
	for range 2 {
		sum, err := s.Summary(t.Context(), now)
		if err != nil {
			t.Fatal(err)
		}
		if sum.Statuses["drafted"] != 1 || sum.Statuses["applied"] != 2 || sum.Statuses["no_response"] != 1 {
			t.Fatalf("statuses = %v", sum.Statuses)
		}
		if sum.Stale != 1 {
			t.Fatalf("stale = %d, want 1", sum.Stale)
		}
		if sum.Shortlist != (Shortlist{Total: 2, Strong: 1, Good: 1}) {
			t.Fatalf("shortlist = %+v", sum.Shortlist)
		}
	}
	if logins != 1 {
		t.Fatalf("logins = %d, want 1 (cookie reused)", logins)
	}

	if _, err := New(srv.URL, "wrong").Summary(t.Context(), now); err == nil {
		t.Fatal("want error with wrong password")
	}
}
