#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Designpipe 2.0 — 一键启动脚本
#  用法：bash start.sh
# ─────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_PORT=8000
FRONTEND_PORT=5173

# ── 颜色输出 ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▸${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*"; exit 1; }

echo ""
echo -e "${BOLD}  Designpipe 2.0 — AI 设计流水线${RESET}"
echo "  ──────────────────────────────────"
echo ""

# ── 端口占用检查 & 清理 ────────────────────────────────────────
free_port() {
  local port=$1
  local pid
  pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    warn "端口 $port 已被占用 (PID $pid)，正在释放…"
    kill -9 $pid 2>/dev/null || true
    sleep 0.5
  fi
}

free_port $BACKEND_PORT
free_port $FRONTEND_PORT

# ── 找 Python 3 ───────────────────────────────────────────────
PYTHON=""
for candidate in python3 python3.11 python3.10 python3.9; do
  if command -v "$candidate" &>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done
[ -z "$PYTHON" ] && error "未找到 Python 3，请先安装 Python 3.9+"
info "使用 Python：$($PYTHON --version)"

# ── 找 uvicorn ────────────────────────────────────────────────
UVICORN=""
for candidate in \
  "$($PYTHON -m site --user-base 2>/dev/null)/bin/uvicorn" \
  "$(brew --prefix 2>/dev/null)/bin/uvicorn" \
  "$HOME/Library/Python/3.9/bin/uvicorn" \
  "$HOME/Library/Python/3.10/bin/uvicorn" \
  "$HOME/Library/Python/3.11/bin/uvicorn" \
  "$(command -v uvicorn 2>/dev/null)"; do
  if [ -x "$candidate" ]; then
    UVICORN="$candidate"
    break
  fi
done

if [ -z "$UVICORN" ]; then
  info "未找到 uvicorn，正在安装依赖…"
  $PYTHON -m pip install -r requirements.txt --quiet
  UVICORN="$($PYTHON -m site --user-base)/bin/uvicorn"
  [ -x "$UVICORN" ] || UVICORN="$PYTHON -m uvicorn"
fi
info "使用 uvicorn：$UVICORN"

# ── 安装 Python 依赖（如有缺失）──────────────────────────────
if ! $PYTHON -c "import fastapi, anthropic" 2>/dev/null; then
  info "安装 Python 依赖（首次运行约需 1 分钟）…"
  $PYTHON -m pip install -r requirements.txt --quiet
  success "Python 依赖安装完成"
fi

# ── 安装前端依赖 ──────────────────────────────────────────────
# 优先使用 frontend2（当前版本）
FRONTEND_DIR="frontend2"
if [ ! -d "$FRONTEND_DIR" ]; then
  FRONTEND_DIR="frontend"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  info "安装前端依赖（首次运行约需 1 分钟）…"
  if command -v npm &>/dev/null; then
    (cd "$FRONTEND_DIR" && npm install --silent)
    success "前端依赖安装完成"
  else
    error "未找到 npm，请先安装 Node.js (https://nodejs.org)"
  fi
fi

# ── 检查 .env ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    warn "未找到 .env，已从 .env.example 复制，请填写 API_KEY"
    cp .env.example .env
  else
    warn "未找到 .env，后端可能无法正常调用 AI"
  fi
fi

# ── 启动后端 ──────────────────────────────────────────────────
info "启动后端 → http://localhost:${BACKEND_PORT}"
$UVICORN backend.main:app \
  --host 0.0.0.0 \
  --port $BACKEND_PORT \
  --reload \
  --log-level warning \
  > /tmp/dp_backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端就绪（最多 12s）
info "等待后端就绪…"
for i in $(seq 1 24); do
  if curl -sf "http://localhost:${BACKEND_PORT}/api/health" &>/dev/null; then
    success "后端已就绪"
    break
  fi
  sleep 0.5
  if [ $i -eq 24 ]; then
    warn "后端启动超时，查看日志：tail -f /tmp/dp_backend.log"
  fi
done

# ── 启动前端 ──────────────────────────────────────────────────
info "启动前端 → http://localhost:${FRONTEND_PORT}"
(cd "$FRONTEND_DIR" && npm run dev -- --port $FRONTEND_PORT --host 2>/dev/null) \
  > /tmp/dp_frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

# ── 打印启动信息 ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  🚀 Designpipe 2.0 已启动！${RESET}"
echo "  ──────────────────────────────────"
echo -e "  前端  →  ${BOLD}http://localhost:${FRONTEND_PORT}${RESET}"
echo -e "  后端  →  http://localhost:${BACKEND_PORT}"
echo -e "  日志  →  tail -f /tmp/dp_backend.log"
echo ""
echo -e "  按 ${BOLD}Ctrl+C${RESET} 停止所有服务"
echo ""

# ── 自动打开浏览器（macOS）────────────────────────────────────
if command -v open &>/dev/null; then
  sleep 1
  open "http://localhost:${FRONTEND_PORT}" 2>/dev/null || true
fi

# ── 优雅退出 ──────────────────────────────────────────────────
cleanup() {
  echo ""
  info "正在停止服务…"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  # 确保端口被释放
  lsof -ti tcp:$BACKEND_PORT  | xargs kill -9 2>/dev/null || true
  lsof -ti tcp:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
  success "已停止"
  exit 0
}

trap cleanup INT TERM

# 保持脚本运行
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
