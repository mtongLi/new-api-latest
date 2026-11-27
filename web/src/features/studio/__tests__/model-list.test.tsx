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

import { StudioModelList } from '../components/studio-model-list'

function renderList(
  overrides: Partial<Parameters<typeof StudioModelList>[0]> = {}
) {
  const props = {
    view: 'image' as const,
    models: ['flux-dev', 'gpt-image-1', 'seedream-4'],
    value: 'gpt-image-1',
    onChange: vi.fn(),
    emptyText: 'No image generation models available.',
    ...overrides,
  }
  render(<StudioModelList {...props} />)
  return props
}

describe('StudioModelList', () => {
  it('lists every model with the selected one marked as current', () => {
    renderList()

    const options = screen.getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'flux-dev',
      'gpt-image-1',
      'seedream-4',
    ])
    expect(screen.getByRole('option', { name: 'gpt-image-1' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    expect(
      screen.getByRole('option', { name: 'flux-dev' })
    ).not.toHaveAttribute('aria-current')
  })

  it('reports the clicked model', async () => {
    const user = userEvent.setup()
    const props = renderList()

    await user.click(screen.getByRole('option', { name: 'seedream-4' }))

    expect(props.onChange).toHaveBeenCalledWith('seedream-4')
  })

  it('narrows the list by the search keyword, ignoring case', async () => {
    const user = userEvent.setup()
    renderList()

    await user.type(screen.getByRole('combobox'), 'FLUX')

    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['flux-dev'])
  })

  it('shows a no-match message when the search finds nothing', async () => {
    const user = userEvent.setup()
    renderList()

    await user.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No model found.')).toBeInTheDocument()
  })

  it('shows the empty text when no model is available', () => {
    renderList({ models: [], value: '' })

    expect(
      screen.getByText('No image generation models available.')
    ).toBeInTheDocument()
  })

  it('shows a loading state instead of models while loading', () => {
    renderList({ isLoading: true })

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
