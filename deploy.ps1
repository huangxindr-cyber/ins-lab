# ================================================
# 上线部署脚本
# 用法：在 PowerShell 中运行 .\deploy.ps1
# 前提：已运行 .\setup-ssh.ps1 完成一次性密钥配置
# ================================================

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$PROJECT_DIR   = $PSScriptRoot
$SERVER        = "root@8.162.7.82"
$REMOTE_DIR    = "/www/wwwroot/lab.tanpeak.com"
$SSH_KEY       = "$env:USERPROFILE\.ssh\ins-lab"

Set-Location $PROJECT_DIR

Write-Host "🚀 开始上线部署..." -ForegroundColor Cyan

# ── 第一步：提交代码到 GitHub main 分支 ──
Write-Host ""
Write-Host "1️⃣  提交代码到 GitHub..." -ForegroundColor Yellow

$status = git status --porcelain
if ($status) {
    $msg = Read-Host "  请输入本次提交说明（直接回车用默认）"
    if (-not $msg) { $msg = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
    git add .
    git commit -m $msg
}

git push origin main
Write-Host "   ✅ 代码已推送到 GitHub main" -ForegroundColor Green

# ── 第二步：本地构建 ──
Write-Host ""
Write-Host "2️⃣  构建项目..." -ForegroundColor Yellow
npm run build
Write-Host "   ✅ 构建完成" -ForegroundColor Green

# ── 第三步：上传到服务器 ──
Write-Host ""
Write-Host "3️⃣  上传文件到服务器..." -ForegroundColor Yellow

# 确保服务器目录存在
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "mkdir -p $REMOTE_DIR"

# 上传 dist 目录内容
scp -r -i $SSH_KEY -o StrictHostKeyChecking=no "dist\*" "${SERVER}:${REMOTE_DIR}/"
Write-Host "   ✅ 文件上传完成" -ForegroundColor Green

# ── 第四步：刷新 Nginx ──
Write-Host ""
Write-Host "4️⃣  刷新服务器 Nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "nginx -s reload"
Write-Host "   ✅ Nginx 已刷新" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "   访问地址：http://lab.tanpeak.com" -ForegroundColor Cyan
Write-Host "   GitHub：https://github.com/huangxindr-cyber/ins-lab" -ForegroundColor Cyan
