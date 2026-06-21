<template>
  <div id="app">
    <nav class="navbar">
      <router-link to="/" class="logo">民宿短租</router-link>
      <div class="nav-links">
        <router-link to="/">首页</router-link>
        <template v-if="!userStore.isLoggedIn">
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
        <template v-else>
          <router-link v-if="userStore.user?.role === 'host'" to="/publish">发布房源</router-link>
          <router-link to="/orders">我的订单</router-link>
          <router-link to="/messages" class="msg-link">
            消息
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </router-link>
          <router-link to="/profile">{{ userStore.user?.nickname || userStore.user?.phone }}</router-link>
          <span class="balance">余额: ¥{{ userStore.user?.balance || 0 }}</span>
          <button class="logout-btn" @click="logout">退出</button>
        </template>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './store/user'
import axios from 'axios'

const userStore = useUserStore()
const router = useRouter()
const unreadCount = ref(0)

onMounted(() => {
  userStore.checkAuth()
  fetchUnreadCount()
})

watch(() => userStore.isLoggedIn, () => {
  fetchUnreadCount()
})

async function fetchUnreadCount() {
  if (!userStore.isLoggedIn) {
    unreadCount.value = 0
    return
  }
  try {
    const res = await axios.get('/api/messages/unread-count', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    unreadCount.value = res.data.unread_count || 0
  } catch (e) {}
}

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo {
  color: white;
  font-size: 22px;
  font-weight: bold;
  text-decoration: none;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 15px;
  opacity: 0.9;
  transition: opacity 0.2s;
}
.nav-links a:hover {
  opacity: 1;
}
.msg-link {
  position: relative;
}
.badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background: #ff4757;
  color: white;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
.balance {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
}
.logout-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.logout-btn:hover {
  background: rgba(255,255,255,0.3);
}
.main-content {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
  padding: 20px 0;
}
</style>
