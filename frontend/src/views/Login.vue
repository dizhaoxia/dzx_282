<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h2 class="auth-title">登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input v-model="form.phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="请输入密码" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="auth-tip">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../store/user'

const form = reactive({ phone: '', password: '' })
const error = ref('')
const loading = ref(false)
const router = useRouter()
const userStore = useUserStore()

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await axios.post('/api/auth/login', form)
    userStore.setAuth(res.data.token, res.data.user)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
}
.auth-card {
  width: 400px;
  padding: 40px;
}
.auth-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 30px;
  color: #111827;
}
.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
}
.auth-tip {
  text-align: center;
  margin-top: 20px;
  color: #6b7280;
  font-size: 14px;
}
.auth-tip a {
  color: #667eea;
  text-decoration: none;
}
</style>
