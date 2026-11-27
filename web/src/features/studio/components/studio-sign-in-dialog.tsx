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
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'

type StudioSignInDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Asks a visitor to sign in when they try to create something. */
export function StudioSignInDialog(props: StudioSignInDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <ConfirmDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Sign in to start creating')}
      desc={t(
        'Generating images, videos and text uses your account balance. Sign in to continue.'
      )}
      confirmText={t('Sign in')}
      handleConfirm={() => {
        props.onOpenChange(false)
        navigate({ to: '/sign-in', search: { redirect: location.href } })
      }}
    />
  )
}
