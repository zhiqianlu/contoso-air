# 使用官方Python运行时作为基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制当前目录的内容到容器的/app目录
COPY . /app

# 暴露端口8000
EXPOSE 8000

# 运行服务器
CMD ["python", "server.py"]
