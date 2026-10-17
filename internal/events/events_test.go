package events

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/raiden0456/pulse/internal/store"
	"github.com/raiden0456/pulse/internal/store/db"
)

func TestNormalizePayload(t *testing.T) {
	cases := map[string]string{
		`{"a":1}`:                 `{"a":1}`,
		"```json\n{\"a\":1}\n```": `{"a":1}`,
		"```\n[]\n```":            `[]`,
		"not json":                "null",
		"":                        "null",
	}
	for in, want := range cases {
		if got := NormalizePayload(in); got != want {
			t.Errorf("NormalizePayload(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestIngestDedupesAndLatest(t *testing.T) {
	conn, err := store.Open(t.Context(), filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	q := db.New(conn)
	s := New(q)

	base := time.Date(2026, 10, 17, 21, 0, 0, 0, time.UTC)
	inputs := []Input{
		{Source: "chatgpt", Task: "mail-scan", Status: "ok", Payload: `{}`, RunAt: base},
		{Source: "chatgpt", Task: "mail-scan", Status: "ok", Payload: `{}`, RunAt: base},
		{Source: "chatgpt", Task: "mail-scan", Status: "error", Payload: `{}`, RunAt: base.Add(time.Hour)},
		{Source: "chatgpt", Task: "invoices", Status: "ok", Payload: `{}`, RunAt: base},
	}
	var added int
	for _, in := range inputs {
		isNew, err := s.Ingest(t.Context(), in)
		if err != nil {
			t.Fatal(err)
		}
		if isNew {
			added++
		}
	}
	if added != 3 {
		t.Fatalf("added = %d, want 3", added)
	}

	latest, err := q.LatestEventPerTask(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	if len(latest) != 2 || latest[0].Task != "mail-scan" || latest[0].Status != "error" {
		t.Fatalf("unexpected latest: %+v", latest)
	}
}
