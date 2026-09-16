<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="keyword" class="field" placeholder="按 QQ 号搜索" clearable />
        <div class="toolbar-actions">
          <el-button @click="load">刷新</el-button>
        </div>
      </div>

      <el-table :data="filtered" v-loading="loading">
        <el-table-column prop="user_id" label="QQ 号" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span v-if="row.is_banned" class="pill pill-banned">已封禁</span>
            <span v-else class="pill pill-selected">正常</span>
          </template>
        </el-table-column>
        <el-table-column prop="today_count" label="今日点歌" width="100" />
        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.is_banned ? 'success' : 'danger'"
              @click="toggleBan(row)"
            >
              {{ row.is_banned ? '解封' : '封禁' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

import { api } from '@/api'
import type { UserRow } from '@/types'

const rows = ref<UserRow[]>([])
const loading = ref(false)
const keyword = ref('')

const filtered = computed(() =>
  keyword.value ? rows.value.filter((r) => r.user_id.includes(keyword.value)) : rows.value,
)

function fmtTime(t?: string | null) {
  return t ? t.slice(0, 16).replace('T', ' ') : '-'
}

async function load() {
  loading.value = true
  try {
    rows.value = await api.users()
  } finally {
    loading.value = false
  }
}

async function toggleBan(row: UserRow) {
  const action = row.is_banned ? '解封' : '封禁'
  await ElMessageBox.confirm(`确定${action}用户 ${row.user_id} 吗？`, action, { type: 'warning' })
  if (row.is_banned) {
    await api.unbanUser(row.user_id)
  } else {
    await api.banUser(row.user_id)
  }
  ElMessage.success(`已${action} ${row.user_id}`)
  load()
}

onMounted(load)
</script>
