import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function NewPlanPage() {
  async function createPlan(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: plan, error } = await supabase
      .from('workout_plans')
      .insert({
        trainer_id: user!.id,
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
        goal: (formData.get('goal') as string) || null,
        duration_weeks: parseInt(formData.get('duration_weeks') as string) || 4,
      })
      .select('id')
      .single()

    if (error || !plan) return
    redirect(`/plans/${plan.id}`)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/plans" className="text-sm text-[#545B6A] hover:text-[#E8EAF0] transition-colors">
          ← Back to plans
        </Link>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight mt-2">
          New Plan
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">Set up the plan details, then add days and exercises.</p>
      </div>

      <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2229]">
          <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Plan Details</h2>
        </div>
        <form action={createPlan} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Plan Name *</label>
            <input
              name="name"
              required
              placeholder="e.g. 4-Week Fat Loss Program"
              className="w-full border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Goal</label>
            <input
              name="goal"
              placeholder="e.g. Fat loss, Muscle gain, General fitness"
              className="w-full border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief overview of this program..."
              className="w-full border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Duration (weeks)</label>
            <select
              name="duration_weeks"
              defaultValue="4"
              className="w-full appearance-none border border-[#1E2229] rounded-lg px-3 py-2.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40"
            >
              {[2, 4, 6, 8, 10, 12, 16, 20, 24].map(w => (
                <option key={w} value={w}>{w} weeks</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-3 hover:bg-[#C8FF6A] transition-colors mt-2"
          >
            Create Plan & Add Exercises →
          </button>
        </form>
      </div>
    </div>
  )
}
