# 快速部署脚本 - AKS Fleet Manager
# 用于绕过 GitHub token 问题，直接部署到 AKS

param(
    [Parameter(Mandatory=$true)]
    [string]$AcrName,
    
    [Parameter(Mandatory=$true)]
    [string]$AksClusterName,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "web-app-namespace"
)

Write-Host "🚀 开始部署到 AKS..." -ForegroundColor Green
Write-Host ""

# 检查 Azure 登录
Write-Host "📝 检查 Azure 登录..." -ForegroundColor Cyan
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "⚠️  未登录 Azure" -ForegroundColor Yellow
    az login
}
Write-Host "✅ 已登录 Azure: $($account.name)" -ForegroundColor Green
Write-Host ""

# 构建并推送镜像到 ACR
Write-Host "🐳 构建并推送 Docker 镜像到 ACR..." -ForegroundColor Cyan
az acr build --registry $AcrName --image my-web-app:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 镜像构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 镜像构建并推送成功" -ForegroundColor Green
Write-Host ""

# 获取 AKS 凭据
Write-Host "🔑 获取 AKS 集群凭据..." -ForegroundColor Cyan
az aks get-credentials --resource-group $ResourceGroup --name $AksClusterName --overwrite-existing
Write-Host "✅ AKS 凭据已更新" -ForegroundColor Green
Write-Host ""

# 配置 ACR 集成
Write-Host "🔗 配置 AKS 与 ACR 集成..." -ForegroundColor Cyan
az aks update --name $AksClusterName --resource-group $ResourceGroup --attach-acr $AcrName
Write-Host "✅ ACR 集成配置完成" -ForegroundColor Green
Write-Host ""

# 更新部署文件
Write-Host "📝 更新 Kubernetes 部署文件..." -ForegroundColor Cyan
$deploymentContent = Get-Content "k8s-full-deployment.yaml" -Raw
$deploymentContent = $deploymentContent -replace '<ACR_NAME>', $AcrName
$deploymentContent = $deploymentContent -replace '<YOUR_DOMAIN>', "$AksClusterName.eastasia.cloudapp.azure.com"
$deploymentContent | Set-Content "k8s-deployment-updated.yaml"
Write-Host "✅ 部署文件已更新" -ForegroundColor Green
Write-Host ""

# 应用 Kubernetes 配置
Write-Host "☸️  部署到 Kubernetes..." -ForegroundColor Cyan
kubectl apply -f k8s-deployment-updated.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Kubernetes 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Kubernetes 部署成功" -ForegroundColor Green
Write-Host ""

# 等待部署完成
Write-Host "⏳ 等待 Pod 启动..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod -l app=web-app -n $Namespace --timeout=300s

# 获取服务信息
Write-Host ""
Write-Host "📊 获取服务状态..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

$service = kubectl get service web-app-service -n $Namespace -o json | ConvertFrom-Json
$externalIP = $service.status.loadBalancer.ingress[0].ip

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📋 部署信息:" -ForegroundColor Cyan
Write-Host "  集群: $AksClusterName"
Write-Host "  命名空间: $Namespace"
Write-Host "  镜像: $AcrName.azurecr.io/my-web-app:latest"
Write-Host ""

if ($externalIP) {
    $url = "http://$externalIP"
    Write-Host "🌐 访问地址: $url" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 在浏览器中打开..." -ForegroundColor Cyan
    Start-Process $url
} else {
    Write-Host "⏳ 外部 IP 分配中，请稍后运行:" -ForegroundColor Yellow
    Write-Host "  kubectl get service web-app-service -n $Namespace"
}

Write-Host ""
Write-Host "💡 常用命令:" -ForegroundColor Yellow
Write-Host "  查看 Pods: kubectl get pods -n $Namespace"
Write-Host "  查看服务: kubectl get service web-app-service -n $Namespace"
Write-Host "  查看日志: kubectl logs -l app=web-app -n $Namespace --tail=100"
Write-Host "  扩展副本: kubectl scale deployment web-app -n $Namespace --replicas=5"
Write-Host ""
