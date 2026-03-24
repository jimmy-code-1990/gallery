#!/bin/bash
# ═══════════════════════════════════════════
#  AI Gallery 一键启动脚本
#  双击此文件或在终端执行即可启动画廊
#  后端 server.cjs → localhost:3781
#  前端 Vite dev   → localhost:3779 (自动打开)
# ═══════════════════════════════════════════

cd "$(dirname "$0")" || exit 1

BACKEND_PORT=3781
FRONTEND_PORT=3779
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

cleanup() {
  echo ""
  echo "🛑 正在关闭服务..."
  # 杀掉本脚本启动的所有子进程
  kill $(jobs -p) 2>/dev/null
  wait 2>/dev/null
  echo "👋 已退出"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 1. 检查 node_modules ──
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，安装依赖..."
  npm install
  echo ""
fi

# ── 2. 杀掉占用端口的旧进程 ──
for P in $BACKEND_PORT $FRONTEND_PORT; do
  OLD_PID=$(lsof -ti:$P 2>/dev/null)
  if [ -n "$OLD_PID" ]; then
    echo "⚠️  端口 $P 被占用 (PID: $OLD_PID)，正在释放..."
    kill $OLD_PID 2>/dev/null
    sleep 0.5
  fi
done

# ── 3. 启动后端 API 服务器 ──
echo "🚀 启动后端 API 服务器 (port $BACKEND_PORT)..."
GALLERY_PORT=$BACKEND_PORT node server.cjs &
BACKEND_PID=$!

# 等待后端就绪
for i in {1..20}; do
  if curl -s "http://localhost:$BACKEND_PORT/api/images" > /dev/null 2>&1; then
    echo "✅ 后端已就绪 (PID: $BACKEND_PID)"
    break
  fi
  sleep 0.5
done

if ! curl -s "http://localhost:$BACKEND_PORT/api/images" > /dev/null 2>&1; then
  echo "❌ 后端启动失败，请检查日志"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# ── 4. 启动 Vite 前端开发服务器 ──
echo "🎨 启动前端 Vite 开发服务器 (port $FRONTEND_PORT)..."
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!

# 等待前端就绪
for i in {1..30}; do
  if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "✅ 前端已就绪 (PID: $FRONTEND_PID)"
    break
  fi
  sleep 0.5
done

# ── 5. 打开浏览器 ──
echo ""
echo "┌───────────────────────────────────────────┐"
echo "│          🎨 AI Gallery 已启动              │"
echo "├───────────────────────────────────────────┤"
echo "│  前端:  $FRONTEND_URL                  │"
echo "│  后端:  http://localhost:$BACKEND_PORT                  │"
echo "│                                           │"
echo "│  按 Ctrl+C 停止所有服务                    │"
echo "└───────────────────────────────────────────┘"
echo ""
open "$FRONTEND_URL"

# ── 保持脚本运行，等待子进程 ──
wait
