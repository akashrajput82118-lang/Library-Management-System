$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "frontend")

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    & npm.cmd install --no-fund --no-audit
}

Write-Host ""
Write-Host "Starting Vite on http://localhost:5173 ..."
Write-Host "Make sure the Spring Boot backend is running on port 8080."
Write-Host ""

& npm.cmd run dev
