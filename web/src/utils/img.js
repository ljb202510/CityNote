const DEFAULT_ICON = '/imgs/icons/default-icon.png'

/**
 * 把后端返回的图片路径转成浏览器可访问的 URL。
 * 兼容三种形态：
 *  1. 绝对 URL（http/https）—— 原样返回
 *  2. 已带 /imgs 前缀（tb_blog / tb_user 中的历史数据）—— 原样返回
 *  3. 上传接口返回的 /blogs/x/y/uuid.jpg —— 补 /imgs 前缀
 */
export function resolveImg(path) {
  if (!path) return DEFAULT_ICON
  if (/^(https?:)?\/\//.test(path)) return path
  if (path.startsWith('/imgs')) return path
  if (path.startsWith('/')) return '/imgs' + path
  return '/imgs/' + path
}

/** 逗号分隔的多图字符串 → 可访问 URL 数组 */
export function resolveImgs(images) {
  if (!images) return []
  return images.split(',').filter(Boolean).map(resolveImg)
}

export { DEFAULT_ICON }
