# Azure 部署脚本
# 使用Azure CLI直接部署，不依赖GitHub集成

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "my-web-app-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "my-web-app-$(Get-Random -Maximum 9999)",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastasia",
    
    [Parameter(Mandatory=$false)]
    [string]$AcrName = "mywebappacr$(Get-Random -Maximum 9999)"
)

Write-Host "🚀 开始部署到 Azure..." -ForegroundColor Green
Write-Host ""

# 检查是否已登录Azure
Write-Host "📝 检查 Azure 登录状态..." -ForegroundColor Cyan
$account = az account show 2>$null
if (-not $account) {
    Write-Host "⚠️  未登录 Azure，正在启动登录..." -ForegroundColor Yellow
    az login
}

Write-Host "✅ Azure 登录成功" -ForegroundColor Green
Write-Host ""

# 创建资源组
Write-Host "📦 创建资源组: $ResourceGroup" -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location
Write-Host "✅ 资源组创建成功" -ForegroundColor Green
Write-Host ""

# 创建容器注册表
Write-Host "🐳 创建 Azure Container Registry: $AcrName" -ForegroundColor Cyan
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true
Write-Host "✅ ACR 创建成功" -ForegroundColor Green
Write-Host ""

# 构建并推送Docker镜像
Write-Host "🔨 构建并推送 Docker 镜像..." -ForegroundColor Cyan
az acr build --registry $AcrName --image my-web-app:latest .
Write-Host "✅ Docker 镜像推送成功" -ForegroundColor Green
Write-Host ""

# 获取ACR凭据
$acrCredentials = az acr credential show --name $AcrName | ConvertFrom-Json
$acrLoginServer = az acr show --name $AcrName --query loginServer --output tsv

# 创建App Service计划
Write-Host "📋 创建 App Service 计划..." -ForegroundColor Cyan
$planName = "$AppName-plan"
az appservice plan create --name $planName --resource-group $ResourceGroup --is-linux --sku B1
Write-Host "✅ App Service 计划创建成功" -ForegroundColor Green
Write-Host ""

# 创建Web App
Write-Host "🌐 创建 Web App: $AppName" -ForegroundColor Cyan
az webapp create `
    --resource-group $ResourceGroup `
    --plan $planName `
    --name $AppName `
    --deployment-container-image-name "$acrLoginServer/my-web-app:latest"

# 配置Web App使用ACR
Write-Host "⚙️  配置 Web App..." -ForegroundColor Cyan
az webapp config container set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --docker-custom-image-name "$acrLoginServer/my-web-app:latest" `
    --docker-registry-server-url "https://$acrLoginServer" `
    --docker-registry-server-user $acrCredentials.username `
    --docker-registry-server-password $acrCredentials.passwords[0].value

Write-Host "✅ Web App 配置完成" -ForegroundColor Green
Write-Host ""

# 获取Web App URL
$webAppUrl = "https://$AppName.azurewebsites.net"

Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📋 部署信息:" -ForegroundColor Cyan
Write-Host "  资源组: $ResourceGroup"
Write-Host "  应用名称: $AppName"
Write-Host "  访问地址: $webAppUrl"
Write-Host "  容器注册表: $acrLoginServer"
Write-Host ""
Write-Host "🌐 在浏览器中打开应用..." -ForegroundColor Cyan
Start-Process $webAppUrl
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "  - 首次启动可能需要几分钟时间"
Write-Host "  - 查看日志: az webapp log tail --name $AppName --resource-group $ResourceGroup"
Write-Host "  - 重新部署: az acr build --registry $AcrName --image my-web-app:latest ."
Write-Host ""
