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
import { IMAGE_ENDPOINT_TYPE, VIDEO_ENDPOINT_TYPE } from '../constants'
import type { StudioModelKind } from '../types'

export type StudioCatalogEntry = {
  model_name: string
  supported_endpoint_types?: string[]
}

export type StudioModelGroups = Record<StudioModelKind, string[]>

// Used only when the model catalog has no endpoint metadata for a model,
// e.g. the public model square is disabled.
const VIDEO_NAME_PATTERN =
  /(video|sora|veo|kling|hailuo|seedance|vidu|pixverse|runway|luma|wan2?\.?\d*-(t2v|i2v)|ltx)/i
const IMAGE_NAME_PATTERN =
  /(image|dall-?e|flux|imagen|seedream|midjourney|ideogram|recraft|stable-?diffusion|sdxl|kolors|hidream|nano-banana)/i

function kindFromEndpoints(types: string[]): StudioModelKind | null {
  if (types.includes(VIDEO_ENDPOINT_TYPE)) return 'video'
  if (types.includes(IMAGE_ENDPOINT_TYPE)) return 'image'
  return null
}

function kindFromName(name: string): StudioModelKind | null {
  if (VIDEO_NAME_PATTERN.test(name)) return 'video'
  if (IMAGE_NAME_PATTERN.test(name)) return 'image'
  return null
}

// Endpoint types served by the chat playground.
const TEXT_ENDPOINT_TYPES = new Set([
  'openai',
  'openai-response',
  'anthropic',
  'gemini',
])

/**
 * Keep the models usable for text chat. A model the catalog describes only
 * with non-chat endpoints (image, video, embeddings, ...) is dropped; models
 * without catalog metadata are kept because chat is the default endpoint.
 */
export function selectTextModels<T extends string | { value: string }>(
  models: T[],
  catalog: StudioCatalogEntry[] | null | undefined
): T[] {
  const endpointsByModel = new Map<string, string[]>()
  for (const entry of catalog ?? []) {
    if (entry.supported_endpoint_types?.length) {
      endpointsByModel.set(entry.model_name, entry.supported_endpoint_types)
    }
  }
  return models.filter((model) => {
    const name = typeof model === 'string' ? model : model.value
    const endpoints = endpointsByModel.get(name)
    return !endpoints || endpoints.some((type) => TEXT_ENDPOINT_TYPES.has(type))
  })
}

/**
 * Split the models a token may call into image and video groups.
 *
 * Catalog endpoint types win; a model the catalog describes with only other
 * endpoint types (chat, embeddings, ...) is excluded. Models missing from the
 * catalog fall back to a name heuristic.
 */
export function classifyStudioModels(
  availableModels: string[],
  catalog: StudioCatalogEntry[] | null | undefined
): StudioModelGroups {
  const endpointsByModel = new Map<string, string[]>()
  for (const entry of catalog ?? []) {
    if (entry.supported_endpoint_types?.length) {
      endpointsByModel.set(entry.model_name, entry.supported_endpoint_types)
    }
  }

  const groups: StudioModelGroups = { image: [], video: [] }
  const seen = new Set<string>()
  for (const name of availableModels) {
    if (!name || seen.has(name)) continue
    seen.add(name)
    const endpoints = endpointsByModel.get(name)
    const kind = endpoints ? kindFromEndpoints(endpoints) : kindFromName(name)
    if (kind) groups[kind].push(name)
  }
  groups.image.sort((a, b) => a.localeCompare(b))
  groups.video.sort((a, b) => a.localeCompare(b))
  return groups
}
