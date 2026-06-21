<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h2 class="auth-title">注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input v-model="form.phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11" required />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="请输入密码（至少6位）" required />
        </div>
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="请再次输入密码" required />
        </div>
        <div class="form-group">
          <label class="form-label">昵称（选填）</label>
          <input v-model="form.nickname" type="text" class="form-input" placeholder="请输入昵称" maxlength="20" />
        </div>
        <div class="form-group">
          <label class="form-label">选择身份</label>
          <div class="role-select">
            <label :class="['role-option', { active: form.role === 'guest' }]">
              <input type="radio" v-model="form.role" value="guest" />
              <div class="role-content">
                <div class="role-icon">🏠</div>
                <div class="role-name">房客</div>
                <div class="role-desc">预订民宿入住</div>
              </div>
            </label>
            <label :class="['role-option', { active: form.role === 'host' }]">
              <input type="radio" v-model="form.role" value="host" />
              <div class="role-content">
                <div class="role-icon">🏢</div>
                <div class="role-name">房东</div>
                <div class="role-desc">发布房源出租</div>
              </div>
            </label>
          </div>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="auth-tip">
        已有账号？<router-link to="/login">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const form = reactive({ phone: '', password: '', confirmPassword: '', nickname: '', role: 'guest' })
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function handleRegister() {
  error.value = ''
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    error.value = '手机号格式不正确'
    return
  }
  if (form.password.length < 6) {
    error.value = '密码长度不能少于6位'
    return
  }
  if (form.password !== form.confirmPassword) {
    error.value = '两次密码输入不一致'
    return
  }
  loading.value = true
  try {
    await axios.post('/api/auth/register', {
      phone: form.phone,
      password: form.password,
      role: form.role,
      nickname: form.nickname || undefined
    })
    alert('注册成功，请登录')
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message || '注册失败'
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
  width: 450px;
  padding: 40px;
}
.auth-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 30px;
  color: #111827;
}
.role-select {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.role-option {
  cursor: pointer;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  transition: all 0.2s;
  display: block;
}
.role-option input {
  display: none;
}
.role-option.active {
  border-color: #667eea;
  background: #eef2ff;
}
.role-content {
  text-align: center;
}
.role-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.role-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: #111827;
}
.role-desc {
  font-size: 12px;
  color: #6b7280;
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
