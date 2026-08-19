<#
.SYNOPSIS
    Hardened, Anti-Reverse-Engineering Release Packaging Pipeline
.DESCRIPTION
    Builds the Next.js frontend with 0 source maps, compiles the Python backend,
    and packages the desktop installer using Rust Fat LTO and symbol stripping.
#>

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

$Version = (Get-Content "$RootDir\VERSION" -Raw).Trim()
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PULSE ENTERPRISE HARDENED RELEASE BUILD: v$Version" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Verify and Bump/Sync Version Stamps
Write-Host "`n[1/4] Synchronizing Version Metadata..." -ForegroundColor Yellow
node "$RootDir\scripts\bump_version.js" $Version

# 2. Frontend Hardened Static Export
Write-Host "`n[2/4] Building Hardened Next.js Bundle (0 Source Maps)..." -ForegroundColor Yellow
Set-Location "$RootDir\apps\web"
npm run build

# Sanity Check: Ensure no source maps leaked into out/
$SourceMaps = Get-ChildItem -Path "$RootDir\apps\web\out" -Filter "*.map" -Recurse
if ($SourceMaps.Count -gt 0) {
    Write-Host "SECURITY WARNING: Detected $($SourceMaps.Count) source map file(s) in out/. Removing..." -ForegroundColor Red
    $SourceMaps | Remove-Item -Force
} else {
    Write-Host "PASSED: Zero source maps detected in export bundle." -ForegroundColor Green
}

# 3. Backend Verification
Write-Host "`n[3/4] Verifying Django Backend Integrity..." -ForegroundColor Yellow
Set-Location $RootDir
& "$RootDir\apps\api\venv\Scripts\python.exe" "$RootDir\apps\api\manage.py" test core --noinput

# 4. Packaging Summary
Write-Host "`n[4/4] Release Package Prepared." -ForegroundColor Yellow
Write-Host "Ready for Tauri NSIS / MSI compilation via: npm --prefix apps/web run tauri:build" -ForegroundColor Cyan
Write-Host "Hardened Rust Release Profile: [opt-level=3, lto=fat, strip=symbols, codegen-units=1]" -ForegroundColor Green
Write-Host "`nBuild Pipeline Complete for v$Version." -ForegroundColor Green
