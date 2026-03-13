# ================================================
# 一次性 SSH 密钥配置脚本
# 只需运行一次，之后 deploy.ps1 自动免密部署
# ================================================

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$SERVER   = "root@8.162.7.82"
$KEY_PATH = "$env:USERPROFILE\.ssh\ins-lab"

Write-Host "🔑 配置 SSH 免密登录..." -ForegroundColor Cyan
Write-Host "   服务器：$SERVER" -ForegroundColor Gray

# 1. 生成密钥（如果不存在）
if (-not (Test-Path "$KEY_PATH")) {
    Write-Host ""
    Write-Host "1️⃣  生成 SSH 密钥..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $KEY_PATH -N "" -C "ins-lab-deploy"
    Write-Host "   ✅ 密钥已生成：$KEY_PATH" -ForegroundColor Green
} else {
    Write-Host "ℹ️  密钥已存在，跳过生成" -ForegroundColor Yellow
}

# 2. 将公钥复制到服务器（需要输入一次密码）
Write-Host ""
Write-Host "2️⃣  将公钥上传到服务器（需要输入服务器密码）..." -ForegroundColor Yellow
Write-Host "   密码：Hxsk@2016" -ForegroundColor Gray

$pubKey = Get-Content "$KEY_PATH.pub"
$remoteCmd = "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# Windows 使用 ssh 的 stdin 方式上传公钥
Write-Host "   请在弹出的密码提示中输入服务器密码..." -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no $SERVER $remoteCmd

Write-Host "   ✅ 公钥已上传" -ForegroundColor Green

# 3. 验证连接
Write-Host ""
Write-Host "3️⃣  验证免密连接..." -ForegroundColor Yellow
$result = ssh -i $KEY_PATH -o StrictHostKeyChecking=no -o BatchMode=yes $SERVER "echo ok" 2>&1
if ($result -eq "ok") {
    Write-Host "   ✅ 免密登录配置成功！" -ForegroundColor Green
} else {
    Write-Host "   ❌ 验证失败，请检查：$result" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 SSH 配置完成！现在可以运行 .\deploy.ps1 自动部署了。" -ForegroundColor Green
