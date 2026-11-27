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
import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import type { ShowcaseArt } from '../showcase'

// Film grain shared by every cover, as an inline SVG so no asset is fetched.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")"

function patternLayer(art: ShowcaseArt): string {
  const [a, b, c] = art.colors
  if (art.pattern === 'waves') {
    return [
      `radial-gradient(120% 60% at 50% 110%, ${c} 0%, transparent 60%)`,
      `radial-gradient(140% 55% at 20% 95%, ${a}cc 0%, transparent 55%)`,
      `radial-gradient(140% 50% at 85% 80%, ${b}aa 0%, transparent 55%)`,
    ].join(', ')
  }
  if (art.pattern === 'rings') {
    return [
      `repeating-radial-gradient(circle at 50% 45%, transparent 0 18px, ${c}40 19px 21px)`,
      `radial-gradient(circle at 50% 45%, ${a} 0%, transparent 45%)`,
    ].join(', ')
  }
  return [
    `radial-gradient(circle at 25% 30%, ${a} 0%, transparent 38%)`,
    `radial-gradient(circle at 75% 65%, ${c} 0%, transparent 40%)`,
    `radial-gradient(circle at 60% 20%, ${b}cc 0%, transparent 30%)`,
  ].join(', ')
}

type StudioArtProps = {
  art: ShowcaseArt
  /** Pan the gradient continuously, used for video covers and loading. */
  animated?: boolean
  className?: string
}

/**
 * Abstract cover made from gradients and grain. Colors are example data, so
 * they are applied through inline styles.
 */
export function StudioArt(props: StudioArtProps) {
  const [a, b, c] = props.art.colors
  const base: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${a}, ${b}, ${c}, ${a})`,
  }

  return (
    <div
      aria-hidden='true'
      className={cn('relative overflow-hidden', props.className)}
    >
      <div
        className={cn('absolute inset-0', props.animated && 'studio-pan')}
        style={base}
      />
      <div
        className={cn(
          'absolute inset-0 mix-blend-screen',
          props.animated && 'studio-drift'
        )}
        style={{ backgroundImage: patternLayer(props.art) }}
      />
      <div
        className='absolute inset-0 opacity-30 mix-blend-overlay'
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  )
}
