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
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { COMPANY_BRAND_NAME } from '../../constants'
import { CoreOrbit } from './core-orbit'
import { ParticleField } from './particle-field'

export function CompanyHero() {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 flex min-h-[100svh] items-center overflow-hidden px-6 pt-28 pb-16 lg:pt-24'>
      {/* Particle network */}
      <div className='absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_45%,black_40%,transparent_100%)]'>
        <ParticleField />
      </div>
      {/* Glow */}
      <div
        aria-hidden
        className='pointer-events-none absolute top-[-25%] left-1/2 -z-10 h-[75vh] w-[95vw] max-w-6xl -translate-x-1/2 rounded-full opacity-30 blur-3xl dark:opacity-25'
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.7 0.16 230 / 80%), oklch(0.55 0.2 270 / 35%) 60%, transparent)',
        }}
      />
      {/* Bottom fade into the page */}
      <div
        aria-hidden
        className='from-background pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t to-transparent'
      />

      <div className='mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-8'>
        <div className='min-w-0 lg:col-span-7'>
          <div
            className='landing-animate-fade-up border-border/70 bg-background/60 text-muted-foreground mb-8 inline-flex items-center gap-3 rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] uppercase opacity-0 backdrop-blur'
            style={{ animationDelay: '0ms' }}
          >
            <span className='relative flex size-2'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-60 motion-reduce:hidden' />
              <span className='relative inline-flex size-2 rounded-full bg-sky-500' />
            </span>
            <span>{COMPANY_BRAND_NAME}</span>
            <span className='bg-border h-3 w-px' aria-hidden />
            <span>{t('AI infrastructure company')}</span>
          </div>

          <h1
            className='landing-animate-fade-up text-[clamp(2.75rem,7vw,6rem)] leading-[1.03] font-semibold tracking-[-0.035em] opacity-0'
            style={{ animationDelay: '80ms' }}
          >
            {t('Building reliable')}
            <br />
            <span className='company-gradient-text bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 bg-clip-text text-transparent dark:from-sky-300 dark:via-violet-400 dark:to-sky-300'>
              {t('infrastructure for AI')}
            </span>
          </h1>

          <p
            className='landing-animate-fade-up text-muted-foreground mt-8 max-w-xl text-base leading-relaxed opacity-0 md:text-lg'
            style={{ animationDelay: '160ms' }}
          >
            {t(
              'CherayeAI builds the infrastructure behind applied AI: model data, model training, inference optimization, and Mass, our unified model aggregation platform.'
            )}
          </p>

          <div
            className='landing-animate-fade-up mt-10 flex flex-wrap items-center gap-3 opacity-0'
            style={{ animationDelay: '220ms' }}
          >
            <Button
              className='group relative h-12 overflow-hidden rounded-full px-6 text-sm font-medium shadow-[0_8px_30px_-8px_oklch(0.6_0.2_250/0.7)]'
              render={<a href='#services' />}
            >
              <span
                aria-hidden
                className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full'
              />
              {t('Explore our business')}
              <ArrowRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
            </Button>
            <Button
              variant='outline'
              className='group bg-background/60 h-12 rounded-full px-6 text-sm font-medium backdrop-blur'
              render={<a href='#mass' />}
            >
              {t('Explore Mass')}
              <ArrowUpRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </Button>
          </div>
        </div>

        <div
          className='landing-animate-scale-in min-w-0 px-10 opacity-0 sm:px-16 lg:col-span-5 lg:px-6'
          style={{ animationDelay: '300ms' }}
        >
          <CoreOrbit />
        </div>
      </div>
    </section>
  )
}
