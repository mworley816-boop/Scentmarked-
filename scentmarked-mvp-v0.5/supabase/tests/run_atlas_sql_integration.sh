#!/usr/bin/env bash
set -euo pipefail

test_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$test_dir/guard_disposable_database.sh"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for Atlas database integration tests" >&2
  exit 1
fi

# A loopback URL alone does not prove a database is disposable.
# The caller must provision and identify the disposable database separately.
if [[ "${ATLAS_SCHEMA_BOOTSTRAPPED:-}" != "true" ]]; then
  echo "Refusing SQL execution until disposable schema bootstrap is confirmed" >&2
  exit 1
fi

for fixture in atlas_import_security_preflight.sql atlas_import_transaction_rollback.sql; do
  echo "Running Atlas SQL fixture: $fixture"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$test_dir/$fixture"
done

echo "Atlas SQL fixtures passed in the explicitly authorized local test database."
