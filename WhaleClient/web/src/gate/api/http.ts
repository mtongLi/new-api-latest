/** 统一的 HTTP 封装：处理 new-api 的 {success, message, data} 包装 */
import { rateLimitMessage, translateServerMessage } from './messages.js'

export type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
  /** 后端错误的英文原文 key，用来翻译和判断是哪类错误 */
  message_key?: string
  message_params?: Record<string, unknown>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** 后端的 message_key，界面据此把错误放到对应输入框下 */
    readonly key?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 把失败响应转成中文 ApiError。
 * 支付接口的失败是 {message: "error", data: 原文}，其他接口是 {success: false, message: 原文}。
 */
export const responseError = (response: Response, body: ApiEnvelope<unknown> | null): ApiError => {
  if (response.status === 429) return new ApiError(rateLimitMessage(response.headers.get('Retry-After')), 429)
  const original = body?.message === 'error' && typeof body.data === 'string' ? body.data : body?.message
  const message =
    translateServerMessage(body?.message_key, body?.message_params) || original || `HTTP ${response.status}`
  return new ApiError(message, response.status, body?.message_key)
}

export const normalizeServer = (input: string): string => {
  const raw = input.trim()
  // 留空 = 与页面同源（走自带代理）
  if (!raw) return location.origin
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withScheme.replace(/\/+$/, '')
}

export const request = async <T>(
  server: string,
  path: string,
  init: RequestInit & { bearer?: string; json?: unknown } = {}
): Promise<T> => {
  const { bearer, json, headers, ...rest } = init
  const finalHeaders = new Headers(headers)
  if (json !== undefined) finalHeaders.set('Content-Type', 'application/json')
  if (bearer) finalHeaders.set('Authorization', `Bearer ${bearer}`)

  let response: Response
  try {
    response = await fetch(`${server}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  } catch (error) {
    throw new ApiError(`连不上服务器：${(error as Error).message}`)
  }

  const text = await response.text()
  let body: ApiEnvelope<T> | null = null
  try {
    body = text ? (JSON.parse(text) as ApiEnvelope<T>) : null
  } catch {
    if (response.status === 429) throw responseError(response, null)
    throw new ApiError(text.slice(0, 200) || `HTTP ${response.status}`, response.status)
  }

  if (!response.ok || body?.success === false) {
    const fallback =
      response.status === 429
        ? '请求太频繁，请稍等一会儿再试'
        : response.status === 401
          ? '用户名或密码不正确'
          : response.status >= 500
            ? '服务暂时不可用，请稍后再试'
            : `HTTP ${response.status}`
    throw new ApiError(body?.message || fallback, response.status)
  }
  return (body?.data ?? (body as unknown)) as T
}

export const requestRaw = async (
  server: string,
  path: string,
  init: RequestInit & { bearer?: string } = {}
): Promise<Response> => {
  const headers = new Headers(init.headers)
  if (init.bearer) headers.set('Authorization', `Bearer ${init.bearer}`)
  return fetch(`${server}${path}`, { ...init, headers })
}
