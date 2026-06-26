# Build + ZIP listo para subir a cPanel public_html/ai/
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $root

if (-not (Test-Path ".env.local")) {
  Write-Host "ERROR: Crea .env.local desde .env.example con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY" -ForegroundColor Red
  exit 1
}

Write-Host "Building for /ai/ ..." -ForegroundColor Cyan
npm run build:cpanel
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$zipPath = Join-Path $root "deploy-cpanel-ai.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path "dist\*" -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Listo: $zipPath" -ForegroundColor Green
Write-Host "Sube el ZIP a cPanel -> File Manager -> public_html/ai/ -> Extract" -ForegroundColor Yellow
Write-Host "O sube manualmente todo el contenido de dist/ a public_html/ai/" -ForegroundColor Yellow

Pop-Location
