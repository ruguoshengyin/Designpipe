# Designpipe 2.0 — AI 设计流水线

把 UX 设计流程做成一条可追溯的流水线：竞品分析 → 设计分析 → 概念方向 → 高保真 → 交付文档，5 步全 AI 协作。

---

## 快速开始

### 第一步：安装前提工具

| 工具 | 版本要求 | 下载 |
|------|---------|------|
| Python | 3.9 以上 | https://www.python.org/downloads/ |
| Node.js | 18 以上 | https://nodejs.org（选 LTS 版） |
| Git | 任意 | https://git-scm.com |

安装完后打开终端验证：

```bash
python3 --version   # 应显示 Python 3.x.x
node --version      # 应显示 v18.x.x 或更高
```

### 第二步：克隆项目

```bash
git clone -b designpipe-2 https://github.com/ruguoshengyin/Designpipe.git
cd Designpipe
```

### 第三步：配置 API Key

项目使用 [apiyi.com](https://apiyi.com) 作为 Claude API 代理。

```bash
cp .env.example .env
```

用文本编辑器打开 `.env`，填入你的 API Key：

```
ANTHROPIC_API_KEY=你的key
```

> 注意：项目在 `designpipe-2` 分支，克隆命令里的 `-b designpipe-2` 不能省略。  
> API Key 在 apiyi.com 注册后可在控制台获取。

### 第四步：启动

```bash
bash start.sh
```

首次运行会自动安装所有依赖（约需 1-2 分钟），之后浏览器会自动打开 **http://localhost:5173**。

---

## 常见问题

**Q：提示"端口已被占用"怎么办？**  
脚本会自动清理，如仍有问题请手动运行：
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Q：`python3` 找不到命令？**  
macOS 用户可通过 Homebrew 安装：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.11 node
```

**Q：AI 不响应 / 提示配额不足？**  
请前往 [apiyi.com](https://apiyi.com) 充值，然后刷新页面重试。

**Q：如何停止服务？**  
在终端按 `Ctrl+C` 即可停止前后端所有进程。

---

## 项目结构

```
designpipe/
├── backend/          # FastAPI 后端
│   ├── main.py
│   ├── routers/      # API 路由（generate, projects…）
│   └── utils/        # 设计规范、工具函数
├── frontend2/        # Vite + React 前端（当前版本）
│   └── src/
│       ├── components/   # Workflow, Kickoff, Steps…
│       └── views/        # Home 页面
├── .env.example      # 环境变量模板
├── requirements.txt  # Python 依赖
└── start.sh          # 一键启动脚本
```

---

## 技术栈

- **前端**：React + TypeScript + Vite
- **后端**：Python FastAPI + SQLite
- **AI**：Claude claude-sonnet-4-5（通过 apiyi.com 代理）
