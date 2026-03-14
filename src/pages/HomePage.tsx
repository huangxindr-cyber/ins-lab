import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CheckCircle, Loader2 } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import type { Tool, Log, SiteConfig } from '../types'
import { getTools, getLogs, getRequests, getSiteConfig, subscribe, calcExperimentDays, getTotalSuggestionsCount } from '../lib/api'

export default function HomePage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [requestCount, setRequestCount] = useState(0)
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [suggestionCount, setSuggestionCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTools(), getLogs(5), getRequests(), getSiteConfig(), getTotalSuggestionsCount()]).then(([t, l, r, c, sc]) => {
      setTools(t)
      setLogs(l)
      setRequestCount(r.length)
      setConfig(c)
      setSuggestionCount(sc)
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
  const completedCountForStats = completedTools.filter(t => t.number !== 0).length

  return (
    <div className="pt-14 pb-16 md:pb-0">
      <WechatQRWidget />
      <HeroSection config={config} />
      <ProgressSection days={days} completedCount={completedCountForStats} requestCount={requestCount} suggestionCount={suggestionCount} />

      {/* 工具列表 */}
      <section className="px-4 py-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="border border-gray-200 rounded-2xl p-5 space-y-8">
            {developingTools.length > 0 && <ToolGroup title="正在开发" tools={developingTools} />}
            {completedTools.length > 0 && <ToolGroup title="已上线工具" tools={completedTools.slice(0, 4)} showMore={completedTools.length > 4} />}
            {upcomingTools.length > 0 && <ToolGroup title="即将开发" tools={upcomingTools} subtitle="投票让该项目提前开发" />}
          </div>
        </div>
      </section>

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
      {/* 移动端：顶部内嵌横排（仅首页/工具页显示） */}
      <div className="md:hidden flex items-center gap-4 bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 mx-4 mt-3">
        <img src="/wechat-qrcode.jpg" alt="微信群二维码" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
        <div>
          <p className="text-base font-semibold text-gray-800">扫码入群讨论</p>
          <p className="text-sm text-gray-500 mt-1">和大家一起探讨 AI 保险工具</p>
          <p className="text-xs text-gray-400 mt-0.5">长按图片转发二维码</p>
        </div>
      </div>
    </>
  )
}

function HeroSection({ config }: { config: SiteConfig | null }) {
  return (
    <section className="bg-gradient-to-b from-teal-50/60 to-white pt-16 pb-4 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
          <CheckCircle size={12} />
          100天公开实验进行中
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
          {config?.hero_title || 'AI保险实验室'}
        </h1>
        <p className="text-base text-gray-500 mb-8 whitespace-nowrap">
          {config?.hero_subtitle || '100天，用AI做10个真实可用的保险小工具。从想法到开发到上线，全程公开记录。'}
        </p>
      </div>
    </section>
  )
}

function ProgressSection({ days, completedCount, requestCount, suggestionCount }: { days: number; completedCount: number; requestCount: number; suggestionCount: number }) {
  const stats = [
    { label: '完成工具', value: `${completedCount}/10` },
    { label: '实验天数', value: `${days}/100` },
    { label: '用户建议', value: `${suggestionCount}` },
    { label: '用户需求', value: `${requestCount}` },
  ]

  return (
    <section className="pt-3 pb-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 gap-3 md:gap-4 mb-4">
          {stats.map(s => (
            <div key={s.label} className="bg-teal-50 rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-teal-600 leading-none">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">实验进度</span>
            <span className="text-xs text-gray-400">{days}/100 天</span>
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
            {Array.from({ length: 100 }, (_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-[2px] ${i < days ? 'bg-teal-400' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ToolGroup({ title, tools, subtitle, showMore }: { title: string; tools: Tool[]; subtitle?: string; showMore?: boolean }) {
  const [localTools, setLocalTools] = useState(tools)
  const handleVote = (id: string) => {
    setLocalTools(prev => prev.map(t => t.id === id ? { ...t, vote_count: t.vote_count + 1 } : t))
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {localTools.map(tool => <ToolCard key={tool.id} tool={tool} onVote={handleVote} />)}
      </div>
      {showMore && (
        <div className="mt-4">
          <Link to="/tools" className="text-teal-600 text-sm hover:underline flex items-center gap-1">
            查看全部工具 <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}

function LogsSection({ logs }: { logs: Log[] }) {
  return (
    <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">实验日志</h2>
          <Link to="/logs" className="text-teal-600 text-sm hover:underline flex items-center gap-1">
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
    <section className="py-16 px-4 bg-gradient-to-br from-teal-600 to-cyan-600 text-white text-center">
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
