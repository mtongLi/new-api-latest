import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  IconDataOutline16,
  IconDownloadOutline16,
  IconEllipsisOutline16,
  IconPanelLeftOutline16,
  IconSearchOutline16,
  IconSettingsOutline16,
  IconUploadOutline14,
  NewChatIcon,
} from '../base/icons.js'
import { setSiderCollapsed, useSettings } from '../../services/settings.js'
import { brand } from '../../app/brand.js'
import { readSession, signOut } from '../../../gate/session.js'
import { readPinned } from '../../../gate/pins.js'
import { groupSessions } from '../../services/chat/sessionGroups.js'
import { newChat, removeSession, useChatStore } from '../../services/chat/store.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { Button } from '../base/Button.js'
import { IconButton } from '../base/IconButton.js'
import { Modal } from '../base/Modal.js'
import { showToast } from '../base/toastState.js'
import { openSettings } from '../settings/settingsDialogState.js'
import { closeMobileSider, useMobileSider } from './mobileSiderState.js'
import { SessionItem } from './SessionItem.js'
import { readAvatar } from '../../../gate/api/auth.js'
import { AppDialog, isMobile } from '../../../gate/views/AppDialog.js'
import { AccountDialog } from '../../../gate/views/AccountDialog.js'
import { DownloadPopover } from '../../../gate/views/DownloadPopover.js'
import { SearchDialog } from './SearchDialog.js'
import styles from './Sider.module.css'

const SelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <ellipse cx="8" cy="8" rx="5.6" ry="4.2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5.4 10.6 10.6 5.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

/** 搜索命中片段：取第一条包含关键词的消息 */
const snippet = (id: string, keyword: string): string => {
  const detail = useChatStore.getState().sessionCache[id]
  if (!detail) return ''
  const key = keyword.trim().toLowerCase()
  const hit = detail.messages.find(
    (message) => typeof message.content === 'string' && message.content.toLowerCase().includes(key)
  )
  if (!hit || typeof hit.content !== 'string') return ''
  const index = hit.content.toLowerCase().indexOf(key)
  const start = Math.max(0, index - 14)
  return `${start > 0 ? '…' : ''}${hit.content.slice(start, index + 26)}…`
}

