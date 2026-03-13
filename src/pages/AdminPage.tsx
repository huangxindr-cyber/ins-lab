import { useState, useEffect } from 'react'
import { LogOut, Loader2, Plus, Trash2, Star, StarOff, CheckCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Tool, Log, Request, Subscription } from '../types'

type Tab = 'tools' | 'logs' | 'requests' | 'subscriptions'

export default function AdminPage() {
  const [session, setSession] = useState<boolean>(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) { setChecking(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(!!s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen pt-14"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 max-w-sm">
          <p className="text-lg font-medium mb-2">Supabase 未配置</p>
          <p className="text-sm">请在 <code className="bg-gray-100 px-1 rounded">.env.local</code> 中配置 Supabase 连接信息后重启项目。</p>
        </div>
      </div>
    )
  }

  return session ? <AdminDashboard onLogout={() => setSession(false)} /> : <LoginPage onLogin={() => setSession(true)} />
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('账号或密码错误')
      setLoading(false)
    } else {
      onLogin()
    }
  }

  return (
    <div className="pt-14 min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">后台管理</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            登录
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('tools')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tools', label: '工具管理' },
    { key: 'logs', label: '日志管理' },
    { key: 'requests', label: '需求管理' },
    { key: 'subscriptions', label: '订阅列表' },
  ]

  return (
    <div className="pt-14 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">后台管理</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-100">
            <LogOut size={16} /> 退出登录
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'tools' && <AdminTools />}
        {tab === 'logs' && <AdminLogs />}
        {tab === 'requests' && <AdminRequests />}
        {tab === 'subscriptions' && <AdminSubscriptions />}
      </div>
    </div>
  )
}

function AdminTools() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', name: '', description: '', status: 'upcoming', start_date: '', complete_date: '', url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('tools').select('*').order('number').then(({ data }) => {
      setTools(data || [])
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { number: parseInt(form.number), name: form.name, description: form.description, status: form.status, start_date: form.start_date || null, complete_date: form.complete_date || null, url: form.url || null, try_count: 0, vote_count: 0 }
    const { data } = await supabase.from('tools').insert([payload]).select().single()
    if (data) { setTools(prev => [...prev, data]); setShowForm(false); setForm({ number: '', name: '', description: '', status: 'upcoming', start_date: '', complete_date: '', url: '' }) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    await supabase.from('tools').delete().eq('id', id)
    setTools(prev => prev.filter(t => t.id !== id))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('tools').update({ status }).eq('id', id)
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: status as Tool['status'] } : t))
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900">工具列表</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700">
          <Plus size={14} /> 添加工具
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="编号" type="number" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="工具名称" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="一句话介绍" rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none">
              <option value="upcoming">即将开发</option>
              <option value="developing">开发中</option>
              <option value="completed">已上线</option>
            </select>
            <input value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} type="date" placeholder="开始日期" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" />
            <input value={form.complete_date} onChange={e => setForm(p => ({ ...p, complete_date: e.target.value }))} type="date" placeholder="完成日期" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
          <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="试用链接（选填）" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />} 保存
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">取消</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tools.map(tool => (
          <div key={tool.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <span className="text-xs text-gray-400 font-mono w-8">#{String(tool.number).padStart(2, '0')}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">{tool.name}</div>
              <div className="text-xs text-gray-400 truncate">{tool.description}</div>
            </div>
            <select
              value={tool.status}
              onChange={e => handleStatusChange(tool.id, e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:outline-none"
            >
              <option value="upcoming">即将开发</option>
              <option value="developing">开发中</option>
              <option value="completed">已上线</option>
            </select>
            <button onClick={() => handleDelete(tool.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', title: '', content: '', type: 'daily' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('logs').select('*').order('date', { ascending: false }).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('logs').insert([form]).select().single()
    if (data) { setLogs(prev => [data, ...prev]); setShowForm(false); setForm({ date: '', title: '', content: '', type: 'daily' }) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    await supabase.from('logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900">实验日志</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700">
          <Plus size={14} /> 发布日志
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} type="date" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none">
              <option value="daily">日记录</option>
              <option value="weekly">周复盘</option>
            </select>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="标题" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
          <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="日志内容" rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />} 发布
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg">取消</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">{log.date}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.type === 'weekly' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {log.type === 'weekly' ? '周复盘' : '日记录'}
                </span>
              </div>
              <div className="font-medium text-gray-900 text-sm">{log.title}</div>
              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{log.content}</div>
            </div>
            <button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('requests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setRequests(data || [])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    await supabase.from('requests').delete().eq('id', id)
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('requests').update({ is_featured: !current }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, is_featured: !current } : r))
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">用户需求（{requests.length}条）</h2>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{req.nickname || '匿名用户'}</span>
                  {req.contact && <span className="text-xs text-gray-400">· {req.contact}</span>}
                  <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString('zh-CN')}</span>
                  <span className="text-xs text-indigo-600">👍 {req.vote_count}</span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{req.problem}</p>
                {req.current_solution && <p className="text-xs text-gray-400">目前：{req.current_solution}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleFeatured(req.id, req.is_featured)}
                  className={`text-sm p-1.5 rounded-lg transition-colors ${req.is_featured ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={req.is_featured ? '取消精选' : '设为精选'}
                >
                  {req.is_featured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                </button>
                <button onClick={() => handleDelete(req.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setSubs(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">订阅列表（{subs.length}人）</h2>
      {subs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">暂无订阅</div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-sm text-gray-700">{sub.contact}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date(sub.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
