/**
 * 登录与个人访问令牌（PAT）。
 * 密码或微信登录 → 安全验证 → 建 PAT → 注销临时会话。
 */
import { ensureApiKey, forgetApiKey } from './chat.js'
import { ApiError, normalizeServer, request } from './http.js'

/** usage:read、wallet:read 给用量与余额页用 */
export const PAT_SCOPES = [
  'api_key:read',
  'api_key:reveal',
  'api_key:write',
  'profile:read',
  'profile:write',
  'usage:read',
  'wallet:read',
  'account_security:write',
]
const PAT_LIFETIME_SECONDS = 90 * 24 * 3600

export type StoredAuth = {
  server: string
  token: string
  expiresAt: number
  user?: { id?: number; username?: string; display_name?: string; quota?: number }
  /** 没有长期令牌，只缓存了 API Key（见 keyOnlyAuth）：能聊天，不能调管理接口 */
  keyOnly?: boolean
  /** PAT 的权限；旧版本登录保存的凭证没有这个字段 */
  scopes?: string[]
}

/** 旧凭证不记录 scopes，一律视为没有，需要重新登录换新 PAT */
export const hasScope = (auth: StoredAuth, scope: string): boolean => Boolean(auth.scopes?.includes(scope))

const STORAGE_KEY = 'whaleclient:auth'

export const loadAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

export const saveAuth = (auth: StoredAuth): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export const clearAuth = (): void => {
  localStorage.removeItem(STORAGE_KEY)
  // 头像缓存跟账号走，换账号登录不能沿用上一个人的
  localStorage.removeItem(AVATAR_KEY)
}

type EncryptionKey = { enabled: boolean; kid?: string; public_key?: string }

/** 服务端开启密码加密时用 RSA-OAEP 加密；否则明文，靠 HTTPS 保护 */
const encryptPassword = async (server: string, password: string): Promise<Record<string, string>> => {
  const key = await request<EncryptionKey>(server, '/api/user/login/encryption-key', { method: 'GET' })
  if (!key?.enabled || !key.kid || !key.public_key) {
    return { password }
  }
  const pem = key.public_key
  const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
  const cipher = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, cryptoKey, new TextEncoder().encode(password))
  return { password_encrypted: btoa(String.fromCharCode(...new Uint8Array(cipher))), encryption_key_id: key.kid }
}

type LoginResponse = {
  access_token?: string
  require_verification?: boolean
  flow_token?: string
  methods?: { method: string; available: boolean }[]
}

/** 拿到临时会话、还没换成长期令牌时的中间状态 */
export type PendingSession = { server: string; sessionToken: string }

/**
 * 登录的下一步：
 * - done：已登录
 * - loginCode：账号开了两步验证，登录本身要验证码
 * - stepUpCode：创建长期令牌要再验证一次。method 为 2fa 时输入新的两步验证码；
 *   为 wechat 时（纯微信账号）在公众号再获取一个验证码。同一个验证码都不能重复用
 */
export type LoginStep =
  | { kind: 'done'; auth: StoredAuth }
  | { kind: 'loginCode'; flowToken: string }
  | { kind: 'stepUpCode'; pending: PendingSession; method: StepUpMethod }

/** 服务端开启 Turnstile 时，new-api 从查询参数 turnstile 读取 token */
const withTurnstile = (path: string, turnstile?: string): string =>
  turnstile ? `${path}?turnstile=${encodeURIComponent(turnstile)}` : path

export const login = async (
  rawServer: string,
  username: string,
  password: string,
  turnstile?: string
): Promise<LoginStep> => {
  const server = normalizeServer(rawServer)
  const passwordBody = await encryptPassword(server, password)
  const result = await request<LoginResponse>(server, withTurnstile('/api/user/login', turnstile), {
    method: 'POST',
    json: { username, ...passwordBody },
  })
  return afterLogin(server, result, password)
}

