# Triggers POST /v1/ingest using mobile/server/.env (INGEST_SECRET, PUBLIC_API_BASE).
# Example (Task Scheduler): node scripts/trigger-ingest.js from mobile/server, or run this script.
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerRoot = Join-Path $ScriptDir ".."
Push-Location $ServerRoot
try {
  node (Join-Path $ScriptDir "trigger-ingest.js")
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
