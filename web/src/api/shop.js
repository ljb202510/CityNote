import request from '@/utils/request'

export const getShop = (id) => request.get(`/shop/${id}`)
// 后端仅支持 typeId / current / x / y
export const getShopsByType = (params) => request.get('/shop/of/type', { params })
export const searchShopByName = (name, current = 1) =>
  request.get('/shop/of/name', { params: { name, current } })
