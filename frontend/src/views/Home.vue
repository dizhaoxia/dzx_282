<template>
  <div class="container">
    <h1 class="page-title">精选房源</h1>
    <div v-if="properties.length === 0" class="empty-state">
      暂无房源，敬请期待
    </div>
    <div v-else class="property-grid">
      <div v-for="p in properties" :key="p.id" class="property-card card" @click="goDetail(p.id)">
        <div class="property-img">
          <img v-if="p.cover_image" :src="p.cover_image.startsWith('http') ? p.cover_image : p.cover_image" :alt="p.title" />
          <div v-else class="img-placeholder">暂无图片</div>
        </div>
        <div class="property-info">
          <h3 class="property-title">{{ p.title }}</h3>
          <p class="property-address">{{ p.address }}</p>
          <div class="property-tags">
            <span class="tag">{{ p.room_type }}</span>
            <span class="tag">可住{{ p.max_guests }}人</span>
            <span v-for="f in (p.facilities || []).slice(0, 3)" :key="f" class="tag">{{ f }}</span>
          </div>
          <div class="property-price">
            <span class="price-label">平日</span>
            <span class="price">¥{{ p.weekday_price }}</span>
            <span class="price-unit">/晚</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const properties = ref([])
const router = useRouter()

onMounted(async () => {
  try {
    const res = await axios.get('/api/properties')
    properties.value = res.data
  } catch (e) {
    console.error(e)
  }
})

function goDetail(id) {
  router.push(`/property/${id}`)
}
</script>

<style scoped>
.property-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.property-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.property-img {
  width: 100%;
  height: 180px;
  background: #e5e7eb;
  overflow: hidden;
}
.property-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}
.property-info {
  padding: 16px;
}
.property-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.property-address {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}
.property-tags {
  margin-bottom: 12px;
}
.property-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.price-label {
  font-size: 12px;
  color: #9ca3af;
}
.price {
  font-size: 22px;
  font-weight: bold;
  color: #ef4444;
}
.price-unit {
  font-size: 12px;
  color: #9ca3af;
}
</style>
