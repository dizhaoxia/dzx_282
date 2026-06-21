<template>
  <div class="container">
    <h1 class="page-title">消息通知</h1>
    <div style="margin-bottom: 16px;">
      <button class="btn btn-default btn-sm" @click="markAllRead" :disabled="!hasUnread">全部标记已读</button>
    </div>
    <div v-if="messages.length === 0" class="empty-state">暂无消息</div>
    <div v-else class="msg-list card">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['msg-item', { unread: !msg.is_read }]"
        @click="readMsg(msg)"
      >
        <div class="msg-icon">
          <span class="dot" v-if="!msg.is_read"></span>
          <span class="icon-text">📧</span>
        </div>
        <div class="msg-content">
          <div class="msg-title-row">
            <h4>{{ msg.title }}</h4>
            <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <p class="msg-text">{{ msg.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const messages = ref([])

const hasUnread = computed(() => messages.value.some(m => !m.is_read))

function formatTime(t) {
  const d = new Date(t)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  return d.toLocaleDateString()
}

async function loadMessages() {
  try {
    const res = await axios.get('/api/messages', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    messages.value = res.data
  } catch (e) {}
}

async function readMsg(msg) {
  if (msg.is_read) return
  msg.is_read = 1
  try {
    await axios.put(`/api/messages/${msg.id}/read`, {}, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
  } catch (e) {}
}

async function markAllRead() {
  try {
    await axios.put('/api/messages/read-all', {}, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    messages.value.forEach(m => m.is_read = 1)
  } catch (e) {}
}

onMounted(loadMessages)
</script>

<style scoped>
.msg-list {
  overflow: hidden;
}
.msg-item {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}
.msg-item:last-child {
  border-bottom: none;
}
.msg-item:hover {
  background: #f9fafb;
}
.msg-item.unread {
  background: #eef2ff;
}
.msg-icon {
  position: relative;
  width: 40px;
  height: 40px;
  background: #eef2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.msg-icon .dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}
.msg-content {
  flex: 1;
}
.msg-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.msg-title-row h4 {
  font-size: 15px;
  margin: 0;
}
.msg-time {
  font-size: 12px;
  color: #9ca3af;
}
.msg-text {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}
</style>
