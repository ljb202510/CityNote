<template>
  <div class="home">
    <header class="hero">
      <h1>CityNote</h1>
      <p>发现城市里的好味道</p>
    </header>

    <div class="types cn-card">
      <div class="type" v-for="t in types" :key="t.id" @click="toShopList(t)">
        <img :src="resolveImg(t.icon)" alt="" />
        <span>{{ t.name }}</span>
      </div>
    </div>

    <h2 class="section">热门探店笔记</h2>
    <WaterfallList ref="listRef" :fetcher="fetchHot">
      <template #default="{ item }">
        <BlogCard :blog="item" @like="toggleLike" />
      </template>
    </WaterfallList>

    <TabBar active="home" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import WaterfallList from '@/components/WaterfallList.vue'
import BlogCard from '@/components/BlogCard.vue'
import TabBar from '@/components/TabBar.vue'
import { getShopTypes } from '@/api/shopType'
import { getHotBlogs, toggleLike as apiToggleLike, getBlogById } from '@/api/blog'
import { resolveImg } from '@/utils/img'

const router = useRouter()
const types = ref([])
const listRef = ref(null)
const current = ref(1)

onMounted(async () => {
  try {
    const res = await getShopTypes()
    types.value = res.data
  } catch (e) {}
})

function fetchHot() {
  return getHotBlogs(current.value).then((res) => {
    current.value++
    return { list: res.data, hasMore: !!res.data && res.data.length > 0 }
  })
}

// toggle 语义：调用后端后重新拉取该笔记的 liked/isLike
async function toggleLike(blog) {
  try {
    await apiToggleLike(blog.id)
    const res = await getBlogById(blog.id)
    blog.liked = res.data.liked
    blog.isLike = res.data.isLike
  } catch (e) {
    if (e.message === '请先登录') ElMessage.error('请先登录')
  }
}

function toShopList(t) {
  router.push({ path: '/shops', query: { type: t.id, name: t.name } })
}
</script>

<style scoped>
.home {
  padding: var(--cn-space-4);
  padding-bottom: 76px;
}
.hero {
  padding: var(--cn-space-4) var(--cn-space-1) var(--cn-space-4);
}
.hero h1 {
  color: var(--cn-primary);
  font-size: 26px;
}
.hero p {
  margin-top: 2px;
  font-size: 13px;
  color: var(--cn-text-2);
}
.types {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--cn-space-2);
  padding: var(--cn-space-4) var(--cn-space-2);
}
.type {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.type img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.type span {
  font-size: 12px;
  color: var(--cn-text-2);
}
.section {
  margin: var(--cn-space-5) 0 var(--cn-space-3);
  font-size: 16px;
}
</style>
