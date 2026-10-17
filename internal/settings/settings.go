package settings

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/raiden0456/pulse/internal/httpx"
	"github.com/raiden0456/pulse/internal/store/db"
)

const (
	interfaceKey = "interface"
	maxDim       = 90
)

type Interface struct {
	Language     string `json:"language"`
	WallpaperDim int    `json:"wallpaper_dim"`
}

func defaultInterface() Interface {
	return Interface{WallpaperDim: 55}
}

func (ui Interface) Validate() error {
	if ui.Language != "" && ui.Language != "en" && ui.Language != "ru" {
		return httpx.Errorf(http.StatusBadRequest, "language must be en or ru")
	}
	if ui.WallpaperDim < 0 || ui.WallpaperDim > maxDim {
		return httpx.Errorf(http.StatusBadRequest, "wallpaper_dim must be between 0 and %d", maxDim)
	}
	return nil
}

type Store struct {
	q *db.Queries
}

func New(q *db.Queries) *Store {
	return &Store{q: q}
}

func (s *Store) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/settings/interface", httpx.Handle(s.getInterface))
	mux.HandleFunc("PUT /api/settings/interface", httpx.Handle(s.putInterface))
}

func (s *Store) Interface(ctx context.Context) (Interface, error) {
	ui := defaultInterface()
	raw, err := s.q.GetSetting(ctx, interfaceKey)
	if errors.Is(err, sql.ErrNoRows) {
		return ui, nil
	}
	if err != nil {
		return ui, err
	}
	return ui, json.Unmarshal([]byte(raw), &ui)
}

func (s *Store) getInterface(w http.ResponseWriter, r *http.Request) error {
	ui, err := s.Interface(r.Context())
	if err != nil {
		return err
	}
	httpx.JSON(w, http.StatusOK, ui)
	return nil
}

func (s *Store) putInterface(w http.ResponseWriter, r *http.Request) error {
	var ui Interface
	if err := httpx.Decode(r, &ui); err != nil {
		return err
	}
	if err := ui.Validate(); err != nil {
		return err
	}
	raw, err := json.Marshal(ui)
	if err != nil {
		return err
	}
	if err := s.q.PutSetting(r.Context(), db.PutSettingParams{Key: interfaceKey, Value: string(raw)}); err != nil {
		return err
	}
	httpx.JSON(w, http.StatusOK, ui)
	return nil
}
