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
import { describe, expect, it } from 'vitest'

import {
  extractErrorMessage,
  extractImageAssets,
  extractVideoTaskId,
  parseVideoTask,
} from '../lib/responses'

describe('extractImageAssets', () => {
  it('keeps remote URLs as persistent assets and marks base64 images as session-only', () => {
    const assets = extractImageAssets({
      data: [{ url: 'https://cdn.example.com/a.png' }, { b64_json: 'QUJD' }],
    })

    expect(assets).toEqual([
      { url: 'https://cdn.example.com/a.png' },
      { url: 'data:image/png;base64,QUJD', ephemeral: true },
    ])
  })

  it('returns no assets when the response has no data array', () => {
    expect(extractImageAssets({ error: { message: 'bad' } })).toEqual([])
  })
})

describe('extractVideoTaskId', () => {
  it.each([
    ['OpenAI video object', { id: 'task_a', status: 'queued' }, 'task_a'],
    ['legacy task_id field', { task_id: 'task_b' }, 'task_b'],
    ['task envelope', { code: 'success', data: { task_id: 'task_c' } }, 'task_c'],
    ['task id as data string', { code: 'success', data: 'task_d' }, 'task_d'],
  ])('reads the id from a %s', (_name, body, expected) => {
    expect(extractVideoTaskId(body)).toBe(expected)
  })

  it('returns undefined when no id is present', () => {
    expect(extractVideoTaskId({ code: 'success' })).toBeUndefined()
  })
})

describe('parseVideoTask', () => {
  it('maps a finished gateway task to succeeded with its result URL', () => {
    const snapshot = parseVideoTask({
      code: 'success',
      data: {
        status: 'SUCCESS',
        progress: '100%',
        result_url: 'https://cdn.example.com/v.mp4',
        fail_reason: '',
      },
    })

    expect(snapshot).toEqual({
      status: 'succeeded',
      progress: '100%',
      url: 'https://cdn.example.com/v.mp4',
      error: undefined,
    })
  })

  it('maps a failed gateway task to failed with its fail reason', () => {
    const snapshot = parseVideoTask({
      code: 'success',
      data: { status: 'FAILURE', fail_reason: 'content policy' },
    })

    expect(snapshot.status).toBe('failed')
    expect(snapshot.error).toBe('content policy')
  })

  it.each([
    ['NOT_START', 'pending'],
    ['SUBMITTED', 'pending'],
    ['QUEUED', 'pending'],
    ['IN_PROGRESS', 'running'],
    ['in_progress', 'running'],
    ['completed', 'succeeded'],
  ])('normalizes status %s to %s', (raw, expected) => {
    expect(parseVideoTask({ data: { status: raw } }).status).toBe(expected)
  })

  it('reads a top-level OpenAI video object with numeric progress', () => {
    const snapshot = parseVideoTask({
      id: 'video_1',
      status: 'in_progress',
      progress: 40,
    })

    expect(snapshot.status).toBe('running')
    expect(snapshot.progress).toBe('40%')
  })
})

describe('extractErrorMessage', () => {
  it.each([
    ['OpenAI error object', { error: { message: 'quota exceeded' } }, 'quota exceeded'],
    ['gateway message', { success: false, message: 'invalid token' }, 'invalid token'],
    ['plain text body', 'Bad Gateway', 'Bad Gateway'],
  ])('reads the message from a %s', (_name, body, expected) => {
    expect(extractErrorMessage(body)).toBe(expected)
  })
})
