package sheets

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"

	"github.com/raiden0456/pulse/internal/events"
)

const columns = 6

type Ingester struct {
	svc    *sheets.Service
	id     string
	tab    string
	every  time.Duration
	events *events.Service
	warned map[int]bool
}

func New(ctx context.Context, credFile, spreadsheetID, tab string, every time.Duration, ev *events.Service) (*Ingester, error) {
	key, err := os.ReadFile(credFile)
	if err != nil {
		return nil, fmt.Errorf("read google credentials: %w", err)
	}
	svc, err := sheets.NewService(ctx,
		option.WithAuthCredentialsJSON(option.ServiceAccount, key),
		option.WithScopes(sheets.SpreadsheetsReadonlyScope),
	)
	if err != nil {
		return nil, fmt.Errorf("sheets client: %w", err)
	}
	return &Ingester{svc: svc, id: spreadsheetID, tab: tab, every: every, events: ev, warned: map[int]bool{}}, nil
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

// Sync reads the whole tab and stores rows it has not seen yet. The sheet is append-only and doubles
// as a log, so nothing is ever deleted; already stored rows are skipped by their source, task and run time.
func (in *Ingester) Sync(ctx context.Context) error {
	resp, err := in.svc.Spreadsheets.Values.Get(in.id, in.tab+"!A2:F").Context(ctx).Do()
	if err != nil {
		return fmt.Errorf("read rows: %w", err)
	}

	added := 0
	for i, row := range resp.Values {
		input, ok := parseRow(row)
		if !ok {
			continue
		}
		rowNum := i + 2
		if input.RunAt.IsZero() {
			if !in.warned[rowNum] {
				slog.Warn("sheet row skipped: invalid run_at", "row", rowNum)
				in.warned[rowNum] = true
			}
			continue
		}
		isNew, err := in.events.Ingest(ctx, input)
		if err != nil {
			return fmt.Errorf("ingest row %d: %w", rowNum, err)
		}
		if isNew {
			added++
		}
	}
	if added > 0 {
		slog.Info("sheet synced", "rows", len(resp.Values), "added", added)
	}
	return nil
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
