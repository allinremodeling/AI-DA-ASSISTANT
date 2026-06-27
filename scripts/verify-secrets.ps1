# Verifica secrets de Supabase Edge Functions para AI-DA
$ErrorActionPreference = "Continue"
$ProjectRef = "nchzvkvinhpnowopqbfb"

$Required = @(
  "OPENAI_API_KEY",
  "REPLICATE_API_TOKEN",
  "VITE_CLOUDINARY_CLOUD_NAME",
  "VITE_CLOUDINARY_UPLOAD_PRESET"
)

$Recommended = @(
  "STABILITY_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_UPLOAD_PRESET"
)

Write-Host "Consultando secrets en Supabase ($ProjectRef)..." -ForegroundColor Cyan
$lines = & npx supabase secrets list --project-ref $ProjectRef 2>&1
$jsonLine = ($lines | Where-Object { $_ -match '^\{' } | Select-Object -First 1)
if (-not $jsonLine) {
  Write-Host ($lines | Out-String) -ForegroundColor Red
  Write-Host "Ejecuta: npx supabase login" -ForegroundColor Yellow
  exit 1
}

$data = $jsonLine | ConvertFrom-Json
$names = $data.secrets | ForEach-Object { $_.name }

Write-Host ""
Write-Host "=== Requeridos ===" -ForegroundColor Green
foreach ($s in $Required) {
  $ok = $names -contains $s
  if ($ok) {
    Write-Host "  [OK] $s" -ForegroundColor Green
  } else {
    Write-Host "  [FALTA] $s" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "=== Recomendados ===" -ForegroundColor Yellow
foreach ($s in $Recommended) {
  $ok = $names -contains $s
  if ($ok) {
    Write-Host "  [OK] $s" -ForegroundColor Green
  } else {
    Write-Host "  [opcional] $s" -ForegroundColor DarkYellow
  }
}

$cloudOk = ($names -contains "CLOUDINARY_CLOUD_NAME" -and $names -contains "CLOUDINARY_UPLOAD_PRESET") -or ($names -contains "VITE_CLOUDINARY_CLOUD_NAME" -and $names -contains "VITE_CLOUDINARY_UPLOAD_PRESET")

Write-Host ""
if ($cloudOk) {
  Write-Host "Cloudinary backend: OK (VITE_* o CLOUDINARY_* presentes)" -ForegroundColor Green
} else {
  Write-Host "Cloudinary backend: FALTA - ediciones Stability pueden fallar sin CDN" -ForegroundColor Red
}

$missing = @($Required | Where-Object { $names -notcontains $_ })
if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Configura los faltantes:" -ForegroundColor Yellow
  Write-Host "  npx supabase secrets set NOMBRE=valor --project-ref $ProjectRef"
  exit 1
}

Write-Host ""
Write-Host "Secrets listos. Despliega funciones: npm run deploy:chat" -ForegroundColor Green
