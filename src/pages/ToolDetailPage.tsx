import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import type { Tool, Log } from '../types'
import { getToolById, getLogsByToolId, incrementTryCount } from '../lib/api'

const statusConfig = {
  completed: { label: '已上线', className: 'bg-green-100 text-green-700' },
  developing: { label: '开发中', className: 'bg-amber-100 text-amber-700' },
  upcoming: { label: '即将开发', className: 'bg-purple-100 text-purple-700' },
}

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tool, setTool] = useState<Tool | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getToolById(id), getLogsByToolId(id)]).then(([t, l]) => {
      setTool(t)
      setLogs(l)
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
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="pt-14 min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p className="mb-4">工具不存在</p>
        <Link to="/tools" className="text-indigo-600 hover:underline">← 返回工具列表</Link>
      </div>
    )
  }

  const status = statusConfig[tool.status]

  return (
    <div className="pt-14 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/tools" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft size={16} /> 返回工具列表
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
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

          <div className="flex flex-wrap gap-3">
            {tool.status === 'completed' ? (
              <button
                onClick={handleTry}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink size={16} />
                立即试用
                {tool.try_count > 0 && <span className="opacity-75 text-sm">({tool.try_count} 次试用)</span>}
              </button>
            ) : (
              <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-xl cursor-not-allowed">
                <ExternalLink size={16} />
                {tool.status === 'developing' ? '开发中，即将上线' : '尚未开始开发'}
              </button>
            )}
          </div>
        </div>

        {/* Features */}
        {tool.features && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">功能介绍</h2>
            <ul className="space-y-2">
              {tool.features.split('\n').map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* How to use */}
        {tool.how_to_use && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">使用方法</h2>
            <ol className="space-y-2">
              {tool.how_to_use.split('\n').map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
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
                    <div className="w-3 h-3 rounded-full bg-indigo-400 mt-1 shrink-0"></div>
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
      </div>
    </div>
  )
}
