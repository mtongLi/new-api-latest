import { useEffect, useMemo, useState } from 'react'
import { fetchSelf, loadAuth } from '../api/auth.js'
import { request } from '../api/http.js'
import { signOut } from '../session.js'
import { Recharge } from './Recharge.js'

type Self = { username?: string; quota?: number; used_quota?: number; request_count?: number }
type LogRow = {
  created_at: number
  model_name?: string
  prompt_tokens?: number
  completion_tokens?: number
  quota?: number
}
type Status = { quota_per_unit?: number; usd_exchange_rate?: number; quota_display_type?: string }
type LogPage = { items?: LogRow[]; total?: number }
type QuotaRow = { created_at: number; quota?: number; token_used?: number; model_name?: string }

const DAY = 86_400_000
const pad = (value: number) => String(value).padStart(2, '0')
const dayKey = (seconds: number) => {
  const date = new Date(seconds * 1000)
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
}

const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="2" y="9" width="3" height="5" rx="1" fill="currentColor" />
    <rect x="6.5" y="5" width="3" height="9" rx="1" fill="currentColor" />
    <rect x="11" y="2" width="3" height="12" rx="1" fill="currentColor" />
  </svg>
)

const IconKey = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="5.4" cy="10.6" r="2.6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M7.2 8.8 13 3M11 5l1.6 1.6M9.2 6.8l1.6 1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const IconWallet = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="11" cy="9.8" r="1" fill="currentColor" />
  </svg>
)

const IconBill = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3.5 2.5h9v11l-2-1.4-2.5 1.4L5.5 12l-2 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M5.8 6h4.4M5.8 8.4h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
)

const IconChat = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M2.5 4.2c0-.9.7-1.7 1.6-1.7h7.8c.9 0 1.6.8 1.6 1.7v5c0 .9-.7 1.7-1.6 1.7H7l-3.2 2.4v-2.4h-.3c-.6 0-1-.5-1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

const formatCny = (value: number) => (value > 0 && value < 0.01 ? '<¥0.01' : `¥${value.toFixed(2)}`)

