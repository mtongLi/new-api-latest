/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { KeyRound } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ApiKey } from '@/features/keys/types'

type StudioTokenSelectProps = {
  tokens: ApiKey[]
  value: number | undefined
  onChange: (tokenId: number) => void
  disabled?: boolean
}

export function StudioTokenSelect(props: StudioTokenSelectProps) {
  const { t } = useTranslation()
  const items = useMemo(
    () =>
      props.tokens.map((token) => ({
        value: String(token.id),
        label: token.group ? `${token.name} · ${token.group}` : token.name,
      })),
    [props.tokens]
  )
  const selected = items.find((item) => item.value === String(props.value))

  return (
    <Select
      items={items}
      value={props.value == null ? null : String(props.value)}
      onValueChange={(value) => {
        if (value != null) props.onChange(Number(value))
      }}
      disabled={props.disabled}
    >
      <SelectTrigger aria-label={t('API key')} className='max-w-64 min-w-40'>
        <KeyRound className='text-muted-foreground' aria-hidden='true' />
        <SelectValue className='min-w-0'>
          <span className='truncate'>
            {selected?.label ?? t('Select an API key')}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className='min-w-52'>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
