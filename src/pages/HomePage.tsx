import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CheckCircle, Loader2 } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import RequestCard from '../components/RequestCard'
import type { Tool, Log, Request, SiteConfig } from '../types'
import { getTools, getLogs, getFeaturedRequests, getSiteConfig, submitRequest, subscribe, calcExperimentDays } from '../lib/api'

export default function HomePage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTools(), getLogs(5), getFeaturedRequests(5), getSiteConfig()]).then(([t, l, r, c]) => {
      setTools(t)
      setLogs(l)
      setRequests(r)
      setConfig(c)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  const developingTools = tools.filter(t => t.status === 'developing')
  const completedTools = tools.filter(t => t.status === 'completed')
  const upcomingTools = tools.filter(t => t.status === 'upcoming')
  const days = config ? calcExperimentDays(config.experiment_start_date) : 1

  return (
    <div className="pt-14">
      <WechatQRWidget />
      <HeroSection config={config} />
      <ProgressSection days={days} completedCount={completedTools.length} requestCount={requests.length} />
      {developingTools.length > 0 && <ToolsSection title="正在开发" tools={developingTools} />}
      {completedTools.length > 0 && <ToolsSection title="已上线工具" tools={completedTools.slice(0, 4)} showMore={completedTools.length > 4} />}
      {upcomingTools.length > 0 && <ToolsSection title="即将开发" tools={upcomingTools} subtitle="投票让该项目提前开发" />}
      <RequestFormSection />
      {requests.length > 0 && <FeaturedRequestsSection requests={requests} />}
      {logs.length > 0 && <LogsSection logs={logs} />}
      <SubscribeSection />
    </div>
  )
}

function WechatQRWidget() {
  return (
    <>
      {/* 桌面端：左侧固定悬浮 */}
      <div className="hidden md:flex fixed top-20 left-4 z-40 flex-col items-center bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-48">
        <img src="/wechat-qrcode.jpg" alt="微信群二维码" className="w-full rounded-xl object-cover" />
        <p className="text-center text-gray-700 text-sm font-medium mt-3">入群讨论</p>
      </div>
      {/* 移动端：顶部内嵌横排 */}
      <div className="md:hidden flex items-center gap-4 bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 mx-4 mt-3">
        <img src="/wechat-qrcode.jpg" alt="微信群二维码" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
        <div>
          <p className="text-base font-semibold text-gray-800">扫码入群讨论</p>
          <p className="text-sm text-gray-500 mt-1">和大家一起探讨 AI 保险工具</p>
        </div>
      </div>
    </>
  )
  )
}

function HeroSection({ config }: { config: SiteConfig | null }) {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <CheckCircle size={14} />
          100天公开实验进行中
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {config?.hero_title || 'AI保险实验室'}
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {config?.hero_subtitle || '100天，用AI做10个真实可用的保险小工具。从想法 → 开发 → 上线，全过程公开。'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/tools" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
            查看所有工具 <ArrowRight size={16} />
          </Link>
          <Link to="/requests" className="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            提交需求
          </Link>
        </div>
      </div>
    </section>
  )
}

