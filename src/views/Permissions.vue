<template>
  <div class="page">
    <div class="page-card card-narrow">
      <h3 class="page-title">权限白名单</h3>
      <p class="tip">权限只读自 <code>data/permissions.json</code>（bot 端按文件修改时间自动热加载，无需重启）。</p>

      <div class="section">
        <h4>管理员（admins）</h4>
        <p class="desc">可重置点歌次数、禁播/解禁歌曲、查看/发送选中通知</p>
        <el-select
          v-model="admins"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入 QQ 号后回车添加"
          class="full"
        />
      </div>

      <div class="section">
        <h4>超级管理员（super_admins）</h4>
        <p class="desc">管理员全部权限 + 封禁/解封用户</p>
        <el-select
          v-model="superAdmins"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入 QQ 号后回车添加"
          class="full"
        />
      </div>

      <el-button type="primary" class="save" :loading="saving" @click="save">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

import { api } from '@/api'

const admins = ref<string[]>([])
const superAdmins = ref<string[]>([])
const saving = ref(false)

async function load() {
  const data = await api.permissions()
  admins.value = data.admins
  superAdmins.value = data.super_admins
}

async function save() {
  saving.value = true
  try {
    await api.savePermissions({ admins: admins.value, super_admins: superAdmins.value })
    ElMessage.success('已保存，bot 端会自动热加载')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.tip {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.7;
}

.tip code {
  background: var(--acc-soft);
  color: var(--acc-strong);
  border-radius: var(--r-xs);
  padding: 1px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.section {
  margin: 18px 0;
}

h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.desc {
  margin: 0 0 8px;
  color: var(--text-3);
  font-size: 12.5px;
}

.full {
  width: 100%;
}

.save {
  width: 100%;
}

@media (min-width: 768px) {
  .save {
    width: auto;
    min-width: 96px;
  }
}
</style>
