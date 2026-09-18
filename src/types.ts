// 全局接口类型（与后端 web-admin/backend/app.py 返回结构一致）

export interface PoolItem {
  id: number
  name: string
  artist: string
  is_banned: boolean
  selected: boolean
  req_count: number
  last_time: string | null
  requesters: string[]
}

export interface RequestRow {
  user_id: string
  time: string
  remark: string
  day_count: number
  name: string
  artist: string
}

export interface HistoryRow {
  id: number
  song_id: number
  name: string
  artist: string
  user_id: string
  note: string
  played_at: string
}

export interface UserRow {
  user_id: string
  is_banned: boolean
  created_at: string
  today_count: number
}

export interface HotSong {
  name: string
  artist: string
  cnt: number
}

export interface TrendPoint {
  day: string
  cnt: number
}

export interface StatsData {
  total: number
  requests: number
  pending: number
  selected: number
  banned: number
  hot: HotSong[]
  trend: TrendPoint[]
}

export type Verdict = 'safe' | 'suspicious' | 'banned' | 'unknown'

export interface AgentVerdict {
  song_id: number
  name: string
  artist: string
  verdict: Verdict
  reason: string
}

export interface DrawFilters {
  date_from: string | null
  date_to: string | null
  exclude_selected: boolean
  exclude_banned: boolean
  platforms: string[] // 空 = 全部
  user_ids: string[] // 空 = 全部
  remark_keyword: string
}

export interface DrawSong {
  id: number
  name: string
  artist: string
  album: string
  cover: string
  source: string
  url: string
  link: string
  req_count: number
  requesters: string[]
  remark: string
}
