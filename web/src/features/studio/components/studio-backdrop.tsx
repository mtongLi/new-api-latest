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

import { STUDIO_ACCENTS } from '../showcase'
import type { StudioView } from '../types'

const BLOB_LAYOUT = [
  'top-[-12%] left-[8%] size-[42rem]',
  'top-[20%] right-[-10%] size-[36rem] [animation-delay:-6s]',
  'bottom-[-18%] left-[35%] size-[34rem] [animation-delay:-12s]',
]

/**
 * Aurora behind the studio: three blurred blobs drift slowly and fade to the
 * active view's colors, over a faint grid. Purely decorative.
 */
export function StudioBackdrop(props: { view: StudioView }) {
  const glow = STUDIO_ACCENTS[props.view].glow

  return (
    <div
      aria-hidden='true'
      className='pointer-events-none fixed inset-0 overflow-hidden'
    >
      {BLOB_LAYOUT.map((layout, index) => (
        <motion.div
          key={layout}
          className={`studio-drift absolute rounded-full opacity-[0.16] blur-3xl dark:opacity-[0.22] ${layout}`}
          animate={{ backgroundColor: glow[index] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      ))}
      <div className='absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] bg-[size:48px_48px] opacity-40' />
    </div>
  )
}
