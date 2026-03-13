import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import type { Tool } from '../types'
import { getTools } from '../lib/api'

const sections = [
  { key: 'developing', title: '开发中' },
  { key: 'completed', title: '已上线' },
  { key: 'upcoming', title: '即将开发' },
] as const

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTools().then(t => { setTools(t); setLoading(false) })
  }, [])

  const handleVote = (id: string) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, vote_count: t.vote_count + 1 } : t))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-14">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="pt-14 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">全部工具</h1>
        <p className="text-gray-500 mb-10">100天，10个真实可用的AI保险工具</p>

        {sections.map(({ key, title }) => {
          const sectionTools = tools.filter(t => t.status === key)
          if (sectionTools.length === 0) return null
          return (
            <div key={key} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                <span className="text-sm text-gray-400 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                  {sectionTools.length} 个
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionTools.map(tool => <ToolCard key={tool.id} tool={tool} onVote={handleVote} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
