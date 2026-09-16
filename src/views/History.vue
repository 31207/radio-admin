<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="filterName" class="field" placeholder="按歌名搜索" clearable @change="reload" />
        <el-date-picker
          v-model="filterDate"
          class="field-sm"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="按日期筛选"
          clearable
          @change="reload"
        />
        <div class="toolbar-actions">
          <el-button type="primary" @click="openImageDialog">生成播放历史图片</el-button>
          <el-button type="danger" plain :disabled="!selIds.length" @click="deleteMany">
            删除选中({{ selIds.length }})
          </el-button>
          <el-button type="danger" @click="deleteAll">删除全部</el-button>
        </div>
      </div>

      <el-table :data="rows" @selection-change="onSelChange" row-key="id" v-loading="loading">
        <el-table-column type="selection" width="42" />
        <el-table-column prop="name" label="歌名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="artist" label="歌手" width="150" show-overflow-tooltip />
        <el-table-column prop="user_id" label="点歌人" width="130">
          <template #default="{ row }">{{ row.user_id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="播放时间" width="150">
          <template #default="{ row }">{{ fmtTime(row.played_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" plain @click="deleteOne(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        class="pager"
        :total="total"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[20, 50, 100]"
        @current-change="reload"
        @size-change="reload"
      />
    </div>

    <el-dialog v-model="imageVisible" title="生成播放历史图片" width="720px">
      <div class="range-options">
        <div
          v-for="opt in RANGE_OPTIONS"
          :key="opt.value"
          class="range-option"
          :class="{ on: imageRange === opt.value }"
          @click="imageRange = opt.value"
        >
          <b>{{ opt.label }}</b>
          <span>{{ opt.desc }}</span>
        </div>
      </div>
      <el-date-picker
        v-if="imageRange === 'custom'"
        v-model="customRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="margin: 12px 0"
      />

      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="播放历史图片" />
      </div>

      <template #footer>
        <el-button @click="imageVisible = false">关闭</el-button>
        <el-button v-if="previewUrl" type="success" @click="downloadImage">下载图片</el-button>
        <el-button type="primary" :loading="generating" @click="generateImage">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

import { api } from '@/api'
import type { HistoryRow } from '@/types'

const rows = ref<HistoryRow[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const loading = ref(false)
const filterName = ref('')
const filterDate = ref('')
const selIds = ref<number[]>([])

function fmtTime(t?: string | null) {
  return t ? t.slice(5, 16).replace('T', ' ') : '-'
}

function onSelChange(selection: HistoryRow[]) {
  selIds.value = selection.map((r) => r.id)
}

async function reload() {
  loading.value = true
  try {
    const res = await api.history({
      name: filterName.value || undefined,
      date: filterDate.value || undefined,
      page: page.value,
      size: size.value,
    })
    rows.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function deleteOne(row: HistoryRow) {
  await ElMessageBox.confirm('确认删除这条播放记录吗？\n删除后对应的歌曲将重置为「待选用」。', '删除', {
    type: 'warning',
  })
  const res = await api.deleteHistory(row.id)
  ElMessage.success(`已删除，重置 ${res.reset_songs} 首歌曲为待选用`)
  reload()
}

async function deleteMany() {
  await ElMessageBox.confirm(
    `确认删除选中的 ${selIds.value.length} 条播放记录吗？\n删除后对应的歌曲将重置为「待选用」。`,
    '批量删除',
    { type: 'warning' },
  )
  const res = await api.deleteHistoryMany(selIds.value)
  ElMessage.success(`已删除 ${res.count} 条，重置 ${res.reset_songs} 首歌曲为待选用`)
  reload()
}

async function deleteAll() {
  await ElMessageBox.confirm(
    '确认删除全部播放记录吗？\n这是一项不可恢复的操作，删除后所有对应的歌曲将重置为「待选用」。',
    '删除全部',
    { type: 'error' },
  )
  const res = await api.deleteHistoryAll()
  ElMessage.success(`已删除 ${res.count} 条，重置 ${res.reset_songs} 首歌曲为待选用`)
  reload()
}

// ---------------- 生成播放历史图片 ----------------

type HistoryRange = 'today' | 'yesterday' | 'week' | 'custom'

const RANGE_OPTIONS: { value: HistoryRange; label: string; desc: string }[] = [
  { value: 'today', label: '今天', desc: '今天 0 点至今（北京时间）' },
  { value: 'yesterday', label: '昨天', desc: '昨天全天' },
  { value: 'week', label: '本周', desc: '本周一到今天' },
  { value: 'custom', label: '自定义', desc: '自选起止日期' },
]

const imageVisible = ref(false)
const imageRange = ref<HistoryRange>('today')
const customRange = ref<[string, string] | null>(null)
const generating = ref(false)
const previewUrl = ref('')
const previewBlob = ref<Blob | null>(null)

function openImageDialog() {
  imageRange.value = 'today'
  customRange.value = null
  previewUrl.value = ''
  previewBlob.value = null
  imageVisible.value = true
}

async function generateImage() {
  if (imageRange.value === 'custom' && !customRange.value) {
    ElMessage.warning('请先选择自定义日期范围')
    return
  }
  generating.value = true
  try {
    const blob = await api.historyImage({
      range: imageRange.value,
      date_from: customRange.value?.[0] ?? null,
      date_to: customRange.value?.[1] ?? null,
    })
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewBlob.value = blob
    previewUrl.value = URL.createObjectURL(blob)
  } catch {
    // 空结果等错误由请求拦截器统一提示
  } finally {
    generating.value = false
  }
}

function downloadImage() {
  if (!previewBlob.value) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(previewBlob.value)
  a.download = `播放记录_${new Date().toISOString().slice(0, 10)}.png`
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(reload)
</script>

<style scoped>
.range-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.range-option {
  flex: 1;
  min-width: 110px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.range-option.on {
  border-color: #4f46e5;
  background: #eef2ff;
}

.range-option span {
  color: #6b7280;
  font-size: 12px;
}

.preview {
  margin-top: 14px;
  text-align: center;
}

.preview img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
}
</style>
