<template>
  <div class="profile">
    <header class="head">
      <img class="avatar" :src="resolveImg(user && user.icon)" alt="" />
      <div class="hinfo">
        <p class="nick">{{ user ? user.nickName : '未登录' }}</p>
        <p class="sub">{{ info ? `${info.gender === 2 ? '女' : '男'} · ${info.birthday || ''}` : '完善资料 >' }}</p>
      </div>
      <div class="hactions">
        <el-button size="small" round @click="$router.push('/me/edit')">编辑资料</el-button>
        <el-button size="small" round text type="danger" @click="doLogout">退出</el-button>
      </div>
    </header>

    <el-tabs v-model="tab" class="tabs" @tab-change="onTabChange">
      <el-tab-pane label="我的笔记" name="me" />
      <el-tab-pane label="关注动态" name="follow" />
    </el-tabs>

    <WaterfallList v-if="tab === 'me'" ref="meRef" :fetcher="fetchMine" empty-text="还没有发布过笔记">
      <template #default="{ item }">
        <BlogCard :blog="item" @like="doLike" />
      </template>
    </WaterfallList>

    <WaterfallList v-else ref="followRef" :fetcher="fetchFollow" empty-text="关注的用户还没有笔记">
      <template #default="{ item }">
        <BlogCard :blog="item" @like="doLike" />
      </template>
    </WaterfallList>

    <TabBar active="me" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import WaterfallList from '@/components/WaterfallList.vue'
import BlogCard from '@/components/BlogCard.vue'
import TabBar from '@/components/TabBar.vue'
import { getMyBlogs, getFollowBlogs, toggleLike, getBlogById } from '@/api/blog'
import { getUserInfo, logout } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { resolveImg } from '@/utils/img'

const router = useRouter()
const store = useUserStore()

const user = ref(null)
const info = ref(null)
const tab = ref('me')
const meRef = ref(null)
const followRef = ref(null)

// 我的笔记：页码分页
const meCurrent = ref(1)
function fetchMine() {
  return getMyBlogs(meCurrent.value).then((res) => {
    meCurrent.value++
    return { list: res.data, hasMore: !!res.data && res.data.length > 0 }
  })
}

// 关注动态：GTE 滚动分页（lastId + offset）
const followParams = ref({ lastId: Date.now() + 1, offset: 0 })
function fetchFollow() {
  const { lastId, offset } = followParams.value
  return getFollowBlogs(lastId, offset).then((res) => {
    const data = res.data
    if (!data || !data.list || data.list.length === 0) return { list: [], hasMore: false }
    const { list, ...params } = data
    followParams.value = params
    return { list, hasMore: true }
  })
}

function onTabChange(name) {
  if (name === 'follow') followParams.value = { lastId: Date.now() + 1, offset: 0 }
  else meCurrent.value = 1
}

async function doLike(blog) {
  try {
    await toggleLike(blog.id)
    const res = await getBlogById(blog.id)
    blog.liked = res.data.liked
    blog.isLike = res.data.isLike
  } catch (e) {}
}

async function doLogout() {
  await logout().catch(() => {})
  store.clear()
  ElMessage.success('已退出登录')
  router.replace('/login')
}

onMounted(async () => {
  user.value = await store.fetchMe()
  if (user.value) {
    const res = await getUserInfo(user.value.id).catch(() => null)
    if (res && res.data) info.value = res.data
  }
})
</script>

<style scoped>
.profile {
  min-height: 100dvh;
  padding: var(--cn-space-4);
  padding-bottom: 76px;
}
.head {
  display: flex;
  align-items: center;
  gap: var(--cn-space-3);
  padding: var(--cn-space-3) 0 var(--cn-space-4);
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}
.hinfo {
  flex: 1;
  min-width: 0;
}
.nick {
  font-size: 17px;
  font-weight: 600;
}
.sub {
  font-size: 12px;
  color: var(--cn-text-3);
  margin-top: 2px;
}
.hactions {
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-1);
}
.tabs {
  margin-bottom: var(--cn-space-3);
}
</style>
