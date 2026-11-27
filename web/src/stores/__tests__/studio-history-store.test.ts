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
import { afterEach, describe, expect, it } from 'vitest'

import type { StudioJob } from '@/features/studio/types'

import {
  INTERRUPTED_JOB_ERROR,
  toPersistedJobs,
  useStudioHistoryStore,
} from '../studio-history-store'

function job(overrides: Partial<StudioJob>): StudioJob {
  return {
    id: 'job-1',
    mode: 'image',
    model: 'gpt-image-1',
    prompt: 'a cat',
    status: 'succeeded',
    createdAt: 1,
    assets: [],
    ...overrides,
  }
}

afterEach(() => {
  useStudioHistoryStore.setState({ jobs: [], tokenId: null, ownerId: null })
  localStorage.clear()
})

describe('toPersistedJobs', () => {
  it('drops base64 images but keeps remote image URLs', () => {
    const [persisted] = toPersistedJobs([
      job({
        assets: [
          { url: 'https://cdn.example.com/a.png' },
          { url: 'data:image/png;base64,QUJD', ephemeral: true },
        ],
      }),
    ])

    expect(persisted.assets).toEqual([{ url: 'https://cdn.example.com/a.png' }])
  })

  it('stores a running image request as interrupted because it cannot resume', () => {
    const [persisted] = toPersistedJobs([job({ status: 'running' })])

    expect(persisted.status).toBe('failed')
    expect(persisted.error).toBe(INTERRUPTED_JOB_ERROR)
  })

  it('keeps a running video task as running so polling resumes after reload', () => {
    const [persisted] = toPersistedJobs([
      job({ mode: 'video', status: 'running', taskId: 'task_1', tokenId: 3 }),
    ])

    expect(persisted.status).toBe('running')
    expect(persisted.taskId).toBe('task_1')
  })
})

describe('useStudioHistoryStore.ensureOwner', () => {
  it('clears history and token choice when a different user signs in', () => {
    useStudioHistoryStore.setState({ jobs: [job({})], tokenId: 7, ownerId: 1 })

    useStudioHistoryStore.getState().ensureOwner(2)

    const state = useStudioHistoryStore.getState()
    expect(state.jobs).toEqual([])
    expect(state.tokenId).toBeNull()
    expect(state.ownerId).toBe(2)
  })

  it('keeps history for the same user', () => {
    useStudioHistoryStore.setState({ jobs: [job({})], tokenId: 7, ownerId: 1 })

    useStudioHistoryStore.getState().ensureOwner(1)

    expect(useStudioHistoryStore.getState().jobs).toHaveLength(1)
    expect(useStudioHistoryStore.getState().tokenId).toBe(7)
  })
})
