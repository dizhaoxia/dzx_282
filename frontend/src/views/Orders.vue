<template>
  <div class="container">
    <h1 class="page-title">我的订单</h1>
    <div v-if="userStore.isHost">
      <div class="tabs">
        <div :class="['tab', { active: activeTab === 'guest' }]" @click="activeTab = 'guest'">我是房客</div>
        <div :class="['tab', { active: activeTab === 'host' }]" @click="activeTab = 'host'">我是房东</div>
      </div>
    </div>

    <div v-if="activeTab === 'guest'">
      <div class="sub-tabs">
        <div v-for="t in guestTabs" :key="t.key" :class="['sub-tab', { active: guestStatus === t.key }]" @click="guestStatus = t.key">{{ t.label }}</div>
      </div>
      <div v-if="filteredGuestOrders.length === 0" class="empty-state">暂无订单</div>
      <div v-else class="order-list">
        <div v-for="order in filteredGuestOrders" :key="order.id" class="order-card card" @click="goDetail(order.id)">
          <div class="order-img">
            <img v-if="order.cover_image" :src="order.cover_image" />
            <div v-else class="no-img"></div>
          </div>
          <div class="order-info">
            <h3>{{ order.title }}</h3>
            <p>入住：{{ order.check_in }} 至 {{ order.check_out }}</p>
            <p>入住人：{{ order.guest_name }} · {{ order.guest_phone }}</p>
            <div class="order-bottom">
              <span :class="['status-tag', 'status-' + order.status]">{{ statusText[order.status] }}</span>
              <span class="order-price">¥{{ order.total_price }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'host'">
      <div v-if="hostOrders.length === 0" class="empty-state">暂无订单</div>
      <div v-else class="order-list">
        <div v-for="order in hostOrders" :key="order.id" class="order-card card" @click="goDetail(order.id)">
          <div class="order-img">
            <img v-if="order.cover_image" :src="order.cover_image" />
            <div v-else class="no-img"></div>
          </div>
          <div class="order-info">
            <h3>{{ order.title }}</h3>
            <p>入住：{{ order.check_in }} 至 {{ order.check_out }}</p>
            <p>房客：{{ order.guest_name }} · {{ order.guest_phone }}</p>
            <div class="order-bottom">
              <span :class="['status-tag', 'status-' + order.status]">{{ statusText[order.status] }}</span>
              <span class="order-price">¥{{ order.total_price }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const router = useRouter()

const activeTab = ref('guest')
const guestStatus = ref('all')
const guestOrders = ref([])
const hostOrders = ref([])

const guestTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'pending_checkin', label: '待入住' },
  { key: 'completed', label: '已完成' }
]

const statusText = {
  pending_payment: '待支付',
  pending_accept: '待接单',
  pending_checkin: '待入住',
  completed: '已完成',
  cancelled: '已取消'
}

const filteredGuestOrders = computed(() => {
  if (guestStatus.value === 'all') return guestOrders.value
  return guestOrders.value.filter(o => {
    if (guestStatus.value === 'pending_payment') return o.status === 'pending_payment'
    if (guestStatus.value === 'pending_checkin') return ['pending_accept', 'pending_checkin'].includes(o.status)
    return o.status === guestStatus.value
  })
})

function goDetail(id) {
  router.push(`/order/${id}`)
}

async function loadGuestOrders() {
  try {
    const res = await axios.get('/api/orders/guest', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    guestOrders.value = res.data
  } catch (e) {}
}

async function loadHostOrders() {
  try {
    const res = await axios.get('/api/orders/host', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    hostOrders.value = res.data
  } catch (e) {}
}

watch(activeTab, (v) => {
  if (v === 'guest') loadGuestOrders()
  else loadHostOrders()
})

onMounted(() => {
  loadGuestOrders()
  if (userStore.isHost) loadHostOrders()
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.tab {
  flex: 1;
  padding: 12px 24px;
  text-align: center;
  cursor: pointer;
  font-size: 15px;
  color: #6b7280;
}
.tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.sub-tab {
  padding: 6px 16px;
  border-radius: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
}
.sub-tab.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.order-card {
  display: flex;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.order-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.order-img {
  width: 160px;
  height: 120px;
  flex-shrink: 0;
}
.order-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-img {
  width: 100%;
  height: 100%;
  background: #e5e7eb;
}
.order-info {
  flex: 1;
  padding: 16px;
}
.order-info h3 {
  margin-bottom: 8px;
  font-size: 16px;
}
.order-info p {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 6px;
}
.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.order-price {
  font-size: 20px;
  font-weight: bold;
  color: #ef4444;
}
</style>
