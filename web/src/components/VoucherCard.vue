<template>
  <div class="voucher cn-card">
    <div class="left">
      <div class="price">
        <span class="cur">¥</span><span class="val cn-num">{{ (voucher.actualValue / 100).toFixed(0) }}</span>
      </div>
      <div class="pay">购 ¥{{ (voucher.payValue / 100).toFixed(0) }}</div>
    </div>
    <div class="mid">
      <p class="title cn-ellipsis">{{ voucher.title }}</p>
      <p class="sub cn-ellipsis">{{ voucher.subTitle }}</p>
      <p class="time" v-if="isSeckill">{{ timeText }}</p>
    </div>
    <div class="right">
      <el-button
        v-if="isSeckill"
        type="primary"
        size="small"
        round
        :disabled="!canSeckill"
        @click="$emit('seckill', voucher)"
      >
        {{ btnText }}
      </el-button>
      <!-- 与旧版一致：普通券显示禁用占位按钮，后端无普通券下单接口 -->
      <el-button v-else size="small" round disabled>抢购</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ voucher: { type: Object, required: true } })
defineEmits(['seckill'])

const isSeckill = computed(() => props.voucher.type === 1 && props.voucher.beginTime)

const status = computed(() => {
  if (!isSeckill.value) return 'normal'
  const now = Date.now()
  if (new Date(props.voucher.beginTime).getTime() > now) return 'notBegin'
  if (new Date(props.voucher.endTime).getTime() < now) return 'end'
  if (!props.voucher.stock || props.voucher.stock < 1) return 'soldOut'
  return 'seckill'
})

const canSeckill = computed(() => status.value === 'seckill')
const btnTextMap = { notBegin: '未开始', end: '已结束', soldOut: '已抢光', seckill: '抢购' }
const btnText = computed(() => btnTextMap[status.value] || '抢购')

function fmt(t) {
  const d = new Date(t)
  const p = (n) => (n < 10 ? '0' + n : n)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`
}
const timeText = computed(() => `${fmt(props.voucher.beginTime)} 开抢`)
</script>

<style scoped>
.voucher {
  display: flex;
  align-items: center;
  gap: var(--cn-space-3);
  padding: var(--cn-space-3);
}
.left {
  flex: 0 0 68px;
  text-align: center;
  color: var(--cn-primary);
}
.price .cur {
  font-size: 13px;
}
.price .val {
  font-size: 26px;
  font-weight: 700;
}
.pay {
  font-size: 11px;
  color: var(--cn-text-3);
}
.mid {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 14px;
  font-weight: 600;
}
.sub {
  font-size: 12px;
  color: var(--cn-text-2);
  margin-top: 2px;
}
.time {
  font-size: 11px;
  color: var(--cn-accent);
  margin-top: 2px;
}
</style>
