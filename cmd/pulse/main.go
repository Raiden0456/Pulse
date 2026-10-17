package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata"

	"github.com/raiden0456/pulse/internal/apps"
	"github.com/raiden0456/pulse/internal/auth"
	"github.com/raiden0456/pulse/internal/config"
	"github.com/raiden0456/pulse/internal/events"
	"github.com/raiden0456/pulse/internal/gonteractive"
	"github.com/raiden0456/pulse/internal/jobsearch"
	"github.com/raiden0456/pulse/internal/server"
	"github.com/raiden0456/pulse/internal/settings"
	"github.com/raiden0456/pulse/internal/sheets"
	"github.com/raiden0456/pulse/internal/store"
	"github.com/raiden0456/pulse/internal/store/db"
	"github.com/raiden0456/pulse/internal/wallpaper"
	"github.com/raiden0456/pulse/web"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	conn, err := store.Open(ctx, cfg.DBPath())
	if err != nil {
		return err
	}
	defer conn.Close()
	q := db.New(conn)

	eventService := events.New(q)

	if cfg.SheetID != "" && cfg.GoogleCredFile != "" {
		ingester, err := sheets.New(ctx, cfg.GoogleCredFile, cfg.SheetID, cfg.SheetTab, cfg.SheetPoll, eventService)
		if err != nil {
			return err
		}
		go ingester.Run(ctx)
	} else {
		slog.Warn("sheet ingest disabled: set PULSE_SHEET_ID and GOOGLE_APPLICATION_CREDENTIALS")
	}

	handler := server.Handler(
		auth.New(q, cfg.Password, cfg.CookieSecure),
		web.Dist(),
		eventService,
		apps.New(cfg.Apps),
		wallpaper.New(cfg.DataDir),
		settings.New(q),
		jobsearch.New(cfg.JobSearchURL, cfg.JobSearchPass),
		gonteractive.New(cfg.GonteractURL, cfg.GonteractPass),
	)

	srv := &http.Server{Addr: cfg.Addr, Handler: handler, ReadHeaderTimeout: 10 * time.Second}
	errc := make(chan error, 1)
	go func() {
		slog.Info("listening", "addr", cfg.Addr)
		errc <- srv.ListenAndServe()
	}()

	select {
	case err := <-errc:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
