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

import { classifyStudioModels, selectTextModels } from '../lib/models'

describe('classifyStudioModels', () => {
  it('uses catalog endpoint types when a model is described', () => {
    const groups = classifyStudioModels(
      ['gpt-image-1', 'kling-v2', 'gpt-4o'],
      [
        { model_name: 'gpt-image-1', supported_endpoint_types: ['image-generation'] },
        { model_name: 'kling-v2', supported_endpoint_types: ['openai-video'] },
        { model_name: 'gpt-4o', supported_endpoint_types: ['openai'] },
      ]
    )

    expect(groups).toEqual({ image: ['gpt-image-1'], video: ['kling-v2'] })
  })

  it('excludes a model the catalog lists only with non-media endpoints even if its name looks like media', () => {
    const groups = classifyStudioModels(
      ['image-captioner'],
      [{ model_name: 'image-captioner', supported_endpoint_types: ['openai'] }]
    )

    expect(groups).toEqual({ image: [], video: [] })
  })

  it('falls back to name matching when the catalog is unavailable', () => {
    const groups = classifyStudioModels(
      ['sora-2', 'dall-e-3', 'flux-schnell', 'claude-sonnet'],
      null
    )

    expect(groups).toEqual({
      image: ['dall-e-3', 'flux-schnell'],
      video: ['sora-2'],
    })
  })

  it('only returns models the token can call, sorted and without duplicates', () => {
    const groups = classifyStudioModels(
      ['veo-3', 'seedream-4', 'veo-3', ''],
      [
        { model_name: 'seedream-4', supported_endpoint_types: ['image-generation'] },
        { model_name: 'midjourney', supported_endpoint_types: ['image-generation'] },
      ]
    )

    expect(groups).toEqual({ image: ['seedream-4'], video: ['veo-3'] })
  })
})

describe('selectTextModels', () => {
  const catalog = [
    { model_name: 'gpt-4o', supported_endpoint_types: ['openai'] },
    { model_name: 'claude-sonnet', supported_endpoint_types: ['anthropic'] },
    { model_name: 'gpt-image-1', supported_endpoint_types: ['image-generation'] },
    { model_name: 'sora-2', supported_endpoint_types: ['openai-video'] },
    { model_name: 'text-embedding-3', supported_endpoint_types: ['embeddings'] },
  ]

  it('drops models the catalog serves only through image, video or embedding endpoints', () => {
    expect(
      selectTextModels(
        ['gpt-4o', 'claude-sonnet', 'gpt-image-1', 'sora-2', 'text-embedding-3'],
        catalog
      )
    ).toEqual(['gpt-4o', 'claude-sonnet'])
  })

  it('keeps models without catalog metadata because chat is the default endpoint', () => {
    expect(selectTextModels(['my-custom-llm'], catalog)).toEqual([
      'my-custom-llm',
    ])
  })

  it('filters option objects by their value', () => {
    expect(
      selectTextModels(
        [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'Sora', value: 'sora-2' },
        ],
        catalog
      )
    ).toEqual([{ label: 'GPT-4o', value: 'gpt-4o' }])
  })
})
