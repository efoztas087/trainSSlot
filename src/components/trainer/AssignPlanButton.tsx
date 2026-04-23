'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, X } from 'lucide-react'

interface Client { id: string; name: string }

interface Props {
  planId: string
  clients: Client[]
  assignedClientIds: string[]
}

export function AssignPlanButton({ planId, clients, assignedClientIds }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const unassigned = clients.filter(c => !assignedClientIds.includes(c.id))

  async function assign(clientId: string) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('plan_assignments').upsert({
      plan_id: planId,
      client_id: clientId,
      trainer_id: user!.id,
      is_active: true,
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function unassign(clientId: string) {
    const supabase = createClient()
    await supabase.from('plan_assignments').delete().eq('plan_id', planId).eq('client_id', clientId)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E2229] text-[#E8EAF0] text-sm font-medium hover:bg-[#171A1F] transition-colors"
      >
        <UserPlus className="h-4 w-4" /> Assign to Client
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-[#131519] border border-[#1E2229] rounded-xl shadow-2xl p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Assign Plan</p>
            <button onClick={() => setOpen(false)}><X className="h-3.5 w-3.5 text-[#545B6A]" /></button>
          </div>
          {unassigned.length === 0 ? (
            <p className="text-xs text-[#545B6A] py-2">All clients are assigned.</p>
          ) : (
            <div className="space-y-1">
              {unassigned.map(c => (
                <button
                  key={c.id}
                  disabled={loading}
                  onClick={() => assign(c.id)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-[#171A1F] transition-colors text-left"
                >
                  <div className="h-7 w-7 rounded-full bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#A8FF3A]">{c.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-[#E8EAF0]">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