/** 微信公众号验证码登录：用户关注公众号并回复「验证码」拿到 code；首次登录会自动注册 */
export const wechatLogin = async (rawServer: string, code: string): Promise<LoginStep> => {
  const server = normalizeServer(rawServer)
  const result = await request<LoginResponse>(server, `/api/oauth/wechat?code=${encodeURIComponent(code)}`, {
    method: 'GET',
  })
  return afterLogin(server, result, null)
}

/** password 为 null 表示不是密码登录（如微信），之后不会用密码做安全验证 */
export const submitLoginCode = async (
  rawServer: string,
  flowToken: string,
  code: string,
  password: string | null
): Promise<LoginStep> => {
  const server = normalizeServer(rawServer)
  const result = await request<LoginResponse>(server, '/api/user/login/verify', {
    method: 'POST',
    json: { flow_token: flowToken, method: '2fa', code },
  })
  return afterLogin(server, result, password)
}

export type StepUpMethod = '2fa' | 'wechat'

export const submitStepUpCode = async (
  pending: PendingSession,
  method: StepUpMethod,
  code: string
): Promise<StoredAuth> => createAccessToken(pending, { method, code })

const afterLogin = async (server: string, result: LoginResponse, password: string | null): Promise<LoginStep> => {
  if (result.require_verification) {
    if (!result.flow_token) throw new ApiError('登录响应缺少 flow_token')
    if (!(result.methods ?? []).some((m) => m.method === '2fa' && m.available)) {
      throw new ApiError('该账号需要 Passkey 验证登录，暂不支持，请先在网页控制台启用两步验证')
    }
    return { kind: 'loginCode', flowToken: result.flow_token }
  }
  if (!result.access_token) throw new ApiError('登录响应缺少 access_token')
  return exchangeSession({ server, sessionToken: result.access_token }, password)
}

/**
 * 用临时会话（15 分钟）换长期令牌（PAT）。创建 PAT 需要一次安全验证：
 * 能用密码就用密码，账号开了 2FA 就再要一次验证码。
 * 两样都没有时（典型是微信注册、没设密码的账号，后端的第三方验证不含微信），
 * 退而用临时会话直接取 API Key，只能聊天，不能看用量。
 */
const exchangeSession = async (pending: PendingSession, password: string | null): Promise<LoginStep> => {
  const requirements = await request<{ methods: { method: string; available: boolean }[] }>(
    pending.server,
    '/api/verify/methods?scope=access_token.generate',
    { method: 'GET', bearer: pending.sessionToken }
  )
  const available = new Set((requirements.methods ?? []).filter((m) => m.available).map((m) => m.method))
  if (password !== null && available.has('password')) {
    const passwordBody = await encryptPassword(pending.server, password)
    return { kind: 'done', auth: await createAccessToken(pending, { method: 'password', ...passwordBody }) }
  }
  if (available.has('2fa')) {
    return { kind: 'stepUpCode', pending, method: '2fa' }
  }
  // 纯微信账号（没有密码、2FA、Passkey）用新的公众号验证码授权
  if (available.has('wechat')) {
    return { kind: 'stepUpCode', pending, method: 'wechat' }
  }
  return { kind: 'done', auth: await keyOnlyAuth(pending) }
}

const createAccessToken = async (pending: PendingSession, verification: Record<string, unknown>): Promise<StoredAuth> => {
  const { server, sessionToken } = pending
  // 安全证明绑定了这组 scopes 和过期时间，两个请求必须一致
  const scopes = [...PAT_SCOPES].sort()
  const expiresAt = Math.floor(Date.now() / 1000) + PAT_LIFETIME_SECONDS
  const context = { scopes, expires_at: expiresAt }

  const proof = await request<{ proof_token: string }>(server, '/api/verify', {
    method: 'POST',
    bearer: sessionToken,
    json: { scope: 'access_token.generate', context, ...verification },
  })

  const created = await request<{ token: string }>(server, '/api/user/access_tokens', {
    method: 'POST',
    bearer: sessionToken,
    headers: { 'X-Security-Proof': proof.proof_token },
    json: { name: `小虎鲸 Web · ${navigator.platform || 'browser'}`, scopes, expires_at: expiresAt },
  })

  await endSession(pending)
  forgetApiKey()
  const auth: StoredAuth = { server, token: created.token, expiresAt, scopes }
  saveAuth(auth)
  return auth
}

