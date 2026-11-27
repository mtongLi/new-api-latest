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

import { PlaygroundChat } from '../playground-chat'

describe('PlaygroundChat empty state', () => {
  it('shows the default starter screen when no custom empty state is given', () => {
    render(<PlaygroundChat messages={[]} onSelectPrompt={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Start a playground chat' })
    ).toBeInTheDocument()
  })

  it('renders a custom empty state that can send a prompt', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()
    render(
      <PlaygroundChat
        messages={[]}
        onSelectPrompt={onSelectPrompt}
        renderEmptyState={(send) => (
          <button type='button' onClick={() => send('hello')}>
            Custom starter
          </button>
        )}
      />
    )

    expect(
      screen.queryByRole('heading', { name: 'Start a playground chat' })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Custom starter' }))

    expect(onSelectPrompt).toHaveBeenCalledWith('hello')
  })
})
