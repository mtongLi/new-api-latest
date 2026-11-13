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
import { AppWindow, Boxes, Cpu, Database, Layers } from 'lucide-react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

import { MASS_PRODUCT_NAME } from '../../constants'
import { SectionHeading } from './section-heading'

export function CompanyServices() {
  const { t } = useTranslation()

  const pipeline = [
    {
      id: 'data',
      title: t('Model Data'),
      caption: t('Curation and annotation'),
      icon: Database,
    },
    {
      id: 'training',
      title: t('Model Training'),
      caption: t('Fine-tuning and alignment'),
      icon: Boxes,
    },
    {
      id: 'inference',
      title: t('Inference Optimization'),
      caption: t('Faster, cheaper model serving'),
      icon: Cpu,
    },
    {
      id: 'mass',
      title: MASS_PRODUCT_NAME,
      caption: t('Model aggregation platform'),
      icon: Layers,
    },
    {
      id: 'apps',
      title: t('Your applications'),
      caption: t('Products and agents'),
      icon: AppWindow,
    },
  ]

  const services = [
    {
      id: 'data',
      title: t('Model Data'),
      desc: t(
        'High-quality datasets for training and evaluation: collection, cleaning, annotation, and synthetic data generation.'
      ),
      points: [
        t('Data cleaning and deduplication'),
        t('Expert annotation'),
        t('Synthetic data generation'),
      ],
    },
    {
      id: 'training',
      title: t('Model Training'),
      desc: t(
        'Adapt models to your domain, from continued pre-training to supervised fine-tuning and preference alignment.'
      ),
      points: [
        t('Domain fine-tuning'),
        t('Alignment and evaluation'),
        t('Training pipeline engineering'),
      ],
    },
    {
      id: 'inference',
      title: t('Inference Optimization'),
      desc: t(
        'Lower latency and serving cost for model deployments through quantization, batching, caching, and hardware-aware tuning.'
      ),
      points: [
        t('Quantization and compression'),
        t('Throughput and latency tuning'),
        t('Private deployment support'),
      ],
    },
    {
      id: 'mass',
      title: MASS_PRODUCT_NAME,
      desc: t(
        'A unified model aggregation platform: access mainstream large models through one standard API, with unified billing, routing, and usage monitoring.'
      ),
      points: [
        t('One API for many models'),
        t('Smart routing and failover'),
        t('Transparent pay-as-you-go billing'),
      ],
    },
  ]

  return (
    <section
      id='services'
      className='relative z-10 scroll-mt-16 px-6 py-24 md:py-36'
    >
      <div className='mx-auto max-w-7xl'>
        <SectionHeading
          index='01'
          label={t('Business')}
          title={t('One team across the full AI stack')}
          description={t(
            'From the data that shapes a model to the platform that serves it, we help teams build and run AI with confidence.'
          )}
        />

        {/* Pipeline diagram */}
        <AnimateInView
          animation='fade-in'
          className='mb-16 flex flex-col items-stretch lg:flex-row lg:items-center'
        >
          {pipeline.map((node, index) => {
            const Icon = node.icon
            const isMass = node.id === 'mass'
            const isApps = node.id === 'apps'
            return (
              <Fragment key={node.id}>
                {index > 0 && (
                  <div
                    aria-hidden
                    className='bg-border relative mx-auto h-6 w-px overflow-hidden lg:mx-0 lg:h-px lg:w-auto lg:min-w-6 lg:flex-1'
                  >
                    <span
                      className='company-flow-pulse absolute inset-y-0 left-0 hidden w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent lg:block'
                      style={{ animationDelay: `${index * 350}ms` }}
                    />
                  </div>
                )}
                <div
                  className={cn(
                    'bg-background flex items-center gap-3 rounded-xl border px-4 py-3 lg:shrink-0',
                    isMass &&
                      'border-sky-500/50 shadow-[0_0_0_4px_oklch(0.7_0.15_230/0.12)]',
                    isApps && 'border-dashed',
                    !isMass && !isApps && 'border-border'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 shrink-0',
                      isMass
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-muted-foreground'
                    )}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <div className='min-w-0'>
                    <div className='text-sm font-medium'>{node.title}</div>
                    <div className='text-muted-foreground text-xs'>
                      {node.caption}
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          })}
        </AnimateInView>

        {/* Detail grid */}
        <div className='border-border/70 grid border-t border-l md:grid-cols-2 lg:grid-cols-4'>
          {services.map((service, index) => (
            <AnimateInView
              key={service.id}
              delay={index * 80}
              className='border-border/70 border-r border-b'
            >
              <div
                className='group/spot relative isolate flex h-full flex-col overflow-hidden p-7 md:p-8'
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  event.currentTarget.style.setProperty(
                    '--spot-x',
                    `${event.clientX - rect.left}px`
                  )
                  event.currentTarget.style.setProperty(
                    '--spot-y',
                    `${event.clientY - rect.top}px`
                  )
                }}
              >
                {/* Cursor spotlight and top accent line */}
                <div
                  aria-hidden
                  className='pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100'
                  style={{
                    background:
                      'radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), oklch(0.72 0.15 230 / 0.16), transparent 70%)',
                  }}
                />
                <span
                  aria-hidden
                  className='absolute top-0 left-0 h-px w-0 bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500 group-hover/spot:w-full'
                />
                <span className='text-muted-foreground mb-10 font-mono text-xs transition-colors group-hover/spot:text-sky-500'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className='text-xl font-semibold tracking-tight'>
                  {service.title}
                </h3>
                <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>
                  {service.desc}
                </p>
                <ul className='mt-auto space-y-2 pt-8'>
                  {service.points.map((point) => (
                    <li
                      key={point}
                      className='text-foreground/80 flex items-center gap-2.5 text-sm'
                    >
                      <span
                        className='size-1 shrink-0 bg-sky-500'
                        aria-hidden
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
