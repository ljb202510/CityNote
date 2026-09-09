<template>
  <div class="other-info">
    <AppNavBar title="个人主页" />

    <div class="head cn-card" v-if="user.id">
      <img class="avatar" :src="resolveImg(user.icon)" alt="" />
      <div class="hinfo">
        <p class="nick">{{ user.nickName }}</p>
        <p class="sub">{{ info.introduce || '这个人很懒，什么都没写' }}</p>
      </div>
      <el-button
        v-if="!isSelf"
        :type="followed ? 'info' : 'primary'"
        size="small"
        round
        @click="doFollow"
      >
        {{ followed ? '已关注' : '+ 关注' }}
      </el-button>
    </div>

    <el-tabs v-model="tab" class="tabs">
      <el-tab-pane label="TA的笔记" name="blogs" />
      <el-tab-pane label="共同关注" name="common" />
    </el-tabs>

    <template v-if="tab === 'blogs'">
      <div class="grid">
        <div class="cell" v-for="b in blogs" :key="b.id" @click="$router.push(`/blogs/${b.id}`)">
          <img :src="cover(b)" alt="" />
          <p class="cn-ellipsis">{{ b.title }}</p>
        </div>
      </div>
      <EmptyState v-if="!blogs.length" text="TA还没有发布笔记" />
    </template>

    <template v-else>
      <div class="common" v-if="commonFollows.length">
        <div class="cf" v-for="u in commonFollows" :key="u.id" @click="$router.push(`/users/${u.id}`)">
          <img :src="resolveImg(u.icon)" alt="" />
          <span>{{ u.nickName }}</span>
        </div>
      </div>
      <EmptyState v-else text="没有共同关注的用户" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppNavBar from '@/components/AppNavBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getUser, getUserInfo } from '@/api/user'
import { getBlogsOfUser } from '@/api/blog'
import { getCommonFollows, followUser, isFollowed } from '@/api/follow'
import { useUserStore } from '@/stores/user'
import { resolveImg, resolveImgs } from '@/utils/img'

const route = useRoute()
const store = useUserStore()

const user = ref({})
const info = ref({})
const blogs = ref([])
const commonFollows = ref([])
const followed = ref(false)
const tab = ref('blogs')

const isSelf = computed(() => store.userInfo && store.userInfo.id === user.value.id)
const cover = (b) => resolveImgs(b.images)[0] || resolveImg('')

async function loadCommon() {
  if (commonFollows.value.length) return
  const res = await getCommonFollows(user.value.id).catch(() => null)
  if (res) commonFollows.value = res.data || []
}

async function doFollow() {
  try {
    await followUser(user.value.id, !followed.value)
    followed.value = !followed.value
    ElMessage.success(followed.value ? '已关注' : '已取消关注')
  } catch (e) {}
}

// tab 切到共同关注时懒加载
watch(tab, (t) => t === 'common' && loadCommon())

onMounted(async () => {
  const id = route.params.id
  const res = await getUser(id)
  user.value = res.data
  const [detail, blogRes] = await Promise.all([
    getUserInfo(id).catch(() => null),
    getBlogsOfUser(id, 1).catch(() => null)
  ])
  if (detail && detail.data) info.value = detail.data
  if (blogRes) blogs.value = blogRes.data || []
  await store.fetchMe().catch(() => {})
  if (!isSelf.value) {
    const f = await isFollowed(id).catch(() => null)
    if (f) followed.value = f.data
  }
})
</script>

<style scoped>
.other-info {
  min-height: 100dvh;
  padding: var(--cn-space-4);
}
.head {
  display: flex;
  align-items: center;
  gap: var(--cn-space-3);
  padding: var(--cn-space-4);
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
}
.hinfo {
  flex: 1;
  min-width: 0;
}
.nick {
  font-size: 16px;
  font-weight: 600;
}
.sub {
  font-size: 12px;
  color: var(--cn-text-3);
  margin-top: 2px;
}
.tabs {
  margin: var(--cn-space-3) 0;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--cn-space-3);
}
.cell {
  cursor: pointer;
}
.cell img {
  width: 100%;
  aspect-ratio: 1 / 1.05;
  object-fit: cover;
  border-radius: var(--cn-radius-card);
}
.cell p {
  font-size: 12px;
  margin-top: 4px;
}
.common {
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-2);
}
.cf {
  display: flex;
  align-items: center;
  gap: var(--cn-space-2);
  padding: var(--cn-space-2);
  cursor: pointer;
}
.cf img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.cf span {
  font-size: 14px;
}
</style>
