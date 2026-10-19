package attention

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/raiden0456/pulse/internal/store"
	"github.com/raiden0456/pulse/internal/store/db"
)

func TestResolveRoundTrip(t *testing.T) {
	conn, err := store.Open(t.Context(), filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	mux := http.NewServeMux()
	New(db.New(conn)).Routes(mux)

	do := func(method, path string) *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, httptest.NewRequest(method, path, nil))
		return rec
	}
	keys := func() []string {
		var out []Resolved
		json.NewDecoder(do("GET", "/api/attention/resolved").Body).Decode(&out)
		ks := make([]string, len(out))
		for i, r := range out {
			ks[i] = r.Key
		}
		return ks
	}

	for _, k := range []string{"12-mail-0", "12-mail-0", "7-error"} {
		if rec := do("PUT", "/api/attention/resolved/"+k); rec.Code != http.StatusNoContent {
			t.Fatalf("resolve %s: %d", k, rec.Code)
		}
	}
	if got := keys(); len(got) != 2 {
		t.Fatalf("resolved = %v, want 2 unique keys", got)
	}
	if rec := do("DELETE", "/api/attention/resolved/7-error"); rec.Code != http.StatusNoContent {
		t.Fatalf("unresolve: %d", rec.Code)
	}
	if got := keys(); len(got) != 1 || got[0] != "12-mail-0" {
		t.Fatalf("after unresolve = %v", got)
	}
	if rec := do("PUT", "/api/attention/resolved/"+strings.Repeat("x", maxKeyLen+1)); rec.Code != http.StatusBadRequest {
		t.Fatalf("long key accepted: %d", rec.Code)
	}
}
