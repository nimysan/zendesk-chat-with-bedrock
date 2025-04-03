#!/bin/bash

# 加载.env文件中的环境变量
set -a
source .env
set +a

# 导出NGROK_DOMAIN（如果.env中未设置则使用默认值）
export NGROK_DOMAIN=${NGROK_DOMAIN:-working-buzzard-plainly.ngrok-free.app}
echo "Using NGROK_DOMAIN: $NGROK_DOMAIN"
# 安装依赖
echo "Installing dependencies..."
npm install

# 安装PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# 停止已存在的实例（如果有）
pm2 delete zcis 2>/dev/null || true

# 创建日志目录
mkdir -p logs

# 使用PM2启动应用（单实例模式）
echo "Starting application with PM2..."
pm2 start index.js \
    --name "zcis" \
    --max-memory-restart 500M \
    --instances 1 \
    --exp-backoff-restart-delay=100 \
    --merge-logs \
    --log ./logs/app.log \
    --output ./logs/out.log \
    --error ./logs/error.log \
    --time

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

echo "Deployment completed successfully!"
echo "To monitor the application, use: pm2 monit"
echo "To view all logs in realtime, use: pm2 logs zcis"
echo "To view console.log output, use: tail -f ./logs/out.log"
echo "To view error logs, use: tail -f ./logs/error.log"
echo "To view application logs, use: tail -f ./logs/app.log"
echo "To check status, use: pm2 status"
