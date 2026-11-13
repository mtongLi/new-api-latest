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

import { SectionHeading } from './section-heading'

export function CompanyAbout() {
  const { t } = useTranslation()

  const principles = [
    {
      id: 'full-stack',
      title: t('Full-stack expertise'),
      desc: t(
        'Data, training, inference, and platform are handled by one team, so every layer is optimized together.'
      ),
    },
    {
      id: 'efficiency',
      title: t('Cost efficiency'),
      desc: t(
        'We measure success in latency and cost per token, not just benchmark scores.'
      ),
    },
    {
      id: 'control',
      title: t('Secure and controllable'),
      desc: t(
        'Private deployment options and fine-grained access control keep your data and models in your hands.'
      ),
    },
  ]

  return (
    <>
      <section
        id='about'
        className='relative z-10 scroll-mt-16 px-6 py-24 md:py-36'
      >
        <div className='mx-auto max-w-7xl'>
          <SectionHeading
            index='03'
            label={t('About us')}
            title={t(
              'We believe every team should be able to use the best AI at a reasonable cost.'
            )}
            description={t(
              'CherayeAI focuses on the engineering between models and real-world applications: better data, more targeted training, faster inference, and simpler access.'
            )}
          />

          <div className='border-border/70 grid border-t md:grid-cols-3'>
            {principles.map((item, index) => (
              <AnimateInView
                key={item.id}
                delay={index * 100}
                className='border-border/70 border-b py-8 md:border-b-0 md:px-8 md:not-first:border-l md:first:pl-0'
              >
                <span className='font-mono text-xs text-sky-600 dark:text-sky-400'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className='mt-6 text-lg font-semibold tracking-tight'>
                  {item.title}
                </h3>
                <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>
                  {item.desc}
                </p>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      <section className='relative z-10 px-6 pb-24 md:pb-36'>
        <AnimateInView
          animation='fade-in'
          className='relative mx-auto max-w-7xl overflow-hidden rounded-3xl p-px'
        >
          {/* Rotating light beam drawn through the 1px border gap */}
          <div
            aria-hidden
            className='absolute top-1/2 left-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 animate-[spin_6s_linear_infinite] motion-reduce:animate-none'
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 280deg, oklch(0.75 0.15 230) 330deg, oklch(0.6 0.22 280) 350deg, transparent 360deg)',
            }}
          />
          <div className='bg-foreground text-background relative overflow-hidden rounded-[calc(1.5rem-1px)] px-8 py-16 md:px-16 md:py-24'>
            <div
              aria-hidden
              className='absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent_70%)] opacity-20'
              style={{
                backgroundImage:
                  'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div
              aria-hidden
              className='absolute -right-24 -bottom-32 size-[28rem] rounded-full opacity-40 blur-3xl'
              style={{
                background:
                  'radial-gradient(closest-side, oklch(0.7 0.16 230), transparent)',
              }}
            />
            <div className='relative max-w-2xl'>
              <span className='font-mono text-xs tracking-[0.2em] uppercase opacity-60'>
                04 — {t('Contact')}
              </span>
              <h2 className='mt-6 text-3xl leading-tight font-semibold tracking-tight md:text-5xl'>
                {t('Ready to put AI to work?')}
              </h2>
              <p className='mt-5 text-sm leading-relaxed opacity-70 md:text-base'>
                {t(
                  'Start with Mass today, or talk to us about inference optimization, model training, and data services.'
                )}
              </p>
              <div className='mt-10 flex flex-wrap items-center gap-3'>
                <Button
                  variant='secondary'
                  className='group h-12 rounded-full px-6 text-sm font-medium'
                  render={<a href='#mass' />}
                >
                  {t('Explore Mass')}
                  <ArrowRight className='ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                <Button
                  variant='ghost'
                  className='hover:bg-background/10 hover:text-background h-12 rounded-full px-6 text-sm font-medium'
                  render={<Link to='/about' />}
                >
                  {t('About')}
                </Button>
              </div>
            </div>
          </div>
        </AnimateInView>
      </section>
    </>
  )
}
