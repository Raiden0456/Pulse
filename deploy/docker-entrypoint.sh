#!/bin/sh
set -e

mkdir -p /data
if [ "$(stat -c %U /data)" != app ]; then
	chown -R app:app /data
fi

# Host-mounted keys are usually root-owned; hand the app its own readable copy.
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
	install -o app -g app -m 600 "$GOOGLE_APPLICATION_CREDENTIALS" /tmp/google.json
	export GOOGLE_APPLICATION_CREDENTIALS=/tmp/google.json
fi

exec su-exec app "$@"
