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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { STATUS_QUERY_KEY } from '@/lib/status-query'

import { PublicHeader } from '../public-header'

async function renderHeader(compact?: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(STATUS_QUERY_KEY, {})
  const root = createRootRoute()
  const page = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => (
      <PublicHeader
        compact={compact}
        showNotifications={false}
        showVersion={false}
      />
    ),
  })
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  await router.load()
  await screen.findAllByRole('navigation')
  return document.querySelector('header > div')
}

afterEach(() => {
  localStorage.clear()
})

describe('PublicHeader compact mode', () => {
  it('uses the full-width bar at the top of the page by default', async () => {
    const shell = await renderHeader()

    expect(shell).toHaveClass('max-w-7xl')
    expect(shell).not.toHaveClass('max-w-[52rem]')
  })

  it('keeps the centered compact bar without scrolling when compact is set', async () => {
    const shell = await renderHeader(true)

    expect(shell).toHaveClass('mx-auto', 'max-w-[52rem]')
    expect(shell).not.toHaveClass('max-w-7xl')
  })
})
