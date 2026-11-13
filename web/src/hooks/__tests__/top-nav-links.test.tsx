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
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { STATUS_QUERY_KEY } from '@/lib/status-query'

import { useTopNavLinks } from '../use-top-nav-links'

function renderNavLinks(status: Record<string, unknown>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(STATUS_QUERY_KEY, status)
  const wrapper = (props: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  )
  return renderHook(() => useTopNavLinks(), { wrapper }).result.current
}

afterEach(() => {
  localStorage.clear()
})

describe('useTopNavLinks', () => {
  it('groups platform links under Models and adds the business anchor with default modules', () => {
    const links = renderNavLinks({})

    expect(
      links.map((link) => [link.title, link.href, link.hash, link.group])
    ).toEqual([
      ['Home', '/', undefined, undefined],
      ['Business', '/', 'services', undefined],
      ['Console', '/dashboard', undefined, 'Models'],
      ['Model Square', '/pricing', undefined, 'Models'],
      ['Rankings', '/rankings', undefined, 'Models'],
      ['Docs', '/docs', undefined, 'Models'],
      ['About', '/about', undefined, undefined],
    ])
  })

  it('hides the business anchor when the home module is disabled', () => {
    const links = renderNavLinks({
      HeaderNavModules: JSON.stringify({ home: false }),
    })

    expect(links.some((link) => link.hash === 'services')).toBe(false)
    expect(links.some((link) => link.href === '/')).toBe(false)
  })
})
