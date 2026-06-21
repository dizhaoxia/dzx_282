<template>
  <div class="container">
    <h1 class="page-title">个人中心</h1>
    <div class="profile-card card">
      <div class="avatar-section">
        <div class="avatar">
          {{ (user?.nickname || user?.phone || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <h3>{{ user?.nickname || '未设置昵称' }}</h3>
          <p>手机号：{{ user?.phone }}</p>
          <p>身份：<span class="role-tag">{{ user?.role === 'host' ? '房东' : '房客' }}</span></p>
          <p>账户余额：<span class="balance">¥{{ user?.balance || 0 }}</span></p>
        </div>
      </div>
      <div class="form-section">
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input v-model="form.nickname" type="text" class="form-input" placeholder="请输入昵称" maxlength="20" />
        </div>
        <button class="btn btn-primary" @click="handleSave" :disabled="loading">
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>

    <div v-if="user?.role === 'host'" style="margin-top: 30px;">
      <div class="card" style="padding: 24px;">
        <h2 style="margin-bottom: 20px; font-size: 18px;">我的房源</h2>
        <div v-if="myProperties.length === 0" class="empty-state">
          还没有发布房源，<router-link to="/publish" style="color: #667eea;">立即发布</router-link>
        </div>
        <div v-else class="property-list">
          <div v-for="p in myProperties" :key="p.id" class="property-item">
            <div class="item-img">
              <img v-if="p.cover_image" :src="p.cover_image" />
            </div>
            <div class="item-info">
              <h4>{{ p.title }}</h4>
              <p>{{ p.address }}</p>
              <div>
                <span class="tag">{{ p.room_type }}</span>
                <span class="tag">¥{{ p.weekday_price }}/晚</span>
              </div>
            </div>
            <div class="item-actions">
              <router-link :to="`/property/${p.id}`" class="btn btn-default btn-sm">查看</router-link>
              <router-link :to="`/property/${p.id}/calendar`" class="btn btn-primary btn-sm">房态管理</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const user = ref(userStore.user)
const form = reactive({ nickname: userStore.user?.nickname || '' })
const loading = ref(false)
const myProperties = ref([])

watch(() => userStore.user, (u) => {
  user.value = u
  form.nickname = u?.nickname || ''
})

onMounted(async () => {
  if (userStore.user?.role === 'host') {
    try {
      const res = await axios.get('/api/properties/mine', {
        headers: { Authorization: `Bearer ${userStore.token}` }
      })
      myProperties.value = res.data
    } catch (e) {}
  }
})

async function handleSave() {
  loading.value = true
  try {
    await axios.put('/api/user/profile', { nickname: form.nickname || null }, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    userStore.updateUser({ nickname: form.nickname || null })
    alert('保存成功')
  } catch (e) {
    alert(e.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-card {
  padding: 30px;
}
.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
}
.user-info h3 {
  font-size: 20px;
  margin-bottom: 8px;
}
.user-info p {
  color: #6b7280;
  margin-bottom: 4px;
  font-size: 14px;
}
.role-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #eef2ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 12px;
}
.balance {
  color: #f59e0b;
  font-weight: bold;
}
.property-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.property-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.item-img {
  width: 100px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #e5e7eb;
  flex-shrink: 0;
}
.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-info {
  flex: 1;
}
.item-info h4 {
  margin-bottom: 6px;
}
.item-info p {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
}
.item-actions {
  display: flex;
  gap: 8px;
}
</style>
