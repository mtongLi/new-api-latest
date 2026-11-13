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
import { useTranslation } from 'react-i18next'

import { getLobeIcon } from '@/lib/lobe-icon'

import { MASS_PRODUCT_NAME } from '../../constants'

// Provider brand names are proper nouns and are not translated
const MODEL_PROVIDERS = [
  { icon: 'OpenAI', name: 'OpenAI' },
  { icon: 'Claude.Color', name: 'Claude' },
  { icon: 'Gemini.Color', name: 'Gemini' },
  { icon: 'DeepSeek.Color', name: 'DeepSeek' },
  { icon: 'Qwen.Color', name: 'Qwen' },
  { icon: 'Doubao.Color', name: 'Doubao' },
  { icon: 'Moonshot', name: 'Kimi' },
  { icon: 'Zhipu.Color', name: 'GLM' },
  { icon: 'Minimax.Color', name: 'MiniMax' },
  { icon: 'Grok', name: 'Grok' },
  { icon: 'Mistral.Color', name: 'Mistral' },
  { icon: 'Hunyuan.Color', name: 'Hunyuan' },
] as const

export function ModelMarquee() {
  const { t } = useTranslation()

  return (
    <section className='border-border/70 relative z-10 border-y py-10'>
      <p className='text-muted-foreground mb-7 px-6 text-center font-mono text-xs tracking-[0.2em] uppercase'>
        {t('Leading models, one gateway: {{product}}', {
          product: MASS_PRODUCT_NAME,
        })}
      </p>
      <div className='relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]'>
        <ul className='company-marquee flex w-max items-center'>
          {[0, 1].map((copy) =>
            MODEL_PROVIDERS.map((provider) => (
              <li
                key={`${copy}-${provider.name}`}
                aria-hidden={copy === 1 || undefined}
                className='text-foreground/70 hover:text-foreground flex items-center gap-2.5 px-8 text-lg font-medium whitespace-nowrap transition-colors'
              >
                {getLobeIcon(provider.icon, 26)}
                {provider.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  )
}
