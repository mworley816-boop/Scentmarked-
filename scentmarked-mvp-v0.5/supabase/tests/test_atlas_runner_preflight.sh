#!/usr/bin/env bash
set -euo pipefail

runner="$(dirname "$0")/run_atlas_sql_integration.sh"
pass=0
fail=0

expect_reject() {
  local label="$1"
  shift
  if env "$@" bash "$runner" >/dev/null 2>&1; then
    echo "FAIL (unexpected accept): $label"
    fail=$((fail + 1))
  else
    echo "PASS (rejected): $label"
    pass=$((pass + 1))
  fi
}

expect_reject "no opt-in" ATLAS_DISPOSABLE_DB=false ATLAS_SCHEMA_BOOTSTRAPPED=true DATABASE_URL=postgresql://postgres:test@localhost:54322/postgres
expect_reject "no bootstrap confirmation" ATLAS_DISPOSABLE_DB=true ATLAS_SCHEMA_BOOTSTRAPPED=false DATABASE_URL=postgresql://postgres:test@localhost:54322/postgres
expect_reject "remote database" ATLAS_DISPOSABLE_DB=true ATLAS_SCHEMA_BOOTSTRAPPED=true DATABASE_URL=postgresql://postgres:test@db.example.org:5432/postgres
expect_reject "production database" ATLAS_DISPOSABLE_DB=true ATLAS_SCHEMA_BOOTSTRAPPED=true DATABASE_URL=postgresql://postgres:test@db.qnlqdkctfmfagsvbwiis.supabase.co:5432/postgres

echo "$pass preflight rejection checks passed; $fail failed"
test "$fail" -eq 0
