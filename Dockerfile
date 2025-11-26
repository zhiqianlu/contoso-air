# 使用官方Python运行时作为基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制必要的文件
COPY server.py index.html ./

# 如果有requirements.txt，先复制并安装依赖
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# 暴露端口8000
EXPOSE 8000

# 运行服务器
CMD ["python", "server.py"]
