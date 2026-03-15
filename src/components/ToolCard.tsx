import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, FileText, MessageSquare, ThumbsUp } from 'lucide-react'
import type { Tool } from '../types'
import { incrementTryCount, voteForTool, unvoteForTool } from '../lib/api'

const statusConfig = {
  completed: { label: '已上线', className: 'bg-teal-50 text-teal-700', border: 'border-teal-200 hover:border-teal-300', notesCls: 'bg-teal-50 text-teal-600', numCls: 'text-teal-500' },
  developing: { label: '开发中', className: 'bg-amber-50 text-amber-700', border: 'border-amber-200 hover:border-amber-300', notesCls: 'bg-amber-50 text-amber-600', numCls: 'text-amber-400' },
  upcoming: { label: '即将开发', className: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100 hover:border-indigo-200', notesCls: 'bg-indigo-50 text-indigo-600', numCls: 'text-indigo-400' },
}

function isToolVoted(id: string): boolean {
  try { return (JSON.parse(localStorage.getItem('voted_tools') || '[]') as string[]).includes(id) } catch { return false }
}
function markToolVoted(id: string) {
  try {
    const arr = JSON.parse(localStorage.getItem('voted_tools') || '[]') as string[]
    localStorage.setItem('voted_tools', JSON.stringify([...arr, id]))
  } catch {}
}
function unmarkToolVoted(id: string) {
  try {
    const arr = JSON.parse(localStorage.getItem('voted_tools') || '[]') as string[]
    localStorage.setItem('voted_tools', JSON.stringify(arr.filter((v: string) => v !== id)))
  } catch {}
}

interface ToolCardProps {
  tool: Tool
  onVote?: (id: string) => void
}

export default function ToolCard({ tool, onVote }: ToolCardProps) {
  const status = statusConfig[tool.status]
  const [voted, setVoted] = useState(() => isToolVoted(tool.id))
  const [localCount, setLocalCount] = useState(tool.vote_count)
  const [bumping, setBumping] = useState(false)

  const handleEnter = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!tool.url) return
    window.open(tool.url, '_blank')  // 同步调用，避免 iOS/微信拦截
    incrementTryCount(tool.id)       // 异步统计，不阻塞跳转
  }

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    setBumping(true)
    setTimeout(() => setBumping(false), 400)
    if (voted) {
      setVoted(false)
      setLocalCount(c => Math.max(0, c - 1))
      unmarkToolVoted(tool.id)
      await unvoteForTool(tool.id)
    } else {
      setVoted(true)
      setLocalCount(c => c + 1)
      markToolVoted(tool.id)
      await voteForTool(tool.id)
      onVote?.(tool.id)
    }
  }

  return (
    <Link
      to={`/tools/${tool.id}`}
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-3 cursor-pointer ${status.border}`}
    >
      {/* 顶部：编号 + 状态 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-xl font-bold font-mono ${status.numCls}`}>#{String(tool.number).padStart(2, '0')}</span>
          {tool.number === 0 && (
            <p className="text-xs text-gray-400 mt-0.5">挑战开始前上线，不计入统计</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* 名称 + 描述 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-teal-700 transition-colors">{tool.name}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
      </div>

      {/* 进度备注 */}
      {tool.notes && (
        <p className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${status.notesCls}`}>
          {tool.notes}
        </p>
      )}

      {/* 底部按钮区 */}
      <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-gray-50">
        {tool.status === 'completed' ? (
          <button
            onClick={handleEnter}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors"
          >
            <ExternalLink size={13} />
            进入
          </button>
        ) : tool.status === 'upcoming' ? (
          <button
            onClick={handleVote}
            className={`w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              voted
                ? 'bg-indigo-100 text-indigo-500 hover:bg-indigo-200'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            } ${bumping ? 'scale-95' : 'scale-100'}`}
          >
            <ThumbsUp size={13} className={voted ? 'fill-indigo-500' : ''} />
            {voted ? `已支持 · ${localCount}` : `投票支持${localCount > 0 ? ` · ${localCount}` : ''}`}
          </button>
        ) : null}

        {/* 第二行：详情 + 建议 */}
        <div className="flex gap-2" onClick={e => e.preventDefault()}>
          <Link
            to={`/tools/${tool.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FileText size={12} />
            详情
          </Link>
          <Link
            to={`/tools/${tool.id}#suggestions`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MessageSquare size={12} />
            建议
          </Link>
        </div>
      </div>
    </Link>
  )
}
