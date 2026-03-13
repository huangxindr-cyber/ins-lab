import { useState, useEffect } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import RequestCard from '../components/RequestCard'
import type { Request } from '../types'
import { getRequests, submitRequest } from '../lib/api'

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ problem: '', current_solution: '', willing_to_try: '', nickname: '', contact: '' })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    getRequests().then(r => { setRequests(r); setLoading(false) })
  }, [])

  const handleVote = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, vote_count: r.vote_count + 1 } : r))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.problem.trim()) return
    setSubmitStatus('loading')
    const res = await submitRequest({
      problem: form.problem,
      current_solution: form.current_solution || undefined,
      willing_to_try: form.willing_to_try || undefined,
      nickname: form.nickname || undefined,
      contact: form.contact || undefined,
    })
    if (res.success) {
      setSubmitStatus('success')
      setForm({ problem: '', current_solution: '', willing_to_try: '', nickname: '', contact: '' })
    } else {
      setSubmitStatus('error')
      setErrorMsg(res.error || '提交失败，请稍后重试')
    }
  }

  return (
    <div className="pt-14 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">用户需求</h1>
        <p className="text-gray-500 mb-10">大家都在期待哪些保险 AI 工具？投票支持你最想要的</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests list */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">还没有需求</p>
                <p className="text-sm">成为第一个提交需求的人！</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(r => <RequestCard key={r.id} request={r} onVote={handleVote} />)}
              </div>
            )}
          </div>

          {/* Submit form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">提交需求</h2>
              <p className="text-xs text-gray-400 mb-4">需求被采纳可终身免费使用</p>

              {submitStatus === 'success' ? (
                <div className="text-center py-6">
                  <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-900 mb-1">提交成功！</p>
                  <button onClick={() => setSubmitStatus('idle')} className="text-indigo-600 text-sm hover:underline">再提交一条</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">想解决什么问题？<span className="text-red-500">*</span></label>
                    <textarea
                      value={form.problem}
                      onChange={e => setForm(p => ({ ...p, problem: e.target.value }))}
                      required rows={3}
                      placeholder="描述你遇到的问题..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">现在怎么解决的？</label>
                    <textarea
                      value={form.current_solution}
                      onChange={e => setForm(p => ({ ...p, current_solution: e.target.value }))}
                      rows={2}
                      placeholder="（选填）"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">愿意试用吗？</label>
                    <textarea
                      value={form.willing_to_try}
                      onChange={e => setForm(p => ({ ...p, willing_to_try: e.target.value }))}
                      rows={2}
                      placeholder="（选填）"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">称呼</label>
                      <input
                        value={form.nickname}
                        onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                        placeholder="（选填）"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">联系方式</label>
                      <input
                        value={form.contact}
                        onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
                        placeholder="（选填）"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                  </div>
                  {submitStatus === 'error' && <p className="text-red-500 text-xs">{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={submitStatus === 'loading' || !form.problem.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitStatus === 'loading' && <Loader2 size={14} className="animate-spin" />}
                    提交
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
