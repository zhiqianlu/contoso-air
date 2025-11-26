#!/usr/bin/env python3
"""
简单的HTTP服务器，用于运行HTML网页
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

# 配置
PORT = 8000
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

def start_server():
    """启动HTTP服务器"""
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"🚀 服务器启动成功！")
        print(f"📍 访问地址: {url}")
        print(f"📁 服务目录: {DIRECTORY}")
        print(f"⚠️  按 Ctrl+C 停止服务器")
        print("-" * 50)
        
        # 自动在浏览器中打开
        try:
            webbrowser.open(url)
            print(f"🌐 已在浏览器中打开网页")
        except:
            print(f"⚠️  请手动在浏览器中访问: {url}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ 服务器已关闭")

if __name__ == "__main__":
    start_server()
