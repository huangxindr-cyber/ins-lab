# ================================================
# 提交备份脚本
# 用法：在 PowerShell 中运行 .\backup.ps1
# ================================================

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$PROJECT_DIR = $PSScriptRoot
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_BRANCH = "backup/$date"

Set-Location $PROJECT_DIR

# 获取当前分支
$currentBranch = git rev-parse --abbrev-ref HEAD

Write-Host "📦 开始备份..." -ForegroundColor Cyan

# 1. 提交当前所有改动
$status = git status --porcelain
if ($status) {
    git add .
    git commit -m "backup: $date"
    Write-Host "✅ 已提交本次改动" -ForegroundColor Green
} else {
    Write-Host "ℹ️  没有新的改动，跳过 commit" -ForegroundColor Yellow
}

# 2. 创建备份分支并推送
git checkout -b $BACKUP_BRANCH
git push origin $BACKUP_BRANCH
Write-Host "✅ 备份分支已推送：$BACKUP_BRANCH" -ForegroundColor Green

# 3. 回到原分支
git checkout $currentBranch

Write-Host ""
Write-Host "🎉 备份完成！" -ForegroundColor Green
Write-Host "   分支：$BACKUP_BRANCH" -ForegroundColor Cyan
Write-Host "   查看：https://github.com/huangxindr-cyber/ins-lab/branches" -ForegroundColor Cyan
