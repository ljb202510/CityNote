<template>
  <div class="blog-detail">
    <AppNavBar title="探店笔记" />

    <div class="content" v-if="blog.id">
      <ImagePreview :images="images" />

      <div class="author cn-card">
        <img class="avatar" :src="resolveImg(blog.icon)" alt="" @click="toAuthor" />
        <div class="info">
          <p class="name">{{ blog.name }}</p>
          <p class="time">{{ timeText }}</p>
        </div>
        <el-button
          v-if="showFollowBtn"
          :type="followed ? 'info' : 'primary'"
          size="small"
          round
          @click="follow"
        >
          {{ followed ? '已关注' : '+ 关注' }}
        </el-button>
      </div>

      <article class="body cn-card">
        <h1>{{ blog.title }}</h1>
        <p class="text">{{ blog.content }}</p>
      </article>

      <div class="shop cn-card" v-if="shop.id" @click="$router.push(`/shops/${shop.id}`)">
        <img :src="shopCover" alt="" />
        <div class="sinfo">
          <p class="sname cn-ellipsis">{{ shop.name }}</p>
          <p class="sarea cn-ellipsis">{{ shop.area }} · ￥{{ shop.avgPrice }}/人</p>
        </div>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>

      <div class="likes cn-card" v-if="likes.length">
        <p class="likes-title">{{ blog.liked }} 人点赞</p>
        <div class="avatars">
          <img v-for="u in likes" :key="u.id" :src="resolveImg(u.icon)" :title="u.nickName" alt="" />
        </div>
      </div>
    </div>

    <div class="like-bar" v-if="blog.id">
      <div class="like-btn" :class="{ liked: blog.isLike }" @click="doLike">
        <el-icon><StarFilled v-if="blog.isLike" /><Star v-else /></el-icon>
        <span class="cn-num">{{ blog.liked }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Star, StarFilled } from '@element-plus/icons-vue'
import AppNavBar from '@/components/AppNavBar.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getBlogById, getBlogLikes, toggleLike } from '@/api/blog'
import { getShop } from '@/api/shop'
import { isFollowed as apiIsFollowed, followUser } from '@/api/follow'
import { useUserStore } from '@/stores/user'
import { resolveImg, resolveImgs } from '@/utils/img'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const blog = ref({})
const shop = ref({})
const likes = ref([])
const followed = ref(false)

const images = computed(() => resolveImgs(blog.value.images))
const shopCover = computed(() => resolveImgs(shop.value.images)[0] || resolveImg(''))
const timeText = computed(() => {
  if (!blog.value.createTime) return ''
  const d = new Date(blog.value.createTime)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})
const showFollowBtn = computed(
  () => store.userInfo && blog.value.userId && store.userInfo.id !== blog.value.userId
)

async function load() {
  const id = route.params.id
  const res = await getBlogById(id)
  blog.value = res.data
  loadLikes()
  if (blog.value.shopId) {
    const s = await getShop(blog.value.shopId).catch(() => null)
    if (s) shop.value = s.data
  }
  if (store.userInfo && store.userInfo.id !== blog.value.userId) {
    const f = await apiIsFollowed(blog.value.userId).catch(() => null)
    if (f) followed.value = f.data
  }
}

async function loadLikes() {
  const res = await getBlogLikes(blog.value.id).catch(() => null)
  if (res) likes.value = res.data || []
}

async function doLike() {
  try {
    await toggleLike(blog.value.id)
    const res = await getBlogById(blog.value.id)
    blog.value.liked = res.data.liked
    blog.value.isLike = res.data.isLike
    loadLikes()
  } catch (e) {
    if (e.message === '请先登录') ElMessage.error('请先登录后再点赞')
  }
}

async function follow() {
  try {
    await followUser(blog.value.userId, !followed.value)
    followed.value = !followed.value
    ElMessage.success(followed.value ? '已关注' : '已取消关注')
  } catch (e) {}
}

function toAuthor() {
  if (store.userInfo && store.userInfo.id === blog.value.userId) router.push('/me')
  else router.push(`/users/${blog.value.userId}`)
}

onMounted(async () => {
  await store.fetchMe().catch(() => {})
  load()
})
</script>

<style scoped>
.blog-detail {
  min-height: 100dvh;
  padding-bottom: 76px;
}
.content {
  padding: var(--cn-space-3) var(--cn-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-3);
}
.author {
  display: flex;
  align-items: center;
  gap: var(--cn-space-2);
  padding: var(--cn-space-3);
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 14px;
  font-weight: 600;
}
.time {
  font-size: 11px;
  color: var(--cn-text-3);
}
.body {
  padding: var(--cn-space-4);
}
.body h1 {
  font-size: 18px;
  margin-bottom: var(--cn-space-3);
}
.text {
  font-size: 14px;
  line-height: 1.75;
  color: var(--cn-text-1);
  white-space: pre-wrap;
}
.shop {
  display: flex;
  align-items: center;
  gap: var(--cn-space-3);
  padding: var(--cn-space-3);
  cursor: pointer;
}
.shop img {
  width: 52px;
  height: 52px;
  border-radius: var(--cn-radius-btn);
  object-fit: cover;
}
.sinfo {
  flex: 1;
  min-width: 0;
}
.sname {
  font-size: 14px;
  font-weight: 600;
}
.sarea {
  font-size: 12px;
  color: var(--cn-text-3);
  margin-top: 2px;
}
.arrow {
  color: var(--cn-text-3);
}
.likes {
  padding: var(--cn-space-3);
}
.likes-title {
  font-size: 12px;
  color: var(--cn-text-3);
  margin-bottom: var(--cn-space-2);
}
.avatars {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.avatars::-webkit-scrollbar {
  display: none;
}
.avatars img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.like-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cn-card);
  border-top: 1px solid var(--cn-divider);
}
.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 24px;
  border-radius: 20px;
  background: var(--cn-bg);
  color: var(--cn-text-2);
  font-size: 15px;
  cursor: pointer;
}
.like-btn.liked {
  color: var(--cn-accent);
  background: #fff7ed;
}
</style>
