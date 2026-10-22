package events

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/raiden0456/pulse/internal/store"
	"github.com/raiden0456/pulse/internal/store/db"
)

func TestListPagination(t *testing.T) {
	conn, err := store.Open(t.Context(), filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	s := New(db.New(conn))
	base := time.Date(2026, 10, 22, 9, 0, 0, 0, time.UTC)
	for i := range 25 {
		task := "mail-scan"
		if i%2 == 1 {
			task = "invoices"
		}
		at := base.Add(time.Duration(i/2) * time.Minute)
		if _, err := s.Ingest(t.Context(), Input{Source: "chatgpt", Task: task, Status: "ok", Payload: "{}", RunAt: at}); err != nil {
			t.Fatal(err)
		}
	}
	mux := http.NewServeMux()
	s.Routes(mux)
	page := func(query string) []Event {
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, httptest.NewRequest("GET", "/api/events?"+query, nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("%s: %d %s", query, rec.Code, rec.Body)
		}
		var out []Event
		json.NewDecoder(rec.Body).Decode(&out)
		return out
	}

	seen := map[int64]bool{}
	query := "limit=10"
	for pages := 0; ; pages++ {
		events := page(query)
		for _, e := range events {
			if seen[e.ID] {
				t.Fatalf("event %d returned twice", e.ID)
			}
			seen[e.ID] = true
		}
		if len(events) < 10 {
			if pages != 2 || len(seen) != 25 {
				t.Fatalf("pages=%d seen=%d, want 3 pages covering 25 events", pages+1, len(seen))
			}
			break
		}
		last := events[len(events)-1]
		query = fmt.Sprintf("limit=10&before=%d:%d", last.RunAt, last.ID)
	}

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest("GET", "/api/events?before=garbage", nil))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("bad cursor: %d", rec.Code)
	}
}