/** 近 30 天每日消耗折线 + 柱状 */
const Chart = ({
  rows,
  unit,
  rate,
}: {
  rows: QuotaRow[]
  unit: number
  rate: number
}) => {
  const [mode, setMode] = useState<'type' | 'key'>('type')

  const series = useMemo(() => {
    const today = new Date()
    const points: { key: string; value: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * DAY)
      const key = `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000
      const end = start + 86400
      const value = rows
        .filter((row) => row.created_at >= start && row.created_at < end)
        .reduce((sum, row) => sum + (row.quota ?? 0), 0)
      points.push({ key, value: (value / unit) * rate })
    }
    return points
  }, [rows, unit, rate])

  const max = Math.max(0.0001, ...series.map((item) => item.value))
  const total = series.reduce((sum, item) => sum + item.value, 0)
  const width = 900
  const height = 240
  const left = 56
  const bottom = 28
  const plotW = width - left - 12
  const plotH = height - bottom - 12
  const step = plotW / series.length

  const ticks = [max, max / 2, 0]
  const path = series
    .map((item, index) => {
      const x = left + index * step + step / 2
      const y = 12 + plotH - (item.value / max) * plotH
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const area = `${path} L${left + plotW - step / 2} ${12 + plotH} L${left + step / 2} ${12 + plotH} Z`

  return (
    <div className="pf-chart-card">
      <div className="pf-chart-head">
        <div>
          <span className="pf-chart-title">消费金额（CNY）</span>
          <span className="pf-chart-total">{formatCny(total)}</span>
        </div>
        <div className="pf-seg">
          <button type="button" className={mode === 'type' ? 'on' : ''} onClick={() => setMode('type')}>
            调用类型
          </button>
          <button type="button" className={mode === 'key' ? 'on' : ''} onClick={() => setMode('key')}>
            API Key
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="pf-chart-svg" role="img">
        <defs>
          <linearGradient id="pfArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8c42" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff8c42" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {ticks.map((tick, index) => {
          const y = 12 + (plotH / (ticks.length - 1)) * index
          return (
            <g key={index}>
              <line x1={left} y1={y} x2={width - 12} y2={y} stroke="#2c2f35" strokeWidth="1" />
              <text x={left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#7d838c">
                {tick === 0 ? '0' : tick.toFixed(3)}
              </text>
            </g>
          )
        })}
        <path d={area} fill="url(#pfArea)" />
        <path d={path} fill="none" stroke="#ff8c42" strokeWidth="1.6" />
        {series.map((item, index) => {
          if (item.value === 0) return null
          const x = left + index * step + step / 2
          const y = 12 + plotH - (item.value / max) * plotH
          return <circle key={item.key} cx={x} cy={y} r="2.4" fill="#ff8c42" />
        })}
        {[0, 10, 20, 29].map((index) => (
          <text key={index} x={left + index * step + step / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="#7d838c">
            {series[index]?.key}
          </text>
        ))}
      </svg>
    </div>
  )
}

const Recharge = ({
  auth,
  startQuota,
  onClose,
  onPaid,
}: {
  auth: NonNullable<ReturnType<typeof loadAuth>>
  startQuota: number
  onClose: () => void
  onPaid: () => void
}) => {
  type Method = { name: string; type: string }
  const [info, setInfo] = useState<{ pay_methods?: Method[]; min_topup?: number } | null>(null)
  const [amount, setAmount] = useState('10')
  const [method, setMethod] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'paid' | 'timeout'>('idle')

  useEffect(() => {
    request<{ pay_methods?: Method[]; min_topup?: number }>(auth.server, '/api/user/topup/info', {
      method: 'GET',
      bearer: auth.token,
    })
      .then((value) => {
        setInfo(value ?? {})
        setMethod(value?.pay_methods?.[0]?.type ?? '')
      })
      .catch(() => setInfo({}))
  }, [auth])

  /** 支付页在新窗口；本页轮询余额，到账后提示，不跳控制台 */
  const waitForPayment = () => {
    setStatus('waiting')
    const started = Date.now()
    const timer = window.setInterval(async () => {
      try {
        const profile = await fetchSelf(auth)
        if ((profile?.quota ?? 0) > startQuota) {
          window.clearInterval(timer)
          setStatus('paid')
          onPaid()
          return
        }
      } catch {
        // 单次失败忽略
      }
      if (Date.now() - started > 5 * 60 * 1000) {
        window.clearInterval(timer)
        setStatus('timeout')
      }
    }, 5000)
  }

  const pay = async () => {
    setBusy(true)
    setError('')
    try {
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) throw new Error('请输入有效金额')
      const result = await request<{ url?: string }>(auth.server, '/api/user/pay', {
        method: 'POST',
        bearer: auth.token,
        json: { amount: value, payment_method: method },
      })
      if (!result?.url) throw new Error('服务端没有返回支付地址')
      window.open(result.url, '_blank', 'noopener')
      waitForPayment()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const methods = info?.pay_methods ?? []

  return (
    <div className="usage-mask" onClick={onClose}>
      <div className="usage-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="usage-dialog-title">充值</div>

        {info && methods.length === 0 ? (
          <>
            <div className="usage-dialog-note">
              管理员还没有开启在线充值。请把用户名发给管理员，由管理员给账号加额度。
            </div>
            <button type="button" className="usage-dialog-close" onClick={onClose}>
              知道了
            </button>
          </>
        ) : status === 'waiting' || status === 'timeout' ? (
          <>
            <div className="usage-dialog-note">
              支付页已打开。付款完成后回到这里，余额会自动刷新，请不要关闭本页。
            </div>
            {status === 'timeout' ? <div className="usage-dialog-error">等待超时，刷新页面再看余额</div> : null}
            <button type="button" className="usage-dialog-close" onClick={onClose}>
              关闭
            </button>
          </>
        ) : status === 'paid' ? (
          <>
            <div className="usage-dialog-note">充值已到账，余额已更新。</div>
            <button type="button" className="usage-dialog-close" onClick={onClose}>
              好
            </button>
          </>
        ) : (
          <>
            <label className="usage-field">
              <span>金额（元）</span>
              <input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} />
            </label>
            <div className="usage-field">
              <span>支付方式</span>
              <div className="usage-methods">
                {methods.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={method === item.type ? 'usage-method on' : 'usage-method'}
                    onClick={() => setMethod(item.type)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            {error ? <div className="usage-dialog-error">{error}</div> : null}
            <button type="button" className="usage-dialog-pay" disabled={busy} onClick={pay}>
              {busy ? '处理中…' : '去支付'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export const Usage = () => {
  // 只读一次：每次渲染新建对象会让下面的 effect 反复请求
  const [auth] = useState(loadAuth)
  const [self, setSelf] = useState<Self | null>(null)
  const [status, setStatus] = useState<Status>({})
  const [logs, setLogs] = useState<LogRow[]>([])
  const [quotaRows, setQuotaRows] = useState<QuotaRow[]>([])
  const [range, setRange] = useState(30)
  const [recharging, setRecharging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    if (auth.keyOnly) {
      setError('本设备还没有完成授权，暂时无法查看用量。请点下方「重新登录」，微信登录时按提示在公众号再获取一次验证码即可完成授权。')
      return
    }
    let alive = true
    const now = Math.floor(Date.now() / 1000)
    ;(async () => {
      try {
        const [profile, site, page, data] = await Promise.all([
          fetchSelf(auth),
          request<Status>(auth.server, '/api/status', { method: 'GET' }).catch(() => ({}) as Status),
          request<LogPage>(auth.server, '/api/log/self?p=1&size=100', { method: 'GET', bearer: auth.token }),
          request<QuotaRow[]>(
            auth.server,
            `/api/data/self?start_timestamp=${now - 30 * 86400}&end_timestamp=${now}`,
            { method: 'GET', bearer: auth.token }
          ).catch(() => []),
        ])
        if (!alive) return
        setSelf((profile ?? {}) as Self)
        setStatus(site ?? {})
        setLogs(page?.items ?? [])
        setQuotaRows(Array.isArray(data) ? data : [])
      } catch (err) {
        if (alive) setError((err as Error).message)
      }
    })()
    return () => {
      alive = false
    }
  }, [auth])

  const unit = status.quota_per_unit || 500000
  const rate = status.usd_exchange_rate || 7.3
  const toCny = (quota: number) => (quota / unit) * rate

  const days = useMemo(() => {
    const cutoff = Date.now() / 1000 - range * 86400
    return quotaRows.filter((row) => row.created_at >= cutoff)
  }, [quotaRows, range])

  const spent = days.reduce((sum, row) => sum + toCny(row.quota ?? 0), 0)
  const tokens = days.reduce((sum, row) => sum + (row.token_used ?? 0), 0)
  const requests = logs.filter((row) => row.created_at >= Date.now() / 1000 - range * 86400).length

  if (!auth) {
    return (
      <div className="pf">
        <div className="pf-main">
          <div className="pf-empty">请先登录</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pf">
      <aside className="pf-side">
        <a className="pf-logo" href="/">
          <img src="brand-avatar.png" alt="" />
          <span>Whale Girl</span>
        </a>
        <nav className="pf-nav">
          <a className="on" href="#usage">
            <IconChart />
            用量信息
          </a>
          <button type="button" onClick={() => setRecharging(true)}>
            <IconWallet />
            充值
          </button>
          <button type="button" onClick={() => setRecharging(true)}>
            <IconBill />
            账单
          </button>
        </nav>
        <a className="pf-cta" href="#chat">
          <IconChat />
          进入对话
        </a>

        <div className="pf-account">
          <img src="brand-avatar.png" alt="" />
          <span>{self?.username || '未登录'}</span>
        </div>
      </aside>

      <main className="pf-main">
        <h1 className="pf-title">用量信息</h1>
        <div className="pf-note">所有日期均按 GMT+8 时间显示，数据可能有 5 分钟延迟</div>

        {error ? <div className="pf-error">{error}</div> : null}
        {auth.keyOnly ? (
          <button type="button" className="pf-topup pf-relogin" onClick={signOut}>
            重新登录
          </button>
        ) : null}

        <div className="pf-balance-row">
          <div className="pf-balance">
            <div className="pf-balance-label">充值余额</div>
            <div className="pf-balance-value">
              {formatCny(toCny(self?.quota ?? 0))}
              <span className="pf-unit">CNY</span>
              <button type="button" className="pf-topup" onClick={() => setRecharging(true)}>
                去充值
              </button>
            </div>
          </div>
          <div className="pf-balance">
            <div className="pf-balance-label">累计消费金额</div>
            <div className="pf-balance-value">
              {formatCny(toCny(self?.used_quota ?? 0))}
              <span className="pf-unit">CNY</span>
            </div>
          </div>
        </div>

        <div className="pf-toolbar">
          <label className="pf-select">
            <span>时间维度</span>
            <select value={range} onChange={(event) => setRange(Number(event.target.value))}>
              <option value={7}>近 7 天</option>
              <option value={30}>近 30 天</option>
              <option value={90}>近 90 天</option>
            </select>
          </label>
          <label className="pf-select">
            <span>API Key</span>
            <select defaultValue="all">
              <option value="all">全部</option>
            </select>
          </label>
          <button type="button" className="pf-export">
            导出
          </button>
        </div>

        <div className="pf-stats">
          <div className="pf-stat">
            <div className="pf-stat-label">消费金额</div>
            <div className="pf-stat-value">
              {formatCny(spent)} <span className="pf-unit">CNY</span>
            </div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat-label">API 请求次数</div>
            <div className="pf-stat-value">
              {requests} <span className="pf-unit">次</span>
            </div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat-label">Tokens</div>
            <div className="pf-stat-value">{tokens.toLocaleString('en-US')}</div>
          </div>
        </div>

        <Chart rows={days} unit={unit} rate={rate} />
      </main>

      {recharging && auth ? (
        <Recharge
          auth={auth}
          startQuota={self?.quota ?? 0}
          onClose={() => setRecharging(false)}
          onPaid={() => undefined}
        />
      ) : null}
    </div>
  )
}
