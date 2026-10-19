-- name: ResolveItem :exec
INSERT INTO resolved_items (key) VALUES (?)
ON CONFLICT (key) DO NOTHING;

-- name: UnresolveItem :exec
DELETE FROM resolved_items WHERE key = ?;

-- name: ListResolvedItems :many
SELECT key, resolved_at FROM resolved_items ORDER BY resolved_at DESC;

-- name: DeleteResolvedBefore :exec
DELETE FROM resolved_items WHERE resolved_at < ?;
