import request from '@/utils/request'

export const getShopTypes = () => request.get('/shop-type/list')
