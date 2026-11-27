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
import { Link } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { useStudioHistoryStore } from '@/stores/studio-history-store'

import { useStudioGeneration } from '../hooks/use-studio-generation'
import { useStudioModels } from '../hooks/use-studio-models'
import { useStudioToken } from '../hooks/use-studio-token'
import {
  IMAGE_SHOWCASE,
  VIDEO_SHOWCASE,
  type MediaShowcaseExample,
} from '../showcase'
import type { StudioMode } from '../types'
import { StudioComposer, type StudioComposerDraft } from './studio-composer'
import { StudioGallery } from './studio-gallery'
import { StudioHero } from './studio-hero'
import { StudioModelList } from './studio-model-list'
import { StudioShowcase } from './studio-showcase'
import { StudioSignInDialog } from './studio-sign-in-dialog'
import { StudioTokenSelect } from './studio-token-select'

/** Image or video creation page: composer, creations and inspiration. */
export function StudioMediaPanel(props: { mode: StudioMode }) {
  const { t } = useTranslation()
  const mode = props.mode
  const isAuthed = useAuthStore((s) => s.auth.user != null)
  const [signInOpen, setSignInOpen] = useState(false)
  // Each applied example gets a new id so the composer remounts with it.
  const [draft, setDraft] = useState<{
    id: number
    value: StudioComposerDraft
  } | null>(null)

  const token = useStudioToken()
  const models = useStudioModels({
    isAuthed,
    tokenId: token.selectedToken?.id,
    apiKey: token.apiKey,
  })
  const generation = useStudioGeneration(token.selectedToken?.id, token.apiKey)
  const hasCreations = useStudioHistoryStore((s) =>
    s.jobs.some((job) => job.mode === mode)
  )

  const modeModels = models.groups[mode]
  const savedModel = useStudioHistoryStore((s) => s.selectedModels[mode])
  const setSelectedModel = useStudioHistoryStore((s) => s.setSelectedModel)
  // Fall back to the first model when the saved pick is not available.
  const model =
    savedModel && modeModels.includes(savedModel)
      ? savedModel
      : (modeModels[0] ?? '')
  const handleModelChange = (next: string) => setSelectedModel(mode, next)

  const noTokens = isAuthed && !token.isLoading && token.tokens.length === 0
  const noModels =
    !models.isLoading && Boolean(token.apiKey) && modeModels.length === 0

  const handleUseExample = (example: MediaShowcaseExample) => {
    setDraft((current) => ({
      id: (current?.id ?? 0) + 1,
      value: {
        prompt: example.prompt,
        size: example.size,
        duration: example.duration,
      },
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderComposer = () => {
    if (token.isLoading || (token.apiKey && models.isLoading)) {
      return <Skeleton className='h-40 w-full rounded-2xl' />
    }
    if (noTokens) {
      return (
        <EmptyState
          bordered
          icon={KeyRound}
          className='bg-background/70 min-h-[220px] rounded-2xl backdrop-blur'
          title={t('Create an API key to start')}
          description={t(
            'Creations are billed to the API key you choose, just like API calls.'
          )}
          action={
            <Button render={<Link to='/keys' />}>{t('Manage API keys')}</Button>
          }
        />
      )
    }
    return (
      <div className='space-y-2'>
        <StudioComposer
          key={draft?.id ?? 0}
          draft={draft?.value}
          mode={mode}
          models={modeModels}
          model={model}
          onModelChange={handleModelChange}
          guest={!isAuthed}
          onGuestSubmit={() => setSignInOpen(true)}
          disabled={isAuthed && (!token.apiKey || modeModels.length === 0)}
          onCreateImage={(params, summary) =>
            void generation.createImage(params, summary)
          }
          onCreateVideo={(params, summary) =>
            void generation.createVideo(params, summary)
          }
        />
        {noModels && (
          <p className='text-muted-foreground px-1 text-sm' role='status'>
            {mode === 'video'
              ? t('This API key has no video generation models available.')
              : t('This API key has no image generation models available.')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className='flex min-h-[calc(100svh-4rem)]'>
      <StudioModelList
        view={mode}
        models={modeModels}
        value={model}
        onChange={handleModelChange}
        isLoading={token.isLoading || models.isLoading}
        emptyText={
          mode === 'video'
            ? t('No video generation models available.')
            : t('No image generation models available.')
        }
      />
      <div className='mx-auto w-full max-w-[1400px] min-w-0 flex-1 space-y-8 px-3 py-6 sm:px-6 sm:py-8 xl:px-10'>
        <StudioHero
          view={mode}
          eyebrow={
            mode === 'video'
              ? t('Text and image to video')
              : t('Text and image to image')
          }
          title={mode === 'video' ? t('Video generation') : t('Image generation')}
          description={
            mode === 'video'
              ? t(
                  'Turn a prompt or a still frame into motion. Pick a model on the left and describe the shot.'
                )
              : t(
                  'Describe a scene, drop in reference images, and let the model paint it. Pick a model on the left.'
                )
          }
          actions={
            token.tokens.length > 0 ? (
              <StudioTokenSelect
                tokens={token.tokens}
                value={token.selectedToken?.id}
                onChange={token.selectToken}
              />
            ) : undefined
          }
        />

        {renderComposer()}

        {isAuthed && hasCreations && <StudioGallery mode={mode} />}

        <StudioShowcase
          mode={mode}
          examples={mode === 'video' ? VIDEO_SHOWCASE : IMAGE_SHOWCASE}
          onUse={handleUseExample}
        />

        <StudioSignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </div>
    </div>
  )
}
