<template>
  <div class="profile-edit">
    <AppNavBar title="资料编辑" />

    <div class="list cn-card">
      <div class="row">
        <span class="label">头像</span>
        <img class="avatar" :src="resolveImg(user && user.icon)" alt="" />
      </div>
      <div class="row">
        <span class="label">昵称</span>
        <span class="value">{{ user ? user.nickName : '' }}</span>
      </div>
      <div class="row">
        <span class="label">个人介绍</span>
        <span class="value">{{ info.introduce || '还没有介绍自己' }}</span>
      </div>
      <div class="row">
        <span class="label">性别</span>
        <span class="value">{{ genderText }}</span>
      </div>
      <div class="row">
        <span class="label">城市</span>
        <span class="value">{{ info.city || '未填写' }}</span>
      </div>
      <div class="row">
        <span class="label">生日</span>
        <span class="value">{{ info.birthday || '未填写' }}</span>
      </div>
    </div>

    <el-alert
      class="notice"
      title="后端暂未提供资料更新接口，当前为只读展示"
      type="info"
      :closable="false"
      show-icon
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppNavBar from '@/components/AppNavBar.vue'
import { getUserInfo } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { resolveImg } from '@/utils/img'

const store = useUserStore()
const user = ref(null)
const info = ref({})

const genderText = computed(() => {
  if (!info.value.gender) return '未选择'
  return info.value.gender === 2 ? '女' : '男'
})

onMounted(async () => {
  user.value = await store.fetchMe()
  if (user.value) {
    const res = await getUserInfo(user.value.id).catch(() => null)
    if (res && res.data) info.value = res.data
  }
})
</script>

<style scoped>
.profile-edit {
  min-height: 100dvh;
}
.list {
  margin: var(--cn-space-4);
  padding: 0 var(--cn-space-4);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  border-bottom: 1px solid var(--cn-divider);
}
.row:last-child {
  border-bottom: none;
}
.label {
  font-size: 14px;
  color: var(--cn-text-2);
  flex-shrink: 0;
}
.value {
  font-size: 14px;
  color: var(--cn-text-3);
  max-width: 200px;
  text-align: right;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.notice {
  margin: 0 var(--cn-space-4);
}
</style>
