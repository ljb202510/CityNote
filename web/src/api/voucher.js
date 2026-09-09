import request from '@/utils/request'

export const getVouchersOfShop = (shopId) => request.get(`/voucher/list/${shopId}`)
