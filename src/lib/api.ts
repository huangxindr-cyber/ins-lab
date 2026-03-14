import { supabase, isSupabaseConfigured } from './supabase'
import { mockTools, mockLogs, mockRequests, mockConfig } from './mockData'
import type { Tool, Log, Request, RequestReply, SiteConfig, Suggestion } from '../types'

// --- Tools ---

export async function getTools(): Promise<Tool[]> {
  if (!isSupabaseConfigured()) return mockTools
  const { data, error } = await supabase.from('tools').select('*').order('number')
  if (error) { console.error('getTools:', error.message); return [] }
  return data || []
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!isSupabaseConfigured()) return mockTools.find(t => t.id === id) || null
  const { data, error } = await supabase.from('tools').select('*').eq('id', id).single()
  if (error) { console.error('getToolById:', error.message); return null }
  return data
}

export async function incrementTryCount(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.rpc('increment_try_count', { tool_id: id })
}

export async function voteForTool(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.rpc('increment_tool_vote', { tool_id: id })
}

// --- Logs ---

export async function getLogs(limit?: number): Promise<Log[]> {
  if (!isSupabaseConfigured()) {
    return limit ? mockLogs.slice(0, limit) : mockLogs
  }
  let query = supabase.from('logs').select('*').order('date', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) { console.error('getLogs:', error.message); return [] }
  return data || []
}

export async function getLogsByToolId(toolId: string): Promise<Log[]> {
  if (!isSupabaseConfigured()) return mockLogs.filter(l => l.tool_id === toolId)
  const { data, error } = await supabase.from('logs').select('*').eq('tool_id', toolId).order('date', { ascending: false })
  if (error) return []
  return data || []
}

// --- Requests ---

export async function getRequests(): Promise<Request[]> {
  if (!isSupabaseConfigured()) return mockRequests
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('vote_count', { ascending: false })
  if (error) { console.error('getRequests:', error.message); return [] }
  return data || []
}

export async function getFeaturedRequests(limit = 5): Promise<Request[]> {
  if (!isSupabaseConfigured()) return mockRequests.filter(r => r.is_featured).slice(0, limit)
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('is_featured', true)
    .order('vote_count', { ascending: false })
    .limit(limit)
  if (error) return mockRequests.filter(r => r.is_featured)
  return data || []
}

export async function submitRequest(payload: {
  problem: string
  current_solution?: string
  willing_to_try?: string
  nickname?: string
  contact?: string
}): Promise<{ success: boolean; data?: Request; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }
  const { data, error } = await supabase.from('requests').insert([{ ...payload, vote_count: 0, is_featured: false }]).select().single()
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as Request }
}

export async function voteForRequest(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.rpc('increment_request_vote', { request_id: id })
}

// --- Request Replies ---

export async function getAllReplies(): Promise<RequestReply[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase.from('request_replies').select('*').order('created_at', { ascending: true })
  if (error) { console.error('getAllReplies:', error.message); return [] }
  return data || []
}

export async function submitReply(requestId: string, content: string): Promise<{ success: boolean; data?: RequestReply; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase 未配置' }
  const { data, error } = await supabase.from('request_replies').insert([{ request_id: requestId, content }]).select().single()
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateReply(id: string, content: string): Promise<{ success: boolean; data?: RequestReply; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase 未配置' }
  const { data, error } = await supabase.from('request_replies').update({ content, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function deleteReply(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.from('request_replies').delete().eq('id', id)
}

// --- Suggestions ---

export async function getTotalSuggestionsCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const { count, error } = await supabase.from('suggestions').select('*', { count: 'exact', head: true })
  if (error) { console.error('getTotalSuggestionsCount:', error.message); return 0 }
  return count || 0
}

export async function getSuggestions(toolId: string): Promise<Suggestion[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getSuggestions:', error.message); return [] }
  return data || []
}

export async function submitSuggestion(toolId: string, content: string, nickname?: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true }
  const { error } = await supabase.from('suggestions').insert([{ tool_id: toolId, content, nickname: nickname || null }])
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --- Subscriptions ---

export async function subscribe(contact: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true }
  const { error } = await supabase.from('subscriptions').insert([{ contact }])
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --- Config ---

export async function getSiteConfig(): Promise<SiteConfig> {
  if (!isSupabaseConfigured()) return mockConfig
  const { data, error } = await supabase.from('site_config').select('*').single()
  if (error) { console.error('getSiteConfig:', error.message); return mockConfig }
  return data || mockConfig
}

export function calcExperimentDays(startDate: string): number {
  // 用本地日期对比，避免时区偏差（3.14 = 第1天，3.15零点起 = 第2天）
  const [y, m, d] = startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const now = new Date()
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.floor((todayLocal.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 100)
}
