<template>
  <div class="container" v-if="order">
    <h1 class="page-title">订单详情</h1>
    <div class="card" style="padding: 30px;">
      <div class="order-header">
        <div>
          <h2>订单号：{{ order.order_no }}</h2>
          <span :class="['status-tag', 'large', 'status-' + order.status]">{{ statusText[order.status] }}</span>
        </div>
      </div>

      <div class="section">
        <h3>房源信息</h3>
        <div class="property-row">
          <div class="p-img">
            <img v-if="order.cover_image" :src="order.cover_image" />
          </div>
          <div class="p-info">
            <h4>{{ order.title }}</h4>
            <p>📍 {{ order.address }}</p>
            <p>房东：{{ order.host_nickname }} · {{ order.host_phone }}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">入住日期</span>
            <span class="value">{{ order.check_in }}</span>
          </div>
          <div class="info-item">
            <span class="label">退房日期</span>
            <span class="value">{{ order.check_out }}</span>
          </div>
          <div class="info-item">
            <span class="label">入住人</span>
            <span class="value">{{ order.guest_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{{ order.guest_phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单总额</span>
            <span class="value price">¥{{ order.total_price }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间</span>
            <span class="value">{{ new Date(order.created_at).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button v-if="isGuest && order.status === 'pending_payment'" class="btn btn-primary btn-lg" @click="goPay">
          去支付
        </button>
        <button v-if="isHost && order.status === 'pending_accept'" class="btn btn-success btn-lg" @click="handleAccept">
          确认接单
        </button>
        <button v-if="isHost && order.status === 'pending_accept'" class="btn btn-danger btn-lg" @click="handleReject">
          拒绝订单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const order = ref(null)

const statusText = {
  pending_payment: '待支付',
  pending_accept: '待接单',
  pending_checkin: '待入住',
  completed: '已完成',
  cancelled: '已取消'
}

const isGuest = computed(() => userStore.user?.id === order.value?.guest_id)
const isHost = computed(() => userStore.isHost)

function goPay() {
  router.push(`/payment/${order.value.order_no}`)
}

async function handleAccept() {
  if (!confirm('确认接此订单？')) return
  try {
    await axios.post(`/api/orders/${route.params.id}/accept`, {}, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    alert('接单成功')
    loadOrder()
  } catch (e) {
    alert(e.response?.data?.message || '操作失败')
  }
}

async function handleReject() {
  if (!confirm('确认拒绝此订单？款项将退回房客余额')) return
  try {
    await axios.post(`/api/orders/${route.params.id}/reject`, {}, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    alert('拒单成功')
    loadOrder()
  } catch (e) {
    alert(e.response?.data?.message || '操作失败')
  }
}

async function loadOrder() {
  try {
    const res = await axios.get(`/api/orders/${route.params.id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    order.value = res.data
  } catch (e) {
    alert('订单不存在')
    router.push('/orders')
  }
}

onMounted(loadOrder)
</script>

<style scoped>
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}
.order-header h2 {
  font-size: 20px;
  margin-bottom: 8px;
}
.status-tag.large {
  font-size: 16px;
  padding: 6px 16px;
}
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
}
.status-pending_payment { background: #fef3c7; color: #d97706; }
.status-pending_accept { background: #dbeafe; color: #2563eb; }
.status-pending_checkin { background: #d1fae5; color: #059669; }
.status-completed { background: #e5e7eb; color: #6b7280; }
.status-cancelled { background: #fee2e2; color: #dc2626; }
.section {
  padding: 20px 0;
  border-bottom: 1px solid #f3f4f6;
}
.section h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #111827;
}
.property-row {
  display: flex;
  gap: 16px;
  align-items: center;
}
.p-img {
  width: 140px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #e5e7eb;
  flex-shrink: 0;
}
.p-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.p-info h4 {
  font-size: 16px;
  margin-bottom: 8px;
}
.p-info p {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 4px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-item .label {
  font-size: 13px;
  color: #6b7280;
}
.info-item .value {
  font-size: 15px;
  font-weight: 500;
}
.info-item .value.price {
  color: #ef4444;
  font-size: 20px;
  font-weight: bold;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}
</style>
