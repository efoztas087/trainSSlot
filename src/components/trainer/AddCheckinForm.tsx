'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, ClipboardList } from 'lucide-react'

interface Props {
  clientId: string
  trainerId: string
}

function ScoreSelector({ name, label }: { name: string; label: string }) {
  const [val, setVal] = useState<number | null>(null)
  const colors = ['#FF6B6B', '#F5A623', '#F5A623', '#22D17A', '#A8FF3A']
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <input type="hidden" name={name} value={val ?? ''} />
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setVal(n)}
            className={`h-8 w-8 rounded-lg text-xs font-bold border transition-all ${
              val === n
                ? 'border-transparent text-[#0A0B0E]'
                : 'border-[#1E2229] text-[#545B6A] hover:border-[#3E4452]'
            }`}
            style={val === n ? { backgroundColor: colors[n - 1] } : {}}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AddCheckinForm({ clientId, trainerId }: Props) {
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

    const num = (key: string) => {
      const v = formData.get(key) as string
      return v ? parseFloat(v) : null
    }
    const score = (key: string) => {
      const v = formData.get(key) as string
      return v ? parseInt(v) : null
    }

    const { error: err } = await supabase.from('client_checkins').insert({
      client_id: clientId,
      trainer_id: trainerId,
      date: formData.get('date') as string,
      weight_kg: num('weight_kg'),
      energy_level: score('energy_level'),
      sleep_quality: score('sleep_quality'),
      adherence_score: score('adherence_score'),
      stress_level: score('stress_level'),
      notes: (formData.get('notes') as string) || null,
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
        <Plus className="h-4 w-4" /> New Check-in
      </button>
    )
  }

  return (
    <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#A8FF3A]" />
          <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Weekly Check-in</h3>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-[#545B6A] hover:text-[#E8EAF0]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {error && <div className="rounded-lg bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input id="weight_kg" name="weight_kg" type="number" step="0.1" placeholder="75.5" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider mb-3">Client Scores <span className="text-[#3E4452] normal-case font-normal">(1 = low · 5 = high)</span></p>
          <div className="grid grid-cols-2 gap-4">
            <ScoreSelector name="energy_level" label="Energy Level" />
            <ScoreSelector name="sleep_quality" label="Sleep Quality" />
            <ScoreSelector name="adherence_score" label="Plan Adherence" />
            <ScoreSelector name="stress_level" label="Stress Level" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes <span className="text-[#545B6A] font-normal">(optional)</span></Label>
          <Textarea id="notes" name="notes" placeholder="How did the week go? Any issues?" rows={2} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2.5 hover:bg-[#C8FF6A] transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Check-in'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg border border-[#1E2229] text-[#545B6A] text-sm hover:bg-[#171A1F] hover:text-[#E8EAF0] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
