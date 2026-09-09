<template>
  <div class="navbar">
    <div class="back" @click="goBack"><el-icon><ArrowLeft /></el-icon></div>
    <div class="title cn-ellipsis">{{ title }}</div>
    <div class="right"><slot name="right" /></div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'

defineProps({ title: { type: String, default: '' } })

function goBack() {
  if (window.history.length > 1) window.history.back()
  else location.href = '/'
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--cn-space-3);
  background: var(--cn-card);
  border-bottom: 1px solid var(--cn-divider);
}
.back {
  width: 32px;
  font-size: 18px;
  color: var(--cn-text-1);
  cursor: pointer;
}
.title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}
.right {
  min-width: 32px;
  display: flex;
  justify-content: flex-end;
}
</style>
