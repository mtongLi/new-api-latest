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
import { Download, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTimestampToDate } from '@/lib/format'

import type { StudioJob } from '../types'
import { StudioJobMedia } from './studio-job-media'

type StudioJobCardProps = {
  job: StudioJob
  onRemove: (id: string) => void
}

export function StudioJobCard(props: StudioJobCardProps) {
  const { t } = useTranslation()
  const job = props.job
  const downloadUrl = job.status === 'succeeded' ? job.assets[0]?.url : undefined

  return (
    <article className='bg-card/80 group flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm backdrop-blur transition-shadow hover:shadow-xl'>
      <div className='bg-muted/40 relative aspect-square w-full overflow-hidden'>
        <StudioJobMedia job={job} />
      </div>
      <div className='flex flex-1 flex-col gap-2 p-3'>
        <p className='line-clamp-2 text-sm' title={job.prompt}>
          {job.prompt}
        </p>
        <div className='text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs'>
          <Badge variant='secondary' className='max-w-full truncate font-mono'>
            {job.model}
          </Badge>
          {job.summary && <span>{job.summary}</span>}
        </div>
        <div className='mt-auto flex items-center justify-between gap-2'>
          <time
            className='text-muted-foreground text-xs'
            dateTime={new Date(job.createdAt).toISOString()}
          >
            {formatTimestampToDate(job.createdAt, 'milliseconds')}
          </time>
          <div className='flex items-center'>
            <CopyButton
              value={job.prompt}
              size='icon'
              className='size-8'
              tooltip={t('Copy prompt')}
            />
            {downloadUrl && (
              <Button
                variant='ghost'
                size='icon'
                className='size-8'
                aria-label={t('Download')}
                render={
                  <a
                    href={downloadUrl}
                    download
                    target='_blank'
                    rel='noreferrer'
                  />
                }
              >
                <Download className='size-4' aria-hidden='true' />
              </Button>
            )}
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              aria-label={t('Remove from history')}
              onClick={() => props.onRemove(job.id)}
            >
              <Trash2 className='size-4' aria-hidden='true' />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
