package sheets

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"

	"github.com/raiden0456/pulse/internal/events"
)

const columns = 6

type Ingester struct {
	svc     *sheets.Service
	id      string
	tab     string
	every   time.Duration
	events  *events.Service
	sheetID *int64
}

func New(ctx context.Context, credFile, spreadsheetID, tab string, every time.Duration, ev *events.Service) (*Ingester, error) {
	svc, err := sheets.NewService(ctx,
		option.WithAuthCredentialsFile(option.ServiceAccount, credFile),
		option.WithScopes(sheets.SpreadsheetsScope),
	)
	if err != nil {
		return nil, fmt.Errorf("sheets client: %w", err)
	}
	return &Ingester{svc: svc, id: spreadsheetID, tab: tab, every: every, events: ev}, nil
}

func (in *Ingester) Run(ctx context.Context) {
	ticker := time.NewTicker(in.every)
	defer ticker.Stop()
	for {
		if err := in.Sync(ctx); err != nil && ctx.Err() == nil {
			slog.Error("sheet sync failed", "err", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// Sync moves every data row of the tab into the events table, then deletes those rows from the sheet.
// Rows appended while a sync runs sit below the deleted range and are picked up next time.
func (in *Ingester) Sync(ctx context.Context) error {
	resp, err := in.svc.Spreadsheets.Values.Get(in.id, in.tab+"!A2:F").Context(ctx).Do()
	if err != nil {
		return fmt.Errorf("read rows: %w", err)
	}
	if len(resp.Values) == 0 {
		return nil
	}

	added := 0
	for i, row := range resp.Values {
		input, ok := parseRow(row)
		if !ok {
			continue
		}
		if input.RunAt.IsZero() {
			slog.Warn("sheet row has invalid run_at", "row", i+2)
			input.RunAt = time.Now()
		}
		isNew, err := in.events.Ingest(ctx, input)
		if err != nil {
			return fmt.Errorf("ingest row %d: %w", i+2, err)
		}
		if isNew {
			added++
		}
	}

	if err := in.deleteRows(ctx, len(resp.Values)); err != nil {
		return err
	}
	slog.Info("sheet synced", "rows", len(resp.Values), "added", added)
	return nil
}

func (in *Ingester) deleteRows(ctx context.Context, n int) error {
	sheetID, err := in.resolveSheetID(ctx)
	if err != nil {
		return err
	}
	_, err = in.svc.Spreadsheets.BatchUpdate(in.id, &sheets.BatchUpdateSpreadsheetRequest{
		Requests: []*sheets.Request{{
			DeleteDimension: &sheets.DeleteDimensionRequest{
				Range: &sheets.DimensionRange{
					SheetId:         sheetID,
					Dimension:       "ROWS",
					StartIndex:      1,
					EndIndex:        int64(1 + n),
					ForceSendFields: []string{"SheetId"},
				},
			},
		}},
	}).Context(ctx).Do()
	if err != nil {
		return fmt.Errorf("delete synced rows: %w", err)
	}
	return nil
}

func (in *Ingester) resolveSheetID(ctx context.Context) (int64, error) {
	if in.sheetID != nil {
		return *in.sheetID, nil
	}
	ss, err := in.svc.Spreadsheets.Get(in.id).Fields("sheets.properties").Context(ctx).Do()
	if err != nil {
		return 0, fmt.Errorf("read spreadsheet: %w", err)
	}
	for _, s := range ss.Sheets {
		if s.Properties.Title == in.tab {
			id := s.Properties.SheetId
			in.sheetID = &id
			return id, nil
		}
	}
	return 0, fmt.Errorf("tab %q not found", in.tab)
}

func parseRow(row []any) (events.Input, bool) {
	cells := make([]string, columns)
	blank := true
	for i := 0; i < columns && i < len(row); i++ {
		cells[i] = strings.TrimSpace(fmt.Sprint(row[i]))
		if cells[i] != "" {
			blank = false
		}
	}
	if blank {
		return events.Input{}, false
	}

	runAt, _ := time.Parse(time.RFC3339, cells[0])
	return events.Input{
		RunAt:   runAt,
		Source:  orUnknown(cells[1]),
		Task:    orUnknown(cells[2]),
		Status:  orUnknown(cells[3]),
		Summary: cells[4],
		Payload: cells[5],
	}, true
}

func orUnknown(s string) string {
	if s == "" {
		return "unknown"
	}
	return s
}
