import { supabase, isSupabaseConfigured } from './supabase'
import { mockTools, mockLogs, mockRequests, mockConfig } from './mockData'
import type { Tool, Log, Request, SiteConfig } from '../types'

// --- Tools ---

export async function getTools(): Promise<Tool[]> {
  if (!isSupabaseConfigured()) return mockTools
  const { data, error } = await supabase.from('tools').select('*').order('number')
  if (error) return mockTools
  return data || []
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!isSupabaseConfigured()) return mockTools.find(t => t.id === id) || null
  const { data, error } = await supabase.from('tools').select('*').eq('id', id).single()
  if (error) return null
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
  if (error) return mockLogs
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
  if (error) return mockRequests
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
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }
  const { error } = await supabase.from('requests').insert([{ ...payload, vote_count: 0, is_featured: false }])
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function voteForRequest(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.rpc('increment_request_vote', { request_id: id })
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
  if (error) return mockConfig
  return data || mockConfig
}

export function calcExperimentDays(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 100)
}
