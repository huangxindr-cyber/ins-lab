# AI保险实验室 - 项目说明

## 项目概述

**AI Insurance Lab（AI保险实验室）** 是一个个人实验展示网站，记录"100天用AI做10个保险行业小工具"的完整过程。

- **线上地址**：https://lab.tanpeak.com（域名已备案）
- **项目目录**：`E:\ins-lab\ai-insurance-lab\`
- **构建产物**：`dist/` 文件夹（纯静态）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite + TypeScript |
| 样式 | Tailwind CSS |
| 路由 | React Router DOM |
| 图标 | Lucide React |
| 后端/数据库 | Supabase（PostgreSQL + Auth） |
| 部署 | 阿里云 ECS + 宝塔面板（静态托管） |

---

## 目录结构

```
ai-insurance-lab/
├── src/
│   ├── App.tsx                  # 路由配置
│   ├── main.tsx                 # 入口
│   ├── index.css                # 全局样式
│   ├── types/index.ts           # 全局类型定义
│   ├── lib/
│   │   ├── supabase.ts          # Supabase 客户端初始化
│   │   ├── api.ts               # 所有数据操作函数
│   │   └── mockData.ts          # 本地 Mock 数据（Supabase 未配置时使用）
│   ├── components/
│   │   ├── Navbar.tsx           # 顶部导航栏（含移动端汉堡菜单）
│   │   ├── ToolCard.tsx         # 工具卡片组件
│   │   └── RequestCard.tsx      # 需求卡片组件
│   └── pages/
│       ├── HomePage.tsx         # 首页（Hero、进度、工具分区、需求表单、订阅）
│       ├── ToolsPage.tsx        # 全部工具页
│       ├── ToolDetailPage.tsx   # 工具详情页
│       ├── RequestsPage.tsx     # 用户需求页
│       ├── LogsPage.tsx         # 实验日志页
│       └── AdminPage.tsx        # 后台管理（工具/日志/需求/订阅管理）
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── wechat-qrcode.jpg        # 微信群二维码（左侧悬浮组件用）
├── dist/                        # 构建产物，部署到服务器的文件
├── index.html
├── vite.config.ts
├── tsconfig.json
└── .env.local                   # 本地环境变量（不提交 git）
```

---

## 路由结构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 首页 |
| `/tools` | ToolsPage | 全部工具列表 |
| `/tools/:id` | ToolDetailPage | 工具详情页 |
| `/requests` | RequestsPage | 用户需求列表 |
| `/logs` | LogsPage | 实验日志 |
| `/admin` | AdminPage | 后台管理（需登录） |

---

## 数据层说明

### Supabase 表结构

| 表名 | 说明 |
|------|------|
| `tools` | 工具信息（名称、状态、链接、试用次数、投票数等） |
| `logs` | 实验日志（日记录 / 周复盘两种类型） |
| `requests` | 用户需求提交 |
| `subscriptions` | 订阅用户（邮箱或微信号） |
| `site_config` | 首页配置（Hero 标题、实验起始日期） |

### Supabase RPC 函数

| 函数名 | 用途 |
|--------|------|
| `increment_try_count(tool_id)` | 工具试用次数 +1 |
| `increment_tool_vote(tool_id)` | 工具投票数 +1 |
| `increment_request_vote(request_id)` | 需求投票数 +1 |

### Mock 数据降级

`src/lib/api.ts` 中所有函数均有降级逻辑：若 `.env.local` 未配置 Supabase 环境变量，自动使用 `mockData.ts` 中的本地数据，不报错。

### 环境变量

```
VITE_SUPABASE_URL=你的 Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=你的 anon key
```

---

## 工具状态说明

| 状态值 | 含义 | 展示位置 |
|--------|------|----------|
| `completed` | 已上线 | 首页"已上线工具"区、工具页 |
| `developing` | 开发中 | 首页"正在开发"区、工具页 |
| `upcoming` | 即将开发 | 首页"即将开发"区（有投票按钮）、工具页 |

---

## 常用命令

```bash
# 进入项目目录
cd E:\ins-lab\ai-insurance-lab

# 安装依赖
npm install

# 本地开发
npm run dev

# 构建生产包（生成 dist/）
npm run build

# 预览构建结果
npm run preview
```

---

## 部署流程

### 当前部署方式（手动）

1. 本地执行 `npm run build`，生成 `dist/` 文件夹
2. 将 `dist/` 目录内的**全部文件**上传到服务器目录：
   ```
   /www/wwwroot/lab.tanpeak.com/
   ├── index.html
   ├── favicon.svg
   ├── icons.svg
   ├── wechat-qrcode.jpg
   └── assets/
       ├── index-[hash].js
       └── index-[hash].css
   ```
3. 宝塔面板确认 Nginx 配置正常

### 指令约定

| 用户指令 | 实际操作 |
|---------|---------|
| 提交备份 | git add + git commit（本地备份存档） |
| 上线 | push 到 GitHub（未来对接自动部署流水线） |

> 注意：目前尚未配置 GitHub Actions 自动部署，上线流程为手动上传 dist 文件到服务器。

---

## 服务器信息

| 项目 | 说明 |
|------|------|
| 云服务商 | 阿里云 ECS |
| 操作系统 | Linux |
| 管理面板 | 宝塔面板 |
| Web 服务器 | Nginx（宝塔管理） |
| 网站根目录 | `/www/wwwroot/lab.tanpeak.com/` |
| 域名 | lab.tanpeak.com（已备案） |
| HTTPS | 待配置（Let's Encrypt，通过宝塔申请） |

---

## 待办事项

- [ ] 宝塔面板配置 HTTPS（Let's Encrypt 证书）
- [ ] 阿里云安全组开放 443 端口
- [ ] 配置 GitHub Actions 实现 push 自动部署
- [ ] Supabase 数据库表结构初始化（当前生产环境数据依赖 mock）

---

## 注意事项

- React Router 使用 `BrowserRouter`，Nginx 需配置 `try_files $uri /index.html`，否则刷新子页面会 404
- `wechat-qrcode.jpg` 放在 `public/` 目录，打包后在根路径访问
- 后台管理 `/admin` 使用 Supabase Auth 登录，未配置 Supabase 时会显示"Supabase 未配置"提示
