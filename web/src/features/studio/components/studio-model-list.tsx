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
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'
import { MOTION_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { STUDIO_ACCENTS } from '../showcase'
import type { StudioView } from '../types'

type StudioModelListProps = {
  view: StudioView
  models: string[]
  value: string
  onChange: (model: string) => void
  isLoading?: boolean
  emptyText: string
}

/**
 * Searchable model column between the mode rail and the creation page.
 * Hidden below `md`, where pages fall back to a compact model selector.
 */
export function StudioModelList(props: StudioModelListProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const accent = STUDIO_ACCENTS[props.view]

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return props.models
    return props.models.filter((model) => model.toLowerCase().includes(keyword))
  }, [props.models, query])

  const renderBody = () => {
    if (props.isLoading) {
      return (
        <div className='space-y-2 p-3' role='status' aria-label={t('Loading')}>
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-8 w-4/5' />
        </div>
      )
    }
    if (props.models.length === 0) {
      return (
        <p className='text-muted-foreground px-4 py-8 text-center text-xs'>
          {props.emptyText}
        </p>
      )
    }
    if (filtered.length === 0) {
      return (
        <p className='text-muted-foreground px-4 py-8 text-center text-xs'>
          {t('No model found.')}
        </p>
      )
    }
    return filtered.map((model) => {
      const selected = model === props.value
      return (
        <CommandItem
          key={model}
          value={model}
          onSelect={() => props.onChange(model)}
          aria-current={selected ? 'true' : undefined}
          className={cn(
            'relative mb-0.5 flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs data-[selected=true]:bg-accent/60',
            selected && 'font-semibold data-[selected=true]:bg-transparent'
          )}
        >
          {selected && (
            // Slides between items when the selection changes.
            <motion.span
              layoutId={`studio-model-active-${props.view}`}
              transition={MOTION_TRANSITION.spring}
              aria-hidden='true'
              className={cn(
                'absolute inset-0 rounded-lg bg-gradient-to-r opacity-15 dark:opacity-25',
                accent.gradient
              )}
            />
          )}
          <span className='relative truncate' title={model}>
            {model}
          </span>
          {selected && (
            <Check
              className={cn('relative size-3.5 shrink-0', accent.text)}
              aria-hidden='true'
            />
          )}
        </CommandItem>
      )
    })
  }

  return (
    <aside
      aria-label={t('Available models')}
      className='bg-background/50 sticky top-16 backdrop-blur-xl hidden h-[calc(100svh-4rem)] w-60 shrink-0 flex-col border-r md:flex xl:w-64'
    >
      <div className='flex items-center justify-between px-4 pt-4 pb-2'>
        <h2 className='text-sm font-medium'>{t('Available models')}</h2>
        {!props.isLoading && (
          <span className='text-muted-foreground text-xs'>
            {props.models.length}
          </span>
        )}
      </div>
      <Command
        shouldFilter={false}
        className='min-h-0 flex-1 rounded-none bg-transparent'
      >
        <div className='px-2'>
          <CommandInput
            placeholder={t('Search models...')}
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <CommandList className='max-h-none min-h-0 flex-1 px-2 py-2'>
          {renderBody()}
        </CommandList>
      </Command>
    </aside>
  )
}
