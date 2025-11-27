# 使用官方Python运行时作为基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制必要的文件
COPY server.py index.html ./

# 暴露端口8000
EXPOSE 8000

# 设置环境变量，禁用自动打开浏览器
ENV PYTHONUNBUFFERED=1

# 运行服务器
CMD ["python", "server.py"]
