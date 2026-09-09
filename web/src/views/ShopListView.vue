<template>
  <div class="shop-list">
    <AppNavBar :title="typeName || '店铺列表'" />

    <div class="filter cn-card">
      <div
        class="chip"
        v-for="t in types"
        :key="t.id"
        :class="{ active: String(t.id) === String(typeId) }"
        @click="switchType(t)"
      >
        {{ t.name }}
      </div>
    </div>

    <div class="list">
      <ShopCard v-for="s in shops" :key="s.id" :shop="s" />
      <EmptyState v-if="finished && shops.length === 0" text="该分类下暂无店铺" />
      <div ref="sentinel" class="sentinel">
        <span v-if="loading">加载中…</span>
        <span v-else-if="finished && shops.length > 0">— 没有更多了 —</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import ShopCard from '@/components/ShopCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getShopTypes } from '@/api/shopType'
import { getShopsByType } from '@/api/shop'

const route = useRoute()

// 与旧版一致：定位坐标写死
const COORD = { x: 120.149993, y: 30.334229 }

const types = ref([])
const shops = ref([])
const current = ref(1)
const loading = ref(false)
const finished = ref(false)
const sentinel = ref(null)
let observer = null

const typeId = ref(route.query.type || 1)
const typeName = ref(route.query.name || '')

async function load() {
  if (loading.value || finished.value) return
  loading.value = true
  try {
    const res = await getShopsByType({ typeId: typeId.value, current: current.value, ...COORD })
    const list = res.data || []
    shops.value = shops.value.concat(list)
    if (list.length === 0) finished.value = true
    else current.value++
  } catch (e) {
    finished.value = true
  } finally {
    loading.value = false
  }
}

async function reset() {
  shops.value = []
  current.value = 1
  finished.value = false
  await nextTick()
  load()
}

function switchType(t) {
  typeId.value = t.id
  typeName.value = t.name
  reset()
}

watch(() => route.query.type, (v) => {
  if (v && String(v) !== String(typeId.value)) {
    typeId.value = v
    typeName.value = route.query.name || ''
    reset()
  }
})

onMounted(async () => {
  const res = await getShopTypes().catch(() => null)
  if (res) types.value = res.data
  observer = new IntersectionObserver((e) => e[0].isIntersecting && load(), { rootMargin: '120px' })
  observer.observe(sentinel.value)
  load()
})
onBeforeUnmount(() => observer && observer.disconnect())
</script>

<style scoped>
.shop-list {
  min-height: 100dvh;
}
.filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cn-space-2);
  padding: var(--cn-space-3);
  margin: var(--cn-space-3) var(--cn-space-4);
}
.chip {
  padding: 5px 14px;
  font-size: 13px;
  border-radius: 16px;
  background: var(--cn-bg);
  color: var(--cn-text-2);
  cursor: pointer;
}
.chip.active {
  background: var(--cn-primary);
  color: #fff;
}
.list {
  padding: 0 var(--cn-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-3);
}
.sentinel {
  padding: var(--cn-space-4) 0;
  text-align: center;
  font-size: 12px;
  color: var(--cn-text-3);
}
</style>
