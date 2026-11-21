/**
 * 品牌信息：APK 打包时由本机服务注入到 window 上，不同变体显示不同名称与头像。
 * 未注入时退回默认值（浏览器里直接打开 dist 时使用）。
 */
type Brand = {
  /** 侧边栏顶部名称 */
  name: string
  /** 头像图片地址（APK 内为 /brand-avatar.png） */
  avatar: string
  /** 左下角账号名 */
  account: string
}

const injected = (globalThis as unknown as { __BRAND__?: Partial<Brand> }).__BRAND__

export const brand: Brand = {
  name: injected?.name || '小虎鲸',
  avatar: injected?.avatar || 'brand-avatar.png',
  account: injected?.account || '',
}
