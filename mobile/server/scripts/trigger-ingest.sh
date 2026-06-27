#!/usr/bin/env bash
# Triggers POST /v1/ingest using mobile/server/.env (INGEST_SECRET, PUBLIC_API_BASE).
# Example crontab: */30 * * * * cd /path/to/mobile/server && ./scripts/trigger-ingest.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."
exec node "$SCRIPT_DIR/trigger-ingest.js"
