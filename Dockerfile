FROM --platform=$BUILDPLATFORM node:24-alpine AS web
WORKDIR /src/web
RUN corepack enable
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

FROM --platform=$BUILDPLATFORM golang:1.27-alpine AS build
ARG TARGETOS
ARG TARGETARCH
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
COPY web/embed.go ./web/embed.go
COPY --from=web /src/web/dist ./web/dist
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/pulse ./cmd/pulse

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata su-exec \
    && adduser -D -h /home/app app \
    && mkdir -p /data \
    && chown -R app:app /data
ENV APP_DATA_DIR=/data
COPY deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
COPY --from=build /out/pulse /usr/local/bin/pulse
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["docker-entrypoint"]
CMD ["pulse"]
