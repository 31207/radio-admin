<template>
  <div class="page">
    <div class="page-card">
      <div class="head">
        <el-button text @click="$router.push('/wizard')">← 返回引导中心</el-button>
        <el-button text type="danger" @click="restart">重新开始</el-button>
      </div>

      <StepBar :steps="STEPS" :current="step" allow-jump @jump="(i) => (step = i)" />

      <!-- 第 1 步：选择范围 -->
      <div v-if="step === 0" class="step-body">
        <h2>要筛选哪些歌曲？</h2>
        <div class="options">
          <div class="option" :class="{ on: scopeMode === 'pending' }" @click="loadSongs('pending')">
            <b>全部待选用的歌</b>
            <span>还没被选用过、也没禁播的</span>
          </div>
          <div class="option" :class="{ on: scopeMode === 'all' }" @click="loadSongs('all')">
            <b>全部歌曲</b>
            <span>包括已选用、已禁播的</span>
          </div>
          <div class="option" :class="{ on: scopeMode === 'manual' }" @click="scopeMode = 'manual'">
            <b>自己勾选</b>
            <span>在下方列表中手动挑选</span>
          </div>
        </div>

        <el-table
          :data="scopeRows"
          @selection-change="onScopeSelChange"
          row-key="id"
          max-height="340"
          size="small"
          v-loading="scopeLoading"
        >
          <el-table-column type="selection" width="40" />
          <el-table-column prop="name" label="歌名" min-width="160" show-overflow-tooltip />
          <el-table-column prop="artist" label="歌手" width="150" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span v-if="row.is_banned" class="pill pill-banned">已禁播</span>
              <span v-else-if="row.selected" class="pill pill-selected">已选用</span>
              <span v-else class="pill pill-pending">待选用</span>
            </template>
          </el-table-column>
        </el-table>
        <p class="hint">已选择 <b>{{ scopeSel.length }}</b> 首</p>
      </div>

      <!-- 第 2 步：判定标准 -->
      <div v-else-if="step === 1" class="step-body">
        <h2>将按以下标准逐首判断</h2>
        <p class="sub">如标准需要调整，请修改后端规则后再执行。</p>
        <pre class="rules">{{ rules || '加载中…' }}</pre>
      </div>

      <!-- 第 3 步：执行判定 -->
      <div v-else-if="step === 2" class="step-body">
        <h2>开始判定（共 {{ store.screen.songIds.length }} 首）</h2>
        <el-progress v-if="running" :percentage="progressPct" :format="progressText" style="margin: 26px 0" />
        <div v-if="!running && store.screen.results" class="done-tip">
          判定完成！共 {{ store.screen.results.length }} 首，点击「下一步」查看结果。
        </div>
        <div v-if="!running && !store.screen.results" class="done-tip">点击下方按钮开始判定。</div>
      </div>

      <!-- 第 4 步：结果 -->
      <div v-else class="step-body">
        <h2>判定结果</h2>
        <el-table
          :data="store.screen.results || []"
          @selection-change="onResultSelChange"
          row-key="song_id"
          max-height="420"
          size="small"
        >
          <el-table-column type="selection" width="40" :selectable="(row: AgentVerdict) => row.verdict !== 'safe'" />
          <el-table-column prop="name" label="歌名" min-width="150" show-overflow-tooltip />
          <el-table-column prop="artist" label="歌手" width="140" show-overflow-tooltip />
          <el-table-column label="判定" width="90">
            <template #default="{ row }"><VerdictTag :verdict="row.verdict" /></template>
          </el-table-column>
          <el-table-column prop="reason" label="理由" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>

      <!-- 底部导航 -->
      <div class="nav">
        <el-button v-if="step > 0" @click="step--">上一步</el-button>
        <span class="nav-spacer" />
        <el-button v-if="step === 2 && !running" type="primary" @click="run">开始判定</el-button>
        <el-button
          v-if="step === 3 && resultSel.length"
          type="danger"
          @click="banSelected"
        >
          批量标记禁播({{ resultSel.length }})
        </el-button>
        <el-button v-if="step < 3" type="primary" :disabled="!canNext" @click="next">下一步</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { api } from '@/api'
