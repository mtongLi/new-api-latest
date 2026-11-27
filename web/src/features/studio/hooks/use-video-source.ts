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
import { useEffect, useState } from 'react'

import { fetchVideoContentUrl } from '../api'
import type { StudioJob } from '../types'
import { useStudioTokenKeyResolver } from './use-studio-token'

/**
 * Resolve a playable source for a finished video job.
 *
 * Uses the result URL when the task exposes one; otherwise downloads the file
 * through the gateway content proxy, which needs the submitting token.
 */
export function useVideoSource(job: StudioJob) {
  const resolveKey = useStudioTokenKeyResolver()
  const directUrl = job.assets[0]?.url
  const needsProxy =
    job.status === 'succeeded' &&
    !directUrl &&
    job.taskId != null &&
    job.tokenId != null
  const [proxyUrl, setProxyUrl] = useState<string>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!needsProxy) return
    const controller = new AbortController()
    let objectUrl: string | undefined

    resolveKey(job.tokenId as number)
      .then((key) =>
        fetchVideoContentUrl(key, job.taskId as string, controller.signal)
      )
      .then((url) => {
        objectUrl = url
        setProxyUrl(url)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [needsProxy, job.taskId, job.tokenId, resolveKey])

  return {
    src: directUrl ?? proxyUrl,
    isLoading: needsProxy && !proxyUrl && !failed,
    failed,
  }
}
