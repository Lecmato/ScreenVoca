# ScreenVoca Build Script
# Usage: .\build.ps1
# Output: dist\ScreenVoca.exe  (single file, no install required)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot

Write-Host "=== [1/3] Frontend build ===" -ForegroundColor Cyan
Set-Location "$Root\frontend"
npm install
npm run build
Set-Location $Root
Write-Host "Frontend build complete." -ForegroundColor Green

Write-Host "`n=== [2/3] Python deps check ===" -ForegroundColor Cyan
pip install -r requirements.txt --quiet
Write-Host "Python deps OK." -ForegroundColor Green

Write-Host "`n=== [3/3] PyInstaller — single EXE ===" -ForegroundColor Cyan

# frontend/dist is bundled as 'web' inside the EXE
pyinstaller `
    --onefile `
    --noconsole `
    --name "ScreenVoca" `
    --icon "icon.ico" `
    --add-data "frontend/dist;web" `
    --hidden-import "uvicorn.logging" `
    --hidden-import "uvicorn.loops.auto" `
    --hidden-import "uvicorn.lifespan.on" `
    --hidden-import "uvicorn.protocols.http.auto" `
    --hidden-import "uvicorn.protocols.http.h11_impl" `
    --hidden-import "uvicorn.protocols.http.httptools_impl" `
    --hidden-import "uvicorn.protocols.websockets.auto" `
    --hidden-import "uvicorn.protocols.websockets.wsproto_impl" `
    --hidden-import "uvicorn.protocols.websockets.websockets_impl" `
    --hidden-import "sqlalchemy.dialects.sqlite" `
    --hidden-import "sqlalchemy.dialects.sqlite.pysqlite" `
    main.py

Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Green
Write-Host "EXE: $Root\dist\ScreenVoca.exe" -ForegroundColor Yellow
Write-Host "Data is stored in: %APPDATA%\ScreenVoca\" -ForegroundColor Yellow
