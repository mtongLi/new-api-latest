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
import { ImagePlus, Sparkles } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { ModelSelector } from '@/components/model-group-selector'
import { cn } from '@/lib/utils'

import {
  DEFAULT_IMAGE_SIZE,
  DEFAULT_VIDEO_DURATION,
  DEFAULT_VIDEO_SIZE,
  IMAGE_COUNT_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  MAX_IMAGE_REFERENCES,
  MAX_REFERENCE_FILE_SIZE,
  VIDEO_DURATION_OPTIONS,
  VIDEO_SIZE_OPTIONS,
} from '../constants'
import { STUDIO_ACCENTS } from '../showcase'
import type {
  ImageGenerationParams,
  StudioMode,
  VideoGenerationParams,
} from '../types'
import { StudioOptionSelect } from './studio-option-select'

type StudioComposerProps = {
  mode: StudioMode
  models: string[]
  /** Selected model, owned by the page so the model column stays in sync. */
  model: string
  onModelChange: (model: string) => void
  disabled?: boolean
  /** Visitor mode: Generate asks to sign in instead of submitting. */
  guest?: boolean
  onGuestSubmit?: () => void
  onCreateImage: (params: ImageGenerationParams, summary: string) => void
  onCreateVideo: (params: VideoGenerationParams, summary: string) => void
  /**
   * Initial prompt and settings, e.g. from a showcase example. The page
   * remounts the composer (via `key`) to apply a new draft.
   */
  draft?: StudioComposerDraft
}

export type StudioComposerDraft = {
  prompt: string
  size?: string
  duration?: number
}

function AddReferenceButton(props: { disabled?: boolean }) {
  const { t } = useTranslation()
  const attachments = usePromptInputAttachments()
  return (
    <PromptInputButton
      aria-label={t('Add reference image')}
      disabled={props.disabled}
      onClick={() => attachments.openFileDialog()}
    >
      <ImagePlus className='size-4' aria-hidden='true' />
    </PromptInputButton>
  )
}

