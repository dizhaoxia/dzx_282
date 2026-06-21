<template>
  <div class="container" v-if="property">
    <div class="detail-card card">
      <div class="cover-area">
        <img v-if="property.cover_image" :src="property.cover_image" :alt="property.title" />
        <div v-else class="no-img">暂无封面</div>
        <div v-if="isOwner" class="owner-actions">
          <router-link :to="`/property/${property.id}/calendar`" class="btn btn-primary">
            管理房态
          </router-link>
        </div>
      </div>
      <div class="content">
        <div class="main-info">
          <h1>{{ property.title }}</h1>
          <p class="address">📍 {{ property.address }}</p>
          <div class="meta">
            <span class="tag">{{ property.room_type }}</span>
            <span class="tag">可住 {{ property.max_guests }} 人</span>
            <span v-for="f in (property.facilities || [])" :key="f" class="tag">{{ f }}</span>
          </div>
          <div v-if="property.description" class="description">
            <h3>房源介绍</h3>
            <p>{{ property.description }}</p>
          </div>
          <div class="host-info">
            <h3>房东信息</h3>
            <p>房东：{{ property.host_nickname || property.host_phone }}</p>
            <p>联系电话：{{ property.host_phone }}</p>
          </div>
        </div>
        <div class="booking-sidebar">
          <div class="price-box card">
            <div class="price-row">
              <span class="label">平日</span>
              <span class="price">¥{{ property.weekday_price }}<small>/晚</small></span>
            </div>
            <div class="price-row">
              <span class="label">周末</span>
              <span class="price">¥{{ property.weekend_price }}<small>/晚</small></span>
            </div>
            <div v-if="!isOwner && userStore.isGuest" style="margin-top: 20px;">
              <div class="form-group">
                <label class="form-label">入住日期</label>
                <input v-model="bookingForm.check_in" type="date" class="form-input" :min="today" />
              </div>
              <div class="form-group">
                <label class="form-label">退房日期</label>
                <input v-model="bookingForm.check_out" type="date" class="form-input" :min="bookingForm.check_in || today" />
              </div>
              <div class="form-group">
                <label class="form-label">入住人姓名</label>
                <input v-model="bookingForm.guest_name" type="text" class="form-input" placeholder="请输入入住人姓名" />
              </div>
              <div class="form-group">
                <label class="form-label">联系电话</label>
                <input v-model="bookingForm.guest_phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11" />
              </div>
              <div v-if="totalPrice > 0" class="total-row">
                <span>共 {{ nights }} 晚，合计</span>
                <span class="total-price">¥{{ totalPrice }}</span>
              </div>
              <button class="btn btn-primary btn-lg" style="width: 100%; margin-top: 10px;" @click="handleBooking" :disabled="booking">
                {{ booking ? '预订中...' : '立即预订' }}
              </button>
              <p v-if="error" class="error-msg">{{ error }}</p>
            </div>
            <div v-else-if="!userStore.isLoggedIn" style="margin-top: 20px; text-align: center; color: #6b7280;">
              请先<router-link to="/login" style="color: #667eea;">登录</router-link>后预订
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-section card" style="margin-top: 24px; padding: 24px;">
      <h2 style="margin-bottom: 20px;">可订日历</h2>
      <div class="calendar-header">
        <button @click="changeMonth(-1)" class="btn btn-default btn-sm">‹ 上月</button>
        <span class="month-title">{{ currentYear }}年{{ currentMonth }}月</span>
        <button @click="changeMonth(1)" class="btn btn-default btn-sm">下月 ›</button>
      </div>
      <div class="calendar-legend">
        <span><i class="dot available"></i>可订</span>
        <span><i class="dot booked"></i>满房</span>
        <span><i class="dot maintenance"></i>维护</span>
      </div>
      <div class="calendar-grid">
        <div v-for="w in weekDays" :key="w" class="cal-weekday">{{ w }}</div>
        <div v-for="(cell, idx) in calendarCells" :key="idx" :class="['cal-cell', cell.status, { disabled: !cell.date }]">
          <span v-if="cell.date" class="day">{{ cell.day }}</span>
          <span v-if="cell.date && cell.price" class="cal-price">¥{{ cell.price }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const property = ref(null)
const calendarData = ref([])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const error = ref('')
const booking = ref(false)

const today = new Date().toISOString().split('T')[0]

const bookingForm = reactive({
  check_in: '',
  check_out: '',
  guest_name: '',
  guest_phone: ''
})

const isOwner = computed(() => {
  return userStore.isLoggedIn && userStore.user?.id === property.value?.host_id
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const nights = computed(() => {
  if (!bookingForm.check_in || !bookingForm.check_out) return 0
  const s = new Date(bookingForm.check_in)
  const e = new Date(bookingForm.check_out)
  return Math.max(0, Math.floor((e - s) / (1000 * 60 * 60 * 24)))
})

const totalPrice = computed(() => {
  if (!property.value || nights.value === 0) return 0
  const s = new Date(bookingForm.check_in)
  const e = new Date(bookingForm.check_out)
  let total = 0
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day === 0 || day === 6) {
      total += Number(property.value.weekend_price)
    } else {
      total += Number(property.value.weekday_price)
    }
  }
  return total
})

const calendarCells = computed(() => {
  if (!calendarData.value || calendarData.value.length === 0) return []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({})
  calendarData.value.forEach(item => {
    const date = new Date(item.date)
    cells.push({
      date: item.date,
      day: date.getDate(),
      status: item.status || 'available',
      price: item.price
    })
  })
  while (cells.length % 7 !== 0) cells.push({})
  return cells
})

async function loadCalendar() {
  try {
    const res = await axios.get(`/api/calendar/${route.params.id}`, {
      params: { year: currentYear.value, month: currentMonth.value }
    })
    calendarData.value = res.data
  } catch (e) {}
}

function changeMonth(delta) {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  currentMonth.value = m
  currentYear.value = y
  loadCalendar()
}

async function handleBooking() {
  error.value = ''
  if (!bookingForm.check_in || !bookingForm.check_out) {
    error.value = '请选择入住和退房日期'
    return
  }
  if (!bookingForm.guest_name) {
    error.value = '请输入入住人姓名'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(bookingForm.guest_phone)) {
    error.value = '请输入正确的手机号'
    return
  }
  booking.value = true
  try {
    const res = await axios.post('/api/orders', {
      property_id: property.value.id,
      check_in: bookingForm.check_in,
      check_out: bookingForm.check_out,
      total_price: totalPrice.value,
      guest_name: bookingForm.guest_name,
      guest_phone: bookingForm.guest_phone
    }, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    router.push(`/payment/${res.data.order_no}`)
  } catch (e) {
    error.value = e.response?.data?.message || '预订失败'
  } finally {
    booking.value = false
  }
}

onMounted(async () => {
  try {
    const res = await axios.get(`/api/properties/${route.params.id}`)
    property.value = res.data
  } catch (e) {
    alert('房源不存在')
    router.push('/')
  }
  loadCalendar()
})
</script>

<style scoped>
.detail-card {
  overflow: hidden;
}
.cover-area {
  width: 100%;
  height: 360px;
  background: #e5e7eb;
  position: relative;
}
.cover-area img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 18px;
}
.owner-actions {
  position: absolute;
  top: 20px;
  right: 20px;
}
.content {
  padding: 30px;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 30px;
}
.main-info h1 {
  font-size: 26px;
  margin-bottom: 12px;
}
.address {
  color: #6b7280;
  margin-bottom: 16px;
}
.meta {
  margin-bottom: 24px;
}
.description, .host-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}
.description h3, .host-info h3 {
  margin-bottom: 12px;
  font-size: 16px;
}
.description p, .host-info p {
  color: #4b5563;
  line-height: 1.8;
}
.booking-sidebar {
  position: sticky;
  top: 80px;
  align-self: flex-start;
}
.price-box {
  padding: 20px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.label {
  color: #6b7280;
  font-size: 14px;
}
.price {
  font-size: 20px;
  font-weight: bold;
  color: #ef4444;
}
.price small {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
}
.total-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
}
.total-price {
  font-size: 22px;
  font-weight: bold;
  color: #ef4444;
}
.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-top: 10px;
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.month-title {
  font-size: 18px;
  font-weight: 600;
  min-width: 140px;
  text-align: center;
}
.calendar-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  justify-content: center;
  font-size: 13px;
  color: #6b7280;
}
.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.dot.available { background: #10b981; }
.dot.booked { background: #ef4444; }
.dot.maintenance { background: #9ca3af; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.cal-weekday {
  text-align: center;
  padding: 10px;
  font-weight: 600;
  color: #6b7280;
  font-size: 13px;
}
.cal-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cal-cell.disabled {
  background: transparent;
}
.cal-cell.available {
  background: #d1fae5;
  color: #065f46;
}
.cal-cell.booked {
  background: #fee2e2;
  color: #991b1b;
}
.cal-cell.maintenance {
  background: #f3f4f6;
  color: #6b7280;
}
.day {
  font-size: 15px;
  font-weight: 600;
}
.cal-price {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.85;
}
</style>
