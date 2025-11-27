# HTML 网页项目

一个可以在Python环境或Docker容器中运行的简单HTML网页。

## 文件说明

- `index.html` - 前端网页，包含现代化设计和交互功能
- `server.py` - Python HTTP服务器
- `Dockerfile` - Docker容器配置文件
- `.dockerignore` - Docker构建时忽略的文件

## 运行方式

### 方式1: 直接使用Python运行

```bash
python server.py
```

访问 http://localhost:8000

### 方式2: 使用Docker运行

#### 构建Docker镜像
```bash
docker build -t my-web-app .
```

#### 运行Docker容器
```bash
docker run -p 8000:8000 my-web-app
```

访问 http://localhost:8000

#### 停止容器
```bash
docker ps                    # 查看运行中的容器
docker stop <container_id>   # 停止容器
```

## 功能特性

- 📱 响应式设计，适配各种设备
- 🎨 现代化渐变背景和美观界面
- ⚡ 交互式按钮和计数器
- 🚀 轻量级，快速加载

## 部署到 Azure

### 方式1: 使用 PowerShell 脚本（推荐）

首次部署（自动创建所有资源）:
```powershell
.\deploy-azure.ps1
```

更新已有部署:
```powershell
.\deploy-azure-simple.ps1 -ResourceGroup "your-rg" -AcrName "your-acr" -AppName "your-app"
```

### 方式2: 使用 GitHub Actions

1. 在 GitHub 仓库中设置以下 Secrets:
   - `ACR_LOGIN_SERVER`: Azure Container Registry 地址
   - `ACR_USERNAME`: ACR 用户名
   - `ACR_PASSWORD`: ACR 密码
   - `AZURE_CREDENTIALS`: Azure 服务主体凭据
   - `AZURE_WEBAPP_NAME`: Web App 名称

2. 推送代码到 main/dev01 分支自动触发部署

### 故障排查

如果遇到 "github token is invalid" 错误:
- 使用提供的 PowerShell 脚本直接部署，不依赖 GitHub 集成
- 或者在 Azure Portal 中手动重新配置 GitHub 连接

查看部署日志:
```powershell
az webapp log tail --name <your-app-name> --resource-group <your-rg>
```

## 技术栈

- HTML5
- CSS3
- JavaScript (Vanilla)
- Python 3.11
- Docker
- Azure Container Registry
- Azure Web App
