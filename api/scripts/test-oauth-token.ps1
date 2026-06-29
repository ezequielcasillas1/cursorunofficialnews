# Test Pipedream REST API OAuth token exchange.
# Reads api/.env.local — never commit that file.
# Usage: cd C:\Dev\CursorAINews\api; .\scripts\test-oauth-token.ps1

$ErrorActionPreference = 'Stop'
$envFile = Join-Path (Join-Path $PSScriptRoot '..') '.env.local'

if (-not (Test-Path $envFile)) {
  Write-Error "Missing api/.env.local - copy api/.env.example and set PIPEDREAM_CLIENT_ID + PIPEDREAM_CLIENT_SECRET"
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    if ($value) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

if (-not $env:PIPEDREAM_CLIENT_ID -or -not $env:PIPEDREAM_CLIENT_SECRET) {
  Write-Error "PIPEDREAM_CLIENT_ID and PIPEDREAM_CLIENT_SECRET must be set in api/.env.local"
}

$body = @{
  grant_type    = 'client_credentials'
  client_id     = $env:PIPEDREAM_CLIENT_ID
  client_secret = $env:PIPEDREAM_CLIENT_SECRET
} | ConvertTo-Json

Write-Host "POST https://api.pipedream.com/v1/oauth/token ..."

try {
  $response = Invoke-RestMethod -Method POST `
    -Uri 'https://api.pipedream.com/v1/oauth/token' `
    -ContentType 'application/json' `
    -Body $body

  Write-Host "OK - token_type=$($response.token_type) expires_in=$($response.expires_in)s"
  $preview = $response.access_token.Substring(0, [Math]::Min(24, $response.access_token.Length))
  Write-Host "access_token (preview): ${preview}..."
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "FAILED - HTTP $status"
  if ($_.ErrorDetails.Message) {
    Write-Host $_.ErrorDetails.Message
  }
  exit 1
}
