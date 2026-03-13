import { Link } from 'react-router-dom'
import { ExternalLink, FileText, MessageSquare, ThumbsUp, MousePointer } from 'lucide-react'
import type { Tool } from '../types'
import { incrementTryCount, voteForTool } from '../lib/api'

const statusConfig = {
  completed: { label: '已上线', className: 'bg-green-100 text-green-700' },
  developing: { label: '开发中', className: 'bg-amber-100 text-amber-700' },
  upcoming: { label: '即将开发', className: 'bg-purple-100 text-purple-700' },
}

interface ToolCardProps {
  tool: Tool
  onVote?: (id: string) => void
}

export default function ToolCard({ tool, onVote }: ToolCardProps) {
  const status = statusConfig[tool.status]

  const handleTry = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!tool.url) return
    await incrementTryCount(tool.id)
    window.open(tool.url, '_blank')
  }

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    await voteForTool(tool.id)
    onVote?.(tool.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-gray-400 font-semibold">#{String(tool.number).padStart(2, '0')}</span>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 text-base mb-1">{tool.name}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
      </div>

      <div className="text-xs text-gray-400 flex gap-3">
        {tool.start_date && <span>开始：{tool.start_date}</span>}
        {tool.complete_date
          ? <span>完成：{tool.complete_date}</span>
          : tool.start_date
          ? <span className="line-through">完成：--</span>
          : null
        }
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-auto pt-1 border-t border-gray-50">
        {tool.status === 'completed' && (
          <button
            onClick={handleTry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink size={12} />
            试用
            {tool.try_count > 0 && <span className="ml-0.5 opacity-75">({tool.try_count})</span>}
          </button>
        )}
        {tool.status !== 'completed' && (
          <button disabled className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed">
            <MousePointer size={12} />
            试用
          </button>
        )}

        <Link
          to={`/tools/${tool.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <FileText size={12} />
          详情
        </Link>

        <Link
          to="/requests"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          <MessageSquare size={12} />
          建议
        </Link>

        {tool.status === 'upcoming' && (
          <button
            onClick={handleVote}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors ml-auto"
          >
            <ThumbsUp size={12} />
            投票 {tool.vote_count > 0 && `· ${tool.vote_count}`}
          </button>
        )}
      </div>
    </div>
  )
}
