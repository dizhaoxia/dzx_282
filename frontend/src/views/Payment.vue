<template>
  <div class="container">
    <div class="pay-card card">
      <h1 class="pay-title">订单支付</h1>
      <div v-if="order" class="pay-content">
        <div class="order-info card">
          <h3>{{ order.title }}</h3>
          <p>入住：{{ order.check_in }} 至 {{ order.check_out }}</p>
          <p>入住人：{{ order.guest_name }} · {{ order.guest_phone }}</p>
          <div class="pay-amount">
            <span>支付金额</span>
            <span class="amount">¥{{ order.total_price }}</span>
          </div>
        </div>
        <div class="pay-method">
          <h3>支付方式</h3>
          <div class="method-item active">
            <div class="method-icon">💰</div>
            <div class="method-info">
              <div class="method-name">余额支付</div>
              <div class="method-desc">当前余额：¥{{ userStore.user?.balance || 0 }}</div>
            </div>
            <div class="check">✓</div>
          </div>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button 
          class="btn btn-primary btn-lg" 
          style="width: 100%;" 
          @click="handlePay" 
          :disabled="paying || !order || balanceNotEnough"
        >
          {{ paying ? '支付中...' : (balanceNotEnough ? '余额不足' : '确认支付 ¥' + order.total_price) }}
        </button>
        <div v-if="paySuccess" class="success-msg">
          ✓ 支付成功！订单已生成，请等待房东确认
        </div>
        <router-link v-if="paySuccess" to="/orders" class="btn btn-default" style="margin-top:16px;display:block;text-align:center;">查看订单</router-link>
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
const userStore = useUserStore()
const order = ref(null)
const paying = ref(false)
const paySuccess = ref(false)
const error = ref('')

const balanceNotEnough = computed(() => {
  return Number(userStore.user?.balance || 0) < Number(order.value?.total_price || 0)
})

async function loadOrder() {
  try {
    const list = await axios.get('/api/orders/guest', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    order.value = list.data.find(o => o.order_no === route.params.orderNo)
    if (!order.value) {
      alert('订单不存在')
    }
  } catch (e) {
    console.error(e)
  }
}

async function handlePay() {
  if (!order.value) return
  error.value = ''
  paying.value = true
  try {
    await axios.post(`/api/orders/${order.value.id}/pay`, {}, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    paySuccess.value = true
    const profile = await axios.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    userStore.updateUser({ balance: profile.data.balance })
  } catch (e) {
    error.value = e.response?.data?.message || '支付失败'
  } finally {
    paying.value = false
  }
}

onMounted(loadOrder)
</script>

<style scoped>
.pay-card {
  max-width: 600px;
  margin: 40px auto;
  padding: 40px;
}
.pay-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 30px;
}
.order-info {
  padding: 20px;
  margin-bottom: 24px;
  background: #f9fafb;
}
.order-info h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
.order-info p {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 6px;
}
.pay-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.amount {
  font-size: 28px;
  font-weight: bold;
  color: #ef4444;
}
.pay-method {
  margin-bottom: 24px;
}
.pay-method h3 {
  font-size: 16px;
  margin-bottom: 12px;
}
.method-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  position: relative;
}
.method-item.active {
  border-color: #667eea;
  background: #eef2ff;
}
.method-icon {
  font-size: 32px;
}
.method-info {
  flex: 1;
}
.method-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.method-desc {
  color: #6b7280;
  font-size: 13px;
}
.check {
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.error-msg {
  color: #ef4444;
  margin-bottom: 16px;
  font-size: 14px;
}
.success-msg {
  text-align: center;
  color: #10b981;
  font-size: 16px;
  padding: 16px;
  margin-top: 20px;
  background: #d1fae5;
  border-radius: 8px;
}
</style>
