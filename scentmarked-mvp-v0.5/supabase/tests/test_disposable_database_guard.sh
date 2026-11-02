#!/usr/bin/env bash
set -euo pipefail

guard="$(dirname "$0")/guard_disposable_database.sh"
pass=0
fail=0
expect_reject() {
  local label="$1" url="$2" opt="${3:-true}"
  if ATLAS_DISPOSABLE_DB="$opt" DATABASE_URL="$url" bash "$guard" >/dev/null 2>&1; then
    echo "FAIL (unexpected accept): $label"
    fail=$((fail+1))
  else
    echo "PASS (rejected): $label"
    pass=$((pass+1))
  fi
}
expect_accept() {
  local label="$1" url="$2"
  if ATLAS_DISPOSABLE_DB=true DATABASE_URL="$url" bash "$guard" >/dev/null 2>&1; then
    echo "PASS (accepted): $label"
    pass=$((pass+1))
  else
    echo "FAIL (unexpected reject): $label"
    fail=$((fail+1))
  fi
}
expect_accept "localhost" "postgresql://postgres:test@localhost:54322/postgres"
expect_accept "loopback IPv4" "postgresql://postgres:test@127.0.0.1:54322/postgres"
expect_reject "production hostname" "postgresql://postgres:test@db.qnlqdkctfmfagsvbwiis.supabase.co:5432/postgres"
expect_reject "remote host" "postgresql://postgres:test@db.example.org:5432/postgres"
expect_reject "missing opt-in" "postgresql://postgres:test@localhost:54322/postgres" "false"
expect_reject "unsupported protocol" "https://localhost/postgres"
expect_reject "hostname prefix spoof" "postgresql://postgres:test@localhost.evil.example/postgres"
echo "$pass passed; $fail failed"
test "$fail" -eq 0
