# Deploy Supabase Edge Function chat (Windows-safe — bypasses npm.ps1 execution policy)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $root

Write-Host "Deploying chat function to Supabase..." -ForegroundColor Cyan
npx supabase functions deploy chat --project-ref nchzvkvinhpnowopqbfb
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Listo: https://nchzvkvinhpnowopqbfb.supabase.co/functions/v1/chat" -ForegroundColor Green

Pop-Location
