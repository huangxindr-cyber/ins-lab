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
│   ├── App.tsx                  # 路由配置 + ScrollToTop + 移动端底部 BottomNav
│   ├── main.tsx                 # 入口
│   ├── index.css                # 全局样式
│   ├── types/index.ts           # 全局类型定义
│   ├── lib/
│   │   ├── supabase.ts          # Supabase 客户端初始化
│   │   ├── api.ts               # 所有数据操作函数
│   │   └── mockData.ts          # 本地 Mock 数据（Supabase 未配置时使用）
│   ├── components/
│   │   ├── Navbar.tsx           # 顶部导航栏（仅桌面端，无移动端汉堡菜单）
│   │   ├── ToolCard.tsx         # 工具卡片（支持投票/取消投票，localStorage防重）
│   │   └── RequestCard.tsx      # 需求卡片（投票/取消、状态徽标、作者回复、入群引导）
│   └── pages/
│       ├── HomePage.tsx         # 首页（Hero、3格统计、100格进度图、工具列表全宽、订阅）
│       ├── ToolDetailPage.tsx   # 工具详情页（左工具信息+入群卡片 / 右建议表单+列表）
│       ├── RequestsPage.tsx     # 需求页（顶部提交表单，下方全部需求，精选置顶）
│       ├── LogsPage.tsx         # 实验日志页（每次加载5条，查看更多）
│       └── AdminPage.tsx        # 后台管理（工具/日志/需求状态/回复/订阅）
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── wechat-qrcode.jpg        # 微信群二维码
├── .github/workflows/deploy.yml # GitHub Actions 自动部署
├── dist/                        # 构建产物
├── index.html
├── vite.config.ts
├── tsconfig.json
└── .env.local                   # 本地环境变量（不提交 git）
```

---

## 路由结构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 首页（工具列表） |
| `/tools/:id` | ToolDetailPage | 工具详情页（从首页卡片跳转） |
| `/requests` | RequestsPage | 用户需求页 |
| `/logs` | LogsPage | 实验日志 |
| `/admin` | AdminPage | 后台管理（需登录） |

> `/tools` 工具列表页路由仍保留但不在导航显示。

---

## 导航说明

### 桌面端（md 以上）
- 顶部 Navbar：首页 / 需求 / 实验日志
- 左侧悬浮：微信入群社群卡片（渐变绿色）

### 移动端
- 顶部 Navbar：仅显示 Logo（无汉堡菜单）
- 底部 BottomNav（`App.tsx`）：工具 / 需求 / 实验日志（admin 页隐藏）
- 首页右下角：「入群讨论」浮动按钮，点击底部弹出 QR 卡片
- `ScrollToTop` 组件：路由切换自动滚到顶部

---

## 页面功能说明

### HomePage（首页）
- Hero：标题 + 副标题（`whitespace-pre-line` 支持换行）
- 统计：3格（完成工具 / 用户建议 / 用户需求）
- 进度：100格方块图（20列×5行，已过天数填充 teal）
- 工具列表：正在开发 / 已上线 / 即将开发，全宽展示
- 实验日志：**桌面端**显示最新5条（移动端隐藏）
- 订阅区：邮件订阅 + "直接扫码加入讨论群"选项

### RequestsPage（需求页）
- 移动端：提交表单在上，需求列表在下
- 桌面端：左列需求列表 + 右侧 sticky 表单
- 排序：精选需求（is_featured=true）置顶，其余按时间倒序
- 提交成功后立即插入列表顶部（api 返回 data）

### LogsPage（实验日志页）
- 首次显示最新 5 条
- 「查看更多」每次追加 5 条
- 筛选：全部 / 日记录 / 周复盘

### ToolDetailPage（工具详情页）
- 左列：工具信息、功能介绍、使用方法、开发日志
- 左列底部：**已上线工具**显示「用了有问题？来群里聊」入群卡片（点击展开 QR）
- 右列：建议提交表单 + 建议列表（sticky）

### RequestCard（需求卡片）
- 显示需求状态徽标（待评估不显示，其他显示对应颜色）
- 作者回复：amber 底色区块展示
- 有回复时：回复下方出现「想深入交流？扫码入群」提示（点击内联展开 QR）
- 投票/取消投票：localStorage 防重，支持二次点击取消，有缩放动画

---

## 数据层说明

### Supabase 表结构

| 表名 | 说明 |
|------|------|
| `tools` | 工具信息（number/name/description/status/url/notes/features/how_to_use/try_count/vote_count） |
| `logs` | 实验日志（tool_id 可关联工具，type: daily/weekly） |
| `requests` | 用户需求（nickname 存 `role::name`，status 字段：待评估/考虑中/已立项/已实现/暂不做） |
| `suggestions` | 工具建议（关联 tool_id） |
| `request_replies` | 需求回复（关联 request_id，管理员发布，公开展示） |
| `subscriptions` | 订阅用户（邮箱或微信号） |
| `site_config` | 首页配置（hero_title/hero_subtitle/experiment_start_date） |

### 已执行的 Supabase SQL

```sql
-- suggestions 表
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

