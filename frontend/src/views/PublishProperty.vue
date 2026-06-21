<template>
  <div class="container">
    <h1 class="page-title">发布房源</h1>
    <div class="card" style="padding: 30px;">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">房源标题 *</label>
          <input v-model="form.title" type="text" class="form-input" placeholder="给您的房源起个吸引人的标题" maxlength="100" required />
        </div>
        <div class="form-group">
          <label class="form-label">详细地址 *</label>
          <input v-model="form.address" type="text" class="form-input" placeholder="请输入房源详细地址" required />
        </div>
        <div class="row">
          <div class="form-group">
            <label class="form-label">房型类别 *</label>
            <select v-model="form.room_type" class="form-select" required>
              <option value="">请选择</option>
              <option value="整套房">整套房</option>
              <option value="独立房间">独立房间</option>
              <option value="合住房间">合住房间</option>
              <option value="公寓">公寓</option>
              <option value="别墅">别墅</option>
              <option value="民宿">民宿</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">可住人数 *</label>
            <input v-model.number="form.max_guests" type="number" class="form-input" min="1" placeholder="最多可住人数" required />
          </div>
        </div>
        <div class="row">
          <div class="form-group">
            <label class="form-label">平日价格（元/晚）*</label>
            <input v-model.number="form.weekday_price" type="number" class="form-input" min="0" step="0.01" placeholder="周一至周四价格" required />
          </div>
          <div class="form-group">
            <label class="form-label">周末价格（元/晚）*</label>
            <input v-model.number="form.weekend_price" type="number" class="form-input" min="0" step="0.01" placeholder="周五至周日价格" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">房源描述</label>
          <textarea v-model="form.description" class="form-textarea" placeholder="介绍一下您的房源吧"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">设施标签</label>
          <div class="facilities">
            <label v-for="f in availableFacilities" :key="f" :class="['facility-item', { active: form.facilities.includes(f) }]">
              <input type="checkbox" :value="f" v-model="form.facilities" style="display:none;" />
              {{ f }}
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">封面图片</label>
          <div class="upload-area">
            <div v-if="form.cover_image" class="preview-img">
              <img :src="form.cover_image" />
              <button type="button" class="remove-btn" @click="form.cover_image = ''">×</button>
            </div>
            <label v-else class="upload-btn">
              <input type="file" accept="image/*" @change="handleUpload" style="display:none;" />
              <div class="upload-icon">📷</div>
              <div>点击上传封面</div>
            </label>
          </div>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
          {{ loading ? '发布中...' : '发布房源' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const availableFacilities = ['WiFi', '空调', '厨房', '洗衣机', '电视', '冰箱', '暖气', '停车位', '电梯', '健身房', '游泳池', '早餐']

const form = reactive({
  title: '',
  address: '',
  room_type: '',
  max_guests: 1,
  weekday_price: 0,
  weekend_price: 0,
  description: '',
  facilities: [],
  cover_image: ''
})

const error = ref('')
const loading = ref(false)

async function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const fd = new FormData()
  fd.append('image', file)
  try {
    const res = await axios.post('/api/properties/upload', fd, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    form.cover_image = res.data.url.startsWith('http') ? res.data.url : `http://localhost:50323${res.data.url}`
  } catch (err) {
    alert('上传失败')
  }
}

async function handleSubmit() {
  error.value = ''
  if (!form.title || !form.address || !form.room_type || !form.max_guests || !form.weekday_price || !form.weekend_price) {
    error.value = '请填写所有必填项'
    return
  }
  loading.value = true
  try {
    const res = await axios.post('/api/properties', form, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    })
    alert('发布成功')
    router.push(`/property/${res.data.propertyId}/calendar`)
  } catch (e) {
    error.value = e.response?.data?.message || '发布失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.facility-item {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.facility-item.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.upload-area {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.upload-btn {
  width: 200px;
  height: 150px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  font-size: 13px;
  transition: all 0.2s;
}
.upload-btn:hover {
  border-color: #667eea;
  color: #667eea;
}
.upload-icon {
  font-size: 40px;
  margin-bottom: 8px;
}
.preview-img {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
}
.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
