import request from '@/utils/request'

export const saveBlog = (data) => request.post('/blog', data)
// toggle 语义：未赞则赞，已赞则取消
export const toggleLike = (id) => request.put(`/blog/like/${id}`)
export const getMyBlogs = (current = 1) => request.get('/blog/of/me', { params: { current } })
export const getHotBlogs = (current = 1) => request.get('/blog/hot', { params: { current } })
export const getBlogById = (id) => request.get(`/blog/${id}`)
export const getBlogLikes = (id) => request.get(`/blog/likes/${id}`)
export const getBlogsOfUser = (id, current = 1) =>
  request.get('/blog/of/user', { params: { id, current } })
// 基于 GTE 的滚动分页：lastId + offset；返回 { list, ...params }
export const getFollowBlogs = (lastId, offset = 0) =>
  request.get('/blog/of/follow', { params: { lastId, offset } })
