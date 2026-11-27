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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type StudioOptionItem = {
  value: string
  label: string
}

type StudioOptionSelectProps = {
  label: string
  items: StudioOptionItem[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Compact select used for size, count and duration in the composer footer. */
export function StudioOptionSelect(props: StudioOptionSelectProps) {
  const selected = props.items.find((item) => item.value === props.value)

  return (
    <Select
      items={props.items}
      value={props.value}
      onValueChange={(value) => {
        if (value != null) props.onChange(value)
      }}
      disabled={props.disabled}
    >
      <SelectTrigger aria-label={props.label} size='sm'>
        <SelectValue>{selected?.label ?? props.value}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {props.items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
