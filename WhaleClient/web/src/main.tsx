import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App as DemoApp } from './demo/app/App.js'
import { setupTheme } from './demo/app/theme.js'
import { ensureKatex } from './demo/services/markdown/katex.js'
import { setApiKey } from './demo/services/settings.js'
import { sendMessage, useChatStore } from './demo/services/chat/store.js'
import { setDraftText } from './demo/services/chat/drafts.js'
import './demo/app/theme.css'
import './demo/app/global.css'

setupTheme()
ensureKatex()
import { ensureApiKey } from './gate/api/chat.js'
import { fetchSelf, loadAuth, type StoredAuth } from './gate/api/auth.js'
import { rememberUser } from './gate/session.js'
import { Landing } from './gate/views/Landing.js'
import { Usage } from './gate/views/Usage.js'
import { Login } from './gate/views/Login.js'
import './gate/styles/app.css'

/** demo 的界面从 localStorage 读 Key；登录拿到 API Key 后写进去再渲染 */
const KEY_STORAGE = 'chat-demo:api-key'

/** 首页输入的句子带进会话并自动发送 */
const AutoSend = () => {
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const text = params.get('q')
    if (!text) return
    history.replaceState(null, '', `${location.pathname}#chat`)
    let fired = false
    const trySend = () => {
      if (fired || !useChatStore.getState().ready) return
      fired = true
      setDraftText(null, text)
      window.setTimeout(() => sendMessage(null), 0)
      unsubscribe()
    }
    const unsubscribe = useChatStore.subscribe(trySend)
    trySend()
    return () => unsubscribe()
  }, [])
  return null
}

const Root = () => {
  // 只有 #chat 才进会话；其他一律先看首页
  const [route, setRoute] = useState(() => location.hash)
  useEffect(() => {
    document.title = route === '#chat' ? 'Whale Chat' : route === '#usage' ? '用量与余额' : 'Whale Girl'
  }, [route])

  useEffect(() => {
    const onChange = () => setRoute(location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  // #demo 只看界面，用假 Key，不发请求
  const demo = route === '#demo'
  const [auth, setAuth] = useState<StoredAuth | null>(() =>
    demo ? { server: location.origin, token: 'demo', expiresAt: 0 } : loadAuth()
  )
  const [key, setKey] = useState<string | null>(() => {
    const initial = demo ? 'sk-demo-preview' : localStorage.getItem(KEY_STORAGE)
    if (initial) setApiKey(initial)
    return initial
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth || key) return
    let alive = true
    ensureApiKey(auth)
      .then(async (value) => {
        if (!alive) return
        try {
          const self = await fetchSelf(auth)
          if (self?.username) rememberUser(self.username)
        } catch {
          // 拿不到用户信息不影响使用
        }
        localStorage.setItem(KEY_STORAGE, value)
        setApiKey(value)
        setKey(value)
      })
      .catch((e) => alive && setError((e as Error).message))
    return () => {
      alive = false
    }
  }, [auth, key])

  if (route === '#usage' && auth) {
    return <Usage />
  }

  // 未登录看用量：先登录，登录后自动停在本页
  if (route === '#usage') {
    return (
      <Login
        onDone={(value) => {
          localStorage.removeItem(KEY_STORAGE)
          setAuth(value)
        }}
      />
    )
  }

  if (route === '#chat' && auth && key) {
    return (
      <>
        <AutoSend />
        <DemoApp />
      </>
    )
  }

  if (route === '#chat' && auth && !key) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="brand">
            <img className="brand-logo" src="brand-avatar.png" alt="" />
            <div className="brand-name">小虎鲸</div>
          </div>
          {error ? <div className="error">{error}</div> : <div className="notice">正在准备…</div>}
        </div>
      </div>
    )
  }

  // 首页：只要不在 #chat，就先看首页
  if (route !== '#chat') {
    return <Landing signedIn={Boolean(auth)} />
  }

  return (
    <Login
      onDone={(value) => {
        localStorage.removeItem(KEY_STORAGE)
        setAuth(value)
      }}
    />
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(<Root />)
