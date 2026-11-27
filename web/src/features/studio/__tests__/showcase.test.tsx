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
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { StudioShowcase } from '../components/studio-showcase'
import { StudioTextShowcase } from '../components/studio-text-showcase'
import { IMAGE_SHOWCASE, TEXT_SHOWCASE, VIDEO_SHOWCASE } from '../showcase'

describe('StudioShowcase', () => {
  it('shows one card per image example under the Inspiration heading', () => {
    render(
      <StudioShowcase mode='image' examples={IMAGE_SHOWCASE} onUse={vi.fn()} />
    )

    const section = screen.getByRole('region', { name: 'Inspiration' })
    expect(within(section).getAllByRole('button')).toHaveLength(
      IMAGE_SHOWCASE.length
    )
  })

  it('hands the clicked example to onUse so its prompt and size can be applied', async () => {
    const user = userEvent.setup()
    const onUse = vi.fn()
    render(
      <StudioShowcase mode='image' examples={IMAGE_SHOWCASE} onUse={onUse} />
    )

    await user.click(
      screen.getByRole('button', { name: 'Use the "Desert dawn" example' })
    )

    expect(onUse).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'desert-dawn', size: '1792x1024' })
    )
  })

  it('labels video examples with their duration', () => {
    render(
      <StudioShowcase mode='video' examples={VIDEO_SHOWCASE} onUse={vi.fn()} />
    )

    const card = screen.getByRole('button', {
      name: 'Use the "Aurora over the lake" example',
    })
    expect(within(card).getByText('10 seconds')).toBeInTheDocument()
  })

  it('opens the example with the keyboard', async () => {
    const user = userEvent.setup()
    const onUse = vi.fn()
    render(
      <StudioShowcase mode='image' examples={IMAGE_SHOWCASE} onUse={onUse} />
    )

    await user.tab()
    await user.keyboard('{Enter}')

    expect(onUse).toHaveBeenCalledWith(IMAGE_SHOWCASE[0])
  })
})

describe('StudioTextShowcase', () => {
  it('sends the full prompt of the chosen starter', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()
    render(<StudioTextShowcase onSelectPrompt={onSelectPrompt} />)

    expect(screen.getAllByRole('button')).toHaveLength(TEXT_SHOWCASE.length)

    await user.click(screen.getByRole('button', { name: /Plan a trip/ }))

    expect(onSelectPrompt).toHaveBeenCalledWith(
      'Plan a 3-day food-focused trip to Chengdu with a daily schedule.'
    )
  })
})
