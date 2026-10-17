package config

import "testing"

func TestParseApps(t *testing.T) {
	apps, err := parseApps(" Gonteractive=https://gonteractive.ts.net ; AI Job Search=http://jobs:3000;")
	if err != nil {
		t.Fatal(err)
	}
	if len(apps) != 2 || apps[1].Name != "AI Job Search" || apps[1].URL != "http://jobs:3000" {
		t.Fatalf("unexpected: %+v", apps)
	}
	if _, err := parseApps("broken"); err == nil {
		t.Fatal("want error for entry without url")
	}
}
