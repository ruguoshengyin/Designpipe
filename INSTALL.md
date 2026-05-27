# Designpipe 2.0 — 安装指南

> 预计耗时：10 分钟（首次安装）

---

## 目录

1. [系统要求](#1-系统要求)
2. [安装前提工具](#2-安装前提工具)
3. [克隆项目](#3-克隆项目)
4. [配置 API Key](#4-配置-api-key)
5. [启动项目](#5-启动项目)
6. [验证是否成功](#6-验证是否成功)
7. [常见问题](#7-常见问题)

---

## 1. 系统要求

| 系统 | 支持情况 |
|------|---------|
| macOS 12+ | ✅ 完全支持 |
| Windows 10/11 | ✅ 支持（需 WSL 或 Git Bash） |
| Linux (Ubuntu 20+) | ✅ 完全支持 |

---

## 2. 安装前提工具

需要提前安装三个工具：**Python**、**Node.js**、**Git**。

### 2.1 安装 Python 3.9+

**macOS（推荐用 Homebrew）：**
```bash
# 先安装 Homebrew（已安装可跳过）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Python
brew install python@3.11
```

**或直接下载安装包：**  
前往 https://www.python.org/downloads/ 下载最新版本（3.9 以上均可）。

**验证：**
```bash
python3 --version
# 应输出：Python 3.x.x
```

---

### 2.2 安装 Node.js 18+

前往 https://nodejs.org 下载 **LTS 版本**（长期支持版）并安装。

**macOS 也可用 Homebrew：**
```bash
brew install node
```

**验证：**
```bash
node --version
# 应输出：v18.x.x 或更高
npm --version
# 应输出：9.x.x 或更高
```

---

### 2.3 安装 Git

**macOS：**
```bash
brew install git
```

**或前往** https://git-scm.com 下载安装。

**验证：**
```bash
git --version
# 应输出：git version 2.x.x
```

---

## 3. 克隆项目

打开终端，执行以下命令：

```bash
git clone -b designpipe-2 https://github.com/ruguoshengyin/Designpipe.git
cd Designpipe
```

> ⚠️ 注意：命令里的 `-b designpipe-2` **不能省略**，项目代码在 `designpipe-2` 分支，不加会克隆到空的主分支。

克隆完成后，目录结构如下：

```
Designpipe/
├── backend/          # Python 后端
├── frontend2/        # React 前端
├── .env.example      # API Key 配置模板
├── requirements.txt  # Python 依赖列表
├── start.sh          # 一键启动脚本
└── README.md
```

---

## 4. 配置 API Key

项目通过 [apiyi.com](https://apiyi.com) 调用 Claude AI，需要配置 API Key。

### 4.1 获取 API Key

1. 前往 https://apiyi.com 注册账号
2. 登录后进入「控制台」→「API Key」
3. 点击「创建新 Key」，复制生成的 Key
4. 确保账户有余额（首次需充值）

### 4.2 配置到项目

在项目根目录执行：

```bash
cp .env.example .env
```

用任意文本编辑器打开 `.env` 文件（比如 `open .env` 或 `code .env`），找到这一行：

```
ANTHROPIC_API_KEY=你的key
```

把 `你的key` 替换为刚才复制的 API Key，保存文件。

**示例：**
```
ANTHROPIC_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 🔒 `.env` 文件已被 `.gitignore` 排除，不会上传到 GitHub，请勿分享给他人。

---

## 5. 启动项目

在项目根目录执行：

```bash
bash start.sh
```

**首次启动**会自动安装所有依赖，大约需要 1-2 分钟，请耐心等待。  
安装完成后，浏览器会自动打开 **http://localhost:5173**。

终端看到以下输出表示启动成功：

```
  🚀 Designpipe 2.0 已启动！
  ──────────────────────────────────
  前端  →  http://localhost:5173
  后端  →  http://localhost:8000
```

**停止服务：** 在终端按 `Ctrl+C`。

---

## 6. 验证是否成功

启动后，在浏览器中：

1. 打开 http://localhost:5173，应看到 Designpipe 首页
2. 点击「新建项目」，输入项目描述
3. 点击「生成」，等待 AI 响应

如果 AI 正常返回内容，说明安装成功 🎉

---

## 7. 常见问题

### ❓ 提示「端口已被占用」

脚本会自动清理，如仍报错请手动执行：

```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

然后重新运行 `bash start.sh`。

---

### ❓ `python3` 命令找不到

macOS 用户尝试：

```bash
brew install python@3.11
```

Windows 用户安装 Python 时，勾选 **「Add Python to PATH」** 选项。

---

### ❓ `npm` 命令找不到

重新安装 Node.js：https://nodejs.org，安装完重开终端再试。

---

### ❓ AI 不响应 / 报错「配额不足」

1. 登录 https://apiyi.com 检查账户余额
2. 余额不足请充值
3. 刷新页面重试

---

### ❓ 前端页面打开空白

检查后端是否正常启动：

```bash
curl http://localhost:8000/api/health
# 应返回：{"status":"ok"}
```

如后端未启动，查看日志：

```bash
tail -30 /tmp/dp_backend.log
```

---

### ❓ Windows 上 `bash start.sh` 报错

Windows 需要通过 **Git Bash** 运行：
1. 安装 Git for Windows：https://git-scm.com
2. 右键项目文件夹 → 「Git Bash Here」
3. 在 Git Bash 中执行 `bash start.sh`

---

## 获取帮助

遇到问题可在 GitHub 提 Issue：  
https://github.com/ruguoshengyin/Designpipe/issues
