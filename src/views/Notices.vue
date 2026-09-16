<template>
  <div class="page">
    <div class="page-card card-narrow-wide">
      <h3 class="page-title">选中通知状态</h3>
      <p class="tip">bot 每周五 19:00 自动发送；失败用户只重试、满 3 轮放弃。可在 QQ 里用「发送通知」手动触发。</p>

      <div class="stats">
        <div class="stat">
          <div class="num warn">{{ status.pending.length }}</div>
          <div class="lbl">待发送</div>
        </div>
        <div class="stat">
          <div class="num ok">{{ status.sent_count }}</div>
          <div class="lbl">已发送</div>
        </div>
        <div class="stat">
          <div class="num bad">{{ status.failed.length }}</div>
          <div class="lbl">失败（放弃）</div>
        </div>
      </div>

      <el-tabs v-model="tab">
        <el-tab-pane :label="`待发送 (${status.pending.length})`" name="pending">
          <el-table :data="status.pending" size="small" empty-text="没有待发送的通知">
            <el-table-column label="歌曲" min-width="180">
              <template #default="{ row }">《{{ row.name }} - {{ row.artist }}》</template>
            </el-table-column>
            <el-table-column label="选用时间" width="150">
              <template #default="{ row }">{{ fmtTime(row.selected_at) }}</template>
            </el-table-column>
            <el-table-column label="已尝试" width="80">
              <template #default="{ row }">{{ row.attempts }} 轮</template>
            </el-table-column>
            <el-table-column label="将通知" min-width="140">
              <template #default="{ row }">{{ (row.user_ids || []).join('、') }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`失败放弃 (${status.failed.length})`" name="failed">
          <el-table :data="status.failed" size="small" empty-text="没有失败的通知">
            <el-table-column label="歌曲" min-width="180">
              <template #default="{ row }">《{{ row.name }} - {{ row.artist }}》</template>
            </el-table-column>
            <el-table-column label="选用时间" width="150">
              <template #default="{ row }">{{ fmtTime(row.selected_at) }}</template>
            </el-table-column>
            <el-table-column label="未送达用户" min-width="140">
              <template #default="{ row }">{{ row.failed_user_ids.join('、') }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <el-button class="refresh" @click="load">刷新</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api } from '@/api'
import type { NoticeStatus } from '@/types'

const status = ref<NoticeStatus>({ pending: [], sent_count: 0, failed: [] })
const tab = ref('pending')

function fmtTime(t?: string | null) {
  return t ? t.slice(5, 16).replace('T', ' ') : '-'
}

async function load() {
  status.value = await api.noticeStatus()
}

onMounted(load)
</script>

<style scoped>
.card-narrow-wide {
  max-width: 860px;
}

.tip {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.7;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin: 14px 0;
}

.stat {
  background: #f8f9fc;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  text-align: center;
  padding: 14px 10px;
}

.num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}

.num.warn {
  color: var(--warn);
}

.num.ok {
  color: var(--ok);
}

.num.bad {
  color: var(--bad);
}

.lbl {
  font-size: 12px;
  color: var(--text-3);
}

.refresh {
  margin-top: 12px;
}

@media (max-width: 767px) {
  .refresh {
    width: 100%;
  }
}
</style>
