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
import { SendIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { Playground } from '@/features/playground'
import { useAuthStore } from '@/stores/auth-store'
import { useStudioHistoryStore } from '@/stores/studio-history-store'

import { useStudioCatalog } from '../hooks/use-studio-models'
import { selectTextModels } from '../lib/models'
import { StudioModelList } from './studio-model-list'
import { StudioSignInDialog } from './studio-sign-in-dialog'
import { StudioTextShowcase } from './studio-text-showcase'

/**
 * Visitors see the chat layout and the public text models without loading
 * conversations, which need a session; sending asks them to sign in.
 */
function GuestTextPreview() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [signInOpen, setSignInOpen] = useState(false)
  const catalogQuery = useStudioCatalog(false)
  const savedModel = useStudioHistoryStore((s) => s.selectedModels.text)
  const setSelectedModel = useStudioHistoryStore((s) => s.setSelectedModel)

  const models = useMemo(() => {
    const catalog = catalogQuery.data ?? []
    return selectTextModels(
      catalog.map((entry) => entry.model_name),
      catalog
    ).sort((a, b) => a.localeCompare(b))
  }, [catalogQuery.data])
  const model =
    savedModel && models.includes(savedModel) ? savedModel : (models[0] ?? '')

  return (
    <div className='flex size-full min-h-0'>
      <StudioModelList
        view='text'
        models={models}
        value={model}
        onChange={(next) => setSelectedModel('text', next)}
        isLoading={catalogQuery.isLoading}
        emptyText={t('Sign in to see the models available to you.')}
      />
      <div className='flex min-w-0 flex-1 flex-col px-2 pt-2 sm:px-4'>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <StudioTextShowcase onSelectPrompt={setText} />
        </div>
        <div className='mx-auto w-full max-w-4xl px-1 pb-4'>
          <PromptInput
            onSubmit={() => {
              if (text.trim()) setSignInOpen(true)
            }}
            groupClassName='bg-background/95 dark:bg-background/80 has-disabled:opacity-100 border-border/70 rounded-xl shadow-[0_18px_60px_-32px_rgba(0,0,0,0.65)] ring-1 ring-foreground/5'
          >
            <PromptInputTextarea
              className='min-h-20 px-5 pt-4 pb-3 leading-7 md:text-base'
              onChange={(event) => setText(event.target.value)}
              placeholder={t('Ask anything')}
              value={text}
            />
            <PromptInputFooter className='border-border/60 bg-muted/20 justify-end border-t px-3 py-2.5'>
              <PromptInputButton
                className='bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground h-8 px-3 font-medium shadow-sm'
                disabled={!text.trim()}
                type='submit'
                variant='default'
              >
                <SendIcon size={16} aria-hidden='true' />
                <span>{t('Send')}</span>
              </PromptInputButton>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
      <StudioSignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  )
}

/**
 * Signed-in text creation reuses the console playground (groups, parameters,
 * streaming, conversation), billed like the playground. The model column
 * drives the playground's own model choice, hiding image and video models.
 */
function SignedInTextPanel() {
  const { t } = useTranslation()
  const catalogQuery = useStudioCatalog(true)

  return (
    <Playground
      renderEmptyState={(send) => <StudioTextShowcase onSelectPrompt={send} />}
      renderModelPanel={(panel) => (
        <StudioModelList
          view='text'
          models={selectTextModels(panel.models, catalogQuery.data).map(
            (option) => option.value
          )}
          value={panel.value}
          onChange={panel.onChange}
          isLoading={panel.isLoading}
          emptyText={t('No text models available in this group.')}
        />
      )}
    />
  )
}

export function StudioTextPanel() {
  const isAuthed = useAuthStore((s) => s.auth.user != null)

  return (
    <div className='h-[calc(100svh-4rem)] min-h-0'>
      {isAuthed ? <SignedInTextPanel /> : <GuestTextPreview />}
    </div>
  )
}
