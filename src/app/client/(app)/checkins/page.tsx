'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Plus, X } from 'lucide-react'
import { useEffect } from 'react'

type Checkin = {
  id: string
  date: string
  weight_kg: number | null
  energy_level: number | null
  sleep_quality: number | null
  adherence_score: number | null
  stress_level: number | null
  notes: string | null
}

function ScoreSelector({ name, label, value, onChange }: { name: string; label: string; value: number | null; onChange: (n: number) => void }) {
  const colors = ['#FF6B6B', '#F5A623', '#F5A623', '#22D17A', '#A8FF3A']
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-lg text-xs font-bold border transition-all ${value === n ? 'border-transparent text-[#0A0B0E]' : 'border-[#1E2229] text-[#545B6A] hover:border-[#3E4452]'}`}
            style={value === n ? { backgroundColor: colors[n - 1] } : {}}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClientCheckinsPage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [sleep, setSleep] = useState<number | null>(null)
  const [adherence, setAdherence] = useState<number | null>(null)
  const [stress, setStress] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('client_checkins').select('*').eq('client_id', user!.id).order('date', { ascending: false })
      setCheckins(data ?? [])
    }
    load()
  }, [])

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: clientRow } = await supabase.from('clients').select('trainer_id').eq('id', user!.id).single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from('client_checkins').insert({
      client_id: user!.id,
      trainer_id: clientRow?.trainer_id,
      date: formData.get('date') as string,
      weight_kg: formData.get('weight_kg') ? parseFloat(formData.get('weight_kg') as string) : null,
      energy_level: energy,
      sleep_quality: sleep,
      adherence_score: adherence,
      stress_level: stress,
      notes: (formData.get('notes') as string) || null,
    })

    if (err) { setError(err.message); setLoading(false); return }

    setOpen(false)
    setLoading(false)
    setEnergy(null); setSleep(null); setAdherence(null); setStress(null)
    router.refresh()

    // Reload
    const { data: { user: u } } = await supabase.auth.getUser()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('client_checkins').select('*').eq('client_id', u!.id).order('date', { ascending: false })
    setCheckins(data ?? [])
  }

  const scoreColor = (n: number) => n >= 4 ? 'text-[#22D17A]' : n >= 3 ? 'text-[#F5A623]' : 'text-[#FF6B6B]'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">Check-ins</h1>
          <p className="text-[#545B6A] text-sm mt-2">Log your weekly progress for your trainer.</p>
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold hover:bg-[#C8FF6A] transition-colors mt-1">
            <Plus className="h-4 w-4" /> New Check-in
          </button>
        )}
      </div>

      {open && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#A8FF3A]" />
              <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Weekly Check-in</h3>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#545B6A] hover:text-[#E8EAF0]"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {error && <div className="rounded-lg bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Date</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Weight (kg)</label>
                <input name="weight_kg" type="number" step="0.1" placeholder="75.5" className="w-full border border-[#1E2229] rounded-lg px-3 py-2 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider mb-3">How was your week? <span className="text-[#3E4452] normal-case font-normal">(1 = low · 5 = high)</span></p>
              <div className="grid grid-cols-2 gap-4">
                <ScoreSelector name="energy_level" label="Energy Level" value={energy} onChange={setEnergy} />
                <ScoreSelector name="sleep_quality" label="Sleep Quality" value={sleep} onChange={setSleep} />
                <ScoreSelector name="adherence_score" label="Plan Adherence" value={adherence} onChange={setAdherence} />
                <ScoreSelector name="stress_level" label="Stress Level" value={stress} onChange={setStress} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Notes <span className="font-normal text-[#3E4452]">(optional)</span></label>
              <textarea name="notes" rows={3} placeholder="How did the week go? Any wins or challenges?" className="w-full border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="flex-1 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2.5 hover:bg-[#C8FF6A] transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : 'Submit Check-in'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg border border-[#1E2229] text-[#545B6A] text-sm hover:bg-[#171A1F] hover:text-[#E8EAF0] transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {checkins.length > 0 ? (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2229]">
            <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Check-in History</h3>
          </div>
          <div className="divide-y divide-[#1E2229]">
            {checkins.map(c => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#E8EAF0]">
                    {new Date(c.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  {c.weight_kg && <span className="text-xs font-semibold text-[#A8FF3A]">{c.weight_kg} kg</span>}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Energy', value: c.energy_level },
                    { label: 'Sleep', value: c.sleep_quality },
                    { label: 'Adherence', value: c.adherence_score },
                    { label: 'Stress', value: c.stress_level },
                  ].map(s => s.value && (
                    <div key={s.label} className="bg-[#0A0B0E] rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-[#3E4452] uppercase tracking-wider mb-1">{s.label}</p>
                      <p className={`text-xl font-bold ${scoreColor(s.value)}`}>{s.value}<span className="text-xs text-[#3E4452]">/5</span></p>
                    </div>
                  ))}
                </div>
                {c.notes && <p className="text-xs text-[#545B6A] mt-3">{c.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <ClipboardList className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No check-ins yet.</p>
          <p className="text-[#3E4452] text-xs mt-1">Submit your first one above.</p>
        </div>
      )}
    </div>
  )
}
