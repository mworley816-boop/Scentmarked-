#!/usr/bin/env bash
set -euo pipefail

# Fail closed: this guard never connects to a database.
# An isolated Atlas test job must explicitly opt in and use a loopback DB URL.
if [[ "${ATLAS_DISPOSABLE_DB:-}" != "true" ]]; then
  echo "Atlas SQL tests require ATLAS_DISPOSABLE_DB=true" >&2
  exit 1
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi
if [[ "${DATABASE_URL}" != postgresql://* && "${DATABASE_URL}" != postgres://* ]]; then
  echo "Expected a PostgreSQL URL" >&2
  exit 1
fi
# Reject URLs containing non-loopback hosts, cloud poolers, and production refs.
host="${DATABASE_URL#*://}"
host="${host#*@}"
host="${host%%/*}"
host="${host%%\?*}"
host="${host%%:*}"
if [[ "$host" != "localhost" && "$host" != "127.0.0.1" && "$host" != "[::1]" ]]; then
  echo "Refusing non-loopback database host: $host" >&2
  exit 1
fi
if [[ "${DATABASE_URL,,}" == *"qnlqdkctfmfagsvbwiis"* ]]; then
  echo "Refusing production project reference" >&2
  exit 1
fi
echo "Atlas SQL test target passes local-only guard."
