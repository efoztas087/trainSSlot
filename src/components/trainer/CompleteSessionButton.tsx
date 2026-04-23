'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  sessionId: string
}

export function CompleteSessionButton({ sessionId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(newStatus: 'completed' | 'cancelled') {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('sessions').update({ status: newStatus }).eq('id', sessionId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction('completed')}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A2415] text-[#22D17A] border border-[#0F3020] text-xs font-semibold hover:bg-[#0F3020] transition-colors disabled:opacity-50"
      >
        <CheckCircle className="h-3.5 w-3.5" /> Done
      </button>
      <button
        onClick={() => handleAction('cancelled')}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25090A] text-[#FF6B6B] border border-[#3D1010] text-xs font-semibold hover:bg-[#3D1010] transition-colors disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" /> Cancel
      </button>
    </div>
  )
}