/** 展开的侧边栏：名称与收起按钮、开启新对话、按时间分组的会话列表、底部设置；移动端放在抽屉里，收起按钮关闭抽屉 */
export const Sider = ({ mobile = false }: { mobile?: boolean }) => {
  const t = useTranslate()
  const sessions = useChatStore((state) => state.sessions)
  const activeId = useChatStore((state) => state.activeId)
  const [now, setNow] = useState(Date.now)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const sync = () => setAvatar(readAvatar())
    window.addEventListener('whaleclient:avatar', sync)
    return () => window.removeEventListener('whaleclient:avatar', sync)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])
  const [appOpen, setAppOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pinVersion, setPinVersion] = useState(0)
  const [hoverList, setHoverList] = useState(false)
  const [hoverDownload, setHoverDownload] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(() => readAvatar())

  useEffect(() => {
    const refresh = () => setPinVersion((value) => value + 1)
    window.addEventListener('whaleclient:pins', refresh)
    return () => window.removeEventListener('whaleclient:pins', refresh)
  }, [])
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [deleting, setDeleting] = useState<SessionSummary | null>(null)
  const apiKey = useSettings((state) => state.apiKey)
  const session = readSession()
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return sessions
    const cache = useChatStore.getState().sessionCache
    return sessions.filter((item) => {
      if ((item.title || '').toLowerCase().includes(value)) return true
      const detail = cache[item.id]
      if (!detail) return false
      return detail.messages.some((message) =>
        typeof message.content === 'string' && message.content.toLowerCase().includes(value)
      )
    })
  }, [sessions, query])
  const pinned = useMemo(() => readPinned(), [pinVersion])
  const groups = useMemo(() => {
    const pinnedList = filtered.filter((item) => pinned.has(item.id))
    const rest = filtered.filter((item) => !pinned.has(item.id))
    const base = groupSessions(rest, now, t)
    return pinnedList.length > 0
      ? [{ key: 'pinned', label: '置顶', sessions: pinnedList }, ...base]
      : base
  }, [filtered, now, t, pinned])
  const importRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const [importing, setImporting] = useState(false)

  const importFile = async (file: File | undefined) => {
    if (!file || importing) return
    setImporting(true)
    try {
      const { importHistory } = await import('../../services/chat/backup.js')
      const count = await importHistory(file)
      showToast(count === 1 ? t('historyImportedOne') : t('historyImported', { count: String(count) }))
      window.setTimeout(() => location.reload(), 800)
    } catch {
      showToast(t('historyImportFailed'))
      setImporting(false)
    }
  }
  const [deletePending, setDeletePending] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const time = Date.now()
      setNow(time)
      const midnight = new Date(time).setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight - time)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    refresh()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <div className={clsx(styles.sider, mobile && styles.mobile)}>
      <div className={styles.top}>
        <div className={styles.brand}>
          {brand.avatar ? (
            <img className={styles.brandAvatar} src={brand.avatar} alt="" />
          ) : null}
          <div className={styles.appName}>{brand.name}</div>
        </div>
        <div className={styles.topActions}>
          <IconButton
            size="m"
            icon={<IconSearchOutline16 />}
            tooltip="搜索对话"
            tooltipPlacement="bottom"
            onClick={() => setSearchOpen(true)}
          />
          <IconButton
            size="m"
            icon={<IconPanelLeftOutline16 />}
            tooltip={t('collapseSiderbarButton')}
            tooltipPlacement="bottom"
            onClick={() => (mobile ? closeMobileSider() : setSiderCollapsed(true))}
          />
        </div>
      </div>
      <button
        type="button"
        className={styles.newChat}
        onClick={() => {
          newChat()
          closeMobileSider()
        }}
      >
        <span className={styles.newChatIcon}>
          <NewChatIcon />
        </span>
        {t('newChat')}
      </button>
      <div className={styles.listWrap} onMouseEnter={() => setHoverList(true)} onMouseLeave={() => setHoverList(false)}>
        <div className={styles.listHeader}>
          <span>最近对话</span>
          <button
            type="button"
            className={clsx(styles.selectToggle, (hoverList || selectMode) && styles.selectToggleVisible)}
            title={selectMode ? '取消多选' : '多选'}
            aria-label={selectMode ? '取消多选' : '多选'}
            onClick={() => {
              setSelectMode((value) => !value)
              setSelected(new Set())
            }}
          >
            {selectMode ? <span className={styles.cancelText}>取消</span> : <SelectIcon />}
          </button>
        </div>
        {query.trim() ? (
          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.emptyResult}>没有匹配的对话</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={styles.resultItem}
                  onClick={() => {
                    selectSession(item.id)
                    closeMobileSider()
                  }}
                >
                  <div className={styles.resultTitle}>{item.title || t('untitledChat')}</div>
                  <div className={styles.resultSnippet}>{snippet(item.id, query)}</div>
                </div>
              ))
            )}
          </div>
        ) : (
        <div className={styles.list}>
          {groups.map((group) => (
            <div key={group.key} className={styles.section}>
              <div className={styles.sectionHeader}>{group.label}</div>
              {group.sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  active={session.id === activeId}
                  onDelete={() => setDeleting(session)}
                  selectable={selectMode}
                  selected={selected.has(session.id)}
                  onMultiSelect={() => {
                    setSelectMode(true)
                    setSelected(new Set([session.id]))
                  }}
                  onToggleSelect={() =>
                    setSelected((current) => {
                      const next = new Set(current)
                      if (next.has(session.id)) next.delete(session.id)
                      else next.add(session.id)
                      return next
                    })
                  }
                />
              ))}
            </div>
          ))}
        </div>
        )}
      </div>
      {selectMode ? (
        <div className={styles.selectBar}>
          <span>已选 {selected.size} 项</span>
          <div className={styles.selectActions}>
            <button
              type="button"
              className={styles.selectAll}
              onClick={() =>
                setSelected(
                  selected.size === filtered.length
                    ? new Set()
                    : new Set(filtered.map((item) => item.id))
                )
              }
            >
              {selected.size === filtered.length && filtered.length > 0 ? '取消全选' : '全选'}
            </button>
            <button
              type="button"
              className={styles.selectDelete}
              disabled={selected.size === 0}
              onClick={() => {
                selected.forEach((id) => removeSession(id))
                setSelected(new Set())
                setSelectMode(false)
              }}
            >
              删除
            </button>
          </div>
        </div>
      ) : null}
      <div className={styles.bottom}>
        <button
          type="button"
          className={styles.importButton}
          disabled={importing}
          onClick={() => importRef.current?.click()}
        >
          <span className={styles.importIcon}>
            <IconUploadOutline14 />
          </span>
          <span>{importing ? '导入中…' : t('historyImport')}</span>
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(event) => {
            void importFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />

        <div className={styles.accountRow} ref={accountRef}>
          <button type="button" className={styles.account} onClick={() => setMenuOpen((v) => !v)}>
            <span className={styles.accountAvatarWrap}>
              {brand.avatar ? (
                <img className={styles.accountAvatar} src={avatar || brand.avatar} alt="" />
              ) : (
                <span className={styles.accountAvatarFallback}>
                  {(brand.account || brand.name).slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className={styles.accountInfo}>
              <span className={styles.accountName}>{session?.username || brand.account || brand.name}</span>
            </span>
          </button>
          <button
            type="button"
            className={styles.accountMore}
            aria-label="更多"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconEllipsisOutline16 />
          </button>

          {menuOpen ? (
            <div className={styles.menu}>
              <div
                className={styles.downloadWrap}
                onMouseEnter={() => setHoverDownload(true)}
                onMouseLeave={() => setHoverDownload(false)}
              >
                {isMobile() ? (
                  <a className={styles.menuItem} href="download/whalegirl.apk" download>
                    <IconDownloadOutline16 />
                    下载手机应用
                  </a>
                ) : (
                  <button type="button" className={styles.menuItem} onClick={() => setAppOpen(true)}>
                    <IconDownloadOutline16 />
                    下载手机应用
                  </button>
                )}
                {hoverDownload ? <DownloadPopover /> : null}
              </div>
              <a className={styles.menuItem} href="#usage" target="_blank" rel="noreferrer">
                <IconDataOutline16 />
                用量与余额
              </a>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false)
                  openSettings('general')
                }}
              >
                <IconSettingsOutline16 />
                系统设置
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false)
                  setAccountOpen(true)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="5.4" r="2.6" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3.2 13c.9-2.1 2.7-3.2 4.8-3.2s3.9 1.1 4.8 3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                账号管理
              </button>
              <button type="button" className={styles.menuItem} onClick={() => signOut()}>
                <span className={styles.menuArrow}>→</span>
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {searchOpen ? <SearchDialog onClose={() => setSearchOpen(false)} /> : null}
      {appOpen ? <AppDialog onClose={() => setAppOpen(false)} /> : null}
      {accountOpen ? <AccountDialog onClose={() => setAccountOpen(false)} /> : null}
      {deleting ? (
        <Modal
          title={t('deleteSessionModalContentTitle')}
          onClose={() => {
            if (!deletePending) {
              setDeleting(null)
            }
          }}
          footer={
            <>
              <Button variant="outlined" disabled={deletePending} onClick={() => setDeleting(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                disabled={deletePending}
                onClick={async () => {
                  setDeletePending(true)
                  try {
                    if (await removeSession(deleting.id)) {
                      setDeleting(null)
                    } else {
                      showToast({ key: 'sessionDeleteFailed', type: 'error' })
                    }
                  } finally {
                    setDeletePending(false)
                  }
                }}
              >
                {t('delete')}
              </Button>
            </>
          }
        >
          {t('deleteSessionWithFilesDescription')}
        </Modal>
      ) : null}
    </div>
  )
}

/** 移动端抽屉：浮在页面上方，点空白区域关闭。 */
export const MobileSider = () => {
  const open = useMobileSider((state) => state.open)
  if (!open) {
    return null
  }
  return (
    <>
      <div className={styles.drawerMask} onClick={closeMobileSider} />
      <div className={styles.drawer}>
        <Sider mobile />
      </div>
    </>
  )
}
