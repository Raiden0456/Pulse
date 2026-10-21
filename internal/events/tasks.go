package events

import "strings"

var taskAliases = []struct {
	prefix string
	task   string
}{
	{"morning brief", "morning-brief"},
	{"утренний бриф", "morning-brief"},
	{"pre-standup brief", "pre-standup-brief"},
	{"pre standup brief", "pre-standup-brief"},
	{"перед стендапом", "pre-standup-brief"},
	{"предстендапный бриф", "pre-standup-brief"},
	{"weekly review", "weekly-review"},
	{"еженедельный итог", "weekly-review"},
	{"итог недели", "weekly-review"},
}

// CanonicalTask maps the display names my scheduled tasks used to write instead of their ids,
// e.g. "Morning brief (weekdays 9:00 Barcelona)", to the id, so old and new rows count as one task.
func CanonicalTask(task string) string {
	lower := strings.ToLower(strings.TrimSpace(task))
	for _, a := range taskAliases {
		if strings.HasPrefix(lower, a.prefix) {
			return a.task
		}
	}
	return task
}
