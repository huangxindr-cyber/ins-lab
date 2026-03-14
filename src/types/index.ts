export type ToolStatus = 'completed' | 'developing' | 'upcoming'
export type LogType = 'daily' | 'weekly'

export interface Tool {
  id: string
  number: number
  name: string
  description: string
  status: ToolStatus
  start_date: string | null
  complete_date: string | null
  url: string | null
  try_count: number
  vote_count: number
  features: string | null
  how_to_use: string | null
  notes: string | null
  created_at: string
}

export interface Log {
  id: string
  tool_id: string | null
  date: string
  title: string
  content: string
  type: LogType
  created_at: string
}

export type RequestStatus = '待评估' | '考虑中' | '已立项' | '已实现' | '暂不做'

export interface Request {
  id: string
  problem: string
  current_solution: string | null
  willing_to_try: string | null
  nickname: string | null
  contact: string | null
  vote_count: number
  is_featured: boolean
  status: RequestStatus
  created_at: string
}

export interface RequestReply {
  id: string
  request_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface Suggestion {
  id: string
  tool_id: string
  content: string
  nickname: string | null
  created_at: string
}

export interface Subscription {
  id: string
  contact: string
  created_at: string
}

export interface SiteConfig {
  id: string
  hero_title: string
  hero_subtitle: string
  experiment_start_date: string
}
