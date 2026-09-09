import request from '@/utils/request'

// 上传接口 multipart field 名必须是 file；返回 data 形如 /blogs/x/y/uuid.jpg
export const uploadBlogImage = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return request.post('/upload/blog', fd)
}

export const deleteBlogImage = (name) => request.get('/upload/blog/delete', { params: { name } })
