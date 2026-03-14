import { useState, useEffect } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import RequestCard from '../components/RequestCard'
import type { Request } from '../types'
import { getRequests, submitRequest } from '../lib/api'

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRequests().then(r => { setRequests(r); setLoading(false) })
  }, [])

  const handleVote = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, vote_count: r.vote_count + 1 } : r))
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
                <Loader2 size={32} className="animate-spin text-teal-500" />
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
              <RequestFormSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RequestFormSection() {
  const [form, setForm] = useState({ problem: '', current_solution: '', willing_to_try: '', role: '', name: '', contact: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.problem.trim()) return
    setStatus('loading')
    const nickname = form.role && form.name ? `${form.role}::${form.name}`
      : form.role || form.name || undefined
    const res = await submitRequest({
      problem: form.problem,
      current_solution: form.current_solution || undefined,
      willing_to_try: form.willing_to_try || undefined,
      nickname,
      contact: form.contact || undefined,
    })
    if (res.success) {
      setStatus('success')
      setForm({ problem: '', current_solution: '', willing_to_try: '', role: '', name: '', contact: '' })
    } else {
      setStatus('error')
      setErrorMsg(res.error || '提交失败，请稍后重试')
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-300 placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300"

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 leading-snug">一起做出真正有用的<br />AI保险工具</h2>
      <p className="text-xs text-gray-400 mt-2 mb-6 leading-5">
        写得越具体，我们越可能把这个工具做出来。<br />需求被采纳后，你可以永久免费使用。
      </p>

      {status === 'success' ? (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-8 text-center">
          <CheckCircle size={36} className="text-teal-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">提交成功！</h3>
          <p className="text-gray-500 text-sm">感谢你的需求，我会认真考虑的。</p>
          <button onClick={() => setStatus('idle')} className="mt-4 text-teal-600 text-sm hover:underline">再提交一条</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              你在保险工作中遇到过哪些重复、麻烦或低效率的问题？
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea value={form.problem} onChange={e => setForm(p => ({ ...p, problem: e.target.value }))}
              required rows={3}
              placeholder="比如：医疗险方案制作很花时间、健康告知不好判断、客户资料整理很麻烦、核保结论不好判断"
              className={`${inputCls} resize-none`} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">你现在通常是怎么解决这个问题的？</label>
            <textarea value={form.current_solution} onChange={e => setForm(p => ({ ...p, current_solution: e.target.value }))}
              rows={2}
              placeholder="比如：手工查资料、问同业、用 Excel 整理、靠经验判断、没有什么好办法"
              className={`${inputCls} resize-none`} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">如果有一个AI工具，你希望它能帮你做到什么？</label>
            <textarea value={form.willing_to_try} onChange={e => setForm(p => ({ ...p, willing_to_try: e.target.value }))}
              rows={2}
              placeholder="比如：输入客户资料自动生成医疗险方案、自动判断是否能投、一键生成客户方案"
              className={`${inputCls} resize-none`} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">你是</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inputCls}>
              <option value="">请选择你的身份（选填）</option>
              <option value="保险代理人">保险代理人</option>
              <option value="保险经纪人">保险经纪人</option>
              <option value="同业团队负责人">同业团队负责人</option>
              <option value="客户">客户</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">称呼 / 昵称</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="如何称呼你？（选填）" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">留下联系方式</label>
            <p className="text-xs text-gray-400">如果工具做出来，我会第一时间通知你</p>
            <input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
              placeholder="微信 / 邮箱 / 电话（选填）" className={inputCls} />
          </div>

          {status === 'error' && <p className="text-red-500 text-xs">{errorMsg}</p>}

          <button type="submit" disabled={status === 'loading' || !form.problem.trim()}
            className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
            提交需求
          </button>

        </form>
      )}
    </div>
  )
}
