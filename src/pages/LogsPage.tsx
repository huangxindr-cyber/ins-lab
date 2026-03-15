import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { Log } from '../types'
import { getLogs } from '../lib/api'

const SECTION_LABELS: Record<string, string> = {
  '今日完成': '今日完成',
  '分享心得': '分享心得',
  '明日计划': '明日计划',
}

function parseLogContent(content: string): { key: string; label: string | null; text: string }[] | null {
  const keys = ['今日完成', '分享心得', '明日计划', '其他']
  if (!keys.some(k => content.includes(`[${k}]`))) return null
  return keys
    .map(k => {
      const regex = new RegExp(`\\[${k}\\]\\n?([\\s\\S]*?)(?=\\n\\[|$)`)
      const match = content.match(regex)
      const text = match ? match[1].trim() : ''
      return { key: k, label: k === '其他' ? null : SECTION_LABELS[k] ?? k, text }
    })
    .filter(s => s.text)
}

const PAGE_SIZE = 5

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    getLogs().then(l => { setLogs(l); setLoading(false) })
  }, [])

  // 切换 filter 时重置可见数量
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter)
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const handleLoadMore = async () => {
    setLoadingMore(true)
    // 模拟加载延迟，实际数据已全部在客户端
    await new Promise(r => setTimeout(r, 200))
    setVisibleCount(c => c + PAGE_SIZE)
    setLoadingMore(false)
  }

  return (
    <div className="pt-14 pb-16 md:pb-0 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">实验日志</h1>
        <p className="text-gray-500 mb-6">100天全程公开记录，包括每日开发记录和每周复盘</p>

        <div className="flex gap-2 mb-8">
          {[['all', '全部'], ['daily', '日记录'], ['weekly', '周复盘']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无日志</div>
        ) : (
          <>
            <div className="space-y-0">
              {visible.map((log, i) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full mt-2 shrink-0 ${log.type === 'weekly' ? 'bg-amber-400' : 'bg-teal-400'}`}></div>
                    {i < visible.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1 mb-1"></div>}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-2 mt-1.5">
                      <span className="text-sm text-gray-400 font-medium">{log.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.type === 'weekly' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {log.type === 'weekly' ? '周复盘' : '日记录'}
                      </span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="font-semibold text-gray-900 mb-2">{log.title}</h3>
                      {(() => {
                        const sections = parseLogContent(log.content)
                        if (!sections) {
                          return <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{log.content}</p>
                        }
                        return (
                          <div className="space-y-2">
                            {sections.map(s => (
                              <div key={s.key}>
                                {s.label ? (
                                  <p className="text-sm leading-relaxed text-gray-600">
                                    <span className="font-medium text-gray-700">{s.label}：</span>
                                    {s.text}
                                  </p>
                                ) : (
                                  <p className="text-sm leading-relaxed text-gray-500 whitespace-pre-line">{s.text}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore && <Loader2 size={14} className="animate-spin" />}
                  查看更多（还有 {filtered.length - visibleCount} 条）
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
