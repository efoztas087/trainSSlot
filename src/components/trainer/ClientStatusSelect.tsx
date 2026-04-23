'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const options = [
  { value: 'active', label: 'Active', textColor: 'text-[#22D17A]' },
  { value: 'needs_attention', label: 'Needs attention', textColor: 'text-[#F5A623]' },
  { value: 'inactive', label: 'Inactive', textColor: 'text-[#545B6A]' },
]

interface Props {
  clientId: string
  currentStatus: string
}

export function ClientStatusSelect({ clientId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  async function handleChange(value: string) {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('clients').update({ status: value as 'active' | 'inactive' | 'needs_attention' }).eq('id', clientId)
    setStatus(value)
    setSaving(false)
    router.refresh()
  }

  const current = options.find(o => o.value === status)

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className={`appearance-none border border-[#1E2229] rounded-lg px-3 py-1.5 text-sm font-medium bg-[#131519] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 ${current?.textColor ?? 'text-[#E8EAF0]'}`}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
