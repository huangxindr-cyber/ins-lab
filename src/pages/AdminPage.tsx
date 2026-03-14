import { useState, useEffect } from 'react'
import { LogOut, Loader2, Plus, Trash2, Star, StarOff, CheckCircle, Pencil, X, BookOpen, MessageCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Tool, Log, Request, RequestReply, Subscription } from '../types'
import { submitReply, updateReply, deleteReply, getAllReplies } from '../lib/api'

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

const EMPTY_FORM = { number: '', name: '', description: '', status: 'upcoming', start_date: '', complete_date: '', url: '', notes: '', features: '', how_to_use: '' }

function AdminTools() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    supabase.from('tools').select('*').order('number').then(({ data, error }) => {
      if (error) setLoadError(`加载失败：${error.message}`)
      setTools(data || [])
      setLoading(false)
    })
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSaveError('')
    setShowForm(true)
  }

  const openEdit = (tool: Tool) => {
    setEditingId(tool.id)
    setEditingTool(tool)
    setForm({
      number: String(tool.number),
      name: tool.name,
      description: tool.description,
      status: tool.status,
      start_date: tool.start_date || '',
      complete_date: tool.complete_date || '',
      url: tool.url || '',
      notes: tool.notes || '',
      features: tool.features || '',
      how_to_use: tool.how_to_use || '',
    })
    setSaveError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingTool(null)
    setForm(EMPTY_FORM)
    setSaveError('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const payload = {
      number: parseInt(form.number),
      name: form.name,
      description: form.description,
      status: form.status,
      start_date: form.start_date || null,
      complete_date: form.complete_date || null,
      url: form.url || null,
      notes: form.notes || null,
      features: form.features || null,
      how_to_use: form.how_to_use || null,
    }

    if (editingId) {
      // 编辑模式
      const { data, error } = await supabase.from('tools').update(payload).eq('id', editingId).select().single()
      if (error) {
        setSaveError(`保存失败：${error.message}`)
      } else if (data) {
        setTools(prev => prev.map(t => t.id === editingId ? data : t))
        closeForm()
      }
    } else {
      // 新增模式
      const { data, error } = await supabase.from('tools').insert([{ ...payload, try_count: 0, vote_count: 0 }]).select().single()
      if (error) {
        setSaveError(`保存失败：${error.message}`)
      } else if (data) {
        setTools(prev => [...prev, data].sort((a, b) => a.number - b.number))
        closeForm()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    const { error } = await supabase.from('tools').delete().eq('id', id)
    if (error) { alert(`删除失败：${error.message}`); return }
    setTools(prev => prev.filter(t => t.id !== id))
    if (editingId === id) closeForm()
  }

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('tools').update({ status }).eq('id', id)
    if (error) { alert(`更新失败：${error.message}`); return }
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: status as Tool['status'] } : t))
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal-500" /></div>

  return (
    <div>
      {loadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{loadError}</div>}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900">工具列表</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700">
          <Plus size={14} /> 添加工具
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-teal-100 shadow-sm p-5 mb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 text-sm">{editingId ? '编辑工具' : '添加工具'}</h3>
            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input required value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="编号" type="number" className={inputCls} />
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="工具名称" className={inputCls} />
          </div>
          <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="一句话介绍（卡片摘要）" rows={2} className={`${inputCls} resize-none`} />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
              <option value="upcoming">即将开发</option>
              <option value="developing">开发中</option>
              <option value="completed">已上线</option>
            </select>
            <input value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} type="date" className={inputCls} />
            <input value={form.complete_date} onChange={e => setForm(p => ({ ...p, complete_date: e.target.value }))} type="date" className={inputCls} />
          </div>
          <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="试用链接（选填）" className={inputCls} />
          <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="进度备注（卡片展示，开发中/已上线可见）" className={inputCls} />

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs text-gray-400 font-medium">以下内容显示在详情页</p>
            <textarea value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} placeholder="核心功能（每行一条，详情页展示）" rows={3} className={`${inputCls} resize-none`} />
            <textarea value={form.how_to_use} onChange={e => setForm(p => ({ ...p, how_to_use: e.target.value }))} placeholder="使用方法（每行一步，详情页展示）" rows={3} className={`${inputCls} resize-none`} />
          </div>

          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />}
              {editingId ? '保存修改' : '添加'}
            </button>
            <button type="button" onClick={closeForm} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">取消</button>
          </div>
        </form>
      )}

      {/* 编辑模式下：该工具的开发日志管理 */}
      {editingId && editingTool && (
        <ToolLogManager toolId={editingId} toolName={editingTool.name} />
      )}

      <div className="space-y-2">
        {tools.map(tool => (
          <div key={tool.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 transition-colors ${editingId === tool.id ? 'border-teal-200 bg-teal-50/30' : 'border-gray-100'}`}>
            <span className="text-xs text-gray-400 font-mono w-8 shrink-0">#{String(tool.number).padStart(2, '0')}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">{tool.name}</div>
              <div className="text-xs text-gray-400 truncate">{tool.notes || tool.description}</div>
            </div>
            <select
              value={tool.status}
              onChange={e => handleStatusChange(tool.id, e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:outline-none shrink-0"
            >
              <option value="upcoming">即将开发</option>
              <option value="developing">开发中</option>
              <option value="completed">已上线</option>
            </select>
            <button onClick={() => openEdit(tool)} className="text-gray-400 hover:text-teal-600 transition-colors shrink-0" title="编辑">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(tool.id)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0" title="删除">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToolLogManager({ toolId, toolName }: { toolId: string; toolName: string }) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', title: '', content: '', type: 'daily' })
  const [saving, setSaving] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ date: '', title: '', content: '', type: 'daily' })

  useEffect(() => {
    setLoading(true)
    supabase.from('logs').select('*').eq('tool_id', toolId).order('date', { ascending: false }).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
  }, [toolId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('logs').insert([{ ...form, tool_id: toolId }]).select().single()
    if (data) {
      setLogs(prev => [data, ...prev])
      setShowForm(false)
      setForm({ date: '', title: '', content: '', type: 'daily' })
    }
    setSaving(false)
  }

  const openEdit = (log: Log) => {
    setEditingLogId(log.id)
    setEditForm({ date: log.date, title: log.title, content: log.content, type: log.type })
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLogId) return
    setSaving(true)
    const { data } = await supabase.from('logs').update(editForm).eq('id', editingLogId).select().single()
    if (data) {
      setLogs(prev => prev.map(l => l.id === editingLogId ? data : l))
      setEditingLogId(null)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此日志？')) return
    await supabase.from('logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
    if (editingLogId === id) setEditingLogId(null)
  }

  const inputCls = "px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"

  return (
    <div className="bg-white rounded-xl border border-teal-50 p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-teal-500" />
          <h3 className="font-medium text-gray-900 text-sm">「{toolName}」开发日志</h3>
          <span className="text-xs text-gray-400">({logs.length}条)</span>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingLogId(null) }} className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-600 text-xs rounded-lg hover:bg-teal-100">
          <Plus size={12} /> 新增日志
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 rounded-xl p-4 mb-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} type="date" className={inputCls} />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
              <option value="daily">日记录</option>
              <option value="weekly">周复盘</option>
            </select>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="标题" className={inputCls} />
          </div>
          <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="日志内容" rows={3} className={`w-full ${inputCls} resize-none`} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 size={11} className="animate-spin" />} 发布
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-lg">取消</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-teal-400" /></div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">暂无日志，点击「新增日志」添加</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id}>
              {editingLogId === log.id ? (
                <form onSubmit={handleEditSave} className="bg-teal-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input required value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} type="date" className={inputCls} />
                    <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                      <option value="daily">日记录</option>
                      <option value="weekly">周复盘</option>
                    </select>
                    <input required value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="标题" className={inputCls} />
                  </div>
                  <textarea required value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} rows={3} className={`w-full ${inputCls} resize-none`} />
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
                      {saving && <Loader2 size={11} className="animate-spin" />} 保存
                    </button>
                    <button type="button" onClick={() => setEditingLogId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-lg">取消</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-400">{log.date}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.type === 'weekly' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {log.type === 'weekly' ? '周复盘' : '日记录'}
                      </span>
                    </div>
                    <div className="font-medium text-gray-800 text-xs">{log.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{log.content}</div>
                  </div>
                  <button onClick={() => openEdit(log)} className="text-gray-300 hover:text-teal-500 shrink-0 mt-0.5"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(log.id)} className="text-gray-300 hover:text-red-500 shrink-0 mt-0.5"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', title: '', content: '', type: 'daily' })
  const [saving, setSaving] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ date: '', title: '', content: '', type: 'daily' })

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

  const openEdit = (log: Log) => {
    setEditingLogId(log.id)
    setEditForm({ date: log.date, title: log.title, content: log.content, type: log.type })
    setShowForm(false)
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLogId) return
    setSaving(true)
    const { data } = await supabase.from('logs').update(editForm).eq('id', editingLogId).select().single()
    if (data) {
      setLogs(prev => prev.map(l => l.id === editingLogId ? data : l))
      setEditingLogId(null)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    await supabase.from('logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
    if (editingLogId === id) setEditingLogId(null)
  }

  const fieldCls = "px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal-500" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900">实验日志</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingLogId(null) }} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700">
          <Plus size={14} /> 发布日志
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} type="date" className={fieldCls} />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={fieldCls}>
              <option value="daily">日记录</option>
              <option value="weekly">周复盘</option>
            </select>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="标题" className={fieldCls} />
          </div>
          <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="日志内容" rows={4} className={`w-full ${fieldCls} resize-none`} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />} 发布
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg">取消</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id}>
            {editingLogId === log.id ? (
              <form onSubmit={handleEditSave} className="bg-white rounded-xl border border-teal-200 p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">编辑日志</span>
                  <button type="button" onClick={() => setEditingLogId(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input required value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} type="date" className={fieldCls} />
                  <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))} className={fieldCls}>
                    <option value="daily">日记录</option>
                    <option value="weekly">周复盘</option>
                  </select>
                  <input required value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="标题" className={fieldCls} />
                </div>
                <textarea required value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} rows={4} className={`w-full ${fieldCls} resize-none`} />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5">
                    {saving && <Loader2 size={12} className="animate-spin" />} 保存修改
                  </button>
                  <button type="button" onClick={() => setEditingLogId(null)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg">取消</button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
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
                <button onClick={() => openEdit(log)} className="text-gray-400 hover:text-teal-600 shrink-0"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const ROLES = ['保险代理人', '保险经纪人', '同业团队负责人', '客户', '其他']
const roleTagStyle: Record<string, string> = {
  '保险代理人': 'bg-teal-50 text-teal-700',
  '保险经纪人': 'bg-blue-50 text-blue-700',
  '同业团队负责人': 'bg-violet-50 text-violet-700',
  '客户': 'bg-amber-50 text-amber-700',
  '其他': 'bg-gray-100 text-gray-600',
}

function parseNickname(nickname: string | null): { role: string | null; name: string | null } {
  if (!nickname) return { role: null, name: null }
  if (nickname.includes('::')) {
    const idx = nickname.indexOf('::')
    return { role: nickname.slice(0, idx) || null, name: nickname.slice(idx + 2) || null }
  }
  if (ROLES.includes(nickname)) return { role: nickname, name: null }
  return { role: null, name: nickname }
}

function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [replies, setReplies] = useState<RequestReply[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      getAllReplies(),
    ]).then(([{ data }, reps]) => {
      setRequests(data || [])
      setReplies(reps)
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
            {/* 顶部：用户信息 + 操作 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const { role, name } = parseNickname(req.nickname)
                  return (
                    <>
                      <span className="text-xs font-semibold text-gray-800">{name || '匿名用户'}</span>
                      {role && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleTagStyle[role] ?? 'bg-gray-100 text-gray-600'}`}>{role}</span>
                      )}
                    </>
                  )
                })()}
                {req.contact && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{req.contact}</span>
                )}
                <span className="text-xs text-gray-300">{new Date(req.created_at).toLocaleDateString('zh-CN')}</span>
                <span className="text-xs text-teal-600">👍 {req.vote_count}</span>
                {req.is_featured && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">精选</span>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleFeatured(req.id, req.is_featured)}
                  className={`p-1.5 rounded-lg transition-colors ${req.is_featured ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'}`}
                  title={req.is_featured ? '取消精选' : '设为精选'}
                >
                  {req.is_featured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                </button>
                <button onClick={() => handleDelete(req.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* 内容：全字段 */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-gray-400 font-medium">核心场景　</span>
                <span className="text-gray-800">{req.problem}</span>
              </div>
              {req.current_solution && (
                <div>
                  <span className="text-xs text-gray-400 font-medium">当前做法　</span>
                  <span className="text-gray-600">{req.current_solution}</span>
                </div>
              )}
              {req.willing_to_try && (
                <div>
                  <span className="text-xs text-gray-400 font-medium">理想工具　</span>
                  <span className="text-gray-600">{req.willing_to_try}</span>
                </div>
              )}
            </div>

            {/* 回复管理 */}
            <ReplyManager
              requestId={req.id}
              replies={replies.filter(rep => rep.request_id === req.id)}
              onAdd={rep => setReplies(prev => [...prev, rep])}
              onUpdate={rep => setReplies(prev => prev.map(r => r.id === rep.id ? rep : r))}
              onDelete={id => setReplies(prev => prev.filter(r => r.id !== id))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReplyManager({ requestId, replies, onAdd, onUpdate, onDelete }: {
  requestId: string
  replies: RequestReply[]
  onAdd: (r: RequestReply) => void
  onUpdate: (r: RequestReply) => void
  onDelete: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    const res = await submitReply(requestId, content)
    if (res.success && res.data) {
      onAdd(res.data)
      setContent('')
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !editContent.trim()) return
    setSaving(true)
    const res = await updateReply(editingId, editContent)
    if (res.success && res.data) {
      onUpdate(res.data)
      setEditingId(null)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此回复？')) return
    await deleteReply(id)
    onDelete(id)
  }

  const fieldCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
          <MessageCircle size={11} /> 作者回复 {replies.length > 0 && `(${replies.length})`}
        </span>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="text-xs text-amber-600 hover:text-amber-700 hover:underline">
          {showForm ? '收起' : '+ 添加回复'}
        </button>
      </div>

      {/* 已有回复列表 */}
      {replies.length > 0 && (
        <div className="space-y-2 mb-2">
          {replies.map(rep => (
            <div key={rep.id}>
              {editingId === rep.id ? (
                <form onSubmit={handleEdit} className="bg-amber-50 rounded-lg p-3 space-y-2">
                  <textarea required value={editContent} onChange={e => setEditContent(e.target.value)} rows={2} className={fieldCls} />
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1">
                      {saving && <Loader2 size={10} className="animate-spin" />} 保存
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">取消</button>
                  </div>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-2">
                  <p className="text-xs text-amber-900 flex-1 leading-relaxed">{rep.content}</p>
                  <span className="text-xs text-amber-400 shrink-0">{new Date(rep.created_at).toLocaleDateString('zh-CN')}</span>
                  <button onClick={() => { setEditingId(rep.id); setEditContent(rep.content); setShowForm(false) }} className="text-amber-300 hover:text-amber-600 shrink-0"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(rep.id)} className="text-amber-300 hover:text-red-500 shrink-0"><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 新增回复表单 */}
      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2">
          <textarea required value={content} onChange={e => setContent(e.target.value)} rows={2} placeholder="输入回复内容..." className={fieldCls} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 size={10} className="animate-spin" />} 发布回复
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">取消</button>
          </div>
        </form>
      )}
    </div>
  )
}

function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setLoadError(error.message)
      setSubs(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal-500" /></div>

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">订阅列表（{subs.length}人）</h2>
      {loadError && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-2">
          <p className="font-medium">加载失败：{loadError}</p>
          <p className="text-xs text-amber-700">可能是 subscriptions 表缺少查询权限，请在 Supabase SQL Editor 执行：</p>
          <code className="block text-xs bg-amber-100 px-3 py-2 rounded-lg">
            CREATE POLICY "Auth read subscriptions" ON subscriptions FOR SELECT USING (auth.role() = 'authenticated');
          </code>
        </div>
      )}
      {subs.length === 0 && !loadError ? (
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
