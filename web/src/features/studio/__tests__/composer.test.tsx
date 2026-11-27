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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { StudioComposer } from '../components/studio-composer'

function renderComposer(
  overrides: Partial<Parameters<typeof StudioComposer>[0]> = {}
) {
  const models = overrides.models ?? ['gpt-image-1']
  const props = {
    mode: 'image' as const,
    models,
    model: models[0] ?? '',
    onModelChange: vi.fn(),
    onCreateImage: vi.fn(),
    onCreateVideo: vi.fn(),
    ...overrides,
  }
  render(<StudioComposer {...props} />)
  return props
}

describe('StudioComposer', () => {
  it('keeps Generate disabled until a prompt is entered', async () => {
    const user = userEvent.setup()
    renderComposer()
    const generate = screen.getByRole('button', { name: /Generate/ })

    expect(generate).toBeDisabled()

    await user.type(screen.getByRole('textbox'), 'a red fox')

    expect(generate).toBeEnabled()
  })

  it('keeps Generate disabled when no model is available', async () => {
    const user = userEvent.setup()
    renderComposer({ models: [] })

    await user.type(screen.getByRole('textbox'), 'a red fox')

    expect(screen.getByRole('button', { name: /Generate/ })).toBeDisabled()
  })

  it('submits an image request with the selected model and default options', async () => {
    const user = userEvent.setup()
    const props = renderComposer()

    await user.type(screen.getByRole('textbox'), 'a red fox')
    await user.click(screen.getByRole('button', { name: /Generate/ }))

    await waitFor(() => expect(props.onCreateImage).toHaveBeenCalledTimes(1))
    expect(props.onCreateImage).toHaveBeenCalledWith(
      {
        model: 'gpt-image-1',
        prompt: 'a red fox',
        size: '1024x1024',
        n: 1,
        references: [],
      },
      '1024x1024 · ×1'
    )
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('submits a video request with default duration and size in video mode', async () => {
    const user = userEvent.setup()
    const props = renderComposer({ mode: 'video', models: ['sora-2'] })

    await user.type(screen.getByRole('textbox'), 'waves at dusk')
    await user.click(screen.getByRole('button', { name: /Generate/ }))

    await waitFor(() => expect(props.onCreateVideo).toHaveBeenCalledTimes(1))
    expect(props.onCreateVideo).toHaveBeenCalledWith(
      {
        model: 'sora-2',
        prompt: 'waves at dusk',
        size: '1280x720',
        duration: 5,
        image: undefined,
      },
      '5s · 1280x720'
    )
    expect(props.onCreateImage).not.toHaveBeenCalled()
  })

  it('asks a visitor to sign in instead of generating and keeps the prompt', async () => {
    const user = userEvent.setup()
    const onGuestSubmit = vi.fn()
    const props = renderComposer({ guest: true, models: [], onGuestSubmit })

    await user.type(screen.getByRole('textbox'), 'a red fox')
    await user.click(screen.getByRole('button', { name: /Generate/ }))

    await waitFor(() => expect(onGuestSubmit).toHaveBeenCalledTimes(1))
    expect(props.onCreateImage).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveValue('a red fox')
  })

  it('starts from a draft prompt and size when an example was applied', () => {
    renderComposer({
      draft: { prompt: 'Minimalist desert dunes', size: '1792x1024' },
    })

    expect(screen.getByRole('textbox')).toHaveValue('Minimalist desert dunes')
    expect(screen.getByRole('textbox')).toHaveFocus()
    expect(screen.getByRole('combobox', { name: 'Size' })).toHaveTextContent(
      '1792x1024'
    )
    expect(screen.getByRole('button', { name: /Generate/ })).toBeEnabled()
  })
})
