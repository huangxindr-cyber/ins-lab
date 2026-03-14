import { ThumbsUp, Star, UserRound, Crown, User, Tag, MessageCircle } from 'lucide-react'
import type { Request, RequestReply } from '../types'
import { voteForRequest } from '../lib/api'

interface RequestCardProps {
  request: Request
  onVote?: (id: string) => void
  replies?: RequestReply[]
}

const ROLES = ['保险代理人', '保险经纪人', '同业团队负责人', '客户', '其他']

function parseNickname(nickname: string | null): { role: string | null; name: string | null } {
  if (!nickname) return { role: null, name: null }
  if (nickname.includes('::')) {
    const idx = nickname.indexOf('::')
    return { role: nickname.slice(0, idx) || null, name: nickname.slice(idx + 2) || null }
  }
  if (ROLES.includes(nickname)) return { role: nickname, name: null }
  return { role: null, name: nickname }
}

const roleStyle: Record<string, { icon: React.ReactNode; bg: string; tag: string }> = {
  '保险代理人':    { icon: <UserRound size={14} />, bg: 'bg-teal-500',   tag: 'bg-teal-50 text-teal-700' },
  '保险经纪人':    { icon: <UserRound size={14} />, bg: 'bg-blue-500',   tag: 'bg-blue-50 text-blue-700' },
  '同业团队负责人': { icon: <Crown size={14} />,     bg: 'bg-violet-500', tag: 'bg-violet-50 text-violet-700' },
  '客户':         { icon: <User size={14} />,       bg: 'bg-amber-500',  tag: 'bg-amber-50 text-amber-700' },
  '其他':         { icon: <Tag size={14} />,         bg: 'bg-gray-400',   tag: 'bg-gray-100 text-gray-600' },
}
const defaultStyle = { icon: <User size={14} />, bg: 'bg-gray-300', tag: '' }

export default function RequestCard({ request, onVote, replies }: RequestCardProps) {
  const handleVote = async () => {
    await voteForRequest(request.id)
    onVote?.(request.id)
  }

  const { role, name } = parseNickname(request.nickname)
  const style = role ? (roleStyle[role] ?? defaultStyle) : defaultStyle
  const displayName = name || '匿名用户'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">

      {/* 用户信息行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full ${style.bg} flex items-center justify-center text-white shrink-0`}>
            {style.icon}
          </span>
          <span className="text-sm font-bold text-gray-900">{displayName}</span>
          {role && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.tag}`}>
              {role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {request.is_featured && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              <Star size={10} fill="currentColor" />
              精选
            </span>
          )}
          <span className="text-xs text-gray-300">
            {new Date(request.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">核心场景</p>
          <p className="text-sm text-gray-800 leading-relaxed">{request.problem}</p>
        </div>
        {request.current_solution && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">当前做法</p>
            <p className="text-sm text-gray-600 leading-relaxed">{request.current_solution}</p>
          </div>
        )}
        {request.willing_to_try && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">理想工具</p>
            <p className="text-sm text-gray-600 leading-relaxed">{request.willing_to_try}</p>
          </div>
        )}
      </div>

      {/* 作者回复 */}
      {replies && replies.length > 0 && (
        <div className="space-y-2">
          {replies.map(reply => (
            <div key={reply.id} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageCircle size={11} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">作者回复</span>
                <span className="text-xs text-amber-400">{new Date(reply.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 底部投票 */}
      <div className="flex justify-end pt-2 border-t border-gray-50">
        <button
          onClick={handleVote}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 text-xs font-medium rounded-lg hover:bg-teal-100 transition-colors"
        >
          <ThumbsUp size={11} />
          支持 {request.vote_count > 0 && `· ${request.vote_count}`}
        </button>
      </div>
    </div>
  )
}
