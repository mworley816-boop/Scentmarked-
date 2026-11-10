#!/usr/bin/env bash
set -euo pipefail
# Run ONLY against a disposable PostgreSQL database with Atlas migration applied.
# Parallel psql processes compete for one day's remaining reservation allowance.
day="$(date -u +%F)"
psql -v ON_ERROR_STOP=1 -c "DELETE FROM public.atlas_research_budget_reservations WHERE day = CURRENT_DATE; DELETE FROM public.atlas_research_budget_days WHERE day = CURRENT_DATE;" >/dev/null
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
for i in $(seq 1 12); do
 (
  psql -X -qAt -v ON_ERROR_STOP=1 -c "SET ROLE service_role; SELECT coalesce((public.atlas_reserve_research_budget((now() at time zone 'utc')::date,1000,200)->>'id'),'DENIED');" > "$tmpdir/$i"
 ) &
done
wait
successes="$(grep -lE '^[0-9a-f-]{36}$' "$tmpdir"/* | wc -l | tr -d ' ')"
denials="$(grep -l '^DENIED$' "$tmpdir"/* | wc -l | tr -d ' ')"
if [[ "$successes" -ne 5 || "$denials" -ne 7 ]]; then
 echo "Unexpected concurrent reservation outcomes: successes=$successes denials=$denials" >&2
 exit 1
fi
psql -v ON_ERROR_STOP=1 -v expected_day="$day" <<'SQL'
DO $$
DECLARE v_reserved bigint; v_count integer;
BEGIN
 SELECT reserved_micros INTO v_reserved FROM public.atlas_research_budget_days
 WHERE day=(now() at time zone 'utc')::date;
 SELECT count(*) INTO v_count FROM public.atlas_research_budget_reservations
 WHERE day=(now() at time zone 'utc')::date;
 IF v_reserved IS DISTINCT FROM 1000 OR v_count<>5 THEN
  RAISE EXCEPTION 'Concurrent budget invariant failed: reserved %, count %',v_reserved,v_count;
 END IF;
END $$;
SQL
echo "Concurrent ledger test passed: 5 reservations accepted, 7 denied; cap held at 1000 micros."
