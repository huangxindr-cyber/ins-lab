import { ThumbsUp, Star } from 'lucide-react'
import type { Request } from '../types'
import { voteForRequest } from '../lib/api'

interface RequestCardProps {
  request: Request
  onVote?: (id: string) => void
}

export default function RequestCard({ request, onVote }: RequestCardProps) {
  const handleVote = async () => {
    await voteForRequest(request.id)
    onVote?.(request.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold">
            {(request.nickname || '匿').charAt(0)}
          </div>
          <span className="text-sm text-gray-700 font-medium">{request.nickname || '匿名用户'}</span>
        </div>
        <div className="flex items-center gap-2">
          {request.is_featured && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              <Star size={10} fill="currentColor" />
              精选
            </span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(request.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-gray-800 text-sm leading-relaxed">
          <span className="text-gray-400 text-xs mr-1">想解决：</span>
          {request.problem}
        </p>
        {request.current_solution && (
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="text-gray-400 text-xs mr-1">目前方案：</span>
            {request.current_solution}
          </p>
        )}
        {request.willing_to_try && (
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="text-gray-400 text-xs mr-1">试用意愿：</span>
            {request.willing_to_try}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-1 border-t border-gray-50">
        <button
          onClick={handleVote}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ThumbsUp size={12} />
          支持 {request.vote_count > 0 && `· ${request.vote_count}`}
        </button>
      </div>
    </div>
  )
}