import type { AgentVerdict, PoolItem } from '@/types'
import StepBar from '@/components/StepBar.vue'
import VerdictTag from '@/components/VerdictTag.vue'
import { useWizardStore } from '@/stores/wizard'

const STEPS = [
  { key: 'scope', title: '选择范围' },
  { key: 'rules', title: '判定标准' },
  { key: 'run', title: '执行判定' },
  { key: 'result', title: '结果处理' },
]

const store = useWizardStore()
const step = ref(0)
const rules = ref('')
const running = ref(false)
const progressDone = ref(0)
const progressTotal = ref(0)
const resultSel = ref<AgentVerdict[]>([])

// 第 1 步
const scopeMode = ref<'pending' | 'all' | 'manual'>('pending')
const scopeRows = ref<PoolItem[]>([])
const scopeSel = ref<PoolItem[]>([])
const scopeLoading = ref(false)

const progressPct = computed(() =>
  progressTotal.value ? Math.round((progressDone.value / progressTotal.value) * 100) : 0,
)
const progressText = () => `${progressDone.value}/${progressTotal.value} 首`

const canNext = computed(() => {
  if (step.value === 0) return scopeSel.value.length > 0
  return true
})

async function loadSongs(mode: 'pending' | 'all') {
  scopeMode.value = mode
  scopeLoading.value = true
  scopeSel.value = []
  try {
    const res = await api.pool({ status: mode === 'pending' ? 'pending' : undefined, page: 1, size: 200 })
    scopeRows.value = res.data
    scopeSel.value = [...res.data]
  } finally {
    scopeLoading.value = false
  }
}

function onScopeSelChange(selection: PoolItem[]) {
  scopeSel.value = selection
}

function onResultSelChange(selection: AgentVerdict[]) {
  resultSel.value = selection
}

function next() {
  if (step.value === 0) {
    store.screen.songIds = scopeSel.value.map((r) => r.id)
    store.screen.results = null
  }
  step.value++
}

function restart() {
  store.resetScreen()
  scopeRows.value = []
  scopeSel.value = []
  step.value = 0
}

async function run() {
  running.value = true
  progressDone.value = 0
  progressTotal.value = store.screen.songIds.length
  try {
    await store.doScreen(store.screen.songIds, (done, total) => {
      progressDone.value = done
      progressTotal.value = total
    })
  } catch {
    ElMessage.error('判定过程中出错，已得到的部分结果已保留')
  } finally {
    running.value = false
  }
}

async function banSelected() {
  await ElMessageBox.confirm(
    `确定把勾选的 ${resultSel.value.length} 首标记为禁播吗？`,
    '批量禁播',
    { type: 'warning' },
  )
  const res = await api.banMany(resultSel.value.map((r) => r.song_id))
  ElMessage.success(`已禁播 ${res.count} 首`)
  resultSel.value = []
}

onMounted(async () => {
  rules.value = await api.agentRules()
  await loadSongs('pending')
})
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.step-body {
  padding: 10px 8px 24px;
  min-height: 300px;
}

h2 {
  font-size: 19px;
  margin: 8px 0 16px;
}

.sub {
  color: var(--text-2);
  font-size: 13px;
}

.options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.option {
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s;
}

.option:hover {
  border-color: #c7c5ef;
}

.option.on {
  border-color: var(--acc);
  background: var(--acc-soft);
}

.option b {
  font-size: 14px;
}

.option span {
  color: var(--text-2);
  font-size: 12px;
}

.hint {
  margin-top: 10px;
  color: var(--acc);
  font-size: 13px;
}

.rules {
  background: #f8f9fc;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  padding: 16px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-2);
  font-family: var(--font-mono);
  margin: 0;
}

.done-tip {
  color: var(--text-2);
  font-size: 14px;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 14px 8px 4px;
  border-top: 1px solid var(--border-soft);
}

.nav-spacer {
  flex: 1;
}

@media (max-width: 767px) {
  .step-body {
    min-height: 240px;
    padding: 6px 2px 18px;
  }

  h2 {
    font-size: 17px;
    margin: 4px 0 12px;
  }

  .nav .el-button {
    flex: 1 1 40%;
  }

  .nav-spacer {
    display: none;
  }
}
</style>
