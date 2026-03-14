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
| 部署 | 阿里云 ECS + 宝塔面板（静态托管）+ GitHub Actions 自动部署 |

---

## 目录结构

```
ai-insurance-lab/
├── src/
│   ├── App.tsx                  # 路由配置
│   ├── main.tsx                 # 入口
│   ├── index.css                # 全局样式
│   ├── types/index.ts           # 全局类型定义（Tool/Log/Request/Suggestion/Subscription/SiteConfig）
│   ├── lib/
│   │   ├── supabase.ts          # Supabase 客户端初始化
│   │   ├── api.ts               # 所有数据操作函数
│   │   └── mockData.ts          # 本地 Mock 数据（Supabase 未配置时使用）
│   ├── components/
│   │   ├── Navbar.tsx           # 顶部导航栏（含移动端汉堡菜单）
│   │   ├── ToolCard.tsx         # 工具卡片组件
│   │   └── RequestCard.tsx      # 需求卡片组件（含角色图标和 role::name 解析）
│   └── pages/
│       ├── HomePage.tsx         # 首页（Hero、进度统计、两列布局：左工具/右需求表单+精选需求、日志、订阅）
│       ├── ToolDetailPage.tsx   # 工具详情页（两列：左工具信息/右建议表单+建议列表）
│       ├── RequestsPage.tsx     # 用户需求页（左需求列表/右提交表单）
│       ├── LogsPage.tsx         # 实验日志页
│       └── AdminPage.tsx        # 后台管理（工具/日志/需求/订阅管理）
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── wechat-qrcode.jpg        # 微信群二维码（左侧悬浮组件用）
├── .github/workflows/deploy.yml # GitHub Actions 自动部署
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
| `/tools/:id` | ToolDetailPage | 工具详情页（导航不显示工具列表入口，从首页卡片跳转） |
| `/requests` | RequestsPage | 用户需求列表 |
| `/logs` | LogsPage | 实验日志 |
| `/admin` | AdminPage | 后台管理（需登录） |

> 注意：`/tools`（工具列表页）已从导航栏移除，但路由仍保留。工具入口从首页卡片进入详情页。

---

## 数据层说明

### Supabase 表结构

| 表名 | 说明 |
|------|------|
| `tools` | 工具信息（number/name/description/status/url/notes/features/how_to_use/try_count/vote_count） |
| `logs` | 实验日志（tool_id 可关联工具，type: daily/weekly） |
| `requests` | 用户需求提交（nickname 存 `role::name` 格式） |
| `suggestions` | 工具建议（关联 tool_id，用户对具体工具提交的建议） |
| `request_replies` | 需求回复（关联 request_id，管理员对用户需求的回复，公开展示） |
| `subscriptions` | 订阅用户（邮箱或微信号） |
| `site_config` | 首页配置（hero_title/hero_subtitle/experiment_start_date） |

### request_replies 表建表 SQL（需手动在 Supabase 执行）

```sql
CREATE TABLE request_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE request_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read replies" ON request_replies FOR SELECT USING (true);
CREATE POLICY "Auth write replies" ON request_replies FOR ALL USING (auth.role() = 'authenticated');
```

### 订阅列表读取权限（需手动在 Supabase 执行）

```sql
CREATE POLICY "Auth read subscriptions" ON subscriptions FOR SELECT USING (auth.role() = 'authenticated');
```

### suggestions 表建表 SQL（需手动在 Supabase 执行）

```sql
CREATE TABLE suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE,
  content text NOT NULL,
  nickname text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON suggestions FOR SELECT USING (true);
CREATE POLICY "Public insert" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth delete" ON suggestions FOR DELETE USING (auth.role() = 'authenticated');
```

### Supabase RPC 函数

| 函数名 | 用途 |
|--------|------|
| `increment_try_count(tool_id)` | 工具试用次数 +1 |
| `increment_tool_vote(tool_id)` | 工具投票数 +1 |
| `increment_request_vote(request_id)` | 需求投票数 +1 |

### Mock 数据降级

`src/lib/api.ts`：Supabase 未配置时自动降级到 `mockData.ts`；**已配置时不降级**，错误打印到 console。

### 环境变量

```
VITE_SUPABASE_URL=你的 Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=你的 anon key
```

---

## 工具状态说明

| 状态值 | 含义 | 卡片边框 | 卡片徽标 |
|--------|------|----------|----------|
| `completed` | 已上线 | teal-200 | teal |
| `developing` | 开发中 | amber-200 | amber |
| `upcoming` | 即将开发 | indigo-100 | indigo |

- 编号为 `0` 的工具：挑战开始前上线，不计入 10 个统计
- 卡片编号放大突出，颜色跟随状态

---

## 首页进度统计说明

| 统计项 | 数据来源 |
|--------|---------|
| 完成工具 | `tools` 表中 `status=completed` 且 `number != 0` 的数量 |
| 实验天数 | 从 `site_config.experiment_start_date` 计算，本地时区对比 |
| 用户建议 | `suggestions` 表总条数 |
| 用户需求 | `requests` 表总条数 |

---

## 需求提交字段说明

提交需求时：
- **身份（role）** + **称呼（name）** 合并存储为 `nickname` 字段
- 格式：`保险代理人::张三`（有角色有名字）/ `保险代理人`（只选角色）/ `张三`（只填名字）
- `RequestCard` 和 `AdminRequests` 用 `parseNickname()` 拆解显示

---

## 后台管理功能

| 标签页 | 功能 |
|--------|------|
| 工具管理 | 增删改工具（含 notes/features/how_to_use）；编辑模式下可管理该工具的开发日志（增删改） |
| 日志管理 | 全局日志增删改 |
| 需求管理 | 查看所有需求（含角色/称呼/联系方式）；设为精选/取消；删除；每条需求可添加/编辑/删除回复 |
| 订阅列表 | 查看订阅用户 |

---

## 常用命令

```bash
# 进入项目目录
cd E:\ins-lab\ai-insurance-lab

# 安装依赖
npm install --legacy-peer-deps

# 本地开发
npm run dev

# 构建生产包（生成 dist/）
npm run build

# 预览构建结果
npm run preview
```

---

## 部署流程

**当前部署方式（自动）**：push 到 GitHub main 分支 → GitHub Actions 自动 build + SCP 上传到阿里云服务器。

```
git add [files] → git commit → git push → 自动部署（约 40s）
```

### 指令约定

| 用户指令 | 实际操作 |
|---------|---------|
| 提交备份 | git add + git commit（本地存档） |
| 上线 | git push（触发 GitHub Actions 自动部署） |

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
| HTTPS | Let's Encrypt，强制跳转，到期 2026-06-11 |

---

## 注意事项

- React Router 使用 `BrowserRouter`，Nginx 已配置 `try_files $uri /index.html`
- `wechat-qrcode.jpg` 放在 `public/` 目录，打包后在根路径访问
- 后台管理 `/admin` 使用 Supabase Auth 邮箱密码登录
- `suggestions` 表需手动在 Supabase SQL Editor 建表（见上方 SQL）
- `request_replies` 表需手动建表（见上方 SQL）
- `subscriptions` 表需补充 Auth read 策略（见上方 SQL），否则后台订阅列表为空
- 实验起始日期：`2026-03-14`（第1天），天数从本地零点切换，不受时区影响
