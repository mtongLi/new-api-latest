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
import { Play, Wand2 } from 'lucide-react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import type { PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { CARD_ITEM_VARIANTS, CARD_STAGGER_VARIANTS } from '@/lib/motion'

import type { MediaShowcaseExample } from '../showcase'
import type { StudioMode } from '../types'
import { StudioArt } from './studio-art'

const TILT_DEGREES = 8

function aspectRatioOf(size: string): string {
  const [width, height] = size.split('x').map(Number)
  return width > 0 && height > 0 ? `${width} / ${height}` : '1 / 1'
}

function ShowcaseCard(props: {
  example: MediaShowcaseExample
  mode: StudioMode
  onUse: (example: MediaShowcaseExample) => void
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)
  const springX = useSpring(pointerX, { stiffness: 220, damping: 18 })
  const springY = useSpring(pointerY, { stiffness: 220, damping: 18 })
  const rotateY = useTransform(springX, [0, 1], [-TILT_DEGREES, TILT_DEGREES])
  const rotateX = useTransform(springY, [0, 1], [TILT_DEGREES, -TILT_DEGREES])
  const isVideo = props.mode === 'video'
  const title = t(props.example.titleKey)

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - rect.left) / rect.width)
    pointerY.set((event.clientY - rect.top) / rect.height)
  }
  const resetTilt = () => {
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  return (
    <motion.li variants={CARD_ITEM_VARIANTS} className='mb-4 break-inside-avoid'>
      <motion.button
        type='button'
        aria-label={t('Use the "{{title}}" example', { title })}
        onClick={() => props.onUse(props.example)}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        style={
          reduceMotion
            ? undefined
            : { rotateX, rotateY, transformPerspective: 900 }
        }
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className='studio-shine group ring-border/60 focus-visible:ring-ring relative block w-full overflow-hidden rounded-2xl text-left shadow-lg ring-1 transition-shadow outline-none hover:shadow-2xl focus-visible:ring-2'
      >
        <div
          className='relative w-full'
          style={{ aspectRatio: aspectRatioOf(props.example.size) }}
        >
          <StudioArt
            art={props.example.art}
            animated={isVideo}
            className='absolute inset-0 transition-transform duration-700 group-hover:scale-110'
          />
          {isVideo && (
            <>
              <span className='absolute inset-0 flex items-center justify-center'>
                <span className='flex size-12 items-center justify-center rounded-full bg-white/25 text-white ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 group-hover:scale-110'>
                  <Play className='ml-0.5 size-5 fill-current' aria-hidden='true' />
                </span>
              </span>
              <span className='absolute top-3 right-3 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur'>
                {t('{{count}} seconds', { count: props.example.duration ?? 5 })}
              </span>
            </>
          )}
          <span className='absolute top-3 left-3 rounded-full bg-black/35 px-2 py-0.5 font-mono text-[11px] text-white/90 backdrop-blur'>
            {props.example.size}
          </span>
          <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 text-white'>
            <p className='text-sm font-semibold'>{title}</p>
            <p className='mt-1 line-clamp-2 text-xs text-white/75'>
              {props.example.prompt}
            </p>
            <span className='mt-3 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100'>
              <Wand2 className='size-3.5' aria-hidden='true' />
              {t('Use this prompt')}
            </span>
          </div>
        </div>
      </motion.button>
    </motion.li>
  )
}

type StudioShowcaseProps = {
  mode: StudioMode
  examples: MediaShowcaseExample[]
  onUse: (example: MediaShowcaseExample) => void
}

/** Curated examples; picking one fills the composer with its prompt. */
export function StudioShowcase(props: StudioShowcaseProps) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby='studio-showcase-title' className='space-y-4'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <h2 id='studio-showcase-title' className='text-lg font-semibold'>
            {t('Inspiration')}
          </h2>
          <p className='text-muted-foreground text-sm'>
            {t('Pick an example to start from its prompt and settings.')}
          </p>
        </div>
      </div>
      <motion.ul
        variants={CARD_STAGGER_VARIANTS}
        initial='initial'
        animate='animate'
        className='columns-1 gap-4 sm:columns-2 xl:columns-3'
      >
        {props.examples.map((example) => (
          <ShowcaseCard
            key={example.id}
            example={example}
            mode={props.mode}
            onUse={props.onUse}
          />
        ))}
      </motion.ul>
    </section>
  )
}
