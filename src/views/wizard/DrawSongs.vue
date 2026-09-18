<template>
  <div class="page">
    <div class="page-card">
      <div class="head">
        <el-button text @click="$router.push('/wizard')">← 返回引导中心</el-button>
        <el-button text type="danger" @click="restart">重新开始</el-button>
      </div>

      <StepBar :steps="STEPS" :current="step" allow-jump @jump="(i) => (step = i)" />

      <!-- 1 时间范围 -->
      <div v-if="step === 0" class="step-body">
        <h2>从什么时间范围内的点歌里选？</h2>
        <div class="options">
          <div v-for="opt in TIME_OPTIONS" :key="opt.value" class="option" :class="{ on: w.timePreset === opt.value }" @click="pickTime(opt.value)">
            <b>{{ opt.label }}</b>
            <span>{{ opt.desc }}</span>
          </div>
        </div>
        <el-date-picker
          v-if="w.timePreset === 'custom'"
          v-model="w.dateRange"
          class="range-picker"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </div>

      <!-- 2 排除项 -->
      <div v-else-if="step === 1" class="step-body">
        <h2>要排除哪些歌？</h2>
        <div class="switch-row">
          <span class="switch-label"><b>已选用的歌</b><i>之前上过广播的，默认排除</i></span>
          <el-switch v-model="w.excludeSelected" />
        </div>
        <div class="switch-row">
          <span class="switch-label"><b>已禁播的歌</b><i>被标记禁播的，默认排除</i></span>
          <el-switch v-model="w.excludeBanned" />
        </div>
      </div>

      <!-- 3 平台 -->
      <div v-else-if="step === 2" class="step-body">
        <h2>限定哪些平台？</h2>
        <div class="chips">
          <div class="chip" :class="{ on: w.platforms.length === 0 }" @click="w.platforms = []">全部平台</div>
          <div
            v-for="p in PLATFORMS"
            :key="p.value"
            class="chip"
            :class="{ on: w.platforms.includes(p.value) }"
            @click="togglePlatform(p.value)"
          >
            {{ p.label }}
          </div>
        </div>
      </div>

      <!-- 4 点歌人 -->
      <div v-else-if="step === 3" class="step-body">
        <h2>只看某些人点的歌？</h2>
        <div class="chips">
          <div class="chip" :class="{ on: w.userIds.length === 0 }" @click="w.userIds = []">全部点歌人</div>
          <div
            v-for="u in w.candidateUsers"
            :key="u"
            class="chip"
            :class="{ on: w.userIds.includes(u) }"
            @click="toggleUser(u)"
          >
            {{ u }}
          </div>
        </div>
        <p v-if="!w.candidateUsers.length" class="empty-hint">当前条件下暂无点歌人</p>
      </div>

      <!-- 5 备注关键词 -->
      <div v-else-if="step === 4" class="step-body">
        <h2>按备注关键词过滤？</h2>
        <p class="sub">只保留备注中含关键词的歌（如「生日」「毕业」）；留空表示不过滤。</p>
        <el-input v-model="w.remarkKeyword" class="remark-input" placeholder="输入关键词，可留空" clearable />
      </div>

      <!-- 6 抽取方式 -->
      <div v-else-if="step === 5" class="step-body">
        <h2>怎么抽？</h2>
        <div class="options">
          <div class="option" :class="{ on: !w.weighted }" @click="w.weighted = false">
            <b>纯随机</b>
            <span>每首被抽到的概率相同</span>
          </div>
          <div class="option" :class="{ on: w.weighted }" @click="w.weighted = true">
            <b>按点歌次数加权</b>
            <span>大家点得多的歌更可能被抽到</span>
          </div>
        </div>
      </div>

      <!-- 7 数量 + 抽取 -->
      <div v-else-if="step === 6" class="step-body">
        <h2>抽取几首？</h2>
        <div class="draw-row">
          <el-input-number v-model="w.count" :min="1" :max="20" size="large" />
          <el-button type="primary" size="large" :loading="drawing" @click="draw">抽 取</el-button>
        </div>
      </div>

      <!-- 8 结果 -->
      <div v-else class="step-body">
        <h2>今天的广播歌单（{{ w.result?.length || 0 }} 首）</h2>
        <p class="hint">提示：</p>
        <p class="hint">1. 如果出现同名但不同音乐软件的歌曲，可以点击“换一首”</p>
        <p class="hint">2. 把这些选中的歌曲播放一遍，就算是一次每日广播</p>
        <p class="hint">3. 不一定要在对应的音乐软件播放，别的音乐软件有也可以在那里播放，只需点击“复制歌曲信息”，然后去那个音乐软件搜索播放即可</p>
        <p class="hint">4. 把放完的歌曲勾选上，没来得及放的就不要勾选，然后点击“一键选用这x首”</p>
        <p class="hint">5. 被选用的歌曲可在播放历史查看，可以生成播放历史图片并发送到频道里</p>
        <el-alert v-if="w.selectedDone" type="success" :closable="false" title="已选用这批歌曲，用户可在机器人里用「选用记录」查看" style="margin-bottom: 12px" />
        <div v-if="w.result" class="song-grid">
          <div v-for="(s, i) in w.result" :key="s.id" class="song-card">
            <el-checkbox
              class="card-check"
              :model-value="checked.has(s.id)"
              :disabled="w.selectedDone"
              @change="toggle(s.id)"
            >
              选用
            </el-checkbox>
            <div class="cover" :style="coverStyle(s.cover)">{{ s.cover ? '' : '♪' }}</div>
            <div class="info">
              <div class="name">{{ s.name }}</div>
              <div class="artist">{{ s.artist }}</div>
              <div class="meta">
                <span>{{ sourceName(s.source) }}</span>
                <span>被点 {{ s.req_count }} 次</span>
              </div>
              <div v-if="s.remark" class="remark">备注：{{ s.remark }}</div>
              <div class="links">
                <el-link v-if="s.url" type="primary" :href="s.url" target="_blank">音频直链</el-link>
                <el-link v-if="s.link" type="primary" :href="s.link" target="_blank" style="margin-left: 8px">网页链接</el-link>
                <span v-if="!s.url && !s.link" class="no-link">无链接</span>
              </div>
              <div class="card-actions">
                <el-button size="small" @click="copySongInfo(s)">复制歌曲信息</el-button>
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :disabled="w.selectedDone"
                  :loading="replacingIndex === i"
                  @click="replaceOne(i)"
                >
                  换一首
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="nav">
        <el-button v-if="step > 0 && step < 7" @click="step--">上一步</el-button>
        <span class="nav-spacer" />
        <span class="cand-count">当前候选：<b>{{ w.candidatesTotal }}</b> 首</span>
        <el-button v-if="step === 7" @click="draw">重新抽取</el-button>
        <el-button v-if="step === 7" @click="step = 0">调整条件</el-button>
        <el-button
          v-if="step === 7 && !w.selectedDone"
          type="primary"
          :disabled="!checkedCount"
          :loading="selecting"
          @click="selectAll"
        >
          一键选用这 {{ checkedCount }} 首
        </el-button>
        <el-button v-if="step < 7" type="primary" @click="next">下一步</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { api } from '@/api'
