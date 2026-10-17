package gonteractive

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func fakeServer(t *testing.T, daily, quizzes string) *httptest.Server {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{Name: "gonteractive_session", Value: "ok", Path: "/"})
		w.WriteHeader(http.StatusNoContent)
	})
	guard := func(payload string) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if c, err := r.Cookie("gonteractive_session"); err != nil || c.Value != "ok" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.Write([]byte(payload))
		}
	}
	activity := `[{"date":"d1","count":1},{"date":"d2","count":2},{"date":"d3","count":3},{"date":"d4","count":4},{"date":"d5","count":5},{"date":"d6","count":6},{"date":"d7","count":7},{"date":"d8","count":8}]`
	mux.HandleFunc("GET /api/progress", guard(`{"streak":12,"activeToday":true,"answersToday":9,"dueCount":4,"activity":`+activity+`}`))
	mux.HandleFunc("GET /api/daily", guard(daily))
	mux.HandleFunc("GET /api/quizzes", guard(quizzes))
	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)
	return srv
}

func TestSummary(t *testing.T) {
	cases := []struct {
		name, daily, quizzes string
		want                 DailyState
		answered             int
	}{
		{"done", `{"quizId":7,"enabled":true,"scheduledAt":1}`, `[{"id":3},{"id":7,"completedAt":5,"total":8,"answered":8,"score":0.75}]`, DailyDone, 8},
		{"in progress", `{"quizId":7,"enabled":true,"scheduledAt":1}`, `[{"id":7,"total":8,"answered":3}]`, DailyInProgress, 3},
		{"scheduled", `{"quizId":null,"enabled":true,"scheduledAt":1}`, `[]`, DailyScheduled, 0},
		{"off", `{"quizId":null,"enabled":false,"scheduledAt":1}`, `[]`, DailyOff, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := fakeServer(t, tc.daily, tc.quizzes)
			sum, err := New(srv.URL, "secret").Summary(t.Context())
			if err != nil {
				t.Fatal(err)
			}
			if sum.Daily.State != tc.want || sum.Daily.Answered != tc.answered {
				t.Fatalf("daily = %+v, want %s/%d", sum.Daily, tc.want, tc.answered)
			}
			if sum.Streak != 12 || sum.DueCount != 4 || len(sum.Activity) != 7 || sum.Activity[0] != 2 || sum.Activity[6] != 8 {
				t.Fatalf("summary = %+v", sum)
			}
		})
	}
}
