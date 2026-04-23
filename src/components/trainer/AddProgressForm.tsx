'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, TrendingUp } from 'lucide-react'

interface Props {
  clientId: string
  trainerId: string
}

export function AddProgressForm({ clientId, trainerId }: Props) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase.from('progress_entries') as any).insert({
      client_id: clientId,
      trainer_id: trainerId,
      date: formData.get('date') as string,
      weight_kg: num('weight_kg'),
      body_fat_pct: num('body_fat_pct'),
      chest_cm: num('chest_cm'),
      waist_cm: num('waist_cm'),
      hips_cm: num('hips_cm'),
      shoulders_cm: num('shoulders_cm'),
      left_arm_cm: num('left_arm_cm'),
      right_arm_cm: num('right_arm_cm'),
      left_thigh_cm: num('left_thigh_cm'),
      right_thigh_cm: num('right_thigh_cm'),
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
        <Plus className="h-4 w-4" /> Log Progress
      </button>
    )
  }

  return (
    <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#A8FF3A]" />
          <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">New Progress Entry</h3>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-[#545B6A] hover:text-[#E8EAF0]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {error && <div className="rounded-lg bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>}

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input id="weight_kg" name="weight_kg" type="number" step="0.1" placeholder="75.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body_fat_pct">Body fat %</Label>
            <Input id="body_fat_pct" name="body_fat_pct" type="number" step="0.1" placeholder="18.5" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider mb-3">Body Measurements (cm)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'chest_cm', label: 'Chest' },
              { id: 'waist_cm', label: 'Waist' },
              { id: 'hips_cm', label: 'Hips' },
              { id: 'shoulders_cm', label: 'Shoulders' },
              { id: 'left_arm_cm', label: 'Left Arm' },
              { id: 'right_arm_cm', label: 'Right Arm' },
              { id: 'left_thigh_cm', label: 'Left Thigh' },
              { id: 'right_thigh_cm', label: 'Right Thigh' },
            ].map(f => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-xs">{f.label}</Label>
                <Input id={f.id} name={f.id} type="number" step="0.1" placeholder="—" className="text-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes <span className="text-[#545B6A] font-normal">(optional)</span></Label>
          <Textarea id="notes" name="notes" placeholder="Observations, energy levels, sleep quality..." rows={2} />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2.5 hover:bg-[#C8FF6A] transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-lg border border-[#1E2229] text-[#545B6A] text-sm hover:bg-[#171A1F] hover:text-[#E8EAF0] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
