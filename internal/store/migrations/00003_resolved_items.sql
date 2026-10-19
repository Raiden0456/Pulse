-- +goose Up
CREATE TABLE resolved_items (
    key TEXT PRIMARY KEY,
    resolved_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- +goose Down
DROP TABLE resolved_items;
