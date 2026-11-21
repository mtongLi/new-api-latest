import { useState } from 'react'
import { loadAuth } from '../api/auth.js'
import { AppDialog, isMobile } from './AppDialog.js'
import {
  IconGlobeLanguageOutline14,
  IconThinkOutline14,
} from '../../demo/components/base/icons.js'

const SendArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M8.3125 0.980206C8.66767 1.05312 8.97902 1.2042 9.2627 1.43235C9.48724 1.613 9.73029 1.85795 9.97949 2.10716L14.707 6.8347L13.293 8.24876L9 3.95579V15.0417H7V3.95579L2.70703 8.24876L1.29297 6.8347L6.02051 2.10716C6.26971 1.85795 6.51277 1.613 6.7373 1.43235C6.97662 1.23988 7.28445 1.04404 7.6875 0.980206C7.8973 0.947029 8.1031 0.955183 8.3125 0.980206Z" fill="currentColor" />
  </svg>
)

const AccountIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="5.6" r="2.6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M3.2 13.2c.8-2.2 2.6-3.4 4.8-3.4s4 1.2 4.8 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5.6 6.4h4.8M5.6 9.2h3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

/** 首页：配色与版式对齐 deepseek.com */
export const Landing = () => {
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [search, setSearch] = useState(true)
  const [appOpen, setAppOpen] = useState(false)

  /** 已登录直接看用量，未登录先去登录 */
  const openAccount = () => {
    const target = loadAuth() ? '#usage' : '#chat'
    const url = new URL(location.href)
    url.search = ''
    url.hash = target
    window.open(url.toString(), '_blank', 'noopener')
  }

  /** 新开一个页面进会话，和官方一致 */
  const goChat = (question?: string) => {
    const url = new URL(location.href)
    url.search = ''
    const value = (question ?? '').trim()
    if (value) url.searchParams.set('q', value)
    url.hash = '#chat'
    window.open(url.toString(), '_blank', 'noopener')
  }

  return (
    <div className="lp">
      <div className="lp-grid" />

      <header className="lp-nav">
        <div className="lp-brand">
          <img className="lp-logo" src="brand-avatar.png" alt="" />
          <span className="lp-name">Whale Girl</span>
        </div>
        <div className="lp-nav-right">
          {isMobile() ? (
            <a className="lp-getapp" href="download/whalegirl.apk" download>
              获取 APP
            </a>
          ) : (
            <button type="button" className="lp-getapp" onClick={() => setAppOpen(true)}>
              获取 APP
            </button>
          )}
        </div>
      </header>

      <main className="lp-main">
        <div className="lp-news">
          <span className="lp-news-icon">✦</span>
          <span>
            社区观察反馈：官方收紧免费使用额度，并推出多重限制，高峰期还需排队等待。
            <br />
            本应用基于官方开放 API 构建，按量付费、畅享不限速，小虎鲸已备好，随时酣畅开聊 🐋
          </span>
        </div>

        <h1 className="lp-title">和大肥鱼尽情玩耍</h1>

        <div className="lp-card">
          <input
            className="lp-field"
            value={text}
            placeholder="问点什么，一起探索"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') goChat(text)
            }}
          />
          <div className="lp-tools">
            <div className="lp-pills">
            <button
              type="button"
              className={thinking ? 'lp-pill on' : 'lp-pill'}
              onClick={() => setThinking((value) => !value)}
            >
              <IconThinkOutline14 />
              深度思考
            </button>
            <button
              type="button"
              className={search ? 'lp-pill search on' : 'lp-pill search'}
              onClick={() => setSearch((value) => !value)}
            >
              <IconGlobeLanguageOutline14 />
              智能搜索
            </button>
            </div>
            <button type="button" className="lp-send" onClick={() => goChat(text)} aria-label="发送">
              <SendArrow />
            </button>
          </div>
        </div>

        <div className="lp-actions">
          <button type="button" className="lp-action" onClick={() => goChat()}>
            <ChatIcon />
            和小虎鲸对话
          </button>
          <button type="button" className="lp-action" onClick={openAccount}>
            <AccountIcon />
            账号与用量
          </button>
        </div>
      </main>

      {appOpen ? <AppDialog onClose={() => setAppOpen(false)} /> : null}
    </div>
  )
}
