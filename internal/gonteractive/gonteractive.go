package gonteractive

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/raiden0456/pulse/internal/httpx"
	"github.com/raiden0456/pulse/internal/remote"
)

const activityDays = 7

type DailyState string

const (
	DailyOff        DailyState = "off"
	DailyScheduled  DailyState = "scheduled"
	DailyInProgress DailyState = "in_progress"
	DailyDone       DailyState = "done"
)

type progress struct {
	Streak       int   `json:"streak"`
	ActiveToday  bool  `json:"activeToday"`
	AnswersToday int   `json:"answersToday"`
	DueCount     int64 `json:"dueCount"`
	Activity     []struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	} `json:"activity"`
}

type daily struct {
	QuizID      *int64 `json:"quizId"`
	Enabled     bool   `json:"enabled"`
	ScheduledAt int64  `json:"scheduledAt"`
}

type quizSummary struct {
	ID          int64    `json:"id"`
	CompletedAt *int64   `json:"completedAt"`
	Total       int64    `json:"total"`
	Answered    int      `json:"answered"`
	Score       *float64 `json:"score"`
}

type Daily struct {
	State       DailyState `json:"state"`
	Answered    int        `json:"answered"`
	Total       int64      `json:"total"`
	Score       *float64   `json:"score"`
	ScheduledAt int64      `json:"scheduled_at"`
}

type Summary struct {
	URL          string `json:"url"`
	Configured   bool   `json:"configured"`
	Available    bool   `json:"available"`
	Streak       int    `json:"streak"`
	ActiveToday  bool   `json:"active_today"`
	AnswersToday int    `json:"answers_today"`
	DueCount     int64  `json:"due_count"`
	Activity     []int  `json:"activity"`
	Daily        Daily  `json:"daily"`
}

type Service struct {
	client *remote.Client
}

func New(base, password string) *Service {
	return &Service{client: remote.New(base, password)}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/summary/gonteractive", httpx.Handle(s.summary))
}

func (s *Service) summary(w http.ResponseWriter, r *http.Request) error {
	if !s.client.Configured() {
		httpx.JSON(w, http.StatusOK, Summary{})
		return nil
	}
	sum, err := s.Summary(r.Context())
	if err != nil {
		slog.Warn("gonteractive summary unavailable", "err", err)
		httpx.JSON(w, http.StatusOK, Summary{URL: s.client.Base(), Configured: true})
		return nil
	}
	httpx.JSON(w, http.StatusOK, sum)
	return nil
}

func (s *Service) Summary(ctx context.Context) (Summary, error) {
	var p progress
	if err := s.client.Get(ctx, "/api/progress", &p); err != nil {
		return Summary{}, err
	}
	var d daily
	if err := s.client.Get(ctx, "/api/daily", &d); err != nil {
		return Summary{}, err
	}
	var quiz *quizSummary
	if d.QuizID != nil {
		var quizzes []quizSummary
		if err := s.client.Get(ctx, "/api/quizzes?limit=50", &quizzes); err != nil {
			return Summary{}, err
		}
		for i := range quizzes {
			if quizzes[i].ID == *d.QuizID {
				quiz = &quizzes[i]
				break
			}
		}
	}

	sum := Summary{
		URL:          s.client.Base(),
		Configured:   true,
		Available:    true,
		Streak:       p.Streak,
		ActiveToday:  p.ActiveToday,
		AnswersToday: p.AnswersToday,
		DueCount:     p.DueCount,
		Activity:     make([]int, 0, activityDays),
		Daily:        dailyStatus(d, quiz),
	}
	for _, day := range p.Activity[max(0, len(p.Activity)-activityDays):] {
		sum.Activity = append(sum.Activity, day.Count)
	}
	return sum, nil
}

func dailyStatus(d daily, quiz *quizSummary) Daily {
	out := Daily{State: DailyScheduled, ScheduledAt: d.ScheduledAt}
	switch {
	case quiz != nil && quiz.CompletedAt != nil:
		out.State = DailyDone
	case quiz != nil:
		out.State = DailyInProgress
	case !d.Enabled:
		out.State = DailyOff
	}
	if quiz != nil {
		out.Answered, out.Total, out.Score = quiz.Answered, quiz.Total, quiz.Score
	}
	return out
}
