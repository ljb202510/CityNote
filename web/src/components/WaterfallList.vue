<template>
  <div class="waterfall">
    <div class="cols">
      <div class="col" v-for="(col, ci) in columns" :key="ci">
        <div class="cell" v-for="item in col" :key="item.id">
          <slot :item="item" />
        </div>
      </div>
    </div>
    <EmptyState v-if="finished && items.length === 0" :text="emptyText" />
    <div ref="sentinel" class="sentinel">
      <span v-if="loading" class="loading">加载中…</span>
      <span v-else-if="finished && items.length > 0" class="finished">— 没有更多了 —</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import EmptyState from './EmptyState.vue'

// fetcher: async () => { list: Array, hasMore: Boolean }，由父组件维护分页游标
const props = defineProps({
  fetcher: { type: Function, required: true },
  emptyText: { type: String, default: '这里还什么都没有' }
})

const items = ref([])
const loading = ref(false)
const finished = ref(false)
const sentinel = ref(null)
let observer = null

const columns = computed(() => {
  const cols = [[], []]
  items.value.forEach((item, i) => cols[i % 2].push(item))
  return cols
})

async function load() {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const { list, hasMore } = await props.fetcher()
    items.value = items.value.concat(list || [])
    if (hasMore === false || !list || list.length === 0) finished.value = true
  } catch (e) {
    finished.value = true
  } finally {
    loading.value = false
  }
}

async function reload() {
  items.value = []
  finished.value = false
  loading.value = false
  await nextTick()
  await load()
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) load()
    },
    { rootMargin: '120px' }
  )
  observer.observe(sentinel.value)
  load()
})

onBeforeUnmount(() => observer && observer.disconnect())

// fetcher 变化不自动重载（父组件内联箭头函数会导致引用不稳定），需要刷新时由父组件调用 reload()
defineExpose({ reload })
</script>

<style scoped>
.waterfall {
  display: block;
}
.cols {
  display: flex;
  gap: var(--cn-space-3);
  align-items: flex-start;
}
.col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-3);
}
.sentinel {
  width: 100%;
  padding: var(--cn-space-4) 0;
  text-align: center;
  font-size: 12px;
  color: var(--cn-text-3);
}
</style>
