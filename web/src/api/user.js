import request from '@/utils/request'

// 注意：phone 是 query 参数，不是 body
export const sendCode = (phone) => request.post('/user/code', null, { params: { phone } })
export const login = (data) => request.post('/user/login', data)
export const logout = () => request.post('/user/logout')
export const getMe = () => request.get('/user/me')
export const getUserInfo = (id) => request.get(`/user/info/${id}`)
export const getUser = (id) => request.get(`/user/${id}`)
