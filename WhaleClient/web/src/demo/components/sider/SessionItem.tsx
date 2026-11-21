import clsx from 'clsx'
import { memo, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  IconCopyOutline16,
  IconEditOutline16,
  IconEllipsisOutline16,
  IconRightUpOutline14,
  IconTrashOutline16,
} from '../base/icons.js'
import { isPinned, togglePin } from '../../../gate/pins.js'
import { showToast } from '../base/toastState.js'
import { renameSession, selectSession, useChatStore } from '../../services/chat/store.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { IconButton } from '../base/IconButton.js'
import { Menu } from '../base/Menu.js'
import { closeMobileSider } from './mobileSiderState.js'
import styles from './SessionItem.module.css'

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M9.6 2.2l4.2 4.2-1.6 1.6-.5-.2-2.2 2.2.3 2.4-1 1-2.6-2.6-2.4 2.4-.8-.8 2.4-2.4L3.4 7.4l1-1 2.4.3 2.2-2.2-.2-.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
  </svg>
)

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="12" cy="3.6" r="1.9" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="4" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="12" cy="12.4" r="1.9" stroke="currentColor" strokeWidth="1.1" />
    <path d="M5.7 7.1 10.4 4.5M5.7 8.9l4.7 2.6" stroke="currentColor" strokeWidth="1.1" />
  </svg>
)

const MultiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <ellipse cx="8" cy="8" rx="5.4" ry="4" stroke="currentColor" strokeWidth="1.1" />
    <path d="M5.6 10.4 10.4 5.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
)

export const SessionItem = memo(function SessionItem({
  session,
  active,
  onDelete,
  selectable = false,
  selected = false,
  onToggleSelect,
  onMultiSelect,
}: {
  session: SessionSummary
  active: boolean
  onDelete: () => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onMultiSelect?: () => void
}) {
  const t = useTranslate()
  const [editing, setEditing] = useState(false)
  const [pinned, setPinned] = useState(() => isPinned(session.id))

  const share = async () => {
    const detail = useChatStore.getState().sessionCache[session.id]
    const lines = (detail?.messages ?? [])
      .filter((message) => typeof message.content === 'string' && message.content)
      .map((message) => `${message.role === 'user' ? '我' : '小虎鲸'}：${message.content}`)
    const text = [displayTitle, '', ...lines].join('\n').slice(0, 8000)
    try {
      await navigator.clipboard.writeText(text)
      showToast(t('sessionShareCopied'))
    } catch {
      showToast(t('sessionShareCopied'))
    }
  }
  const displayTitle = session.title || t('untitledChat')

  if (editing) {
    const finish = (title: string) => {
      setEditing(false)
      if (title.trim() && title.trim() !== displayTitle) {
        renameSession(session.id, title.trim())
      }
    }
    return (
      <input
        className={styles.renameInput}
        defaultValue={displayTitle}
        autoFocus
        onFocus={(event) => event.target.select()}
        onBlur={(event) => finish(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            finish(event.currentTarget.value)
          } else if (event.key === 'Escape') {
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <div
      className={clsx(styles.item, active && styles.active, selectable && styles.selectable)}
      onClick={() => {
        if (selectable) {
          onToggleSelect?.()
          return
        }
        selectSession(session.id)
        closeMobileSider()
      }}
    >
      {selectable ? (
        <span className={clsx(styles.checkbox, selected && styles.checkboxOn)} aria-hidden>
          {selected ? '✓' : ''}
        </span>
      ) : null}
      <div className={styles.title}>{displayTitle}</div>
      {selectable ? null : (
      <div className={styles.action} onClick={(event) => event.stopPropagation()}>
        <Menu
          options={[
            {
              key: 'rename',
              label: t('sessionItemMenuRenameOption'),
              icon: <IconEditOutline16 />,
              onSelect: () => setEditing(true),
            },
            {
              key: 'pin',
              label: pinned ? t('sessionItemMenuUnpinOption') : t('sessionItemMenuPinOption'),
              icon: <PinIcon />,
              onSelect: () => {
                setPinned(togglePin(session.id))
                window.dispatchEvent(new Event('whaleclient:pins'))
              },
            },
            {
              key: 'share',
              label: t('sessionItemMenuShareOption'),
              icon: <ShareIcon />,
              onSelect: () => void share(),
            },
            {
              key: 'multi',
              label: t('sessionItemMenuMultiSelectOption'),
              icon: <MultiIcon />,
              onSelect: () => onMultiSelect?.(),
            },
            {
              key: 'delete',
              label: t('delete'),
              icon: <IconTrashOutline16 />,
              danger: true,
              onSelect: onDelete,
            },
          ]}
        >
          {({ toggle }) => (
            <IconButton icon={<IconEllipsisOutline16 />} aria-label={t('more')} onClick={toggle} />
          )}
        </Menu>
      </div>
      )}
    </div>
  )
})
