<template>
  <div class="page">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="lbl">累计点歌</div>
        <div class="num">{{ stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="lbl">被点歌曲数</div>
        <div class="num">{{ stats.requests }}</div>
      </div>
      <div class="stat-card is-warn">
        <div class="lbl">待选用</div>
        <div class="num">{{ stats.pending }}</div>
      </div>
      <div class="stat-card is-ok">
        <div class="lbl">已选用</div>
        <div class="num">{{ stats.selected }}</div>
      </div>
      <div class="stat-card is-bad">
        <div class="lbl">已禁播</div>
        <div class="num">{{ stats.banned }}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="page-card">
        <h3 class="page-title">热门歌曲 Top10</h3>
        <el-table :data="stats.hot" size="small">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="name" label="歌名" min-width="140" show-overflow-tooltip />
          <el-table-column prop="artist" label="歌手" width="150" show-overflow-tooltip />
          <el-table-column prop="cnt" label="点歌次数" width="90" />
        </el-table>
      </div>

      <div class="page-card">
        <h3 class="page-title">点歌趋势（按日）</h3>
        <div v-if="stats.trend.length" class="trend-scroll">
          <div class="trend">
            <div v-for="p in stats.trend" :key="p.day" class="trend-col">
              <div class="bar-wrap">
                <div class="bar" :style="{ height: barHeight(p.cnt) }" :title="`${p.day}: ${p.cnt}`" />
              </div>
              <div class="cnt">{{ p.cnt }}</div>
              <div class="day">{{ p.day.slice(5) }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api } from '@/api'
import type { StatsData } from '@/types'

const stats = ref<StatsData>({
  total: 0,
  requests: 0,
  pending: 0,
  selected: 0,
  banned: 0,
  hot: [],
  trend: [],
})

function barHeight(cnt: number) {
  const max = Math.max(...stats.value.trend.map((p) => p.cnt), 1)
  return `${Math.max((cnt / max) * 100, 4)}%`
}

onMounted(async () => {
  stats.value = await api.stats()
})
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-md);
  padding: 15px 16px 15px 20px;
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--acc);
}

.stat-card.is-warn::before {
  background: var(--warn);
}

.stat-card.is-ok::before {
  background: var(--ok);
}

.stat-card.is-bad::before {
  background: var(--bad);
}

.num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.lbl {
  color: var(--text-3);
  font-size: 12.5px;
  margin-bottom: 2px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 16px;
}

.trend-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.trend {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 220px;
  min-width: 100%;
}

.trend-col {
  flex: 1;
  min-width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 4px;
}

.bar-wrap {
  height: 150px;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

.bar {
  width: 60%;
  max-width: 26px;
  background: linear-gradient(180deg, #7f79ec, #4f46e5);
  border-radius: 5px 5px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.cnt {
  font-size: 12px;
  color: var(--acc);
  font-variant-numeric: tabular-nums;
}

.day {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
}
</style>
