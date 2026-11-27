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
import type {
  StudioAsset,
  StudioJobStatus,
  VideoTaskSnapshot,
} from '../types'

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

/** Read the human-readable message from an OpenAI- or gateway-style error body. */
export function extractErrorMessage(body: unknown): string | undefined {
  const record = asRecord(body)
  if (!record) return asNonEmptyString(body)
  const error = record.error
  const errorRecord = asRecord(error)
  return (
    asNonEmptyString(errorRecord?.message) ??
    asNonEmptyString(error) ??
    asNonEmptyString(record.message) ??
    asNonEmptyString(record.fail_reason)
  )
}

/** Collect generated images from an OpenAI images response. */
export function extractImageAssets(body: unknown): StudioAsset[] {
  const items = asRecord(body)?.data
  if (!Array.isArray(items)) return []

  const assets: StudioAsset[] = []
  for (const item of items) {
    const record = asRecord(item)
    const url = asNonEmptyString(record?.url)
    if (url) {
      assets.push({ url })
      continue
    }
    const b64 = asNonEmptyString(record?.b64_json)
    if (b64) {
      assets.push({ url: `data:image/png;base64,${b64}`, ephemeral: true })
    }
  }
  return assets
}

/** Find the gateway task id in a video submission response. */
export function extractVideoTaskId(body: unknown): string | undefined {
  const record = asRecord(body)
  if (!record) return undefined
  const data = record.data
  const dataRecord = asRecord(data)
  return (
    asNonEmptyString(record.task_id) ??
    asNonEmptyString(record.id) ??
    asNonEmptyString(dataRecord?.task_id) ??
    asNonEmptyString(dataRecord?.id) ??
    asNonEmptyString(data)
  )
}

const SUCCEEDED = new Set(['success', 'succeeded', 'completed', 'complete'])
const FAILED = new Set(['failure', 'failed', 'error', 'cancelled', 'canceled'])
const RUNNING = new Set(['in_progress', 'processing', 'running', 'generating'])

export function normalizeTaskStatus(raw: unknown): StudioJobStatus {
  const status = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (SUCCEEDED.has(status)) return 'succeeded'
  if (FAILED.has(status)) return 'failed'
  if (RUNNING.has(status)) return 'running'
  return 'pending'
}

/**
 * Normalize a video task query response.
 *
 * Accepts the gateway task envelope (`{ code, data: TaskDto }`) as well as an
 * OpenAI video object returned at the top level.
 */
export function parseVideoTask(body: unknown): VideoTaskSnapshot {
  const record = asRecord(body)
  const task = asRecord(record?.data) ?? record ?? {}
  const metadata = asRecord(task.metadata)

  const progressValue = task.progress
  const progress =
    typeof progressValue === 'number'
      ? `${progressValue}%`
      : asNonEmptyString(progressValue)

  return {
    status: normalizeTaskStatus(task.status),
    progress,
    url:
      asNonEmptyString(task.result_url) ??
      asNonEmptyString(task.url) ??
      asNonEmptyString(metadata?.url),
    error: extractErrorMessage(task),
  }
}
