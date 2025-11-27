# AKS Fleet Manager 部署指南

## 问题：GitHub Token 无效

如果您在 AKS Fleet Manager 自动化部署时遇到 "github token is invalid" 错误，请按以下步骤操作：

### 解决方案 1: 更新 GitHub Token

1. **生成新的 GitHub Personal Access Token**
   - 访问 GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 点击 "Generate new token (classic)"
   - 选择权限:
     - ✅ `repo` (完整仓库访问权限)
     - ✅ `workflow` (更新 GitHub Actions 工作流)
     - ✅ `write:packages` (如果使用 GitHub Container Registry)
   - 点击 "Generate token" 并复制 token

2. **在 Azure Portal 更新 Token**
   ```bash
   # 方法 1: 使用 Azure CLI
   az fleet update \
     --name <fleet-name> \
     --resource-group <resource-group> \
     --github-token <new-token>
   
   # 方法 2: 通过 Azure Portal
   # Azure Portal → Fleet Manager → Settings → GitHub Integration → Update Token
   ```

3. **在 AKS Fleet Manager 中重新配置**
   - 登录 Azure Portal
   - 导航到您的 Fleet Manager 实例
   - 进入 "Settings" → "Source Control"
   - 点击 "Reconnect" 或 "Update credentials"
   - 输入新的 GitHub token
   - 保存并测试连接

### 解决方案 2: 使用 Azure Container Registry 直接部署

绕过 GitHub 集成，直接从 ACR 部署到 AKS：

```powershell
# 1. 构建并推送镜像到 ACR
az acr build --registry <ACR_NAME> --image my-web-app:latest .

# 2. 为 AKS 配置 ACR 访问权限
az aks update \
  --name <aks-cluster-name> \
  --resource-group <resource-group> \
  --attach-acr <ACR_NAME>

# 3. 创建 Kubernetes Secret (如果需要)
kubectl create secret docker-registry acr-secret \
  --docker-server=<ACR_NAME>.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  --namespace=web-app-namespace

# 4. 更新部署文件中的镜像名称
# 编辑 k8s-deployment.yaml，将 <ACR_NAME> 替换为您的 ACR 名称

# 5. 应用 Kubernetes 配置
kubectl apply -f k8s-deployment.yaml
# 或使用完整配置
kubectl apply -f k8s-full-deployment.yaml

# 6. 检查部署状态
kubectl get pods -n web-app-namespace
kubectl get services -n web-app-namespace

# 7. 获取外部 IP
kubectl get service web-app-service -n web-app-namespace
```

### 解决方案 3: 使用 Fleet Manager CLI

```powershell
# 安装 Fleet Manager CLI
az extension add --name fleet

# 创建 Fleet 资源
az fleet create \
  --name <fleet-name> \
  --resource-group <resource-group> \
  --location eastasia

# 添加 AKS 集群到 Fleet
az fleet member create \
  --name <member-name> \
  --fleet-name <fleet-name> \
  --resource-group <resource-group> \
  --member-cluster-id /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.ContainerService/managedClusters/<aks-name>

# 使用本地 kubectl 部署（无需 GitHub token）
kubectl apply -f k8s-deployment.yaml
```

## 部署文件说明

### k8s-deployment.yaml
- 基础部署配置
- 2个副本
- LoadBalancer 服务
- 健康检查

### k8s-full-deployment.yaml
- 完整生产环境配置
- 独立命名空间
- 3个副本
- Ingress 配置
- TLS/SSL 支持

## 使用步骤

1. **编辑部署文件**
   ```powershell
   # 替换 <ACR_NAME> 为您的 Azure Container Registry 名称
   (Get-Content k8s-deployment.yaml) -replace '<ACR_NAME>', 'your-acr-name' | Set-Content k8s-deployment.yaml
   ```

2. **构建并推送镜像**
   ```powershell
   az acr build --registry <ACR_NAME> --image my-web-app:latest .
   ```

3. **部署到 AKS**
   ```powershell
   kubectl apply -f k8s-deployment.yaml
   ```

4. **查看状态**
   ```powershell
   kubectl get all
   kubectl get service web-app-service
   ```

5. **访问应用**
   ```powershell
   # 获取外部 IP
   $externalIP = kubectl get service web-app-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
   Start-Process "http://$externalIP"
   ```

## 故障排查

### 查看 Pod 日志
```powershell
kubectl logs -l app=web-app --tail=100
```

### 查看 Pod 状态
```powershell
kubectl describe pod -l app=web-app
```

### 查看服务状态
```powershell
kubectl describe service web-app-service
```

### 重启部署
```powershell
kubectl rollout restart deployment web-app
```

## 监控和扩展

### 手动扩展
```powershell
kubectl scale deployment web-app --replicas=5
```

### 查看资源使用
```powershell
kubectl top pods -l app=web-app
kubectl top nodes
```

### 设置自动扩展
```powershell
kubectl autoscale deployment web-app --cpu-percent=70 --min=2 --max=10
```

## 注意事项

- Fleet Manager 的 GitHub token 需要有足够的权限访问您的仓库
- 确保 ACR 已正确配置并与 AKS 集群关联
- 生产环境建议使用 Ingress 和证书管理器
- 定期更新 GitHub token 以确保持续集成正常工作
