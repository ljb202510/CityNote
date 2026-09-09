<template>
  <div class="blog-edit">
    <AppNavBar title="发布探店笔记">
      <template #right>
        <span class="submit-btn" @click="submit">发布</span>
      </template>
    </AppNavBar>

    <div class="form">
      <el-input v-model="form.title" placeholder="添加标题" maxlength="30" show-word-limit size="large" />
      <el-input
        v-model="form.content"
        type="textarea"
        placeholder="分享你的探店体验…"
        :autosize="{ minRows: 6 }"
        maxlength="1000"
        show-word-limit
      />

      <div class="imgs">
        <div class="img-item" v-for="(f, i) in files" :key="i">
          <img :src="f.url" alt="" />
          <div class="del" @click="removeFile(i)"><el-icon><Close /></el-icon></div>
        </div>
        <div class="img-add" @click="pickFile" v-if="files.length < 9">
          <el-icon><Plus /></el-icon>
        </div>
      </div>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />

      <div class="shop-pick cn-card" @click="openShopDialog">
        <span>{{ selectedShop.id ? '关联店铺：' + selectedShop.name : '选择关联店铺' }}</span>
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>

    <el-dialog v-model="shopDialog" title="选择店铺" width="90%" top="8vh">
      <el-input v-model="shopName" placeholder="搜索店铺名称" clearable @input="queryShops" />
      <div class="shop-results">
        <div class="shop-item" v-for="s in shops" :key="s.id" @click="selectShop(s)">
          <img :src="resolveImgs(s.images)[0]" alt="" />
          <div>
            <p class="cn-ellipsis">{{ s.name }}</p>
            <p class="sarea">{{ s.area }} · ￥{{ s.avgPrice }}/人</p>
          </div>
        </div>
        <EmptyState v-if="!shops.length" text="没有匹配的店铺" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Close, Plus } from '@element-plus/icons-vue'
import AppNavBar from '@/components/AppNavBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { saveBlog } from '@/api/blog'
import { searchShopByName } from '@/api/shop'
import { uploadBlogImage, deleteBlogImage } from '@/api/upload'
import { resolveImg, resolveImgs } from '@/utils/img'

const router = useRouter()

const form = ref({ title: '', content: '' })
const files = ref([]) // { raw: /blogs/..., url: /imgs/blogs/... }
const fileInput = ref(null)

const shopDialog = ref(false)
const shopName = ref('')
const shops = ref([])
const selectedShop = ref({})

function pickFile() {
  fileInput.value.click()
}

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await uploadBlogImage(file)
    const raw = res.data // /blogs/x/y/uuid.jpg
    files.value.push({ raw, url: resolveImg(raw) })
  } catch (err) {
    ElMessage.error('图片上传失败，请检查后端图片目录配置')
  } finally {
    e.target.value = ''
  }
}

async function removeFile(i) {
  const f = files.value[i]
  await deleteBlogImage(f.raw).catch(() => {})
  files.value.splice(i, 1)
}

function openShopDialog() {
  shopDialog.value = true
  queryShops()
}

async function queryShops() {
  const res = await searchShopByName(shopName.value).catch(() => null)
  if (res) shops.value = res.data || []
}

function selectShop(s) {
  selectedShop.value = s
  shopDialog.value = false
}

async function submit() {
  if (!form.value.title) return ElMessage.error('请填写标题')
  if (!files.value.length) return ElMessage.error('请至少上传一张图片')
  if (!selectedShop.value.id) return ElMessage.error('请选择关联店铺')
  const data = {
    title: form.value.title,
    content: form.value.content,
    shopId: selectedShop.value.id,
    images: files.value.map((f) => f.url).join(',')
  }
  await saveBlog(data)
  ElMessage.success('发布成功')
  router.replace('/me')
}
</script>

<style scoped>
.blog-edit {
  min-height: 100dvh;
}
.submit-btn {
  padding: 5px 14px;
  font-size: 13px;
  color: #fff;
  background: var(--cn-primary);
  border-radius: 14px;
  cursor: pointer;
}
.form {
  padding: var(--cn-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-3);
}
.imgs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cn-space-2);
}
.img-item,
.img-add {
  width: 80px;
  height: 80px;
  border-radius: var(--cn-radius-btn);
  position: relative;
}
.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--cn-radius-btn);
}
.del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgb(17 24 39 / 60%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
}
.img-add {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--cn-text-3);
  background: var(--cn-card);
  border: 1px dashed var(--cn-text-3);
  cursor: pointer;
}
.shop-pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cn-space-3);
  font-size: 14px;
  cursor: pointer;
}
.shop-results {
  margin-top: var(--cn-space-3);
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-2);
}
.shop-item {
  display: flex;
  gap: var(--cn-space-2);
  align-items: center;
  padding: var(--cn-space-2);
  border-radius: var(--cn-radius-btn);
  cursor: pointer;
}
.shop-item:active {
  background: var(--cn-bg);
}
.shop-item img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}
.shop-item p {
  font-size: 14px;
  max-width: 220px;
}
.sarea {
  font-size: 12px;
  color: var(--cn-text-3);
  margin-top: 2px;
}
</style>