function ProgressSection({ days, completedCount, requestCount }: { days: number; completedCount: number; requestCount: number }) {
  const stats = [
    { label: '完成工具', value: `${completedCount}/10` },
    { label: '实验进度', value: `${days}/100天` },
    { label: '用户建议', value: `${requestCount}条` },
  ]

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-indigo-50 rounded-2xl p-5 text-center">
              <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            <span className="text-sm font-medium text-gray-700">实验进度</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all"
              style={{ width: `${days}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">{days}%</div>
        </div>
      </div>
    </section>
  )
}

function ToolsSection({ title, tools, subtitle, showMore }: { title: string; tools: Tool[]; subtitle?: string; showMore?: boolean }) {
  const [localTools, setLocalTools] = useState(tools)
  const handleVote = (id: string) => {
    setLocalTools(prev => prev.map(t => t.id === id ? { ...t, vote_count: t.vote_count + 1 } : t))
  }

  return (
    <section className="py-10 px-4 bg-white border-t border-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <span className="text-sm text-gray-400">{subtitle}</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {localTools.map(tool => <ToolCard key={tool.id} tool={tool} onVote={handleVote} />)}
        </div>
        {showMore && (
          <div className="text-center mt-6">
            <Link to="/tools" className="text-indigo-600 text-sm hover:underline flex items-center gap-1 justify-center">
              查看全部工具 <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function RequestFormSection() {
  const [form, setForm] = useState({ problem: '', current_solution: '', willing_to_try: '', nickname: '', contact: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.problem.trim()) return
    setStatus('loading')
    const res = await submitRequest({
      problem: form.problem,
      current_solution: form.current_solution || undefined,
      willing_to_try: form.willing_to_try || undefined,
      nickname: form.nickname || undefined,
      contact: form.contact || undefined,
    })
    if (res.success) {
      setStatus('success')
      setForm({ problem: '', current_solution: '', willing_to_try: '', nickname: '', contact: '' })
    } else {
      setStatus('error')
      setErrorMsg(res.error || '提交失败，请稍后重试')
    }
  }

  return (
    <section className="py-14 px-4 bg-gradient-to-b from-white to-indigo-50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">你希望AI帮你做什么工具？</h2>
        <p className="text-center text-gray-500 text-sm mb-8">如果您的需求被采纳，未来可终身免费使用该工具</p>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">提交成功！</h3>
            <p className="text-gray-500 text-sm">感谢你的需求，我会认真考虑的。</p>
            <button onClick={() => setStatus('idle')} className="mt-4 text-indigo-600 text-sm hover:underline">再提交一条</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">你想解决什么问题？<span className="text-red-500">*</span></label>
              <textarea
                value={form.problem}
                onChange={e => setForm(p => ({ ...p, problem: e.target.value }))}
                required
                rows={3}
                placeholder="描述你在保险方面遇到的问题或痛点..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">现在是怎么解决的？<span className="text-gray-400 font-normal">（选填）</span></label>
              <textarea
                value={form.current_solution}
                onChange={e => setForm(p => ({ ...p, current_solution: e.target.value }))}
                rows={2}
                placeholder="目前的解决方式，或者就是没有好方法..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">如果有工具你愿意试用吗？<span className="text-gray-400 font-normal">（选填）</span></label>
              <textarea
                value={form.willing_to_try}
                onChange={e => setForm(p => ({ ...p, willing_to_try: e.target.value }))}
                rows={2}
                placeholder="说说你的使用意愿..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">您的称呼<span className="text-gray-400 font-normal">（选填）</span></label>
                <input
                  value={form.nickname}
                  onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                  placeholder="昵称"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">联系方式<span className="text-gray-400 font-normal">（选填）</span></label>
                <input
                  value={form.contact}
                  onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="邮箱或微信号"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>
            {status === 'error' && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <button
              type="submit"
              disabled={status === 'loading' || !form.problem.trim()}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
              提交需求
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function FeaturedRequestsSection({ requests }: { requests: Request[] }) {
  const [localRequests, setLocalRequests] = useState(requests)
  const handleVote = (id: string) => {
    setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, vote_count: r.vote_count + 1 } : r))
  }
  return (
    <section className="py-10 px-4 bg-white border-t border-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">精选需求</h2>
          <Link to="/requests" className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localRequests.map(r => <RequestCard key={r.id} request={r} onVote={handleVote} />)}
        </div>
      </div>
    </section>
  )
}

function LogsSection({ logs }: { logs: Log[] }) {
  return (
    <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">实验日志</h2>
          <Link to="/logs" className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4">
              <div className="shrink-0 text-center">
                <div className="text-xs text-gray-400">{log.date.substring(0, 7)}</div>
                <div className="font-bold text-gray-900 text-sm">{log.date.substring(8, 10)}日</div>
                <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${log.type === 'weekly' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {log.type === 'weekly' ? '周复盘' : '日记录'}
                </div>
              </div>
              <div className="border-l border-gray-100 pl-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{log.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{log.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SubscribeSection() {
  const [expanded, setExpanded] = useState(false)
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact.trim()) return
    setStatus('loading')
    const res = await subscribe(contact)
    setStatus(res.success ? 'success' : 'error')
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-center">
      <div className="max-w-lg mx-auto">
        <Bell size={32} className="mx-auto mb-4 opacity-90" />
        <h2 className="text-2xl font-bold mb-2">订阅实验进展</h2>
        <p className="text-indigo-200 text-sm mb-6">每当有新工具上线或重要进展，第一时间通知你</p>

        {status === 'success' ? (
          <div className="bg-white/20 rounded-2xl p-6">
            <CheckCircle size={32} className="mx-auto mb-2" />
            <p className="font-medium">订阅成功！</p>
          </div>
        ) : expanded ? (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="邮箱或微信号"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !contact.trim()}
              className="px-5 py-2.5 bg-white text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : '订阅'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="px-8 py-3 bg-white text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors"
          >
            订阅实验进展
          </button>
        )}
        {status === 'error' && <p className="text-red-300 text-sm mt-2">订阅失败，请稍后重试</p>}
      </div>
    </section>
  )
}
