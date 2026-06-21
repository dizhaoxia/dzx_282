import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  { path: '/', component: () => import('../views/Home.vue') },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/property/:id', component: () => import('../views/PropertyDetail.vue') },
  { path: '/publish', component: () => import('../views/PublishProperty.vue'), meta: { requiresAuth: true, requiresHost: true } },
  { path: '/property/:id/calendar', component: () => import('../views/CalendarManage.vue'), meta: { requiresAuth: true, requiresHost: true } },
  { path: '/orders', component: () => import('../views/Orders.vue'), meta: { requiresAuth: true } },
  { path: '/order/:id', component: () => import('../views/OrderDetail.vue'), meta: { requiresAuth: true } },
  { path: '/messages', component: () => import('../views/Messages.vue'), meta: { requiresAuth: true } },
  { path: '/payment/:orderNo', component: () => import('../views/Payment.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.checkAuth()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresHost && userStore.user?.role !== 'host') {
    next('/')
  } else {
    next()
  }
})

export default router
