import { useEffect, useRef, useState } from 'react'
import type { StoredAuth } from '../api/auth.js'
import { ensureApiKey, listModels, streamChat, type ChatMessage } from '../api/chat.js'

type Props = { auth: StoredAuth; onSignOut: () => void }

export const Chat = ({ auth, onSignOut }: Props) => {
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const key = await ensureApiKey(auth)
        const ids = await listModels(auth.server, key)
        if (!alive) return
        setModels(ids)
        setModel((current) => current || ids[0] || '')
      } catch (e) {
        if (alive) setError((e as Error).message)
      }
    })()
    return () => {
      alive = false
    }
  }, [auth])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || busy || !model) return
    setInput('')
    setError('')
    setBusy(true)

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }])
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const key = await ensureApiKey(auth)
      await streamChat(auth.server, key, model, next, {
        signal: controller.signal,
        onDelta: (delta) =>
          setMessages((current) => {
            const copy = [...current]
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = { ...last, content: last.content + delta }
            return copy
          }),
      })
    } catch (e) {
      if (controller.signal.aborted) return
      setError((e as Error).message)
      setMessages((current) => current.slice(0, -1))
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  return (
    <div className="chat">
      <header className="topbar">
        <div className="brand small">
          <img className="brand-logo" src="/brand-avatar.png" alt="" />
          <span className="brand-name">小虎鲸</span>
        </div>
        <div className="topbar-right">
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {models.length === 0 ? <option value="">加载模型…</option> : null}
            {models.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button className="ghost" onClick={onSignOut}>
            退出
          </button>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-title">今天想聊点什么？</div>
            <div className="empty-sub">{auth.server}</div>
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div key={index} className={`bubble ${message.role}`}>
            {message.content || (busy && index === messages.length - 1 ? '…' : '')}
          </div>
        ))}
        {error ? <div className="error">{error}</div> : null}
      </div>

      <footer className="composer">
        <textarea
          value={input}
          rows={1}
          placeholder="输入消息，Enter 发送"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
        />
        {busy ? (
          <button className="primary" onClick={() => abortRef.current?.abort()}>
            停止
          </button>
        ) : (
          <button className="primary" disabled={!input.trim() || !model} onClick={() => void send()}>
            发送
          </button>
        )}
      </footer>
    </div>
  )
}
