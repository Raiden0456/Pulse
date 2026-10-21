package events

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/raiden0456/pulse/internal/store"
	"github.com/raiden0456/pulse/internal/store/db"
)

func TestCanonicalTask(t *testing.T) {
	cases := map[string]string{
		"Morning brief (weekdays 9:00 Barcelona)":      "morning-brief",
		"Утренний бриф":                                "morning-brief",
		"Pre-standup brief (weekdays 14:40 Barcelona)": "pre-standup-brief",
		"Еженедельный итог недели (пятница 16:00)":     "weekly-review",
		"morning-brief":  "morning-brief",
		"weekly-review":  "weekly-review",
		"mail-scan":      "mail-scan",
		"Something else": "Something else",
	}
	for in, want := range cases {
		if got := CanonicalTask(in); got != want {
			t.Errorf("CanonicalTask(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestIngestCanonicalizesAndDedupes(t *testing.T) {
	conn, err := store.Open(t.Context(), filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	q := db.New(conn)
	s := New(q)
	at := time.Date(2026, 10, 19, 9, 0, 0, 0, time.UTC)

	for _, task := range []string{"Morning brief (weekdays 9:00 Barcelona)", "morning-brief"} {
		if _, err := s.Ingest(t.Context(), Input{Source: "claude", Task: task, Status: "ok", RunAt: at}); err != nil {
			t.Fatal(err)
		}
	}
	latest, err := q.LatestEventPerTask(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	if len(latest) != 1 || latest[0].Task != "morning-brief" {
		t.Fatalf("latest = %+v, want one morning-brief", latest)
	}
}
