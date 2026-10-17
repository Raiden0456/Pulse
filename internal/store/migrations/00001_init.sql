-- +goose Up
CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    source TEXT NOT NULL,
    task TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL,
    payload TEXT NOT NULL,
    run_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE (source, task, run_at)
);

CREATE INDEX events_run_at ON events (run_at DESC);

-- +goose Down
DROP TABLE events;
DROP TABLE sessions;
