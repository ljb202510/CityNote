<template>
  <div class="empty">
    <div class="icon">🗒️</div>
    <p>{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({ text: { type: String, default: '这里还什么都没有' } })
</script>

<style scoped>
.empty {
  padding: var(--cn-space-6) 0;
  text-align: center;
  color: var(--cn-text-3);
  font-size: 13px;
}
.empty .icon {
  font-size: 36px;
  margin-bottom: var(--cn-space-2);
}
</style>
