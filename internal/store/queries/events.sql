-- name: InsertEvent :execrows
INSERT INTO events (source, task, status, summary, payload, run_at)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT (source, task, run_at) DO NOTHING;

-- name: ListEvents :many
SELECT * FROM events ORDER BY run_at DESC, id DESC LIMIT ?;

-- name: ListEventsBefore :many
SELECT * FROM events
WHERE run_at < sqlc.arg(before_run_at) OR (run_at = sqlc.arg(before_run_at) AND id < sqlc.arg(before_id))
ORDER BY run_at DESC, id DESC
LIMIT sqlc.arg(row_limit);

-- name: LatestEventPerTask :many
SELECT e.* FROM events e
WHERE e.run_at = (SELECT MAX(run_at) FROM events WHERE source = e.source AND task = e.task)
ORDER BY e.run_at DESC;

-- name: ListTaskEventsSince :many
SELECT * FROM events WHERE task = ? AND run_at >= ? ORDER BY run_at DESC;
