'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, X } from 'lucide-react'

interface Props {
  clientId: string
  trainerId: string
}

export function TrainerNotesForm({ clientId, trainerId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error: err } = await supabase.from('trainer_notes').insert({
      client_id: clientId,
      trainer_id: trainerId,
      message: formData.get('message') as string,
    })

    if (err) { setError(err.message); setLoading(false); return }
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold hover:bg-[#C8FF6A] transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Note
      </button>
    )
  }

  return (
    <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#A8FF3A]" />
          <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">New Note for Client</h3>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-[#545B6A] hover:text-[#E8EAF0]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && <div className="rounded-lg bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Message</label>
          <textarea
            name="message"
            required
            rows={4}
            placeholder="Write a note, feedback, or instructions for your client..."
            className="w-full border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2.5 hover:bg-[#C8FF6A] transition-colors disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Note'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg border border-[#1E2229] text-[#545B6A] text-sm hover:bg-[#171A1F] hover:text-[#E8EAF0] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
