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
import {
  Clapperboard,
  ImageIcon,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react'

import type { StudioView } from './types'

/** Left-rail entries top to bottom; labels are i18n keys. */
export const STUDIO_VIEWS: {
  value: StudioView
  labelKey: string
  icon: LucideIcon
}[] = [
  { value: 'text', labelKey: 'Text generation', icon: MessageSquareText },
  { value: 'image', labelKey: 'Image generation', icon: ImageIcon },
  { value: 'video', labelKey: 'Video generation', icon: Clapperboard },
]

export function isStudioView(value: unknown): value is StudioView {
  return STUDIO_VIEWS.some((view) => view.value === value)
}

/** Option labels are i18n keys rendered with t(option.labelKey). */
export type StudioSizeOption = {
  value: string
  labelKey: string
}

export const IMAGE_SIZE_OPTIONS: StudioSizeOption[] = [
  { value: '1024x1024', labelKey: 'Square 1:1' },
  { value: '1536x1024', labelKey: 'Landscape 3:2' },
  { value: '1024x1536', labelKey: 'Portrait 2:3' },
  { value: '1792x1024', labelKey: 'Widescreen 16:9' },
  { value: '1024x1792', labelKey: 'Vertical 9:16' },
]

export const IMAGE_COUNT_OPTIONS = [1, 2, 3, 4] as const

export const VIDEO_SIZE_OPTIONS: StudioSizeOption[] = [
  { value: '1280x720', labelKey: 'Landscape 16:9' },
  { value: '720x1280', labelKey: 'Vertical 9:16' },
  { value: '1024x1024', labelKey: 'Square 1:1' },
]

export const VIDEO_DURATION_OPTIONS = [5, 10] as const

export const DEFAULT_IMAGE_SIZE = IMAGE_SIZE_OPTIONS[0].value
export const DEFAULT_VIDEO_SIZE = VIDEO_SIZE_OPTIONS[0].value
export const DEFAULT_VIDEO_DURATION = VIDEO_DURATION_OPTIONS[0]

/** Interval between video task status checks. */
export const VIDEO_POLL_INTERVAL_MS = 5000

/** Max reference images accepted by the composer. */
export const MAX_IMAGE_REFERENCES = 4
export const MAX_REFERENCE_FILE_SIZE = 10 * 1024 * 1024

/** Number of creations kept in the local history. */
export const STUDIO_HISTORY_LIMIT = 60

export const IMAGE_ENDPOINT_TYPE = 'image-generation'
export const VIDEO_ENDPOINT_TYPE = 'openai-video'
