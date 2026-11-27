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
import { describe, expect, it } from 'vitest'

import { Tabs, TabsList, TabsTrigger } from '../tabs'

function renderTabs(orientation?: 'horizontal' | 'vertical') {
  render(
    <Tabs orientation={orientation} defaultValue='a'>
      <TabsList aria-label='Sections'>
        <TabsTrigger value='a'>A</TabsTrigger>
        <TabsTrigger value='b'>B</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

describe('Tabs orientation', () => {
  it('defaults to a horizontal tab list', () => {
    renderTabs()

    expect(screen.getByRole('tablist')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    )
  })

  it('exposes a vertical tab list when orientation is vertical', () => {
    renderTabs('vertical')

    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    )
  })

  it('moves focus with the down arrow key in a vertical tab list', async () => {
    const user = userEvent.setup()
    renderTabs('vertical')

    await user.click(screen.getByRole('tab', { name: 'A' }))
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus()
  })
})
