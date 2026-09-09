<template>
  <div class="img-pager">
    <div class="strip">
      <img
        v-for="(src, i) in images"
        :key="i"
        :src="src"
        alt=""
        @click="open(i)"
      />
    </div>
    <div class="counter" v-if="images.length > 1">{{ images.length }} 图</div>
    <el-image-viewer
      v-if="visible"
      :url-list="images"
      :initial-index="index"
      @close="visible = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ images: { type: Array, default: () => [] } })

const visible = ref(false)
const index = ref(0)
function open(i) {
  index.value = i
  visible.value = true
}
</script>

<style scoped>
.img-pager {
  position: relative;
}
.strip {
  display: flex;
  gap: var(--cn-space-2);
  overflow-x: auto;
  padding-bottom: var(--cn-space-1);
  scrollbar-width: none;
}
.strip::-webkit-scrollbar {
  display: none;
}
.strip img {
  flex: 0 0 82%;
  min-width: 0;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--cn-radius-btn);
  background: var(--cn-divider);
  cursor: zoom-in;
}
.counter {
  position: absolute;
  right: var(--cn-space-2);
  bottom: var(--cn-space-3);
  padding: 2px 8px;
  font-size: 11px;
  color: #fff;
  background: rgb(17 24 39 / 45%);
  border-radius: 10px;
}
</style>
