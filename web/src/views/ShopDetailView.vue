<template>
  <div class="shop-detail">
    <AppNavBar title="店铺详情" />

    <div class="content" v-if="shop.id">
      <ImagePreview :images="images" />

      <div class="head cn-card">
        <h1>{{ shop.name }}</h1>
        <div class="rate">
          <el-rate :model-value="shop.score / 10" disabled allow-half size="small" />
          <span class="cn-num score">{{ (shop.score / 10).toFixed(1) }}</span>
          <span class="cn-num comments">{{ shop.comments }}条</span>
        </div>
        <div class="meta">
          <span>口味{{ (shop.score / 10).toFixed(1) }}</span>
          <span>环境{{ (shop.score / 10).toFixed(1) }}</span>
          <span>服务{{ (shop.score / 10).toFixed(1) }}</span>
        </div>
        <p class="area">{{ shop.area }}</p>
        <p class="addr">{{ shop.address }}</p>
        <p class="open">营业时间 {{ shop.openHours }}</p>
      </div>

      <div class="section">
        <h2>代金券</h2>
        <div class="vouchers" v-if="vouchers.length">
          <VoucherCard v-for="v in vouchers" :key="v.id" :voucher="v" @seckill="doSeckill" />
        </div>
        <EmptyState v-else text="暂无优惠券" />
      </div>

      <!-- 按需求保留旧版写死的假数据评价区 -->
      <div class="section">
        <h2>网友评价（119）</h2>
        <div class="tags">
          <span class="tag" v-for="t in tags" :key="t">{{ t }}</span>
        </div>
        <div class="comment cn-card" v-for="i in 3" :key="i">
          <div class="c-user">叶小乙 <span class="lv">Lv5</span></div>
          <div class="c-rate">打分 <el-rate :model-value="4.5" disabled allow-half size="small" /></div>
          <p class="c-text">某平台上买的券，价格可以当工作餐吃，虽然价格便宜，但是这家店一点都没有…</p>
        </div>
        <p class="c-more">查看全部 119 条评价</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppNavBar from '@/components/AppNavBar.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import VoucherCard from '@/components/VoucherCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getShop } from '@/api/shop'
import { getVouchersOfShop } from '@/api/voucher'
import { seckillVoucher } from '@/api/voucherOrder'
import { resolveImgs } from '@/utils/img'

const route = useRoute()
const shop = ref({})
const vouchers = ref([])
const tags = ['味道赞(19)', '牛肉赞(16)', '菜品不错(11)', '回头客(4)', '分量足(4)', '停车方便(3)']

const images = computed(() => resolveImgs(shop.value.images))

async function doSeckill(v) {
  try {
    const res = await seckillVoucher(v.id)
    ElMessage.success('抢购成功，订单号：' + res.data)
  } catch (e) {
    // 库存/秒杀数据缺失等错误由拦截器统一 toast
  }
}

onMounted(async () => {
  const id = route.params.id
  const res = await getShop(id)
  shop.value = res.data
  const v = await getVouchersOfShop(id).catch(() => null)
  if (v) vouchers.value = v.data || []
})
</script>

<style scoped>
.content {
  padding: var(--cn-space-3) var(--cn-space-4) var(--cn-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-4);
}
.head {
  padding: var(--cn-space-4);
}
.head h1 {
  font-size: 19px;
}
.rate {
  display: flex;
  align-items: center;
  gap: var(--cn-space-2);
  margin-top: var(--cn-space-2);
}
.score {
  color: var(--cn-accent);
  font-weight: 600;
}
.comments {
  font-size: 12px;
  color: var(--cn-text-3);
}
.meta {
  display: flex;
  gap: var(--cn-space-3);
  margin-top: var(--cn-space-2);
  font-size: 12px;
  color: var(--cn-text-2);
}
.area {
  margin-top: var(--cn-space-2);
  font-size: 12px;
  color: var(--cn-text-3);
}
.addr,
.open {
  margin-top: 4px;
  font-size: 13px;
  color: var(--cn-text-2);
}
.section h2 {
  font-size: 16px;
  margin-bottom: var(--cn-space-3);
}
.vouchers {
  display: flex;
  flex-direction: column;
  gap: var(--cn-space-3);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cn-space-2);
  margin-bottom: var(--cn-space-3);
}
.tag {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 14px;
  background: var(--cn-primary-light);
  color: var(--cn-primary);
}
.comment {
  padding: var(--cn-space-3);
  margin-bottom: var(--cn-space-3);
}
.c-user {
  font-size: 14px;
  font-weight: 600;
}
.lv {
  font-size: 11px;
  color: var(--cn-accent);
  margin-left: 4px;
}
.c-rate {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--cn-text-3);
  margin: 4px 0;
}
.c-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--cn-text-1);
}
.c-more {
  text-align: center;
  font-size: 13px;
  color: var(--cn-text-3);
  padding-top: var(--cn-space-2);
  border-top: 1px solid var(--cn-divider);
}
</style>
