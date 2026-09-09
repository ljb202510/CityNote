<template>
  <div class="blog-card cn-card" @click="$router.push(`/blogs/${blog.id}`)">
    <div class="cover">
      <img :src="cover" alt="" loading="lazy" />
    </div>
    <div class="body">
      <p class="title">{{ blog.title }}</p>
      <div class="meta">
        <img class="avatar" :src="icon" alt="" @click.stop="$router.push(`/users/${blog.userId}`)" />
        <span class="name cn-ellipsis">{{ blog.name }}</span>
        <span class="like" :class="{ liked: blog.isLike }" @click.stop="$emit('like', blog)">
          <el-icon><StarFilled v-if="blog.isLike" /><Star v-else /></el-icon>
          <i class="cn-num">{{ blog.liked }}</i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { resolveImg, resolveImgs } from '@/utils/img'

const props = defineProps({ blog: { type: Object, required: true } })
defineEmits(['like'])

const cover = computed(() => resolveImgs(props.blog.images)[0] || resolveImg(''))
const icon = computed(() => resolveImg(props.blog.icon))
</script>

<style scoped>
.blog-card {
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.blog-card:active {
  transform: scale(0.98);
}
.cover {
  width: 100%;
  aspect-ratio: 1 / 1.05;
  background: var(--cn-divider);
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.body {
  padding: var(--cn-space-2) var(--cn-space-3) var(--cn-space-3);
}
.title {
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--cn-space-2);
}
.avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.name {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: var(--cn-text-2);
}
.like {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--cn-text-3);
}
.like i {
  font-style: normal;
}
.like.liked {
  color: var(--cn-accent);
}
</style>
