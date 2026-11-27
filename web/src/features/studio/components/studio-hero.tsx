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
import type { ReactNode } from 'react'

import { MOTION_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { STUDIO_ACCENTS } from '../showcase'
import type { StudioView } from '../types'

type StudioHeroProps = {
  view: StudioView
  eyebrow: string
  title: string
  description: string
  /** Controls aligned to the right on wide screens. */
  actions?: ReactNode
  className?: string
}

/** Page heading with a slowly panning gradient title in the view's accent. */
export function StudioHero(props: StudioHeroProps) {
  const accent = STUDIO_ACCENTS[props.view]

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION_TRANSITION.slow}
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        props.className
      )}
    >
      <div className='space-y-2'>
        <span className='bg-background/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur'>
          <span
            className={cn(
              'size-1.5 animate-pulse rounded-full bg-gradient-to-r',
              accent.gradient
            )}
          />
          {props.eyebrow}
        </span>
        <h1
          className={cn(
            'studio-pan bg-gradient-to-r bg-clip-text pb-1 text-3xl font-bold tracking-tight text-transparent sm:text-4xl',
            accent.gradient
          )}
        >
          {props.title}
        </h1>
        <p className='text-muted-foreground max-w-xl text-sm'>
          {props.description}
        </p>
      </div>
      {props.actions}
    </motion.header>
  )
}
