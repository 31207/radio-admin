import { createRouter, createWebHashHistory } from 'vue-router'

import { TOKEN_KEY } from '@/api/request'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '统计概览' } },
        { path: 'pool', component: () => import('@/views/Pool.vue'), meta: { title: '点歌池' } },
        { path: 'history', component: () => import('@/views/History.vue'), meta: { title: '播放历史' } },
        { path: 'users', component: () => import('@/views/Users.vue'), meta: { title: '用户管理' } },
        { path: 'permissions', component: () => import('@/views/Permissions.vue'), meta: { title: '权限白名单' } },
        { path: 'wizard', component: () => import('@/views/wizard/WizardCenter.vue'), meta: { title: '引导式操作' } },
        { path: 'wizard/screen', component: () => import('@/views/wizard/ScreenSongs.vue'), meta: { title: '筛选歌曲' } },
        { path: 'wizard/draw', component: () => import('@/views/wizard/DrawSongs.vue'), meta: { title: '每日选曲' } },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.path !== '/login' && !localStorage.getItem(TOKEN_KEY)) {
    return '/login'
  }
})

export default router
