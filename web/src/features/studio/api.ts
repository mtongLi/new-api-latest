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

import {
  extractErrorMessage,
  extractImageAssets,
  extractVideoTaskId,
  parseVideoTask,
} from './lib/responses'
import type {
  ImageGenerationParams,
  StudioAsset,
  VideoGenerationParams,
  VideoTaskSnapshot,
} from './types'

// Relay endpoints authenticate with the selected API token, so these calls use
// fetch directly instead of the console axios instance, whose interceptors
// treat a 401 as an expired browser session.

export class StudioRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'StudioRequestError'
    this.status = status
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function relayRequest(
  apiKey: string,
  path: string,
  init: RequestInit & { signal?: AbortSignal } = {}
): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    headers: { ...authHeaders(apiKey), ...init.headers },
  })
  const body = await readBody(response)
  if (!response.ok) {
    throw new StudioRequestError(
      extractErrorMessage(body) ??
        t('Request failed with status {{status}}', {
          status: response.status,
        }),
      response.status
    )
  }
  return body
}

/** List model ids the token is allowed to call. */
export async function listTokenModels(
  apiKey: string,
  signal?: AbortSignal
): Promise<string[]> {
  const body = await relayRequest(apiKey, '/v1/models', { signal })
  const items = (body as { data?: unknown })?.data
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (item as { id?: unknown })?.id)
    .filter((id): id is string => typeof id === 'string' && id !== '')
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

/**
 * Create images. Reference images switch the request to the edits endpoint
 * (multipart), otherwise the JSON generations endpoint is used.
 */
export async function generateImages(
  apiKey: string,
  params: ImageGenerationParams,
  signal?: AbortSignal
): Promise<StudioAsset[]> {
  let body: unknown
  if (params.references.length > 0) {
    const form = new FormData()
    form.append('model', params.model)
    form.append('prompt', params.prompt)
    form.append('n', String(params.n))
    form.append('size', params.size)
    const field = params.references.length > 1 ? 'image[]' : 'image'
    const blobs = await Promise.all(params.references.map(dataUrlToBlob))
    blobs.forEach((blob, index) => {
      const extension = blob.type.split('/')[1] || 'png'
      form.append(field, blob, `reference-${index + 1}.${extension}`)
    })
    body = await relayRequest(apiKey, '/v1/images/edits', {
      method: 'POST',
      body: form,
      signal,
    })
  } else {
    body = await relayRequest(apiKey, '/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        n: params.n,
        size: params.size,
      }),
      signal,
    })
  }

  const assets = extractImageAssets(body)
  if (assets.length === 0) {
    throw new StudioRequestError(
      extractErrorMessage(body) ?? t('The response contained no images'),
      200
    )
  }
  return assets
}

/** Submit a video task and return its gateway task id. */
export async function submitVideo(
  apiKey: string,
  params: VideoGenerationParams
): Promise<string> {
  const payload: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
    size: params.size,
    duration: params.duration,
  }
  if (params.image) payload.images = [params.image]

  const body = await relayRequest(apiKey, '/v1/video/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const taskId = extractVideoTaskId(body)
  if (!taskId) {
    throw new StudioRequestError(
      extractErrorMessage(body) ?? t('The response contained no task id'),
      200
    )
  }
  return taskId
}

export async function fetchVideoTask(
  apiKey: string,
  taskId: string,
  signal?: AbortSignal
): Promise<VideoTaskSnapshot> {
  const body = await relayRequest(
    apiKey,
    `/v1/video/generations/${encodeURIComponent(taskId)}`,
    { signal }
  )
  return parseVideoTask(body)
}

/**
 * Download a finished video through the gateway content proxy.
 * The caller owns the returned object URL and must revoke it.
 */
export async function fetchVideoContentUrl(
  apiKey: string,
  taskId: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(
    `/v1/videos/${encodeURIComponent(taskId)}/content`,
    { headers: authHeaders(apiKey), signal }
  )
  if (!response.ok) {
    const body = await readBody(response)
    throw new StudioRequestError(
      extractErrorMessage(body) ??
        t('Request failed with status {{status}}', {
          status: response.status,
        }),
      response.status
    )
  }
  return URL.createObjectURL(await response.blob())
}
