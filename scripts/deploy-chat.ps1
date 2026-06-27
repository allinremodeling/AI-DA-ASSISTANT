# Deploy Supabase Edge Function chat (Windows-safe — bypasses npm.ps1 execution policy)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $root

Write-Host "Deploying chat function to Supabase..." -ForegroundColor Cyan
npx supabase functions deploy chat --project-ref nchzvkvinhpnowopqbfb
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploying edit-kitchen-photo function..." -ForegroundColor Cyan
npx supabase functions deploy edit-kitchen-photo --project-ref nchzvkvinhpnowopqbfb
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Listo:" -ForegroundColor Green
Write-Host "  chat: https://nchzvkvinhpnowopqbfb.supabase.co/functions/v1/chat"
Write-Host "  edit-kitchen-photo: https://nchzvkvinhpnowopqbfb.supabase.co/functions/v1/edit-kitchen-photo"
Write-Host ""
Write-Host "Secrets requeridos: REPLICATE_API_TOKEN (opcional: STABILITY_API_KEY)" -ForegroundColor Yellow

Pop-Location
