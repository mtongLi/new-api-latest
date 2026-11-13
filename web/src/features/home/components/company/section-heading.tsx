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
import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  index: string
  label: string
  title: string
  description?: string
  className?: string
}

/**
 * Company site section heading: a mono index rule above a large title.
 */
export function SectionHeading(props: SectionHeadingProps) {
  return (
    <AnimateInView className={cn('mb-14 md:mb-20', props.className)}>
      <div className='text-muted-foreground mb-8 flex items-center gap-4 font-mono text-xs tracking-[0.2em] uppercase'>
        <span className='text-sky-600 dark:text-sky-400'>{props.index}</span>
        <span className='bg-border h-px w-10' aria-hidden />
        <span>{props.label}</span>
      </div>
      <div className='grid gap-6 lg:grid-cols-12 lg:gap-10'>
        <h2 className='text-3xl leading-[1.15] font-semibold tracking-tight text-balance md:text-5xl lg:col-span-7'>
          {props.title}
        </h2>
        {props.description && (
          <p className='text-muted-foreground text-base leading-relaxed lg:col-span-5 lg:pt-2'>
            {props.description}
          </p>
        )}
      </div>
    </AnimateInView>
  )
}
