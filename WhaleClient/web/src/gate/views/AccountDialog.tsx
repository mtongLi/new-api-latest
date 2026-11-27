import { useEffect, useState } from 'react'

import {
  changePassword,
  fetchSelf,
  loadAuth,
  readAvatar,
  saveAvatar,
  updateUsername,
  uploadAvatar,
} from '../api/auth.js'
import { readSession } from '../session.js'

/** 账号管理：头像、用户名、密码 */
export const AccountDialog = ({ onClose }: { onClose: () => void }) => {
  const [auth] = useState(loadAuth)
  const [profile, setProfile] = useState<{ username?: string; email?: string } | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNext, setPwdNext] = useState('')
  const [avatar, setAvatar] = useState<string | null>(() => readAvatar())
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const session = readSession()

  useEffect(() => {
    if (!auth) return
    let alive = true
    fetchSelf(auth)
      .then((value) => {
        if (!alive) return
        setProfile(value ?? null)
        // 以服务端为准：没设头像就清掉本地缓存，避免显示别的账号留下的头像
        const remote = (value as { avatar?: string } | null)?.avatar ?? ''
        saveAvatar(remote)
        setAvatar(readAvatar())
        window.dispatchEvent(new Event('whaleclient:avatar'))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [auth])

  const saveName = async () => {
    if (!auth || !nameDraft.trim()) return
    setBusy('name')
    setError('')
    setMessage('')
    try {
      await updateUsername(auth, nameDraft.trim())
      setProfile((prev) => ({ ...(prev ?? {}), username: nameDraft.trim() }))
      setMessage('用户名已更新')
      setNameDraft('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy('')
    }
  }

  const savePwd = async () => {
    if (!auth || !pwdCurrent || !pwdNext) return
    setBusy('pwd')
    setError('')
    setMessage('')
    try {
      await changePassword(auth, pwdCurrent, pwdNext)
      setPwdCurrent('')
      setPwdNext('')
      setMessage('密码已更新，下次登录用新密码')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy('')
    }
  }

  const pickAvatar = async (file?: File | null) => {
    if (!file || !auth) return
    setError('')
    setMessage('')
    try {
      const url = await uploadAvatar(auth, file)
      saveAvatar(url)
      setAvatar(readAvatar())
      window.dispatchEvent(new Event('whaleclient:avatar'))
      setMessage('头像已上传')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const displayName = profile?.username || session?.username || '-'

  return (
    <div className='acc-mask' onClick={onClose}>
      <div className='acc-dialog' onClick={(event) => event.stopPropagation()}>
        <div className='acc-head'>
          <span>账号管理</span>
          <button type='button' onClick={onClose} aria-label='关闭'>
            ×
          </button>
        </div>

        <div className='acc-avatar-row'>
          <span className='acc-avatar'>
            {avatar ? <img src={avatar} alt='' /> : displayName.slice(0, 1).toUpperCase()}
          </span>
          <label className='acc-upload'>
            更换头像
            <input type='file' accept='image/*' onChange={(event) => pickAvatar(event.target.files?.[0])} />
          </label>
        </div>

        <div className='acc-field'>
          <span>当前用户名</span>
          <strong>{displayName}</strong>
        </div>
        <div className='acc-field'>
          <span>新用户名</span>
          <div className='acc-inline'>
            <input
              value={nameDraft}
              name='new-username'
              autoComplete='off'
              placeholder='输入新用户名'
              onChange={(event) => setNameDraft(event.target.value)}
            />
            <button type='button' disabled={busy === 'name'} onClick={saveName}>
              保存
            </button>
          </div>
        </div>

        <div className='acc-field'>
          <span>修改密码</span>
          <div className='acc-inline'>
            <input
              type='password'
              value={pwdCurrent}
              autoComplete='new-password'
              placeholder='当前密码'
              onChange={(event) => setPwdCurrent(event.target.value)}
            />
            <input
              type='password'
              value={pwdNext}
              autoComplete='new-password'
              placeholder='新密码'
              onChange={(event) => setPwdNext(event.target.value)}
            />
            <button type='button' disabled={busy === 'pwd'} onClick={savePwd}>
              保存
            </button>
          </div>
        </div>

        {error ? <div className='acc-error'>{error}</div> : null}
        {message ? <div className='acc-ok'>{message}</div> : null}
      </div>
    </div>
  )
}
