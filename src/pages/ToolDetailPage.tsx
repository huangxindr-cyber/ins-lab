import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2, CheckCircle, MessageSquare, Users, Star } from 'lucide-react'
import type { Tool, Log, Suggestion } from '../types'
import { getToolById, getLogsByToolId, incrementTryCount, getSuggestions, submitSuggestion } from '../lib/api'

const statusConfig = {
  completed: { label: '已上线', className: 'bg-teal-50 text-teal-700' },
  developing: { label: '开发中', className: 'bg-amber-100 text-amber-700' },
  upcoming: { label: '即将开发', className: 'bg-indigo-50 text-indigo-600' },
}

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tool, setTool] = useState<Tool | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getToolById(id), getLogsByToolId(id), getSuggestions(id)]).then(([t, l, s]) => {
      setTool(t)
      setLogs(l)
      setSuggestions(s)
      setLoading(false)
    })
  }, [id])

  const handleTry = async () => {
    if (!tool?.url) return
    await incrementTryCount(tool.id)
    window.open(tool.url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-14">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="pt-14 min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p className="mb-4">工具不存在</p>
        <Link to="/" className="text-teal-600 hover:underline">← 返回首页</Link>
      </div>
    )
  }

  const status = statusConfig[tool.status]

  return (
    <div className="pt-14 pb-16 md:pb-0 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft size={16} /> 返回首页
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* 左栏：工具详情 */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-gray-400">#{String(tool.number).padStart(2, '0')}</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{tool.name}</h1>
                  <p className="text-gray-600">{tool.description}</p>
                </div>
              </div>

              {tool.status === 'completed' || (tool.status === 'developing' && tool.url) ? (
                <button
                  onClick={handleTry}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  {tool.status === 'completed' ? '进入' : '点击使用'}
                </button>
              ) : (
                <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-xl cursor-not-allowed">
                  <ExternalLink size={16} />
                  {tool.status === 'developing' ? '开发中，即将上线' : '尚未开始开发'}
                </button>
              )}
            </div>

            {/* Core Scenarios */}
            {tool.core_scenarios && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">核心场景</h2>
                <ul className="space-y-2">
                  {tool.core_scenarios.split('\n').filter(Boolean).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <span className="text-indigo-400 mt-0.5">▸</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Features */}
            {tool.features && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">功能介绍</h2>
                <ul className="space-y-2">
                  {tool.features.split('\n').filter(Boolean).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                      <span className="text-teal-500 mt-0.5">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* How to use */}
            {tool.how_to_use && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">使用方法</h2>
                <ol className="space-y-2">
                  {tool.how_to_use.split('\n').filter(Boolean).map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                      {step.replace(/^\d+\.\s*/, '')}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Development logs */}
            {logs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">开发日志</h2>
                <div className="space-y-4">
                  {logs.map((log, i) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-teal-400 mt-1 shrink-0"></div>
                        {i < logs.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1"></div>}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">{log.date}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.type === 'weekly' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {log.type === 'weekly' ? '周复盘' : '日记录'}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm mb-1">{log.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已上线工具底部：入群卡片 */}
            {tool.status === 'completed' && <JoinGroupCard />}
          </div>

          {/* 右栏：建议表单 + 建议列表 */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-20" id="suggestions">
            <SuggestionForm toolId={tool.id} onSubmitted={s => setSuggestions(prev => [s, ...prev])} />
            {suggestions.length > 0 && <SuggestionList suggestions={suggestions} />}
          </div>

        </div>
      </div>
    </div>
  )
}

function SuggestionForm({ toolId, onSubmitted }: { toolId: string; onSubmitted: (s: Suggestion) => void }) {
  const [form, setForm] = useState({ content: '', nickname: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-300 placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setStatus('loading')
    const res = await submitSuggestion(toolId, form.content, form.nickname || undefined)
    if (res.success) {
      setStatus('success')
      onSubmitted({
        id: Date.now().toString(),
        tool_id: toolId,
        content: form.content,
        nickname: form.nickname || null,
        created_at: new Date().toISOString(),
        is_featured: false,
        is_hidden: false,
      })
      setForm({ content: '', nickname: '' })
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      setStatus('error')
      setErrorMsg(res.error || '提交失败，请稍后重试')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={16} className="text-teal-500" />
        <h2 className="text-base font-bold text-gray-900">提交建议</h2>
      </div>
      <p className="text-xs text-gray-400 mb-5">对这个工具有任何想法或建议？欢迎告诉我</p>

      {status === 'success' ? (
        <div className="text-center py-4">
          <CheckCircle size={28} className="text-teal-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-800">提交成功，感谢！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              你的建议 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              required rows={4}
              placeholder="比如：希望增加某功能、某个地方体验不好、有更好的实现思路..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">称呼</label>
            <input
              value={form.nickname}
              onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
              placeholder="如何称呼你？（选填）"
              className={inputCls}
            />
          </div>
          {status === 'error' && <p className="text-red-500 text-xs">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === 'loading' || !form.content.trim()}
            className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
            提交建议
          </button>
        </form>
      )}
    </div>
  )
}

function JoinGroupCard() {
  const [showQR, setShowQR] = useState(false)
  return (
    <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="opacity-80" />
            <span className="font-semibold">用了有问题？来群里聊</span>
          </div>
          <p className="text-teal-100 text-sm">和作者及其他用户直接交流，反馈 bug、分享经验</p>
        </div>
        <button
          onClick={() => setShowQR(!showQR)}
          className="shrink-0 ml-4 px-4 py-2 bg-white text-teal-600 text-sm font-semibold rounded-xl hover:bg-teal-50 transition-colors"
        >
          {showQR ? '收起' : '加入'}
        </button>
      </div>
      {showQR && (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-teal-400/40">
          {/* 直播后恢复：<img src="/wechat-qrcode.jpg" alt="微信群二维码" className="w-32 h-32 rounded-xl object-cover border-2 border-white/30 shrink-0" /> */}
          <p className="text-teal-100 text-sm leading-relaxed text-center sm:text-left">
            微信扫码/长按保存或转发<br />加入 AI 保险实验讨论群<br />第一时间获取新工具通知
          </p>
        </div>
      )}
    </div>
  )
}

function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-900 mb-4">已提交的建议（{suggestions.length}）</h2>
      <div className="space-y-4">
        {suggestions.map(s => (
          <div key={s.id} className={`border-b border-gray-50 pb-4 last:border-0 last:pb-0 ${s.is_featured ? 'bg-amber-50/50 -mx-2 px-2 rounded-xl border-amber-100' : ''}`}>
            {s.is_featured && (
              <div className="flex items-center gap-1 mb-1.5">
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <span className="text-xs text-amber-500 font-medium">精选建议</span>
              </div>
            )}
            <p className="text-sm text-gray-700 leading-relaxed">{s.content}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 font-medium">{s.nickname || '匿名'}</span>
              <span className="text-xs text-gray-300">{new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
