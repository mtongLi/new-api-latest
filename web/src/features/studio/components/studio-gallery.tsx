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
import { ImageIcon, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { MOTION_TRANSITION } from '@/lib/motion'
import { useStudioHistoryStore } from '@/stores/studio-history-store'

import type { StudioMode } from '../types'
import { StudioJobCard } from './studio-job-card'

export function StudioGallery(props: { mode: StudioMode }) {
  const { t } = useTranslation()
  const allJobs = useStudioHistoryStore((s) => s.jobs)
  const removeJob = useStudioHistoryStore((s) => s.removeJob)
  const clearJobs = useStudioHistoryStore((s) => s.clearJobs)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const jobs = allJobs.filter((job) => job.mode === props.mode)

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={props.mode === 'video' ? Sparkles : ImageIcon}
        title={t('No creations yet')}
        description={
          props.mode === 'video'
            ? t('Videos you generate will appear here.')
            : t('Images you generate will appear here.')
        }
      />
    )
  }

  return (
    <section aria-label={t('Creation history')} className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-medium'>
          {t('Creation history')}
          <span className='text-muted-foreground ml-2 font-normal'>
            {jobs.length}
          </span>
        </h2>
        <Button variant='ghost' size='sm' onClick={() => setConfirmOpen(true)}>
          {t('Clear history')}
        </Button>
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
        <AnimatePresence initial={false}>
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={MOTION_TRANSITION.spring}
            >
              <StudioJobCard job={job} onRemove={removeJob} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('Clear history')}
        desc={t(
          'Remove all creations from this browser? Files already downloaded are not affected.'
        )}
        confirmText={t('Clear')}
        destructive
        handleConfirm={() => {
          clearJobs()
          setConfirmOpen(false)
        }}
      />
    </section>
  )
}
