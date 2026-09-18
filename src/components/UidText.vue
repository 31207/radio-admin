<template>
  <span class="uid">
    <span v-if="label" class="uid-platform">{{ label }}</span>
    <span class="uid-id">{{ id }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ uid?: string | null }>()

const PLATFORM_LABELS: Record<string, string> = {
  onebot: 'QQ',
  c2c: 'C2C',
  dms: '频道',
}

const parsed = computed(() => {
  const raw = props.uid ?? ''
  const idx = raw.indexOf(':')
  if (idx <= 0) return { label: '', id: raw }
  const prefix = raw.slice(0, idx)
  return { label: PLATFORM_LABELS[prefix] ?? prefix, id: raw.slice(idx + 1) }
})

const label = computed(() => parsed.value.label)
const id = computed(() => parsed.value.id)
</script>

<style scoped>
.uid {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}

.uid-platform {
  flex: none;
  padding: 0 5px;
  border-radius: 4px;
  background: #eef0f5;
  color: var(--text-2);
  font-size: 11px;
  line-height: 18px;
}

.uid-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