/** 无法创建 PAT 时，趁临时会话还有效取到 API Key 并缓存，然后注销会话 */
const keyOnlyAuth = async (pending: PendingSession): Promise<StoredAuth> => {
  forgetApiKey()
  await ensureApiKey({ server: pending.server, token: pending.sessionToken, expiresAt: 0 })
  await endSession(pending)
  const auth: StoredAuth = { server: pending.server, token: '', expiresAt: 0, keyOnly: true }
  saveAuth(auth)
  return auth
}

const endSession = async ({ server, sessionToken }: PendingSession): Promise<void> => {
  await request(server, '/api/user/auth/logout', {
    method: 'POST',
    bearer: sessionToken,
  }).catch(() => undefined)
}

export const fetchSelf = async (auth: StoredAuth): Promise<StoredAuth['user']> => {
  if (auth.keyOnly) return undefined
  const data = await request<StoredAuth['user']>(auth.server, '/api/user/self', {
    method: 'GET',
    bearer: auth.token,
  })
  return data
}

export type ServerStatus = {
  register_enabled?: boolean
  password_register_enabled?: boolean
  email_verification?: boolean
  turnstile_check?: boolean
  turnstile_site_key?: string
  wechat_login?: boolean
  wechat_qrcode?: string
}

export const fetchStatus = async (rawServer: string): Promise<ServerStatus> => {
  const server = normalizeServer(rawServer)
  return request<ServerStatus>(server, '/api/status', { method: 'GET' })
}

export type RegisterInput = {
  username: string
  password: string
  email?: string
  code?: string
  affCode?: string
  turnstile?: string
}

/** 注册后不会自动登录，服务端只返回成功 */
export const registerAccount = async (rawServer: string, input: RegisterInput): Promise<void> => {
  const server = normalizeServer(rawServer)
  await request(server, withTurnstile('/api/user/register', input.turnstile), {
    method: 'POST',
    json: {
      username: input.username,
      password: input.password,
      ...(input.email ? { email: input.email } : {}),
      ...(input.code ? { verification_code: input.code } : {}),
      ...(input.affCode ? { aff_code: input.affCode } : {}),
    },
  })
}


/** 修改用户名 */
export const updateUsername = async (auth: StoredAuth, username: string): Promise<void> => {
  await request(auth.server, '/api/user/self', {
    method: 'PUT',
    bearer: auth.token,
    json: { username },
  })
}

/** 修改密码：先用当前密码拿安全凭证，再提交新密码 */
export const changePassword = async (
  auth: StoredAuth,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const proof = await request<{ proof_token?: string }>(auth.server, '/api/verify', {
    method: 'POST',
    bearer: auth.token,
    json: {
      method: 'password',
      scope: 'account.password.change',
      context: {},
      password: currentPassword,
    },
  })
  const token = proof?.proof_token
  if (!token) throw new Error('验证失败')
  await request(auth.server, '/api/user/self', {
    method: 'PUT',
    bearer: auth.token,
    json: { password: newPassword },
    headers: { 'X-Security-Proof': token },
  })
}

/** 上传头像到服务端，返回头像路径 */
export const uploadAvatar = async (auth: StoredAuth, file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(auth.server + '/api/user/avatar', {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
    body: form,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `HTTP ${res.status}`)
  }
  return body?.data?.avatar as string
}

/** 本地头像缓存（服务端路径或 dataURL） */
const AVATAR_KEY = 'whaleclient:avatar'

/** 服务端返回的是 /avatars/... 相对路径，要拼上后端地址；客户端页面和后端不同源（开发服务器、APK 内 file://） */
export const readAvatar = (): string | null => {
  try {
    const value = localStorage.getItem(AVATAR_KEY)
    if (!value?.startsWith('/')) return value
    const server = loadAuth()?.server
    return server ? server + value : value
  } catch {
    return null
  }
}

export const saveAvatar = (dataUrl: string): void => {
  localStorage.setItem(AVATAR_KEY, dataUrl)
}
