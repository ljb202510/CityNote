<template>
  <div class="shop-card cn-card" @click="$router.push(`/shops/${shop.id}`)">
    <div class="cover"><img :src="cover" alt="" loading="lazy" /></div>
    <div class="body">
      <p class="name cn-ellipsis">{{ shop.name }}</p>
      <div class="row">
        <el-rate :model-value="shop.score / 10" disabled size="small" allow-half />
        <span class="cn-num score">{{ (shop.score / 10).toFixed(1) }}</span>
        <span class="cn-num comments">{{ shop.comments }}条</span>
      </div>
      <div class="row sub">
        <span>{{ shop.area }}</span>
        <span class="cn-num">￥{{ shop.avgPrice }}/人</span>
      </div>
      <p class="addr cn-ellipsis">{{ shop.address }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { resolveImg, resolveImgs } from '@/utils/img'

const props = defineProps({ shop: { type: Object, required: true } })

const cover = computed(() => resolveImgs(props.shop.images)[0] || resolveImg(''))
</script>

<style scoped>
.shop-card {
  display: flex;
  gap: var(--cn-space-3);
  padding: var(--cn-space-3);
  cursor: pointer;
  transition: transform 0.12s ease;
}
.shop-card:active {
  transform: scale(0.985);
}
.cover {
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  border-radius: var(--cn-radius-btn);
  overflow: hidden;
  background: var(--cn-divider);
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.body {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 15px;
  font-weight: 600;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--cn-space-2);
  margin-top: 4px;
  font-size: 12px;
  color: var(--cn-text-2);
}
.score {
  color: var(--cn-accent);
  font-weight: 600;
}
.sub {
  justify-content: space-between;
}
.addr {
  margin-top: 6px;
  font-size: 12px;
  color: var(--cn-text-3);
}
</style>
