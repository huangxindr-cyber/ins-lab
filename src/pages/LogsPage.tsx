import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { Log } from '../types'
import { getLogs } from '../lib/api'

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all')

  useEffect(() => {
    getLogs().then(l => { setLogs(l); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter)

  return (
    <div className="pt-14 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">实验日志</h1>
        <p className="text-gray-500 mb-6">100天全程公开记录，包括每日开发记录和每周复盘</p>

        <div className="flex gap-2 mb-8">
          {[['all', '全部'], ['daily', '日记录'], ['weekly', '周复盘']] .map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无日志</div>
        ) : (
          <div className="space-y-0">
            {filtered.map((log, i) => (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full mt-2 shrink-0 ${log.type === 'weekly' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>
                  {i < filtered.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1 mb-1"></div>}
                </div>
                <div className={`pb-6 ${i < filtered.length - 1 ? '' : ''}`}>
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
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{log.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
