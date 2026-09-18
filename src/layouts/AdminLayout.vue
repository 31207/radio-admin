<template>
  <el-container class="layout">
    <el-aside width="232px" class="aside">
      <div class="brand">
        <span class="brand-mark"><AppIcon name="radio" :size="18" /></span>
        <span class="brand-text">校园广播站</span>
      </div>
      <el-menu router :default-active="$route.path" class="menu" @select="drawerOpen = false">
        <el-menu-item v-for="item in MENU" :key="item.path" :index="item.path">
          <AppIcon :name="item.icon" :size="17" />
          <span class="menu-label">{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
      <div class="aside-foot">点歌管理台</div>
    </el-aside>

    <el-container class="body">
      <el-header class="header">
        <button class="icon-btn" type="button" aria-label="打开菜单" @click="drawerOpen = true">
          <AppIcon name="menu" :size="20" />
        </button>
        <span class="header-title">{{ $route.meta.title || '' }}</span>
        <span class="header-spacer" />
        <span v-if="auth.username" class="who">
          <span class="avatar">{{ auth.username.slice(0, 1).toUpperCase() }}</span>
          <span class="who-name">你好，{{ auth.username }}</span>
        </span>
        <el-button text bg class="logout" @click="onLogout">
          <AppIcon name="logout" :size="15" />
          <span class="logout-text">退出登录</span>
        </el-button>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <el-drawer v-model="drawerOpen" direction="ltr" size="248px" :with-header="false" class="nav-drawer">
    <div class="brand">
      <span class="brand-mark"><AppIcon name="radio" :size="18" /></span>
      <span class="brand-text">校园广播站</span>
    </div>
    <el-menu router :default-active="$route.path" class="menu" @select="drawerOpen = false">
      <el-menu-item v-for="item in MENU" :key="item.path" :index="item.path">
        <AppIcon :name="item.icon" :size="17" />
        <span class="menu-label">{{ item.label }}</span>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppIcon, { type IconName } from '@/components/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'

const MENU: { path: string; label: string; icon: IconName }[] = [
  { path: '/dashboard', label: '统计概览', icon: 'dashboard' },
  { path: '/pool', label: '点歌池', icon: 'pool' },
  { path: '/history', label: '播放历史', icon: 'history' },
  { path: '/users', label: '用户管理', icon: 'users' },
  { path: '/permissions', label: '权限白名单', icon: 'shield' },
  { path: '/wizard', label: '引导式操作', icon: 'sparkles' },
]

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const drawerOpen = ref(false)

watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  },
)

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
  height: 100dvh;
}

.aside {
  background: #1c1a3a;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 16px;
  color: #fff;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--acc);
  color: #fff;
  box-shadow: 0 4px 12px rgb(79 70 229 / 0.45);
}

.brand-text {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.01em;
}

.menu {
  border-right: none;
  background: transparent;
  padding: 4px 10px;
  flex: 1;
  --el-menu-text-color: #b6b9d6;
  --el-menu-hover-text-color: #fff;
  --el-menu-hover-bg-color: rgb(255 255 255 / 0.07);
  --el-menu-active-color: #fff;
  --el-menu-item-height: 42px;
}

.menu :deep(.el-menu-item) {
  border-radius: var(--r-sm);
  margin-bottom: 3px;
  gap: 10px;
}

.menu :deep(.el-menu-item.is-active) {
  background: var(--acc);
  box-shadow: 0 6px 16px rgb(79 70 229 / 0.35);
}

.aside-foot {
  padding: 14px 20px 18px;
  color: rgb(182 185 214 / 0.55);
  font-size: 12px;
}

.header {
  height: var(--header-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  position: relative;
  z-index: 5;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-spacer {
  flex: 1;
}

.icon-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: var(--acc-soft);
  color: var(--acc);
}

.who {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  font-size: 13px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--acc-soft);
  color: var(--acc-strong);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logout {
  gap: 6px;
}

.main {
  padding: 0;
  overflow-y: auto;
}

@media (max-width: 991px) {
  .aside {
    display: none;
  }

  .icon-btn {
    display: inline-flex;
  }
}

@media (max-width: 560px) {
  .who-name {
    display: none;
  }

  .header {
    padding: 0 12px;
    gap: 10px;
  }
}
</style>

<style>
.nav-drawer .el-drawer__body {
  padding: 0;
  display: flex;
  flex-direction: column;
  background: #1c1a3a;
}
</style>
