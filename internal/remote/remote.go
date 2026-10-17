package remote

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"sync"
	"time"
)

const requestTimeout = 5 * time.Second

var errUnauthorized = errors.New("unauthorized")

// Client reads JSON from one of my password-protected apps: it signs in through POST /api/auth/login
// like a browser, keeps the session cookie, and signs in again when a request comes back 401.
type Client struct {
	base     string
	password string
	http     *http.Client
	loginMu  sync.Mutex
}

func New(base, password string) *Client {
	jar, _ := cookiejar.New(nil)
	return &Client{
		base:     strings.TrimRight(base, "/"),
		password: password,
		http:     &http.Client{Jar: jar, Timeout: requestTimeout},
	}
}

func (c *Client) Configured() bool { return c.base != "" }

func (c *Client) Base() string { return c.base }

func (c *Client) Get(ctx context.Context, path string, out any) error {
	err := c.fetch(ctx, path, out)
	if errors.Is(err, errUnauthorized) && c.password != "" {
		if err := c.login(ctx); err != nil {
			return err
		}
		err = c.fetch(ctx, path, out)
	}
	return err
}

func (c *Client) fetch(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+path, nil)
	if err != nil {
		return err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch {
	case resp.StatusCode == http.StatusUnauthorized:
		return errUnauthorized
	case resp.StatusCode != http.StatusOK:
		return fmt.Errorf("GET %s: %s", path, resp.Status)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *Client) login(ctx context.Context) error {
	c.loginMu.Lock()
	defer c.loginMu.Unlock()
	body, _ := json.Marshal(map[string]string{"password": c.password})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/api/auth/login", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	if resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("login to %s: %s", c.base, resp.Status)
	}
	return nil
}
