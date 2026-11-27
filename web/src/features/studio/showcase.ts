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
  BookOpenText,
  Bug,
  Lightbulb,
  Mail,
  Map,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import type { StudioView } from './types'

/**
 * Visual identity of each studio view. Tailwind classes stay literal so the
 * build picks them up; `glow` colors feed the animated backdrop.
 */
export type StudioAccent = {
  /** Gradient stops for text, borders and active states. */
  gradient: string
  /** Solid text color used for icons on the active rail item. */
  text: string
  /** Three colors for the aurora backdrop blobs. */
  glow: [string, string, string]
}

export const STUDIO_ACCENTS: Record<StudioView, StudioAccent> = {
  text: {
    gradient: 'from-violet-500 via-fuchsia-500 to-indigo-500',
    text: 'text-violet-500',
    glow: ['#8b5cf6', '#d946ef', '#6366f1'],
  },
  image: {
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    text: 'text-pink-500',
    glow: ['#ec4899', '#fb923c', '#f43f5e'],
  },
  video: {
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    text: 'text-sky-500',
    glow: ['#22d3ee', '#3b82f6', '#14b8a6'],
  },
}

/** Generative cover art: three colors and a composition. */
export type ShowcaseArt = {
  colors: [string, string, string]
  pattern: 'orbs' | 'waves' | 'rings'
}

/**
 * A curated example. Titles are i18n keys; prompts stay in English because
 * they are model input and most image and video models follow English best.
 */
export type MediaShowcaseExample = {
  id: string
  titleKey: string
  prompt: string
  size: string
  duration?: number
  art: ShowcaseArt
}

export const IMAGE_SHOWCASE: MediaShowcaseExample[] = [
  {
    id: 'neon-koi',
    titleKey: 'Neon koi',
    prompt:
      'A luminous koi fish swimming through a neon-lit cyberpunk alley, rain reflections on the ground, cinematic lighting, ultra detailed',
    size: '1024x1536',
    art: { colors: ['#f472b6', '#8b5cf6', '#22d3ee'], pattern: 'orbs' },
  },
  {
    id: 'desert-dawn',
    titleKey: 'Desert dawn',
    prompt:
      'Minimalist desert dunes at sunrise, soft pastel gradients, long shadows, ultra wide composition, film grain',
    size: '1792x1024',
    art: { colors: ['#fb923c', '#f43f5e', '#fde68a'], pattern: 'waves' },
  },
  {
    id: 'glass-botanica',
    titleKey: 'Glass botanica',
    prompt:
      'Translucent glass flowers in a sunlit greenhouse, iridescent refractions, macro photography, shallow depth of field',
    size: '1024x1024',
    art: { colors: ['#34d399', '#2dd4bf', '#a3e635'], pattern: 'rings' },
  },
  {
    id: 'orbital-city',
    titleKey: 'Orbital city',
    prompt:
      'A floating city orbiting a giant ringed planet, retro-futurist travel poster, bold flat shapes, grainy texture',
    size: '1024x1536',
    art: { colors: ['#6366f1', '#38bdf8', '#f0abfc'], pattern: 'rings' },
  },
  {
    id: 'ink-mountains',
    titleKey: 'Ink mountains',
    prompt:
      'Traditional Chinese ink-wash painting of misty mountains and a lone boat on a river, monochrome with a small red seal',
    size: '1536x1024',
    art: { colors: ['#64748b', '#e2e8f0', '#ef4444'], pattern: 'waves' },
  },
  {
    id: 'candy-robot',
    titleKey: 'Candy robot',
    prompt:
      'A cute pastel robot made of glossy candy, soft 3D render, studio lighting, playful character design',
    size: '1024x1024',
    art: { colors: ['#e879f9', '#fb7185', '#fde047'], pattern: 'orbs' },
  },
]

export const VIDEO_SHOWCASE: MediaShowcaseExample[] = [
  {
    id: 'aurora-lake',
    titleKey: 'Aurora over the lake',
    prompt:
      'Time-lapse of green aurora dancing over a frozen lake at night, stars slowly rotating, reflections on the ice',
    size: '1280x720',
    duration: 10,
    art: { colors: ['#34d399', '#2dd4bf', '#6366f1'], pattern: 'waves' },
  },
  {
    id: 'ocean-drone',
    titleKey: 'Golden hour waves',
    prompt:
      'Drone shot gliding low over turquoise waves crashing onto a black sand beach at golden hour, slow motion',
    size: '1280x720',
    duration: 5,
    art: { colors: ['#22d3ee', '#3b82f6', '#fbbf24'], pattern: 'waves' },
  },
  {
    id: 'paper-city',
    titleKey: 'Paper city',
    prompt:
      'Stop-motion animation of a paper city unfolding from an open book, warm desk lamp light, tiny paper cars moving',
    size: '1024x1024',
    duration: 5,
    art: { colors: ['#fbbf24', '#fb923c', '#f43f5e'], pattern: 'rings' },
  },
  {
    id: 'neon-runner',
    titleKey: 'Neon runner',
    prompt:
      'A runner sprinting through a glowing neon tunnel, motion blur, camera tracking from behind, vertical format',
    size: '720x1280',
    duration: 5,
    art: { colors: ['#a855f7', '#ec4899', '#3b82f6'], pattern: 'orbs' },
  },
]

/** Chat starters for the text view; both fields are i18n keys. */
export type TextShowcaseExample = {
  id: string
  icon: LucideIcon
  titleKey: string
  promptKey: string
}

export const TEXT_SHOWCASE: TextShowcaseExample[] = [
  {
    id: 'launch-email',
    icon: Mail,
    titleKey: 'Write a launch email',
    promptKey:
      'Write a short, upbeat launch email announcing a new AI image generation feature.',
  },
  {
    id: 'eli5',
    icon: Lightbulb,
    titleKey: 'Explain it simply',
    promptKey:
      'Explain how large language models work as if I were ten years old.',
  },
  {
    id: 'debug',
    icon: Bug,
    titleKey: 'Find the bug',
    promptKey:
      'Find the bug in this JavaScript and fix it: const sum = (a, b) => { a + b }',
  },
  {
    id: 'trip',
    icon: Map,
    titleKey: 'Plan a trip',
    promptKey: 'Plan a 3-day food-focused trip to Chengdu with a daily schedule.',
  },
  {
    id: 'names',
    icon: Sparkles,
    titleKey: 'Brainstorm names',
    promptKey: 'Brainstorm 10 catchy names for a creative AI studio.',
  },
  {
    id: 'summary',
    icon: BookOpenText,
    titleKey: 'Summarize a paper',
    promptKey:
      'Summarize the key ideas of the paper "Attention Is All You Need" in five bullet points.',
  },
]