import StepBar from '@/components/StepBar.vue'
import { useWizardStore } from '@/stores/wizard'
import type { TimePreset } from '@/stores/wizard'

const STEPS = [
  { key: 'time', title: '时间范围' },
  { key: 'exclude', title: '排除项' },
  { key: 'platform', title: '平台' },
  { key: 'user', title: '点歌人' },
  { key: 'remark', title: '备注' },
  { key: 'way', title: '抽取方式' },
  { key: 'count', title: '抽取数量' },
  { key: 'result', title: '结果' },
]

const TIME_OPTIONS: { value: TimePreset; label: string; desc: string }[] = [
  { value: 'today', label: '今天', desc: '今天点过的歌' },
  { value: 'week', label: '本周', desc: '本周一到今天' },
  { value: '7d', label: '最近 7 天', desc: '含今天的近一周' },
  { value: '30d', label: '最近 30 天', desc: '近一个月' },
  { value: 'all', label: '全部时间', desc: '不限制时间' },
  { value: 'custom', label: '自定义', desc: '自选起止日期' },
]

const PLATFORMS = [
  { value: 'netease', label: '网易云' },
  { value: 'qq', label: 'QQ音乐' },
  { value: 'kugou', label: '酷狗' },
  { value: 'kuwo', label: '酷我' },
  { value: 'migu', label: '咪咕' },
  { value: 'soda', label: '汽水' },
  { value: 'qianqian', label: '千千' },
  { value: 'joox', label: 'JOOX' },
  { value: 'jamendo', label: 'Jamendo' },
  { value: 'bilibili', label: 'B站' },
]

const store = useWizardStore()
const w = store.draw
const step = ref(0)
const drawing = ref(false)
const selecting = ref(false)
const replacingIndex = ref<number | null>(null)
const checked = ref<Set<number>>(new Set())

const checkedCount = computed(() => checked.value.size)

function toggle(songId: number) {
  const next = new Set(checked.value)
  if (next.has(songId)) next.delete(songId)
  else next.add(songId)
  checked.value = next
}

function checkAll(result: { id: number }[]) {
  checked.value = new Set(result.map((s) => s.id))
}

