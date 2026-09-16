<template>
  <div class="login-wrap">
    <div class="card">
      <div class="brand-mark"><AppIcon name="radio" :size="24" /></div>
      <h1>校园广播站 · 点歌管理台</h1>
      <p class="sub">请登录后继续</p>
      <el-form class="login-form" @submit.prevent="onSubmit">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" size="large" autocomplete="username" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" native-type="submit">
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const username = ref('admin')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push('/dashboard')
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background:
    radial-gradient(720px 420px at 12% -10%, #e4e1fb 0%, transparent 60%),
    radial-gradient(640px 380px at 100% 100%, #e0ecfb 0%, transparent 55%),
    var(--bg);
}

.card {
  width: 100%;
  max-width: 384px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 20px;
  padding: 32px 28px;
  box-shadow: var(--shadow-lg);
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #6366f1, #4f46e5);
  color: #fff;
  box-shadow: 0 10px 24px rgb(79 70 229 / 0.35);
  margin-bottom: 18px;
}

h1 {
  font-size: 19px;
  margin: 0 0 6px;
  color: var(--text-1);
}

.sub {
  color: var(--text-3);
  font-size: 13px;
  margin: 0 0 22px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.submit {
  width: 100%;
  margin-top: 4px;
}
</style>
