<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="filterName" class="field" placeholder="按歌名搜索" clearable @change="reload" />
        <el-input v-model="filterUser" class="field" placeholder="按点歌人搜索" clearable @change="reload" />
        <el-select v-model="filterStatus" class="field-sm" placeholder="状态" clearable @change="reload">
          <el-option label="待选用" value="pending" />
          <el-option label="已选用" value="selected" />
          <el-option label="已禁播" value="banned" />
        </el-select>
        <div class="toolbar-actions">
          <el-button type="primary" :disabled="!selIds.length" @click="batchSelect">
            选用选中({{ selIds.length }})
          </el-button>
        </div>
      </div>

      <el-table :data="rows" @selection-change="onSelChange" row-key="id" v-loading="loading">
        <el-table-column type="selection" width="42" :selectable="(row: PoolItem) => !row.selected" />
        <el-table-column prop="name" label="歌名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="artist" label="歌手" width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span v-if="row.is_banned" class="pill pill-banned">已禁播</span>
            <span v-else-if="row.selected" class="pill pill-selected">已选用</span>
            <span v-else class="pill pill-pending">待选用</span>
          </template>
        </el-table-column>
        <el-table-column prop="req_count" label="点歌数" width="80" />
        <el-table-column label="点歌人" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.requesters && row.requesters.length">
              <UidText v-for="u in row.requesters" :key="u" :uid="u" class="requester" />
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="最近点歌" width="150">
          <template #default="{ row }">{{ fmtTime(row.last_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :disabled="row.selected || row.is_banned" @click="selectOne(row)">
              选用
            </el-button>
            <el-button size="small" :type="row.is_banned ? 'success' : 'danger'" @click="toggleBan(row)">
              {{ row.is_banned ? '解禁' : '禁播' }}
            </el-button>
            <el-button size="small" @click="openDetail(row)">详情</el-button>
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

    <el-dialog
      v-model="detailVisible"
      :title="detailSong ? `点歌记录 · ${detailSong.name}` : '点歌记录'"
      width="min(640px, calc(100vw - 32px))"
      align-center
    >
      <el-table :data="detailRows" size="small">
        <el-table-column label="点歌人" min-width="180">
          <template #default="{ row }">
            <UidText v-if="row.user_id" :uid="row.user_id" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="day_count" label="当日次数" width="90" />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ fmtTime(row.time) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

import { api } from '@/api'
import UidText from '@/components/UidText.vue'
import type { PoolItem, RequestRow } from '@/types'

const rows = ref<PoolItem[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const loading = ref(false)
const filterName = ref('')
const filterUser = ref('')
const filterStatus = ref('')
const selIds = ref<number[]>([])

const detailVisible = ref(false)
const detailSong = ref<PoolItem | null>(null)
const detailRows = ref<RequestRow[]>([])

function fmtTime(t?: string | null) {
  return t ? t.slice(5, 16).replace('T', ' ') : '-'
}

function onSelChange(selection: PoolItem[]) {
  selIds.value = selection.map((r) => r.id)
}

async function reload() {
  loading.value = true
  try {
    const res = await api.pool({
      name: filterName.value || undefined,
      user: filterUser.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      size: size.value,
    })
    rows.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function selectOne(row: PoolItem) {
  await api.selectSong(row.id)
  ElMessage.success(`已选用：${row.name}`)
  reload()
}

async function batchSelect() {
  await ElMessageBox.confirm(`确定选用选中的 ${selIds.value.length} 首歌曲吗？`, '批量选用', {
    confirmButtonText: '选用',
    cancelButtonText: '取消',
    type: 'warning',
  })
  const res = await api.selectMany(selIds.value)
  ElMessage.success(`已批量选用 ${res.count} 首`)
  reload()
}

async function toggleBan(row: PoolItem) {
  if (row.is_banned) {
    await api.unbanSong(row.id)
    ElMessage.success(`已解禁：${row.name}`)
  } else {
    await api.banSong(row.id)
    ElMessage.success(`已禁播：${row.name}`)
  }
  reload()
}

async function openDetail(row: PoolItem) {
  detailSong.value = row
  detailRows.value = await api.songRequests(row.id)
  detailVisible.value = true
}

onMounted(reload)
</script>

<style scoped>
.requester {
  margin-right: 4px;
}
</style>
