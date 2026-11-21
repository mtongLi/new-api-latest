import { useEffect, useState } from 'react'
import {
  fetchStatus,
  login,
  registerAccount,
  submitLoginCode,
  submitStepUpCode,
  wechatLogin,
  type LoginStep,
  type ServerStatus,
  type StoredAuth,
} from '../api/auth.js'

const LAST_SERVER = 'whaleclient:server'
/** 默认服务器；用户改过就以本地保存的为准 */
const DEFAULT_SERVER = ''

type Mode = 'login' | 'register' | 'wechat'

/** 登录流程里还要再输一次验证码的那一步 */
type CodeStep = Exclude<LoginStep, { kind: 'done' }>

export const Login = ({ onDone }: { onDone: (auth: StoredAuth) => void }) => {
  const [server, setServer] = useState(() => localStorage.getItem(LAST_SERVER) ?? DEFAULT_SERVER)
  const [mode, setMode] = useState<Mode>('login')
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<CodeStep | null>(null)
  /** 进入两步验证时是否是微信登录（微信登录没有密码可用于后续安全验证） */
  const [viaWechat, setViaWechat] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetchStatus(server)
      .then((value) => alive && setStatus(value))
      .catch(() => alive && setStatus(null))
    return () => {
      alive = false
    }
  }, [server])

  const canRegister = status?.register_enabled !== false && status?.password_register_enabled !== false
  const canWechat = Boolean(status?.wechat_login)

  /** 登录结果要么结束，要么进入下一个验证码步骤 */
  const advance = (next: LoginStep) => {
    if (next.kind === 'done') {
      onDone(next.auth)
      return
    }
    setStep(next)
    setCode('')
    setNotice(next.kind === 'stepUpCode' ? '为了授权此设备，请等验证器刷新后输入新的验证码' : '')
    setBusy(false)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setNotice('')
    setCode('')
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      localStorage.setItem(LAST_SERVER, server.trim())

      if (step?.kind === 'loginCode') {
        advance(await submitLoginCode(server, step.flowToken, code.trim(), viaWechat ? null : password))
        return
      }
      if (step?.kind === 'stepUpCode') {
        onDone(await submitStepUpCode(step.pending, code.trim()))
        return
      }

      if (mode === 'wechat') {
        if (!code.trim()) throw new Error('请输入微信验证码')
        setViaWechat(true)
        advance(await wechatLogin(server, code.trim()))
        return
      }

      if (mode === 'register') {
        if (password !== confirm) throw new Error('两次密码不一致')
        if (status?.turnstile_check) throw new Error('该站开启了人机验证，请在网页后台注册')
        await registerAccount(server, {
          username: username.trim(),
          password,
          email: status?.email_verification ? email.trim() : undefined,
          code: status?.email_verification ? code.trim() : undefined,
        })
        setNotice('注册成功，正在登录…')
        onDone(await expectAuth(login(server, username.trim(), password)))
        return
      }

      setViaWechat(false)
      advance(await login(server, username.trim(), password))
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const title = step ? '两步验证' : mode === 'register' ? '注册' : mode === 'wechat' ? '微信登录' : '登录'

  return (
    <div className="login">
      <div className="login-card">
        <div className="brand">
          <img className="brand-logo" src="brand-avatar.png" alt="" />
          <div className="brand-name">小虎鲸</div>
        </div>

        {step ? null : (
          <div className="tabs">
            <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => switchMode('login')}>
              登录
            </button>
            {canWechat ? (
              <button className={mode === 'wechat' ? 'tab active' : 'tab'} onClick={() => switchMode('wechat')}>
                微信登录
              </button>
            ) : null}
            <button
              className={mode === 'register' ? 'tab active' : 'tab'}
              disabled={!canRegister}
              onClick={() => switchMode('register')}
            >
              注册
            </button>
          </div>
        )}

        {mode === 'register' && !canRegister ? (
          <div className="error">该服务器未开放注册</div>
        ) : null}

        {step ? (
          <label className="field">
            <span>{step.kind === 'stepUpCode' ? '授权此设备：两步验证码' : '两步验证码'}</span>
            <input
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </label>
        ) : mode === 'wechat' ? (
          <>
            {status?.wechat_qrcode ? (
              <img className="wechat-qr" src={status.wechat_qrcode} alt="微信公众号二维码" />
            ) : null}
            <p className="wechat-hint">扫描二维码关注公众号，回复“验证码”以接收验证码。</p>
            <label className="field">
              <span>微信验证码</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>用户名</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="field">
              <span>密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && mode === 'login' && submit()}
              />
            </label>
            {mode === 'register' ? (
              <>
                <label className="field">
                  <span>确认密码</span>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </label>
                {status?.email_verification ? (
                  <>
                    <label className="field">
                      <span>邮箱</span>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                    <label className="field">
                      <span>邮箱验证码</span>
                      <input value={code} onChange={(e) => setCode(e.target.value)} />
                    </label>
                  </>
                ) : null}
              </>
            ) : null}
          </>
        )}

        {error ? <div className="error">{error}</div> : null}
        {notice ? <div className="notice">{notice}</div> : null}

        <button className="primary" disabled={busy || (mode === 'register' && !canRegister)} onClick={submit}>
          {busy ? '处理中…' : step ? '验证' : title}
        </button>
        {step ? (
          <button
            className="link-button"
            disabled={busy}
            onClick={() => {
              setStep(null)
              setCode('')
              setError('')
              setNotice('')
            }}
          >
            返回
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** 注册后自动登录；新账号不会有两步验证，遇到了就让用户回登录页 */
const expectAuth = async (pending: Promise<LoginStep>): Promise<StoredAuth> => {
  const result = await pending
  if (result.kind !== 'done') throw new Error('该账号开启了两步验证，请回到登录页验证')
  return result.auth
}
