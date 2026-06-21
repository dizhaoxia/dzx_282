<template>
  <div class="container">
    <h1 class="page-title">房态管理 - {{ property?.title || '' }}</h1>
    <div class="card" style="padding: 24px;">
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
        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          :class="['cal-cell', cell.status, { disabled: !cell.date, selected: selectedDate === cell.date }]"
          @click="selectDate(cell)"
        >
          <span v-if="cell.date" class="day">{{ cell.day }}</span>
          <span v-if="cell.date && cell.price" class="cal-price">¥{{ cell.price }}</span>
        </div>
      </div>

      <div v-if="selectedCell" class="action-panel card">
        <h3>{{ selectedCell.date }}</h3>
        <div class="action-row">
          <span class="label">当前状态</span>
          <span :class="['status-tag', 'status-' + selectedCell.status]">
            {{ statusText[selectedCell.status] }}
          </span>
        </div>
        <div class="action-row">
          <span class="label">当日价格</span>
          <input v-model="priceInput" type="number" class="form-input" style="width: 150px;" min="0" />
          <button class="btn btn-primary btn-sm" @click="updatePrice">修改价格</button>
        </div>
        <div class="action-row">
          <span class="label">切换状态</span>
          <div class="btn-group">
            <button :class="['btn', 'btn-sm', selectedCell.status === 'available' ? 'btn-success' : 'btn-default']" @click="updateStatus('available')">设为可订</button>
            <button :class="['btn', 'btn-sm', selectedCell.status === 'booked' ? 'btn-danger' : 'btn-default']" @click="updateStatus('booked')">设为满房</button>
            <button :class="['btn', 'btn-sm', selectedCell.status === 'maintenance' ? 'btn-primary' : 'btn-default']" @click="updateStatus('maintenance')">设为维护</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../store/user'

const route = useRoute()
const userStore = useUserStore()
const property = ref(null)
const calendarData = ref([])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const selectedDate = ref('')
const priceInput = ref(0)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const statusText = { available: '可订', booked: '满房', maintenance: '维护' }

const calendarCells = computed(() => {
  if (calendarData.value.length === 0) return []
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

const selectedCell = computed(() => {
  if (!selectedDate.value) return null
  return calendarCells.value.find(c => c.date === selectedDate.value) || null
})

function selectDate(cell) {
  if (cell.date) {
    selectedDate.value = cell.date
    priceInput.value = cell.price || 0
  }
}

function changeMonth(delta) {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  currentMonth.value = m
  currentYear.value = y
  selectedDate.value = ''
  loadCalendar()
}

async function loadCalendar() {
  try {
    const pRes = await axios.get(`/api/properties/${route.params.id}`)
    property.value = pRes.data
    const res = await axios.get(`/api/calendar/${route.params.id}`, {
      params: { year: currentYear.value, month: currentMonth.value }
    })
    calendarData.value = res.data
  } catch (e) {}
}

async function updateStatus(status) {
  if (!selectedDate.value) return
  try {
    await axios.put(`/api/calendar/${route.params.id}/status`, {
      date: selectedDate.value, status
    }, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    loadCalendar()
  } catch (e) {
    alert('操作失败')
  }
}

async function updatePrice() {
  if (!selectedDate.value) return
  try {
    await axios.put(`/api/calendar/${route.params.id}/price`, {
      date: selectedDate.value, price: priceInput.value
    }, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    loadCalendar()
  } catch (e) {
    alert('修改失败')
  }
}

onMounted(loadCalendar)
</script>

<style scoped>
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.month-title {
  font-size: 20px;
  font-weight: 600;
  min-width: 160px;
  text-align: center;
}
.calendar-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  justify-content: center;
  font-size: 14px;
}
.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
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
  gap: 8px;
}
.cal-weekday {
  text-align: center;
  padding: 12px;
  font-weight: 600;
  color: #6b7280;
}
.cal-cell {
  aspect-ratio: 1;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.cal-cell.disabled {
  background: transparent;
  cursor: default;
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
.cal-cell.selected {
  border-color: #667eea;
  transform: scale(1.05);
}
.day {
  font-size: 16px;
  font-weight: 600;
}
.cal-price {
  font-size: 12px;
  margin-top: 4px;
}
.action-panel {
  margin-top: 24px;
  padding: 20px;
  background: #f9fafb;
}
.action-panel h3 {
  margin-bottom: 16px;
  font-size: 18px;
}
.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.label {
  min-width: 80px;
  color: #6b7280;
  font-size: 14px;
}
.btn-group {
  display: flex;
  gap: 8px;
}
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
}
.status-available { background: #d1fae5; color: #065f46; }
.status-booked { background: #fee2e2; color: #991b1b; }
.status-maintenance { background: #e5e7eb; color: #374151; }
</style>
