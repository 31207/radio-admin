<template>
  <span class="pill" :class="cls">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Verdict } from '@/types'

const props = defineProps<{ verdict: Verdict }>()

const MAP: Record<Verdict, { text: string; cls: string }> = {
  safe: { text: '安全', cls: 'pill-selected' },
  suspicious: { text: '可疑', cls: 'pill-suspicious' },
  banned: { text: '禁播', cls: 'pill-banned' },
  unknown: { text: '未知', cls: 'pill-unknown' },
}

const text = computed(() => MAP[props.verdict].text)
const cls = computed(() => MAP[props.verdict].cls)
</script>
