import { defineStore } from 'pinia'

import { api } from '@/api'
import type { AgentVerdict, DrawFilters, DrawSong } from '@/types'

export type TimePreset = 'all' | 'today' | 'week' | '7d' | '30d' | 'custom'

export interface DrawWizardState {
  timePreset: TimePreset
  dateRange: [string, string] | null
  excludeSelected: boolean
  excludeBanned: boolean
  platforms: string[]
  userIds: string[]
  remarkKeyword: string
  weighted: boolean
  count: number
  candidatesTotal: number
  candidateUsers: string[]
  result: DrawSong[] | null
  selectedDone: boolean
}

export interface ScreenWizardState {
  songIds: number[]
  results: AgentVerdict[] | null
}

function presetToRange(preset: TimePreset, dateRange: [string, string] | null): {
  date_from: string | null
  date_to: string | null
} {
  const fmt = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }
  const today = new Date()
  const todayStr = fmt(today)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  switch (preset) {
    case 'today':
      return { date_from: todayStr, date_to: todayStr }
    case 'week':
      return { date_from: fmt(startOfWeek), date_to: null }
    case '7d': {
      const d = new Date(today)
      d.setDate(today.getDate() - 6)
      return { date_from: fmt(d), date_to: null }
    }
    case '30d': {
      const d = new Date(today)
      d.setDate(today.getDate() - 29)
      return { date_from: fmt(d), date_to: null }
    }
    case 'custom':
      return dateRange
        ? { date_from: dateRange[0], date_to: dateRange[1] }
        : { date_from: null, date_to: null }
    default:
      return { date_from: null, date_to: null }
  }
}

export const useWizardStore = defineStore('wizard', {
  state: (): { draw: DrawWizardState; screen: ScreenWizardState } => ({
    draw: {
      timePreset: 'today',
      dateRange: null,
      excludeSelected: true,
      excludeBanned: true,
      platforms: [],
      userIds: [],
      remarkKeyword: '',
      weighted: false,
      count: 5,
      candidatesTotal: 0,
      candidateUsers: [],
      result: null,
      selectedDone: false,
    },
    screen: {
      songIds: [],
      results: null,
    },
  }),
  actions: {
    resetDraw() {
      this.draw = {
        timePreset: 'today',
        dateRange: null,
        excludeSelected: true,
        excludeBanned: true,
        platforms: [],
        userIds: [],
        remarkKeyword: '',
        weighted: false,
        count: 5,
        candidatesTotal: 0,
        candidateUsers: [],
        result: null,
        selectedDone: false,
      }
    },
    resetScreen() {
      this.screen = { songIds: [], results: null }
    },
    buildFilters(): DrawFilters {
      const range = presetToRange(this.draw.timePreset, this.draw.dateRange)
      return {
        date_from: range.date_from,
        date_to: range.date_to,
        exclude_selected: this.draw.excludeSelected,
        exclude_banned: this.draw.excludeBanned,
        platforms: this.draw.platforms,
        user_ids: this.draw.userIds,
        remark_keyword: this.draw.remarkKeyword,
      }
    },
    async refreshCandidates() {
      const res = await api.candidates(this.buildFilters())
      this.draw.candidatesTotal = res.total
      this.draw.candidateUsers = res.users
    },
    async doDraw() {
      this.draw.result = await api.draw(this.buildFilters(), this.draw.count, this.draw.weighted)
      this.draw.selectedDone = false
    },
    async replaceSong(index: number): Promise<DrawSong | null> {
      if (!this.draw.result) return null
      const excludeIds = this.draw.result.map((s) => s.id)
      const [replacement] = await api.draw(this.buildFilters(), 1, this.draw.weighted, excludeIds)
      if (replacement) {
        this.draw.result.splice(index, 1, replacement)
      }
      return replacement ?? null
    },
    async doScreen(songIds: number[], onProgress?: (done: number, total: number) => void) {
      const CHUNK = 5
      const all: AgentVerdict[] = []
      for (let i = 0; i < songIds.length; i += CHUNK) {
        all.push(...(await api.screenSongs(songIds.slice(i, i + CHUNK))))
        onProgress?.(Math.min(i + CHUNK, songIds.length), songIds.length)
      }
      this.screen.songIds = songIds
      this.screen.results = all
    },
  },
})
