'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

interface Client { id: string; name: string }
interface Package { id: string; name: string; sessions_total: number }

interface Props {
  trainerId: string
  clients: Client[]
  packages: Package[]
}

export function AssignPackageForm({ trainerId, clients, packages }: Props) {
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
    const pkgId = formData.get('package_id') as string
    const pkg = packages.find(p => p.id === pkgId)

    const { error: err } = await supabase.from('client_packages').insert({
      client_id: formData.get('client_id') as string,
      package_id: pkgId,
      trainer_id: trainerId,
      sessions_total: pkg?.sessions_total ?? 0,
      start_date: formData.get('start_date') as string,
    })

    if (err) { setError(err.message); setLoading(false); return }
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E2229] text-[#E8EAF0] text-sm font-medium hover:bg-[#171A1F] transition-colors">
        <Plus className="h-4 w-4" /> Assign Package
      </button>
    )
  }

  return (
    <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
        <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Assign Package to Client</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-[#545B6A] hover:text-[#E8EAF0]"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && <div className="rounded-lg bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Client</label>
            <select name="client_id" required className="w-full appearance-none border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Package</label>
            <select name="package_id" required className="w-full appearance-none border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40">
              <option value="">Select package...</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sessions_total} sessions)</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Start Date</label>
          <input name="start_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2.5 hover:bg-[#C8FF6A] transition-colors disabled:opacity-50">
            {loading ? 'Assigning...' : 'Assign Package'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg border border-[#1E2229] text-[#545B6A] text-sm hover:bg-[#171A1F] transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
