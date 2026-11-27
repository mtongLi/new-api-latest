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
import { AlertCircle, ImageOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useVideoSource } from '../hooks/use-video-source'
import { STUDIO_ACCENTS } from '../showcase'
import type { StudioAsset, StudioJob } from '../types'
import { StudioArt } from './studio-art'

/** Flowing accent-colored art shown while a creation is in progress. */
function DreamingPlaceholder(props: { job: StudioJob; text: string }) {
  return (
    <div className='relative size-full' role='status'>
      <StudioArt
        art={{ colors: STUDIO_ACCENTS[props.job.mode].glow, pattern: 'orbs' }}
        animated
        className='absolute inset-0 opacity-80 blur-sm'
      />
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 text-white'>
        <Loader2 className='size-6 animate-spin drop-shadow' aria-hidden='true' />
        <span className='text-sm font-medium drop-shadow'>{props.text}</span>
        {props.job.progress && (
          <span className='rounded-full bg-black/30 px-2 py-0.5 font-mono text-xs backdrop-blur'>
            {props.job.progress}
          </span>
        )}
      </div>
    </div>
  )
}

function MediaPlaceholder(props: {
  icon: 'loading' | 'error' | 'missing'
  text: string
  detail?: string
}) {
  let icon = <ImageOff className='size-6' aria-hidden='true' />
  if (props.icon === 'loading') {
    icon = <Loader2 className='size-6 animate-spin' aria-hidden='true' />
  } else if (props.icon === 'error') {
    icon = <AlertCircle className='text-destructive size-6' aria-hidden='true' />
  }

  return (
    <div
      className='text-muted-foreground flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-sm'
      role={props.icon === 'error' ? 'alert' : 'status'}
    >
      {icon}
      <span>{props.text}</span>
      {props.detail && (
        <span className='line-clamp-3 text-xs break-all'>{props.detail}</span>
      )}
    </div>
  )
}

function ImageAssets(props: { assets: StudioAsset[]; prompt: string }) {
  if (props.assets.length === 1) {
    return (
      <img
        src={props.assets[0].url}
        alt={props.prompt}
        loading='lazy'
        className='size-full object-contain'
      />
    )
  }
  return (
    <div className='grid size-full grid-cols-2 gap-0.5'>
      {props.assets.map((asset) => (
        <a
          key={asset.url}
          href={asset.url}
          target='_blank'
          rel='noreferrer'
          className='bg-background block overflow-hidden'
        >
          <img
            src={asset.url}
            alt={props.prompt}
            loading='lazy'
            className='size-full object-cover'
          />
        </a>
      ))}
    </div>
  )
}

function VideoAsset(props: { job: StudioJob }) {
  const { t } = useTranslation()
  const source = useVideoSource(props.job)
  if (source.isLoading) {
    return <MediaPlaceholder icon='loading' text={t('Loading video...')} />
  }
  if (!source.src) {
    return <MediaPlaceholder icon='missing' text={t('Video unavailable')} />
  }
  return (
    <video
      src={source.src}
      controls
      playsInline
      preload='metadata'
      className='size-full bg-black object-contain'
    />
  )
}

/** Media area of a creation card, reflecting the job lifecycle. */
export function StudioJobMedia(props: { job: StudioJob }) {
  const { t } = useTranslation()
  const job = props.job

  if (job.status === 'failed') {
    return (
      <MediaPlaceholder
        icon='error'
        text={t('Generation failed')}
        detail={job.error ? t(job.error) : undefined}
      />
    )
  }
  if (job.status !== 'succeeded') {
    const text =
      job.status === 'pending' ? t('Queued...') : t('Generating...')
    return <DreamingPlaceholder job={job} text={text} />
  }
  if (job.mode === 'video') return <VideoAsset job={job} />
  if (job.assets.length === 0) {
    return (
      <MediaPlaceholder
        icon='missing'
        text={t('Preview not saved')}
        detail={t('Inline images are kept only until the page is reloaded.')}
      />
    )
  }
  return <ImageAssets assets={job.assets} prompt={job.prompt} />
}
