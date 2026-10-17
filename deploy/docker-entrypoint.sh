#!/bin/sh
set -e

mkdir -p /data
if [ "$(stat -c %U /data)" != app ]; then
	chown -R app:app /data
fi

exec su-exec app "$@"