async function copySongInfo(s: { name: string; artist: string }) {
  try {
    await navigator.clipboard.writeText(`${s.name} - ${s.artist}`)
    ElMessage.success(`已复制：${s.name} - ${s.artist}`)
  } catch {
    ElMessage.error('复制失败，请手动复制歌名歌手')
  }
}

async function replaceOne(index: number) {
  replacingIndex.value = index
  try {
    const oldId = w.result?.[index]?.id
    const replacement = await store.replaceSong(index)
    if (replacement) {
      const next = new Set(checked.value)
      if (oldId !== undefined) next.delete(oldId)
      next.add(replacement.id)
      checked.value = next
    }
  } catch {
    ElMessage.error('换一首失败，请重试')
  } finally {
    replacingIndex.value = null
  }
}

function pickTime(v: TimePreset) {
  w.timePreset = v
  if (v !== 'custom') w.dateRange = null
}

function togglePlatform(v: string) {
  const i = w.platforms.indexOf(v)
  if (i >= 0) w.platforms.splice(i, 1)
  else w.platforms.push(v)
}

function toggleUser(u: string) {
  const i = w.userIds.indexOf(u)
  if (i >= 0) w.userIds.splice(i, 1)
  else w.userIds.push(u)
}

function sourceName(s: string) {
  const m = PLATFORMS.find((p) => p.value === s)
  return m ? m.label : s || '未知来源'
}

function coverStyle(url: string) {
  return url ? { backgroundImage: `url(${url})` } : {}
}

async function refresh() {
  await store.refreshCandidates()
}

async function next() {
  if (step.value === 6) {
    await draw()
    return
  }
  step.value++
  await refresh()
}

async function draw() {
  drawing.value = true
  try {
    await refresh()
    if (!w.candidatesTotal) {
      ElMessage.warning('当前条件下没有候选歌曲，请返回调整条件')
      return
    }
    await store.doDraw()
    checkAll(w.result ?? [])
    step.value = 7
  } finally {
    drawing.value = false
  }
}

async function selectAll() {
  if (!w.result?.length) return
  const ids = w.result.filter((s) => checked.value.has(s.id)).map((s) => s.id)
  if (!ids.length) return
  await ElMessageBox.confirm(
    `确定选用这 ${ids.length} 首歌曲吗？\n选用后将记入播放历史。`,
    '一键选用',
    { type: 'warning' },
  )
  selecting.value = true
  try {
    const res = await api.selectMany(ids, '每日选曲向导')
    w.selectedDone = true
    ElMessage.success(`已选用 ${res.count} 首`)
  } finally {
    selecting.value = false
  }
}

function restart() {
  store.resetDraw()
  checked.value = new Set()
  step.value = 0
}
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: 12px;
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

.range-picker {
  margin-top: 14px;
  width: min(100%, 360px);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  padding: 14px 18px;
  margin-bottom: 12px;
  max-width: 520px;
}

.switch-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.switch-label i {
  font-style: normal;
  color: var(--text-3);
  font-size: 12px;
}

.chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.chip {
  border: 1.5px solid var(--border);
  border-radius: var(--r-full);
  padding: 8px 18px;
  cursor: pointer;
  font-size: 14px;
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  user-select: none;
}

.chip:hover {
  border-color: #c7c5ef;
}

.chip.on {
  border-color: var(--acc);
  background: var(--acc-soft);
  color: var(--acc-strong);
  font-weight: 600;
}

.empty-hint {
  color: var(--text-3);
  font-size: 13px;
}

.remark-input {
  max-width: 360px;
}

.draw-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.song-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 14px;
}

.song-card {
  position: relative;
  display: flex;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 12px;
}

.card-check {
  position: absolute;
  top: 10px;
  right: 12px;
}

.cover {
  width: 64px;
  height: 64px;
  border-radius: var(--r-sm);
  background-color: var(--acc-soft);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--acc);
  font-size: 24px;
  flex-shrink: 0;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 15px;
}

.artist {
  color: var(--text-2);
  font-size: 13px;
}

.meta {
  display: flex;
  gap: 10px;
  color: var(--text-3);
  font-size: 12px;
}

.remark {
  color: var(--acc);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.links {
  margin-top: 2px;
}

.card-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.hint {
  margin: 0 0 14px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.6;
}

.no-link {
  color: var(--text-3);
  font-size: 12px;
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

.cand-count {
  color: var(--text-2);
  font-size: 13px;
}

.cand-count b {
  color: var(--acc);
  font-size: 16px;
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

  .switch-row {
    padding: 12px 14px;
  }

  .remark-input {
    max-width: none;
  }

  .nav .el-button {
    flex: 1 1 40%;
  }

  .nav-spacer {
    display: none;
  }

  .cand-count {
    flex-basis: 100%;
  }
}
</style>
