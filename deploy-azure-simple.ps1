# 简化的 Azure 部署脚本（使用现有资源）
# 适用于已经创建过资源的情况

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$AcrName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppName
)

Write-Host "🚀 开始更新部署..." -ForegroundColor Green

# 检查登录
$account = az account show 2>$null
if (-not $account) {
    Write-Host "⚠️  请先登录 Azure" -ForegroundColor Yellow
    az login
}

# 构建并推送新镜像
Write-Host "🔨 构建并推送 Docker 镜像..." -ForegroundColor Cyan
az acr build --registry $AcrName --image my-web-app:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 镜像更新成功" -ForegroundColor Green
    
    # 重启Web App以加载新镜像
    Write-Host "🔄 重启 Web App..." -ForegroundColor Cyan
    az webapp restart --name $AppName --resource-group $ResourceGroup
    
    $webAppUrl = "https://$AppName.azurewebsites.net"
    Write-Host ""
    Write-Host "🎉 部署完成！" -ForegroundColor Green
    Write-Host "📍 访问地址: $webAppUrl" -ForegroundColor Cyan
    Write-Host ""
    
    Start-Process $webAppUrl
} else {
    Write-Host "❌ 部署失败" -ForegroundColor Red
}
