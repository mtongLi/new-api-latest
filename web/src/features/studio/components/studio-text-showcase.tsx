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
import { ArrowUpRight, MessageSquareText } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { CARD_ITEM_VARIANTS, CARD_STAGGER_VARIANTS } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { STUDIO_ACCENTS, TEXT_SHOWCASE } from '../showcase'

/**
 * Starter screen of the text view: an animated title and example prompts.
 * Choosing one hands its translated prompt to `onSelectPrompt`.
 */
export function StudioTextShowcase(props: {
  onSelectPrompt: (prompt: string) => void
}) {
  const { t } = useTranslation()
  const accent = STUDIO_ACCENTS.text

  return (
    <div className='flex min-h-[min(560px,calc(100svh-18rem))] items-center justify-center px-1 py-8'>
      <div className='grid w-full max-w-3xl gap-8 text-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180 }}
          className={cn(
            'studio-pan mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-xl',
            accent.gradient
          )}
        >
          <MessageSquareText className='size-7' aria-hidden='true' />
        </motion.div>

        <div className='grid gap-3'>
          <h2
            className={cn(
              'studio-pan bg-gradient-to-r bg-clip-text pb-1 text-3xl font-bold tracking-tight text-transparent sm:text-4xl',
              accent.gradient
            )}
          >
            {t('What shall we write today?')}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-lg text-sm leading-6'>
            {t(
              'Pick a model on the left, start from an example, or type your own request below.'
            )}
          </p>
        </div>

        <motion.ul
          variants={CARD_STAGGER_VARIANTS}
          initial='initial'
          animate='animate'
          className='grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3'
        >
          {TEXT_SHOWCASE.map((example) => {
            const Icon = example.icon
            const prompt = t(example.promptKey)
            return (
              <motion.li key={example.id} variants={CARD_ITEM_VARIANTS}>
                <motion.button
                  type='button'
                  onClick={() => props.onSelectPrompt(prompt)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className='studio-shine group bg-background/70 hover:border-foreground/20 focus-visible:ring-ring relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl border p-4 shadow-sm backdrop-blur transition-[border-color,box-shadow] outline-none hover:shadow-xl focus-visible:ring-2'
                >
                  <span className='flex items-center justify-between'>
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow',
                        accent.gradient
                      )}
                    >
                      <Icon className='size-4' aria-hidden='true' />
                    </span>
                    <ArrowUpRight
                      className='text-muted-foreground size-4 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100'
                      aria-hidden='true'
                    />
                  </span>
                  <span className='text-sm font-semibold'>
                    {t(example.titleKey)}
                  </span>
                  <span className='text-muted-foreground line-clamp-2 text-xs leading-5'>
                    {prompt}
                  </span>
                </motion.button>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </div>
  )
}
