'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CalendarPanel } from '@/components/ui/date-time-picker'
import { CalendarDays, Plus, X } from 'lucide-react'
import { format } from 'date-fns'

interface Client {
  id: string
  name: string
}

interface Props {
  trainerId: string
  clients: Client[]
  preselectedClientId?: string
}

function buildIso(date: Date, h: string, m: string) {
  const d = new Date(date)
  d.setHours(parseInt(h), parseInt(m), 0, 0)
  return d.toISOString()
}

export function AddSessionForm({ trainerId, clients, preselectedClientId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calOpen, setCalOpen] = useState(false)

  const init = new Date()
  init.setHours(init.getHours() + 1, 0, 0, 0)
  const [selectedDay, setSelectedDay] = useState<Date>(init)
  const [hour, setHour] = useState(init.getHours().toString().padStart(2, '0'))
  const [minute, setMinute] = useState('00')

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    setSelectedDay(day)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error: insertError } = await supabase.from('sessions').insert({
      trainer_id: trainerId,
      client_id: formData.get('client_id') as string,
      scheduled_at: buildIso(selectedDay, hour, minute),
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      notes: (formData.get('notes') as string) || null,
      status: 'scheduled',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setCalOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold hover:bg-[#C8FF6A] transition-colors"
      >
        <Plus className="h-4 w-4" /> Schedule Session
      </button>
    )
  }

  return (
    <div className="flex items-start gap-4">
      {/* Form card */}
      <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden w-[360px] flex-shrink-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
          <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">
            Schedule a session
          </h2>
          <button
            type="button"
            onClick={() => { setOpen(false); setCalOpen(false) }}
            className="text-[#545B6A] hover:text-[#E8EAF0] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
              {error}
            </div>
          )}

          {!preselectedClientId && (
            <div className="space-y-1.5">
              <Label htmlFor="client_id">Client</Label>
              <select
                id="client_id"
                name="client_id"
                required
                className="w-full appearance-none border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40"
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {preselectedClientId && (
            <input type="hidden" name="client_id" value={preselectedClientId} />
          )}

          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <button
              type="button"
              onClick={() => setCalOpen(o => !o)}
              className={`flex items-center gap-2 w-full border rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] text-left transition-colors ${calOpen ? 'border-[#A8FF3A]/60 ring-2 ring-[#A8FF3A]/20' : 'border-[#1E2229] hover:border-[#A8FF3A]/40'}`}
            >
              <CalendarDays className="h-4 w-4 text-[#545B6A] flex-shrink-0" />
              {format(selectedDay, 'dd/MM/yyyy')} · {hour}:{minute}
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration_minutes">Duration</Label>
            <select
              id="duration_minutes"
              name="duration_minutes"
              defaultValue="60"
              required
              className="w-full appearance-none border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40"
            >
              {[30, 45, 60, 75, 90, 105, 120].map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes <span className="text-[#545B6A] font-normal">(optional)</span></Label>
            <Textarea id="notes" name="notes" placeholder="Session focus, goals..." rows={2} />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2.5 hover:bg-[#C8FF6A] transition-colors disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setCalOpen(false) }}
              className="px-4 py-2.5 rounded-lg border border-[#1E2229] text-[#545B6A] text-sm font-medium hover:bg-[#171A1F] hover:text-[#E8EAF0] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Calendar card — separate, to the right */}
      {calOpen && (
        <CalendarPanel
          selected={selectedDay}
          hour={hour}
          minute={minute}
          onDaySelect={handleDaySelect}
          onHour={setHour}
          onMinute={setMinute}
          onConfirm={() => setCalOpen(false)}
        />
      )}
    </div>
  )
}
