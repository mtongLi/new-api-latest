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
import { t } from 'i18next'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores/auth-store'
import { useStudioHistoryStore } from '@/stores/studio-history-store'

import { fetchVideoTask, generateImages, submitVideo } from '../api'
import { VIDEO_POLL_INTERVAL_MS } from '../constants'
import type {
  ImageGenerationParams,
  StudioJob,
  VideoGenerationParams,
} from '../types'
import { useStudioTokenKeyResolver } from './use-studio-token'

/** Poll failures that will not recover on retry (missing task, revoked token). */
const TERMINAL_POLL_STATUSES = new Set([400, 401, 403, 404])

function createJobId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : t('Generation failed')
}

function isActiveVideoJob(job: StudioJob): boolean {
  return (
    job.mode === 'video' &&
    job.taskId != null &&
    job.tokenId != null &&
    (job.status === 'pending' || job.status === 'running')
  )
}

/** Submit creations and keep unfinished video tasks in sync. */
export function useStudioGeneration(
  tokenId: number | undefined,
  apiKey: string | undefined
) {
  const jobs = useStudioHistoryStore((s) => s.jobs)
  const addJob = useStudioHistoryStore((s) => s.addJob)
  const updateJob = useStudioHistoryStore((s) => s.updateJob)
  const resolveKey = useStudioTokenKeyResolver()
  const isAuthed = useAuthStore((s) => s.auth.user != null)

  const createImage = useCallback(
    async (params: ImageGenerationParams, summary: string) => {
      if (!apiKey || tokenId == null) return
      const id = createJobId()
      addJob({
        id,
        mode: 'image',
        model: params.model,
        prompt: params.prompt,
        status: 'running',
        createdAt: Date.now(),
        summary,
        tokenId,
        assets: [],
      })
      try {
        const assets = await generateImages(apiKey, params)
        updateJob(id, { status: 'succeeded', assets })
      } catch (error) {
        const message = errorMessage(error)
        updateJob(id, { status: 'failed', error: message })
        toast.error(message)
      }
    },
    [addJob, apiKey, tokenId, updateJob]
  )

  const createVideo = useCallback(
    async (params: VideoGenerationParams, summary: string) => {
      if (!apiKey || tokenId == null) return
      const id = createJobId()
      addJob({
        id,
        mode: 'video',
        model: params.model,
        prompt: params.prompt,
        status: 'pending',
        createdAt: Date.now(),
        summary,
        tokenId,
        assets: [],
      })
      try {
        const taskId = await submitVideo(apiKey, params)
        updateJob(id, { taskId })
      } catch (error) {
        const message = errorMessage(error)
        updateJob(id, { status: 'failed', error: message })
        toast.error(message)
      }
    },
    [addJob, apiKey, tokenId, updateJob]
  )

  // Poll every unfinished video task, including ones restored from history.
  // Visitors never poll: resolving a token key needs a session.
  const jobsRef = useRef(jobs)
  jobsRef.current = jobs
  const hasActiveVideo = isAuthed && jobs.some(isActiveVideoJob)

  useEffect(() => {
    if (!hasActiveVideo) return
    const controller = new AbortController()
    let polling = false

    const poll = async () => {
      if (polling) return
      polling = true
      try {
        for (const job of jobsRef.current.filter(isActiveVideoJob)) {
          try {
            const key = await resolveKey(job.tokenId as number)
            const snapshot = await fetchVideoTask(
              key,
              job.taskId as string,
              controller.signal
            )
            updateJob(job.id, {
              status: snapshot.status,
              progress: snapshot.progress,
              assets: snapshot.url ? [{ url: snapshot.url }] : job.assets,
              error:
                snapshot.status === 'failed'
                  ? (snapshot.error ?? t('Generation failed'))
                  : undefined,
            })
          } catch (error) {
            if (controller.signal.aborted) return
            // Keep polling on transient errors; a missing task or revoked
            // token will not recover, so stop tracking it.
            const status = (error as { status?: number }).status
            if (status != null && TERMINAL_POLL_STATUSES.has(status)) {
              updateJob(job.id, {
                status: 'failed',
                error: errorMessage(error),
              })
            }
          }
        }
      } finally {
        polling = false
      }
    }

    void poll()
    const timer = window.setInterval(() => void poll(), VIDEO_POLL_INTERVAL_MS)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [hasActiveVideo, resolveKey, updateJob])

  return { createImage, createVideo }
}
