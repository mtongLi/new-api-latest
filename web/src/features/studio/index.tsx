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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

import { PublicLayout } from '@/components/layout'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { MOTION_VARIANTS, MOTION_TRANSITION } from '@/lib/motion'
import { useAuthStore } from '@/stores/auth-store'
import { useStudioHistoryStore } from '@/stores/studio-history-store'

import { StudioBackdrop } from './components/studio-backdrop'
import { StudioMediaPanel } from './components/studio-media-panel'
import { StudioModeRail } from './components/studio-mode-rail'
import { StudioTextPanel } from './components/studio-text-panel'
import { isStudioView } from './constants'
import type { StudioView } from './types'

/**
 * Fades and lifts a view in when the rail switches to it. No filter here: a
 * filtered ancestor would disable the backdrop blur of the model column.
 */
function ViewEnter(props: { children: ReactNode }) {
  return (
    <motion.div
      initial={MOTION_VARIANTS.slideUp.initial}
      animate={MOTION_VARIANTS.slideUp.animate}
      transition={MOTION_TRANSITION.slow}
    >
      {props.children}
    </motion.div>
  )
}

export function Studio() {
  const search = useSearch({ from: '/studio/' })
  const navigate = useNavigate()
  const view: StudioView = isStudioView(search.tab) ? search.tab : 'text'

  const userId = useAuthStore((s) => s.auth.user?.id)
  const ensureOwner = useStudioHistoryStore((s) => s.ensureOwner)
  useEffect(() => {
    if (userId != null) ensureOwner(userId)
  }, [ensureOwner, userId])

  const handleViewChange = (value: unknown) => {
    if (!isStudioView(value)) return
    navigate({ to: '/studio', search: { tab: value }, replace: true })
  }

  return (
    <PublicLayout showMainContainer={false} headerProps={{ compact: true }}>
      <StudioBackdrop view={view} />
      <Tabs
        orientation='vertical'
        value={view}
        onValueChange={handleViewChange}
        className='relative min-h-svh gap-0 pt-16'
      >
        <StudioModeRail active={view} />

        <TabsContent value='text' className='min-w-0'>
          <ViewEnter>
            <StudioTextPanel />
          </ViewEnter>
        </TabsContent>
        <TabsContent value='image' className='min-w-0'>
          <ViewEnter>
            <StudioMediaPanel mode='image' />
          </ViewEnter>
        </TabsContent>
        <TabsContent value='video' className='min-w-0'>
          <ViewEnter>
            <StudioMediaPanel mode='video' />
          </ViewEnter>
        </TabsContent>
      </Tabs>
    </PublicLayout>
  )
}
