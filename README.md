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

## 技术栈

- HTML5
- CSS3
- JavaScript (Vanilla)
- Python 3.11
- Docker
