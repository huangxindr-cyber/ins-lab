# ================================================
# 上线部署脚本
# 用法：在 PowerShell 中运行 .\deploy.ps1
# ================================================

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$PROJECT_DIR = $PSScriptRoot
Set-Location $PROJECT_DIR

Write-Host "Starting deployment..." -ForegroundColor Cyan

# ── 第一步：提交代码到 GitHub main 分支 ──
Write-Host "1. Pushing to GitHub..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    $msg = Read-Host "Commit message (press Enter for default)"
    if (-not $msg) { $msg = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
    git add .
    git commit -m $msg
}
git push origin main
Write-Host "   GitHub pushed." -ForegroundColor Green

# ── 第二步：本地构建 ──
Write-Host "2. Building..." -ForegroundColor Yellow
npm run build
Write-Host "   Build complete." -ForegroundColor Green

# ── 第三步：部署到服务器 ──
Write-Host "3. Deploying to server..." -ForegroundColor Yellow
python "$PROJECT_DIR\scripts\upload.py"
Write-Host "   Deploy complete." -ForegroundColor Green

Write-Host ""
Write-Host "Done! http://lab.tanpeak.com" -ForegroundColor Green
