-- ============================================================
-- AI保险实验室 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行一次即可
-- ============================================================

-- 1. 工具表
CREATE TABLE IF NOT EXISTS tools (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number        INTEGER NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('completed', 'developing', 'upcoming')),
  start_date    DATE,
  complete_date DATE,
  url           TEXT,
  try_count     INTEGER DEFAULT 0,
  vote_count    INTEGER DEFAULT 0,
  features      TEXT,
  how_to_use    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 实验日志表
CREATE TABLE IF NOT EXISTS logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id    UUID REFERENCES tools(id) ON DELETE SET NULL,
  date       DATE NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 用户需求表
CREATE TABLE IF NOT EXISTS requests (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem          TEXT NOT NULL,
  current_solution TEXT,
  willing_to_try   TEXT,
  nickname         TEXT,
  contact          TEXT,
  vote_count       INTEGER DEFAULT 0,
  is_featured      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 站点配置表
CREATE TABLE IF NOT EXISTS site_config (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_title            TEXT DEFAULT 'AI保险实验室',
  hero_subtitle         TEXT DEFAULT '100天，用AI做10个真实可用的保险小工具。从想法 → 开发 → 上线，全过程公开。',
  experiment_start_date DATE DEFAULT '2026-01-01',
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS 行级安全策略 ──────────────────────────────────────

ALTER TABLE tools       ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- 公开可读
CREATE POLICY "public read tools"       ON tools       FOR SELECT USING (true);
CREATE POLICY "public read logs"        ON logs        FOR SELECT USING (true);
CREATE POLICY "public read requests"    ON requests    FOR SELECT USING (true);
CREATE POLICY "public read site_config" ON site_config FOR SELECT USING (true);

-- 公开可写（需求 & 订阅）
CREATE POLICY "public insert requests"     ON requests     FOR INSERT WITH CHECK (true);
CREATE POLICY "public insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (true);

-- ── RPC 函数（投票 & 试用计数）───────────────────────────

CREATE OR REPLACE FUNCTION increment_try_count(tool_id UUID)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE tools SET try_count = try_count + 1 WHERE id = tool_id;
$$;

CREATE OR REPLACE FUNCTION increment_tool_vote(tool_id UUID)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE tools SET vote_count = vote_count + 1 WHERE id = tool_id;
$$;

CREATE OR REPLACE FUNCTION increment_request_vote(request_id UUID)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE requests SET vote_count = vote_count + 1 WHERE id = request_id;
$$;

-- ── 初始数据 ────────────────────────────────────────────

-- 站点配置
INSERT INTO site_config (hero_title, hero_subtitle, experiment_start_date)
VALUES (
  'AI保险实验室',
  '100天，用AI做10个真实可用的保险小工具。从想法 → 开发 → 上线，全过程公开。',
  '2026-01-01'
) ON CONFLICT DO NOTHING;

-- 示例工具（可在后台修改或删除）
INSERT INTO tools (number, name, description, status, start_date, complete_date, url, try_count, vote_count, features, how_to_use)
VALUES
  (1, '医疗险推荐器',   '输入年龄、预算、健康情况，AI帮你筛选最合适的医疗险产品', 'completed', '2026-01-01', '2026-01-07', null, 0, 0,
   '根据个人情况智能推荐' || chr(10) || '对比多款产品差异' || chr(10) || '生成推荐理由报告',
   '1. 填写基本信息' || chr(10) || '2. 选择预算范围' || chr(10) || '3. 查看推荐结果'),
  (2, '保险条款解释工具', '粘贴晦涩的保险条款，AI用大白话帮你解释清楚',             'completed', '2026-01-08', '2026-01-15', null, 0, 0,
   '支持粘贴任意保险条款' || chr(10) || '生成通俗易懂的解释' || chr(10) || '标注重要风险点',
   '1. 粘贴条款文字' || chr(10) || '2. 点击解释' || chr(10) || '3. 查看通俗版本'),
  (3, '理赔材料清单生成器', '描述你的理赔情况，AI帮你生成需要准备的完整材料清单',  'developing', '2026-01-16', null, null, 0, 0, null, null),
  (4, '保费计算器',      '快速估算各类险种的大致保费区间',                          'upcoming',   null, null, null, 0, 0, null, null),
  (5, '培训课件生成器',  '输入险种知识点，AI自动生成结构化培训课件',                 'upcoming',   null, null, null, 0, 0, null, null),
  (6, '保险方案对比工具', '上传多份保险方案，AI帮你对比分析优劣势',                  'upcoming',   null, null, null, 0, 0, null, null)
ON CONFLICT DO NOTHING;
