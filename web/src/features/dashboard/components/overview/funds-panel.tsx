/*
Copyright (C) 2023-2026 QuantumNous
*/
import { useEffect, useState } from 'react'

import { getFundsOverview, getUpstreamBalance, type FundsOverview } from '@/lib/api'

/** 资金总览：上游 Key 余额 + 每人充值/消耗/剩余 */
export function FundsPanel() {
  const [funds, setFunds] = useState<FundsOverview | null>(null)
  const [balance, setBalance] = useState<{ currency: string; total_balance: string } | null>(null)
  const [balanceError, setBalanceError] = useState('')

  useEffect(() => {
    let alive = true
    getFundsOverview()
      .then((value) => {
        if (alive) setFunds(value)
      })
      .catch(() => undefined)
    getUpstreamBalance()
      .then((value) => {
        if (!alive) return
        const info = value?.balance_infos?.[0]
        if (info) setBalance({ currency: info.currency, total_balance: info.total_balance })
        else setBalanceError('无法读取上游余额')
      })
      .catch((error: Error) => {
        if (alive) setBalanceError(error.message)
      })
    return () => {
      alive = false
    }
  }, [])

  const unit = funds?.quota_per_unit || 500000
  const rate = funds?.usd_exchange_rate || 7.3
  const cny = (quota: number) => `¥${((quota / unit) * rate).toFixed(2)}`
  const users = funds?.users ?? []

  return (
    <div className='mb-4 grid gap-4 lg:grid-cols-[320px_1fr]'>
      <div className='rounded-xl border p-4 sm:p-5'>
        <div className='text-muted-foreground text-xs'>总 Key 余额（上游账户）</div>
        <div className='mt-2 text-2xl font-semibold'>
          {balance ? `¥${balance.total_balance}` : balanceError ? '—' : '读取中…'}
        </div>
        <div className='text-muted-foreground mt-1 text-xs'>
          {balanceError || '来自渠道 Key 所属的官方账户'}
        </div>
        <div className='mt-4 text-xs'>
          账号数：<span className='font-medium'>{users.length}</span>
        </div>
      </div>

      <div className='overflow-hidden rounded-xl border'>
        <div className='text-muted-foreground grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-2 border-b px-4 py-2.5 text-xs'>
          <span>账号</span>
          <span className='text-right'>充值</span>
          <span className='text-right'>消耗</span>
          <span className='text-right'>剩余</span>
        </div>
        <div className='max-h-64 overflow-auto'>
          {users.length === 0 ? (
            <div className='text-muted-foreground px-4 py-6 text-xs'>还没有账号</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className='grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-2 border-b px-4 py-2.5 text-sm last:border-b-0'
              >
                <span className='truncate'>{user.username}</span>
                <span className='text-right'>{cny((user.topped_up || 0) * unit)}</span>
                <span className='text-right'>{cny(user.used_quota)}</span>
                <span className='text-right font-medium'>{cny(user.quota)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
