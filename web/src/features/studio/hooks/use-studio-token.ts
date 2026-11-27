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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useMemo } from 'react'

import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import { API_KEY_STATUS } from '@/features/keys/constants'
import type { ApiKey } from '@/features/keys/types'
import {
  createServerError,
  requireServerSuccess,
} from '@/lib/server-error-message'
import { useAuthStore } from '@/stores/auth-store'
import { useStudioHistoryStore } from '@/stores/studio-history-store'

const TOKEN_LIST_PAGE_SIZE = 100

/** Resolve the unmasked key of a token; kept in memory only. */
function studioTokenKeyQueryOptions(userId: number | undefined, tokenId: number) {
  return {
    queryKey: ['studio', 'token-key', userId, tokenId] as const,
    queryFn: async () => {
      const response = requireServerSuccess(await fetchTokenKey(tokenId))
      const key = response.data?.key
      if (!key) throw createServerError(response, t('Failed to load API keys'))
      return key.startsWith('sk-') ? key : `sk-${key}`
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  }
}

export function useStudioTokenKeyResolver() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.auth.user?.id)
  return useCallback(
    (tokenId: number) =>
      queryClient.fetchQuery(studioTokenKeyQueryOptions(userId, tokenId)),
    [queryClient, userId]
  )
}

/** Tokens of the signed-in user; visitors get an empty, idle result. */
export function useStudioToken() {
  const storedTokenId = useStudioHistoryStore((s) => s.tokenId)
  const setTokenId = useStudioHistoryStore((s) => s.setTokenId)
  const userId = useAuthStore((s) => s.auth.user?.id)
  const isAuthed = userId != null

  const tokensQuery = useQuery({
    queryKey: ['studio', 'tokens', userId],
    enabled: isAuthed,
    queryFn: async () => {
      const response = requireServerSuccess(
        await getApiKeys({ p: 1, size: TOKEN_LIST_PAGE_SIZE })
      )
      return response.data?.items ?? []
    },
    staleTime: 60 * 1000,
  })

  const tokens = useMemo<ApiKey[]>(
    () =>
      (tokensQuery.data ?? []).filter(
        (token) => token.status === API_KEY_STATUS.ENABLED
      ),
    [tokensQuery.data]
  )

  const selectedToken =
    tokens.find((token) => token.id === storedTokenId) ?? tokens[0]

  const keyQuery = useQuery({
    ...studioTokenKeyQueryOptions(userId, selectedToken?.id ?? 0),
    enabled: isAuthed && selectedToken != null,
  })

  return {
    tokens,
    selectedToken,
    apiKey: selectedToken ? keyQuery.data : undefined,
    isLoading:
      isAuthed &&
      (tokensQuery.isLoading || (selectedToken != null && keyQuery.isLoading)),
    error: tokensQuery.error ?? keyQuery.error,
    selectToken: setTokenId,
  }
}
