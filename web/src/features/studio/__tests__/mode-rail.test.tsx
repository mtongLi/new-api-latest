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
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tabs } from '@/components/ui/tabs'

import { StudioModeRail } from '../components/studio-mode-rail'
import type { StudioView } from '../types'

function renderRail(value: StudioView = 'text') {
  const onValueChange = vi.fn()
  render(
    <Tabs orientation='vertical' value={value} onValueChange={onValueChange}>
      <StudioModeRail active={value} />
    </Tabs>
  )
  return { onValueChange }
}

describe('StudioModeRail', () => {
  it('lists text, image and video generation from top to bottom in a vertical tab list', () => {
    renderRail()

    const tablist = screen.getByRole('tablist', { name: 'Creation mode' })
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical')
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Text generation',
      'Image generation',
      'Video generation',
    ])
  })

  it('vertically centers the tab list inside the rail', () => {
    renderRail()

    const rail = screen.getByRole('tablist').parentElement
    expect(rail).toHaveClass('flex', 'items-center', 'justify-center')
  })

  it('marks the current mode as selected', () => {
    renderRail('video')

    expect(screen.getByRole('tab', { name: 'Video generation' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('reports the chosen mode when a tab is clicked', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderRail()

    await user.click(screen.getByRole('tab', { name: 'Image generation' }))

    expect(onValueChange).toHaveBeenCalledWith('image', expect.anything())
  })
})
