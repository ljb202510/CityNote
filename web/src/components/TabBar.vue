<template>
  <nav class="tabbar">
    <div class="item" :class="{ active: active === 'home' }" @click="go('/')">
      <el-icon><HomeFilled /></el-icon>
      <span>首页</span>
    </div>
    <div class="item publish" @click="go('/blogs/edit')">
      <el-icon><Plus /></el-icon>
    </div>
    <div class="item" :class="{ active: active === 'me' }" @click="go('/me')">
      <el-icon><User /></el-icon>
      <span>我的</span>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { HomeFilled, Plus, User } from '@element-plus/icons-vue'

defineProps({ active: { type: String, default: '' } })
const router = useRouter()
const go = (path) => router.push(path)
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  height: 56px;
  background: var(--cn-card);
  border-top: 1px solid var(--cn-divider);
  z-index: 20;
}
.item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--cn-text-3);
  cursor: pointer;
}
.item .el-icon {
  font-size: 20px;
}
.item.active {
  color: var(--cn-primary);
}
.publish {
  flex: 0 0 64px;
}
.publish .el-icon {
  width: 40px;
  height: 40px;
  font-size: 22px;
  color: #fff;
  background: var(--cn-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgb(15 118 110 / 30%);
}
</style>
