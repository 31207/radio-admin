<template>
  <div class="page">
    <h3 class="page-title">引导式操作</h3>
    <p class="intro">管理员日常就两件事：筛选歌曲、确定今天广播放什么。点卡片开始，一路跟着问题走就行。</p>

    <div class="cards">
      <div class="card" @click="go('/wizard/screen')">
        <div class="icon icon-search"><AppIcon name="search" :size="22" /></div>
        <h4>筛选歌曲</h4>
        <p>由智能 agent 逐首判断歌曲是否属于禁播类（纯音乐、重金属等），你确认后一键标记禁播。</p>
        <el-button type="primary">开始筛选</el-button>
      </div>

      <div class="card" @click="go('/wizard/draw')">
        <div class="icon icon-radio"><AppIcon name="radio" :size="22" /></div>
        <h4>每日广播选曲</h4>
        <p>一步步收窄点歌池，最后抽取指定数量（默认 5 首）作为今天的广播歌单，确认后一键选用。</p>
        <el-button type="primary">开始选曲</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()

function go(path: string) {
  router.push(path)
}
</script>

<style scoped>
.intro {
  color: var(--text-2);
  font-size: 14px;
  margin-top: 0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 16px;
  margin-top: 12px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-lg);
  padding: 24px;
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.card:hover {
  border-color: #d9d7f7;
  box-shadow: var(--shadow-md);
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-2px);
  }
}

.icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-search {
  background: var(--acc-soft);
  color: var(--acc);
}

.icon-radio {
  background: var(--ok-soft);
  color: var(--ok);
}

h4 {
  margin: 14px 0 6px;
  font-size: 17px;
  font-weight: 600;
}

p {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.7;
  min-height: 44px;
  margin: 0 0 16px;
}
</style>
