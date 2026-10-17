package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type App struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type Config struct {
	Addr           string
	DataDir        string
	Password       string
	CookieSecure   *bool
	SheetID        string
	SheetTab       string
	SheetPoll      time.Duration
	GoogleCredFile string
	Apps           []App
	JobSearchURL   string
	JobSearchPass  string
}

func (c Config) DBPath() string {
	return filepath.Join(c.DataDir, "pulse.db")
}

func Load() (Config, error) {
	c := Config{
		Addr:           env("APP_ADDR", ":8080"),
		DataDir:        env("APP_DATA_DIR", "data"),
		Password:       os.Getenv("APP_PASSWORD"),
		SheetID:        os.Getenv("PULSE_SHEET_ID"),
		SheetTab:       env("PULSE_SHEET_TAB", "events"),
		GoogleCredFile: os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"),
		JobSearchURL:   os.Getenv("JOBSEARCH_URL"),
		JobSearchPass:  os.Getenv("JOBSEARCH_PASSWORD"),
	}
	if c.Password == "" {
		return c, errors.New("APP_PASSWORD is required")
	}

	if v := env("APP_COOKIE_SECURE", "auto"); v != "auto" {
		secure, err := strconv.ParseBool(v)
		if err != nil {
			return c, errors.New("APP_COOKIE_SECURE must be auto, true or false")
		}
		c.CookieSecure = &secure
	}

	poll, err := time.ParseDuration(env("PULSE_SHEET_POLL", "5m"))
	if err != nil || poll < time.Minute {
		return c, errors.New("PULSE_SHEET_POLL must be a duration of at least 1m")
	}
	c.SheetPoll = poll

	apps, err := parseApps(os.Getenv("PULSE_APPS"))
	if err != nil {
		return c, err
	}
	c.Apps = apps
	return c, nil
}

// parseApps reads "Name=https://url;Other=https://url".
func parseApps(raw string) ([]App, error) {
	var apps []App
	for entry := range strings.SplitSeq(raw, ";") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		name, url, ok := strings.Cut(entry, "=")
		if !ok || strings.TrimSpace(name) == "" || !strings.HasPrefix(strings.TrimSpace(url), "http") {
			return nil, fmt.Errorf("PULSE_APPS: invalid entry %q, want Name=https://url", entry)
		}
		apps = append(apps, App{Name: strings.TrimSpace(name), URL: strings.TrimSpace(url)})
	}
	return apps, nil
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
