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
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getPricing } from '@/features/pricing/api'
import { useStatus } from '@/hooks/use-status'
import { getModuleAccessFromStatus } from '@/lib/nav-modules'
import { requireServerSuccess } from '@/lib/server-error-message'

import { listTokenModels } from '../api'
import { classifyStudioModels, type StudioModelGroups } from '../lib/models'

const EMPTY_GROUPS: StudioModelGroups = { image: [], video: [] }

/**
 * Public model catalog with endpoint metadata. Requested only when the model
 * square is open to the viewer, because a session-protected request would
 * send a visitor to the sign-in page.
 */
export function useStudioCatalog(isAuthed: boolean) {
  const { status } = useStatus()
  const pricingAccess = getModuleAccessFromStatus(
    status as Record<string, unknown> | null,
    'pricing'
  )
  const catalogAllowed =
    pricingAccess.enabled && (isAuthed || !pricingAccess.requireAuth)

  return useQuery({
    queryKey: ['studio', 'catalog'],
    queryFn: async () => requireServerSuccess(await getPricing()).data,
    enabled: catalogAllowed,
    staleTime: 5 * 60 * 1000,
    retry: false,
    meta: { errorToast: false },
  })
}

type UseStudioModelsOptions = {
  isAuthed: boolean
  tokenId?: number
  apiKey?: string
}

/**
 * Image and video models shown in the composer.
 *
 * Signed-in users see the models their selected token may call; the catalog
 * only refines classification. Visitors see the public catalog.
 */
export function useStudioModels(options: UseStudioModelsOptions) {
  const catalogQuery = useStudioCatalog(options.isAuthed)

  const modelsQuery = useQuery({
    queryKey: ['studio', 'token-models', options.tokenId],
    queryFn: ({ signal }) => listTokenModels(options.apiKey ?? '', signal),
    enabled: options.isAuthed && Boolean(options.apiKey),
    staleTime: 60 * 1000,
  })

  const groups = useMemo(() => {
    if (!options.isAuthed) {
      const catalog = catalogQuery.data
      if (!catalog) return EMPTY_GROUPS
      return classifyStudioModels(
        catalog.map((entry) => entry.model_name),
        catalog
      )
    }
    if (!modelsQuery.data) return EMPTY_GROUPS
    return classifyStudioModels(modelsQuery.data, catalogQuery.data)
  }, [options.isAuthed, modelsQuery.data, catalogQuery.data])

  return {
    groups,
    isLoading: modelsQuery.isLoading || catalogQuery.isLoading,
    error: modelsQuery.error,
  }
}
