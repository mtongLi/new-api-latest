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
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STUDIO_HISTORY_LIMIT } from '@/features/studio/constants'
import type { StudioJob, StudioView } from '@/features/studio/types'

type StudioHistoryState = {
  jobs: StudioJob[]
  /** Token chosen for creations; only the id is stored, never the key. */
  tokenId: number | null
  /** User the history belongs to; another sign-in on this browser resets it. */
  ownerId: number | null
  /** Last model picked in each studio view. */
  selectedModels: Partial<Record<StudioView, string>>
  setSelectedModel: (view: StudioView, model: string) => void
  ensureOwner: (userId: number) => void
  addJob: (job: StudioJob) => void
  updateJob: (id: string, patch: Partial<StudioJob>) => void
  removeJob: (id: string) => void
  clearJobs: () => void
  setTokenId: (tokenId: number | null) => void
}

/** i18n key stored for an image request cut off by a page reload. */
export const INTERRUPTED_JOB_ERROR = 'Generation was interrupted'

/**
 * Shape jobs for localStorage.
 *
 * Session-only media is dropped because inline base64 images would quickly
 * exceed the storage quota. An image request still running cannot resume
 * after a reload, so it is stored as interrupted; video tasks keep their
 * status because polling resumes from the task id.
 */
export function toPersistedJobs(jobs: StudioJob[]): StudioJob[] {
  return jobs.map((job) => {
    let persisted = job
    if (job.assets.some((asset) => asset.ephemeral)) {
      persisted = {
        ...persisted,
        assets: job.assets.filter((asset) => !asset.ephemeral),
      }
    }
    if (
      job.mode === 'image' &&
      (job.status === 'running' || job.status === 'pending')
    ) {
      persisted = { ...persisted, status: 'failed', error: INTERRUPTED_JOB_ERROR }
    }
    return persisted
  })
}

export const useStudioHistoryStore = create<StudioHistoryState>()(
  persist(
    (set) => ({
      jobs: [],
      tokenId: null,
      ownerId: null,
      selectedModels: {},
      setSelectedModel: (view, model) =>
        set((state) => ({
          selectedModels: { ...state.selectedModels, [view]: model },
        })),
      ensureOwner: (userId) =>
        set((state) =>
          state.ownerId === userId
            ? state
            : { ownerId: userId, jobs: [], tokenId: null }
        ),
      addJob: (job) =>
        set((state) => ({
          jobs: [job, ...state.jobs].slice(0, STUDIO_HISTORY_LIMIT),
        })),
      updateJob: (id, patch) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...patch } : job
          ),
        })),
      removeJob: (id) =>
        set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),
      clearJobs: () => set({ jobs: [] }),
      setTokenId: (tokenId) => set({ tokenId }),
    }),
    {
      name: 'studio-history',
      version: 1,
      partialize: (state) => ({
        jobs: toPersistedJobs(state.jobs),
        tokenId: state.tokenId,
        ownerId: state.ownerId,
        selectedModels: state.selectedModels,
      }),
    }
  )
)