-- request_replies 表
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

-- subscriptions 读取权限
CREATE POLICY "Auth read subscriptions" ON subscriptions FOR SELECT USING (auth.role() = 'authenticated');

-- requests 表新增 status 字段
ALTER TABLE requests ADD COLUMN IF NOT EXISTS status text DEFAULT '待评估';
```

### Supabase RPC 函数（均已执行）

| 函数名 | 用途 |
|--------|------|
| `increment_try_count(tool_id)` | 工具试用次数 +1 |
| `increment_tool_vote(tool_id)` | 工具投票数 +1 |
| `increment_request_vote(request_id)` | 需求投票数 +1 |
| `decrement_tool_vote(tool_id)` | 工具投票数 -1（最小为0，取消投票用） |
| `decrement_request_vote(request_id)` | 需求投票数 -1（最小为0，取消投票用） |

```sql
CREATE OR REPLACE FUNCTION decrement_tool_vote(tool_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tools SET vote_count = GREATEST(0, vote_count - 1) WHERE id = tool_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_request_vote(request_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE requests SET vote_count = GREATEST(0, vote_count - 1) WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;
```

### Mock 数据降级

`src/lib/api.ts`：Supabase 已配置时不降级，错误打印到 console。

### 环境变量

```
VITE_SUPABASE_URL=你的 Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=你的 anon key
```

---

## 工具状态说明

| 状态值 | 含义 | 卡片边框 | 徽标 |
|--------|------|----------|------|
| `completed` | 已上线 | teal-200 | teal |
| `developing` | 开发中 | amber-200 | amber |
| `upcoming` | 即将开发 | indigo-100 | indigo |

- 编号为 `0` 的工具：挑战开始前上线，不计入 10 个统计
- `upcoming` 工具卡片显示投票按钮，支持投票/取消投票

---

## 需求状态说明

| 状态值 | 显示 | 颜色 |
|--------|------|------|
| `待评估` | 不显示徽标 | — |
| `考虑中` | 蓝色 | blue |
| `已立项` | 绿色 | teal |
| `已实现` | 绿色 | green |
| `暂不做` | 红色 | red |

后台 AdminRequests 可通过下拉框直接修改状态。

---

## 投票机制

- localStorage 键：`voted_tools`（工具）/ `voted_requests`（需求）
- 首次点击：投票（+1，写入 localStorage，调 Supabase RPC）
- 再次点击：取消投票（-1，从 localStorage 移除，调 decrement RPC）
- 动画：点击时 `scale-95` 缩放 400ms

---

## 首页进度统计说明

| 统计项 | 数据来源 |
|--------|---------|
| 完成工具 | `tools` 表中 `status=completed` 且 `number != 0` 的数量 |
| 用户建议 | `suggestions` 表总条数 |
| 用户需求 | `requests` 表总条数 |

实验天数通过 100格方块图展示（不再单独显示数字）。

---

## 需求提交字段说明

提交需求时：
- **身份（role）** + **称呼（name）** 合并存储为 `nickname` 字段
- 格式：`保险代理人::张三` / `保险代理人`（只选角色）/ `张三`（只填名字）
- `RequestCard` 和 `AdminRequests` 用 `parseNickname()` 拆解显示

---

## 后台管理功能

| 标签页 | 功能 |
|--------|------|
| 工具管理 | 增删改工具；编辑模式下管理该工具的开发日志（增删改） |
| 日志管理 | 全局日志增删改 |
| 需求管理 | 查看所有需求；修改状态（下拉框）；设为精选/取消；删除；每条需求可添加/编辑/删除作者回复 |
| 订阅列表 | 查看订阅用户（需 RLS SELECT 策略） |

---

## 微信引流设计

| 位置 | 形式 | 触发时机 |
|------|------|---------|
| 首页桌面端 | 左侧固定绿色渐变社群卡片 | 常驻 |
| 首页移动端 | 右下角浮动「入群讨论」按钮，点击底部弹出 QR | 常驻 |
| 工具详情页 | 已上线工具左列底部「有问题？来群里聊」卡片 | 已上线工具 |
| 需求卡片 | 作者回复下方「想深入交流？扫码入群」提示 | 有作者回复 |
| 订阅区 | 分隔线 + 「直接扫码加入讨论群」按钮 | 常驻 |

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
- 实验起始日期：`2026-03-14`（第1天），天数从本地零点切换，不受时区影响
- 所有 Supabase 表和 RPC 函数均已执行（见上方 SQL 区块）
- 每次开发完成后需同步更新 `CLAUDE.md` 和 `E:\ins-lab\WORK-LOG.md`
