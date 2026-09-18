import { http } from './request'
import type {
  AgentVerdict,
  DrawFilters,
  DrawSong,
  HistoryRow,
  PoolItem,
  RequestRow,
  StatsData,
  UserRow,
} from '@/types'

export interface Paged<T> {
  data: T[]
  total: number
  page: number
  size: number
}

export const api = {
  // ---- 登录 ----
  async login(username: string, password: string) {
    const { data } = await http.post<{ ok: boolean; token: string }>('/api/login', {
      username,
      password,
    })
    return data
  },

  // ---- 点歌池 ----
  async pool(params: { name?: string; user?: string; status?: string; page?: number; size?: number }) {
    const { data } = await http.get<Paged<PoolItem>>('/api/pool', { params })
    return data
  },
  async songRequests(sid: number) {
    const { data } = await http.get<{ data: RequestRow[] }>(`/api/songs/${sid}/requests`)
    return data.data
  },
  async selectSong(sid: number, note = '') {
    await http.post(`/api/songs/${sid}/select`, { note })
  },
  async selectMany(ids: number[], note = '') {
    const { data } = await http.post<{ ok: boolean; count: number }>('/api/songs/select_many', {
      ids,
      note,
    })
    return data
  },
  async banSong(sid: number) {
    await http.post(`/api/songs/${sid}/ban`)
  },
  async unbanSong(sid: number) {
    await http.post(`/api/songs/${sid}/unban`)
  },
  async banMany(ids: number[]) {
    const { data } = await http.post<{ ok: boolean; count: number }>('/api/songs/ban_many', {
      ids,
    })
    return data
  },

  // ---- 播放历史 ----
  async history(params: { name?: string; date?: string; page?: number; size?: number }) {
    const { data } = await http.get<Paged<HistoryRow>>('/api/history', { params })
    return data
  },
  async deleteHistory(id: number) {
    const { data } = await http.delete<{ ok: boolean; reset_songs: number }>(`/api/history/${id}`)
    return data
  },
  async deleteHistoryMany(ids: number[]) {
    const { data } = await http.post<{ ok: boolean; count: number; reset_songs: number }>(
      '/api/history/delete_many',
      { ids },
    )
    return data
  },
  async deleteHistoryAll() {
    const { data } = await http.post<{ ok: boolean; count: number; reset_songs: number }>(
      '/api/history/delete_all',
    )
    return data
  },
  async historyImage(payload: { range: string; date_from?: string | null; date_to?: string | null }) {
    const resp = await http.post('/api/history/image', payload, { responseType: 'blob' })
    return resp.data as Blob
  },

  // ---- 用户 ----
  async users() {
    const { data } = await http.get<{ data: UserRow[] }>('/api/users')
    return data.data
  },
  async banUser(uid: string) {
    await http.post(`/api/users/${uid}/ban`)
  },
  async unbanUser(uid: string) {
    await http.post(`/api/users/${uid}/unban`)
  },

  // ---- 统计 ----
  async stats() {
    const { data } = await http.get<{ data: StatsData }>('/api/stats')
    return data.data
  },

  // ---- 权限 ----
  async permissions() {
    const { data } = await http.get<{ data: { admins: string[]; super_admins: string[] } }>(
      '/api/permissions',
    )
    return data.data
  },
  async savePermissions(payload: { admins: string[]; super_admins: string[] }) {
    await http.put('/api/permissions', payload)
  },

  // ---- 筛选 agent ----
  async agentRules() {
    const { data } = await http.get<{ rules: string }>('/api/agent/rules')
    return data.rules
  },
  async screenSongs(songIds: number[]) {
    const { data } = await http.post<{ data: AgentVerdict[] }>('/api/agent/screen-songs', {
      song_ids: songIds,
    })
    return data.data
  },

  // ---- 每日选曲抽取 ----
  async candidates(filters: DrawFilters) {
    const { data } = await http.post<{ data: { total: number; users: string[] } }>(
      '/api/pool/candidates',
      filters,
    )
    return data.data
  },
  async draw(filters: DrawFilters, count: number, weighted: boolean, excludeIds: number[] = []) {
    const { data } = await http.post<{ data: { songs: DrawSong[] } }>('/api/pool/draw', {
      ...filters,
      count,
      weighted,
      exclude_ids: excludeIds,
    })
    return data.data.songs
  },
}
