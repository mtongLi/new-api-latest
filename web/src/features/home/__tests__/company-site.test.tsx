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
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { CompanyServices } from '../components/company/company-services'
import { MassSpotlight } from '../components/company/mass-spotlight'
import { ModelMarquee } from '../components/company/model-marquee'

async function renderAtHome(content: ReactNode) {
  const root = createRootRoute()
  const home = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => content,
  })
  const router = createRouter({
    routeTree: root.addChildren([home]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  await router.load()
}

describe('company site', () => {
  it('exposes each model provider once to assistive tech when the marquee loops', () => {
    render(<ModelMarquee />)

    const names = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(names).toHaveLength(12)
    expect(new Set(names).size).toBe(12)
  })

  it('lists the three service lines and Mass in pipeline order when services render', () => {
    render(<CompanyServices />)

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual([
      'Model Data',
      'Model Training',
      'Inference Optimization',
      'Mass',
    ])
  })

  it('points the Mass call to action at sign-up for visitors', async () => {
    await renderAtHome(<MassSpotlight isAuthenticated={false} />)

    expect(
      await screen.findByRole('button', { name: 'Get Started' })
    ).toHaveAttribute('href', '/sign-up')
  })

  it('points the Mass call to action at the dashboard for signed-in users', async () => {
    await renderAtHome(<MassSpotlight isAuthenticated />)

    expect(
      await screen.findByRole('button', { name: 'Go to Dashboard' })
    ).toHaveAttribute('href', '/dashboard')
  })
})
