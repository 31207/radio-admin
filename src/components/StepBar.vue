<template>
  <div ref="barRef" class="step-bar">
    <template v-for="(step, i) in steps" :key="step.key">
      <div
        class="step"
        :class="{ active: i === current, done: i < current, clickable: allowJump && i < current }"
        @click="allowJump && i < current && emit('jump', i)"
      >
        <span class="dot">{{ i < current ? '✓' : i + 1 }}</span>
        <span class="label">{{ step.title }}</span>
      </div>
      <div v-if="i < steps.length - 1" class="line" :class="{ done: i < current }" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

export interface WizardStep {
  key: string
  title: string
}

const props = defineProps<{
  steps: WizardStep[]
  current: number
  allowJump?: boolean
}>()

const emit = defineEmits<{ jump: [index: number] }>()

const barRef = ref<HTMLElement | null>(null)

watch(
  () => props.current,
  async (i) => {
    await nextTick()
    barRef.value
      ?.querySelectorAll<HTMLElement>('.step')
      [i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  },
)
</script>

<style scoped>
.step-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 16px 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.step-bar::-webkit-scrollbar {
  display: none;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-3);
  font-size: 13px;
  flex-shrink: 0;
  white-space: nowrap;
}

.step.active {
  color: var(--acc);
  font-weight: 600;
}

.step.done {
  color: var(--ok);
}

.step.clickable {
  cursor: pointer;
}

.step.clickable:hover {
  color: var(--acc);
}

.dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef0f5;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}

.active .dot {
  background: var(--acc);
  color: #fff;
  box-shadow: 0 4px 12px rgb(79 70 229 / 0.32);
}

.done .dot {
  background: var(--ok-soft);
  color: var(--ok);
}

.line {
  width: 40px;
  height: 2px;
  border-radius: 2px;
  background: var(--border);
  margin: 0 10px;
  flex-shrink: 0;
}

.line.done {
  background: #a7dcb9;
}

@media (max-width: 767px) {
  .step-bar {
    justify-content: flex-start;
    padding: 12px 0;
  }

  .line {
    width: 20px;
    margin: 0 6px;
  }
}
</style>
