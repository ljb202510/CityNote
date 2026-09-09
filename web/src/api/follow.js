import request from '@/utils/request'

// isFollow: true 关注 / false 取关
export const followUser = (id, isFollow) => request.put(`/follow/${id}/${isFollow}`)
export const isFollowed = (id) => request.get(`/follow/or/not/${id}`)
export const getCommonFollows = (id) => request.get(`/follow/common/${id}`)
