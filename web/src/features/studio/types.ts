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

/** Media modes that produce history jobs. */
export type StudioMode = 'image' | 'video'

/** Every view of the studio, selected from the left rail. */
export type StudioView = StudioMode | 'text'

export type StudioModelKind = StudioMode

/** Normalized lifecycle of one creation, independent of upstream wording. */
export type StudioJobStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export type StudioAsset = {
  /** Remote URL or data URL of the generated media. */
  url: string
  /** Data URLs are kept only for the current session, never persisted. */
  ephemeral?: boolean
}

export type StudioJob = {
  id: string
  mode: StudioMode
  model: string
  prompt: string
  status: StudioJobStatus
  createdAt: number
  /** Option summary shown on the card, e.g. "1024x1024" or "5s · 1280x720". */
  summary?: string
  /** Gateway task id for video jobs, used to resume polling. */
  taskId?: string
  /** Token id used to submit; polling must reuse the same token. */
  tokenId?: number
  progress?: string
  assets: StudioAsset[]
  error?: string
}

export type ImageGenerationParams = {
  model: string
  prompt: string
  size: string
  n: number
  /** Data URLs of reference images; when present the edits endpoint is used. */
  references: string[]
}

export type VideoGenerationParams = {
  model: string
  prompt: string
  size: string
  duration: number
  /** Data URL of a first-frame reference image. */
  image?: string
}

export type VideoTaskSnapshot = {
  status: StudioJobStatus
  progress?: string
  url?: string
  error?: string
}
