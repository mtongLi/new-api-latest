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
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

import { HeroTerminalDemo } from '../hero-terminal-demo'
import { SectionHeading } from './section-heading'

interface MassSpotlightProps {
  isAuthenticated: boolean
}

export function MassSpotlight(props: MassSpotlightProps) {
  const { t } = useTranslation()

  const highlights = [
    t('OpenAI-compatible API, ready for existing SDKs'),
    t('Unified keys, quotas, and team permissions'),
    t('Real-time usage and cost analytics'),
  ]

  return (
    <section
      id='mass'
      className='border-border/70 bg-muted/25 relative z-10 scroll-mt-16 border-y px-6 py-24 md:py-36'
    >
      <div className='mx-auto max-w-7xl'>
        <SectionHeading
          index='02'
          label={t('Product')}
          title={t('Mass: every major model, one API')}
          description={t(
            'Mass is our model aggregation platform. Developers and enterprises call models from leading providers through an OpenAI-compatible interface while keeping cost, quota, and access under control.'
          )}
        />

        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16'>
          <AnimateInView
            className='min-w-0 lg:col-span-4'
            animation='fade-right'
          >
            <ul className='border-border/70 border-t'>
              {highlights.map((item, index) => (
                <li
                  key={item}
                  className='border-border/70 flex items-baseline gap-4 border-b py-5 text-sm'
                >
                  <span className='font-mono text-xs text-sky-600 dark:text-sky-400'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className='text-foreground/85'>{item}</span>
                </li>
              ))}
            </ul>
            <div className='mt-10 flex flex-wrap items-center gap-3'>
              {props.isAuthenticated ? (
                <Button
                  className='group h-11 rounded-full px-6 text-sm font-medium'
                  render={<Link to='/dashboard' />}
                >
                  {t('Go to Dashboard')}
                  <ArrowRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
              ) : (
                <Button
                  className='group h-11 rounded-full px-6 text-sm font-medium'
                  render={<Link to='/sign-up' />}
                >
                  {t('Get Started')}
                  <ArrowRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
              )}
              <Button
                variant='outline'
                className='h-11 rounded-full px-6 text-sm font-medium'
                render={<Link to='/pricing' />}
              >
                {t('View Pricing')}
              </Button>
            </div>
          </AnimateInView>

          <AnimateInView
            className='relative flex w-full min-w-0 justify-center lg:col-span-8'
            animation='fade-left'
            delay={120}
          >
            <div
              aria-hidden
              className='absolute inset-[8%] -z-10 rounded-full opacity-50 blur-3xl dark:opacity-40'
              style={{
                background:
                  'radial-gradient(closest-side, oklch(0.7 0.16 230 / 70%), oklch(0.55 0.22 280 / 40%), transparent)',
              }}
            />
            <HeroTerminalDemo className='max-w-none' />
          </AnimateInView>
        </div>
      </div>
    </section>
  )
}
