import request from '@/utils/request'

export const seckillVoucher = (voucherId) => request.post(`/voucher-order/seckill/${voucherId}`)
