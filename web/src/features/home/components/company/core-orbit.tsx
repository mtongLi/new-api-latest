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
import { Boxes, Cpu, Database, Layers, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { MASS_PRODUCT_NAME } from '../../constants'

type OrbitAnchor = 'top' | 'bottom' | 'left' | 'right'

const ANCHOR_CLASSES: Record<OrbitAnchor, string> = {
  top: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
  bottom: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2',
  left: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
}

interface OrbitNode {
  id: string
  label: string
  icon: LucideIcon
  anchor: OrbitAnchor
  highlight?: boolean
}

/**
 * Hero visual: the four business lines orbiting a glowing core. Rings spin
 * slowly; node labels counter-rotate so they stay upright.
 */
export function CoreOrbit() {
  const { t } = useTranslation()

  const outerNodes: OrbitNode[] = [
    {
      id: 'mass',
      label: MASS_PRODUCT_NAME,
      icon: Layers,
      anchor: 'top',
      highlight: true,
    },
    { id: 'data', label: t('Model Data'), icon: Database, anchor: 'bottom' },
  ]
  const middleNodes: OrbitNode[] = [
    { id: 'training', label: t('Model Training'), icon: Boxes, anchor: 'left' },
    {
      id: 'inference',
      label: t('Inference Optimization'),
      icon: Cpu,
      anchor: 'right',
    },
  ]

  const rings = [
    {
      id: 'outer',
      inset: 'inset-0',
      spin: 'animate-[spin_60s_linear_infinite]',
      counter: 'animate-[spin_60s_linear_infinite_reverse]',
      border: 'border-border/80',
      nodes: outerNodes,
    },
    {
      id: 'middle',
      inset: 'inset-[17%]',
      spin: 'animate-[spin_40s_linear_infinite_reverse]',
      counter: 'animate-[spin_40s_linear_infinite]',
      border: 'border-dashed border-sky-500/30',
      nodes: middleNodes,
    },
  ]

  return (
    <div
      aria-hidden
      className='relative mx-auto aspect-square w-full max-w-[30rem] select-none'
    >
      {/* Ambient glow */}
      <div
        className='absolute inset-[18%] rounded-full opacity-60 blur-3xl'
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.72 0.17 230 / 70%), oklch(0.55 0.22 275 / 40%), transparent)',
        }}
      />

      {rings.map((ring) => (
        <div
          key={ring.id}
          className={cn(
            'absolute rounded-full border motion-reduce:animate-none',
            ring.inset,
            ring.border,
            ring.spin
          )}
        >
          {ring.nodes.map((node) => {
            const Icon = node.icon
            return (
              <div
                key={node.id}
                className={cn('absolute', ANCHOR_CLASSES[node.anchor])}
              >
                <div
                  className={cn(
                    'bg-background/85 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-sm backdrop-blur motion-reduce:animate-none',
                    ring.counter,
                    node.highlight
                      ? 'border-sky-500/60 text-sky-700 shadow-[0_0_24px_-4px_oklch(0.7_0.16_230/0.7)] dark:text-sky-300'
                      : 'border-border'
                  )}
                >
                  <Icon className='size-3.5' strokeWidth={2} />
                  {node.label}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Inner ring with orbiting dots */}
      <div className='absolute inset-[33%] animate-[spin_14s_linear_infinite] rounded-full border border-sky-500/40 motion-reduce:animate-none'>
        <span className='absolute top-0 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_12px_2px_oklch(0.75_0.15_230)]' />
        <span className='absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-400' />
      </div>

      {/* Core */}
      <div className='absolute inset-[40%] flex items-center justify-center'>
        <span className='absolute inset-0 animate-ping rounded-full bg-sky-500/20 [animation-duration:3s] motion-reduce:hidden' />
        <span className='relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 font-mono text-lg font-bold tracking-tight text-white shadow-[0_0_60px_-6px_oklch(0.65_0.2_250)]'>
          AI
        </span>
      </div>
    </div>
  )
}
