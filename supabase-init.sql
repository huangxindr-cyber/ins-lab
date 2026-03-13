-- ============================================================
-- AI保险实验室 Supabase 数据库初始化脚本
-- 在 Supabase 控制台 → SQL Editor 中执行
-- ============================================================


-- ------------------------------------------------------------
-- 1. 建表
-- ------------------------------------------------------------

-- 工具表
CREATE TABLE IF NOT EXISTS tools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number        integer NOT NULL UNIQUE,
  name          text NOT NULL,
  description   text NOT NULL,
  status        text NOT NULL CHECK (status IN ('completed', 'developing', 'upcoming')),
  start_date    date,
  complete_date date,
  url           text,
  try_count     integer NOT NULL DEFAULT 0,
  vote_count    integer NOT NULL DEFAULT 0,
  features      text,
  how_to_use    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 实验日志表
CREATE TABLE IF NOT EXISTS logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id    uuid REFERENCES tools(id) ON DELETE SET NULL,
  date       date NOT NULL,
  title      text NOT NULL,
  content    text NOT NULL,
  type       text NOT NULL CHECK (type IN ('daily', 'weekly')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 用户需求表
CREATE TABLE IF NOT EXISTS requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem          text NOT NULL,
  current_solution text,
  willing_to_try   text,
  nickname         text,
  contact          text,
  vote_count       integer NOT NULL DEFAULT 0,
  is_featured      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 站点配置表（只有一条记录）
CREATE TABLE IF NOT EXISTS site_config (
  id                    text PRIMARY KEY DEFAULT '1',
  hero_title            text NOT NULL DEFAULT 'AI保险实验室',
  hero_subtitle         text NOT NULL DEFAULT '100天，用AI做10个真实可用的保险小工具。从想法 → 开发 → 上线，全过程公开。',
  experiment_start_date date NOT NULL DEFAULT '2026-01-01'
);


-- ------------------------------------------------------------
-- 2. RPC 函数（计数器 +1）
-- ------------------------------------------------------------

-- 工具试用次数 +1
CREATE OR REPLACE FUNCTION increment_try_count(tool_id uuid)
RETURNS void AS $$
  UPDATE tools SET try_count = try_count + 1 WHERE id = tool_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 工具投票数 +1
CREATE OR REPLACE FUNCTION increment_tool_vote(tool_id uuid)
RETURNS void AS $$
  UPDATE tools SET vote_count = vote_count + 1 WHERE id = tool_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 需求投票数 +1
CREATE OR REPLACE FUNCTION increment_request_vote(request_id uuid)
RETURNS void AS $$
  UPDATE requests SET vote_count = vote_count + 1 WHERE id = request_id;
$$ LANGUAGE sql SECURITY DEFINER;


-- ------------------------------------------------------------
-- 3. Row Level Security（RLS）
-- ------------------------------------------------------------

ALTER TABLE tools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config   ENABLE ROW LEVEL SECURITY;

-- tools：所有人可读，禁止匿名写
CREATE POLICY "tools_public_read"  ON tools FOR SELECT USING (true);

-- logs：所有人可读
CREATE POLICY "logs_public_read"   ON logs  FOR SELECT USING (true);

-- requests：所有人可读、可新增
CREATE POLICY "requests_public_read"   ON requests FOR SELECT USING (true);
CREATE POLICY "requests_public_insert" ON requests FOR INSERT WITH CHECK (true);

-- subscriptions：只允许新增
CREATE POLICY "subscriptions_public_insert" ON subscriptions FOR INSERT WITH CHECK (true);

-- site_config：所有人可读
CREATE POLICY "site_config_public_read" ON site_config FOR SELECT USING (true);


-- ------------------------------------------------------------
-- 4. 初始数据
-- ------------------------------------------------------------

-- 站点配置（实验起始日期按实际情况修改）
INSERT INTO site_config (id, hero_title, hero_subtitle, experiment_start_date)
VALUES (
  '1',
  'AI保险实验室',
  '100天，用AI做10个真实可用的保险小工具。从想法 → 开发 → 上线，全过程公开。',
  '2026-03-13'
)
ON CONFLICT (id) DO UPDATE SET
  hero_title            = EXCLUDED.hero_title,
  hero_subtitle         = EXCLUDED.hero_subtitle,
  experiment_start_date = EXCLUDED.experiment_start_date;