export function StudioComposer(props: StudioComposerProps) {
  const { t } = useTranslation()
  const isVideo = props.mode === 'video'
  const draft = props.draft
  const [text, setText] = useState(draft?.prompt ?? '')
  const [imageSize, setImageSize] = useState(
    !isVideo && draft?.size ? draft.size : DEFAULT_IMAGE_SIZE
  )
  const [imageCount, setImageCount] = useState('1')
  const [videoSize, setVideoSize] = useState(
    isVideo && draft?.size ? draft.size : DEFAULT_VIDEO_SIZE
  )
  const [videoDuration, setVideoDuration] = useState(
    String(draft?.duration ?? DEFAULT_VIDEO_DURATION)
  )
  const glowColors = STUDIO_ACCENTS[props.mode].glow

  const model = props.model
  const modelOptions = useMemo(
    () => props.models.map((name) => ({ label: name, value: name })),
    [props.models]
  )
  const sizeItems = (isVideo ? VIDEO_SIZE_OPTIONS : IMAGE_SIZE_OPTIONS).map(
    (option) => ({
      value: option.value,
      label: `${t(option.labelKey)} · ${option.value}`,
    })
  )
  const countItems = IMAGE_COUNT_OPTIONS.map((count) => ({
    value: String(count),
    label: t('{{count}} images', { count }),
  }))
  const durationItems = VIDEO_DURATION_OPTIONS.map((seconds) => ({
    value: String(seconds),
    label: t('{{count}} seconds', { count: seconds }),
  }))

  // Visitors may press Generate without a model so the sign-in prompt shows.
  const canSubmit =
    !props.disabled && text.trim() !== '' && (props.guest || model !== '')

  const handleSubmit = (message: PromptInputMessage) => {
    const prompt = (message.text || text).trim()
    if (!canSubmit || !prompt) return
    if (props.guest) {
      props.onGuestSubmit?.()
      return
    }
    const references = (message.files ?? [])
      .map((file) => file.url)
      .filter((url): url is string => Boolean(url))

    if (isVideo) {
      const duration = Number(videoDuration)
      props.onCreateVideo(
        { model, prompt, size: videoSize, duration, image: references[0] },
        `${duration}s · ${videoSize}`
      )
    } else {
      const n = Number(imageCount)
      props.onCreateImage(
        { model, prompt, size: imageSize, n, references },
        `${imageSize} · ×${n}`
      )
    }
    setText('')
  }

  return (
    // The conic border lights up while the composer has focus.
    <div
      className='group/composer relative isolate rounded-[14px] p-[1.5px]'
      style={
        {
          '--studio-glow-colors': `${glowColors[0]}, ${glowColors[1]}, ${glowColors[2]}, ${glowColors[0]}`,
        } as CSSProperties
      }
    >
      <div
        aria-hidden='true'
        className='studio-glow-border absolute inset-0 rounded-[14px] opacity-25 transition-opacity duration-500 group-focus-within/composer:opacity-100'
      />
      <div
        aria-hidden='true'
        className='studio-glow-border absolute inset-2 -z-10 rounded-[14px] opacity-0 blur-2xl transition-opacity duration-500 group-focus-within/composer:opacity-40'
      />
    <PromptInput
      className='relative'
      accept='image/*'
      multiple={!isVideo}
      maxFiles={isVideo ? 1 : MAX_IMAGE_REFERENCES}
      maxFileSize={MAX_REFERENCE_FILE_SIZE}
      onError={(error) => toast.error(error.message)}
      onSubmit={handleSubmit}
      // A disabled Generate button must not dim the whole group, or the
      // glowing border behind it would show through.
      groupClassName='bg-background dark:bg-background has-disabled:bg-background dark:has-disabled:bg-background has-disabled:opacity-100 rounded-xl border-transparent shadow-[0_18px_60px_-32px_rgba(0,0,0,0.65)]'
    >
      <PromptInputHeader className='px-3 pt-3 empty:hidden'>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
      <PromptInputTextarea
        autoFocus={Boolean(draft)}
        className='min-h-24 px-4 pt-3 leading-7 md:text-base'
        disabled={props.disabled}
        onChange={(event) => setText(event.target.value)}
        placeholder={
          isVideo
            ? t('Describe the video you want to create')
            : t('Describe the image you want to create')
        }
        value={text}
      />
      <PromptInputFooter className='border-border/60 bg-muted/20 flex-wrap border-t px-3 py-2.5'>
        <PromptInputTools className='flex-wrap gap-1.5'>
          <AddReferenceButton disabled={props.disabled} />
          {/* The model column replaces this selector from md up. */}
          <div className='md:hidden'>
            <ModelSelector
              selectedModel={model}
              models={modelOptions}
              onModelChange={props.onModelChange}
              disabled={props.disabled || modelOptions.length === 0}
            />
          </div>
          <StudioOptionSelect
            label={t('Size')}
            items={sizeItems}
            value={isVideo ? videoSize : imageSize}
            onChange={isVideo ? setVideoSize : setImageSize}
            disabled={props.disabled}
          />
          {isVideo ? (
            <StudioOptionSelect
              label={t('Duration')}
              items={durationItems}
              value={videoDuration}
              onChange={setVideoDuration}
              disabled={props.disabled}
            />
          ) : (
            <StudioOptionSelect
              label={t('Count')}
              items={countItems}
              value={imageCount}
              onChange={setImageCount}
              disabled={props.disabled}
            />
          )}
        </PromptInputTools>
        <PromptInputButton
          className={cn(
            'studio-shine studio-pan relative h-9 overflow-hidden bg-gradient-to-r px-4 font-semibold text-white shadow-md transition-[transform,box-shadow] hover:shadow-lg active:scale-95 disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
            STUDIO_ACCENTS[props.mode].gradient
          )}
          disabled={!canSubmit}
          type='submit'
          variant='default'
        >
          <Sparkles className='size-4' aria-hidden='true' />
          <span>{t('Generate')}</span>
        </PromptInputButton>
      </PromptInputFooter>
    </PromptInput>
    </div>
  )
}
