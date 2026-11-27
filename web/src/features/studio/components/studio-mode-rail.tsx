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
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOTION_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { STUDIO_VIEWS } from '../constants'
import { STUDIO_ACCENTS } from '../showcase'
import type { StudioView } from '../types'

/**
 * Left rail of creation modes, stacked top to bottom and vertically centered.
 * The active highlight slides between items. Must render inside a vertical
 * `Tabs` root whose value is `active`.
 */
export function StudioModeRail(props: { active: StudioView }) {
  const { t } = useTranslation()

  return (
    <aside className='bg-background/50 sticky top-16 z-10 flex h-[calc(100svh-4rem)] w-20 shrink-0 items-center justify-center border-r backdrop-blur-xl sm:w-24'>
      <TabsList
        variant='line'
        aria-label={t('Creation mode')}
        className='w-full gap-3 px-2'
      >
        {STUDIO_VIEWS.map((item) => {
          const Icon = item.icon
          const accent = STUDIO_ACCENTS[item.value]
          const active = item.value === props.active
          return (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className='group/rail data-active:text-foreground relative h-auto after:hidden w-full flex-col gap-1.5 rounded-xl px-1 py-3 text-center text-xs leading-tight whitespace-normal group-data-vertical/tabs:justify-center data-active:bg-transparent dark:data-active:bg-transparent'
            >
              {active && (
                <motion.span
                  layoutId='studio-rail-active'
                  transition={MOTION_TRANSITION.spring}
                  aria-hidden='true'
                  className='bg-background/80 ring-border absolute inset-0 rounded-xl shadow-md ring-1'
                />
              )}
              <span
                className={cn(
                  'relative flex size-10 items-center justify-center rounded-xl transition-all duration-300 group-hover/rail:scale-110',
                  active
                    ? cn(
                        'studio-pan bg-gradient-to-br text-white shadow-lg',
                        accent.gradient
                      )
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <Icon className='size-5' aria-hidden='true' />
              </span>
              <span className='relative'>{t(item.labelKey)}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </aside>
  )
}
