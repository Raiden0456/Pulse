package sheets

import "testing"

func TestParseRow(t *testing.T) {
	in, ok := parseRow([]any{"2026-10-17T21:31:08+02:00", "chatgpt", "mail-scan", "ok", "summary", `{"scanned":5}`})
	if !ok || in.Task != "mail-scan" || in.RunAt.Unix() != 1792265468 || in.Payload != `{"scanned":5}` {
		t.Fatalf("unexpected: %+v ok=%v", in, ok)
	}

	if _, ok := parseRow([]any{"", " ", ""}); ok {
		t.Fatal("blank row must be skipped")
	}

	in, ok = parseRow([]any{"yesterday", "", "invoices"})
	if !ok || !in.RunAt.IsZero() || in.Source != "unknown" || in.Status != "unknown" {
		t.Fatalf("unexpected partial row: %+v", in)
	}
}
