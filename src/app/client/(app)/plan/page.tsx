import { createClient } from '@/lib/supabase/server'
import { Dumbbell, ChevronDown } from 'lucide-react'

export default async function ClientPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: assignments } = await db
    .from('plan_assignments')
    .select('*, workout_plans(*, workout_days(*, workout_exercises(*)))')
    .eq('client_id', user!.id)
    .eq('is_active', true)

  type Exercise = { id: string; name: string; sets: number | null; reps: string | null; rest_seconds: number | null; notes: string | null; order_index: number }
  type Day = { id: string; day_number: number; name: string; focus: string | null; workout_exercises: Exercise[] }
  type Plan = { id: string; name: string; goal: string | null; description: string | null; duration_weeks: number; workout_days: Day[] }
  type Assignment = { id: string; workout_plans: Plan | null }

  const plans: Assignment[] = assignments ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">My Plan</h1>
        <p className="text-[#545B6A] text-sm mt-2">Your assigned workout program.</p>
      </div>

      {plans.length > 0 ? plans.map(a => {
        if (!a.workout_plans) return null
        const plan = a.workout_plans
        const days = [...(plan.workout_days ?? [])].sort((x, y) => x.day_number - y.day_number)

        return (
          <div key={a.id} className="space-y-4">
            <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="h-5 w-5 text-[#A8FF3A]" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#E8EAF0] uppercase tracking-wide leading-none">{plan.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    {plan.goal && <span className="text-xs text-[#4D9EFF]">{plan.goal}</span>}
                    <span className="text-xs text-[#545B6A]">{plan.duration_weeks} week program</span>
                    <span className="text-xs text-[#545B6A]">{days.length} training days</span>
                  </div>
                  {plan.description && <p className="text-sm text-[#545B6A] mt-2">{plan.description}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {days.map(day => {
                const exercises = [...(day.workout_exercises ?? [])].sort((a, b) => a.order_index - b.order_index)
                return (
                  <div key={day.id} className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2229]">
                      <div>
                        <h3 className="text-sm font-semibold text-[#E8EAF0]">{day.name}</h3>
                        {day.focus && <p className="text-xs text-[#A8FF3A] mt-0.5">{day.focus}</p>}
                      </div>
                      <span className="text-xs text-[#3E4452]">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                    </div>
                    {exercises.length > 0 ? (
                      <div className="divide-y divide-[#1E2229]">
                        {exercises.map((ex, idx) => (
                          <div key={ex.id} className="flex items-center gap-4 px-5 py-3.5">
                            <span className="text-xs text-[#3E4452] w-5 flex-shrink-0">{idx + 1}</span>
                            <p className="flex-1 text-sm font-medium text-[#E8EAF0]">{ex.name}</p>
                            <div className="flex items-center gap-3 text-xs text-[#545B6A]">
                              {ex.sets && ex.reps && (
                                <span className="bg-[#0A0B0E] border border-[#1E2229] rounded-lg px-2.5 py-1 font-semibold text-[#E8EAF0]">
                                  {ex.sets} × {ex.reps}
                                </span>
                              )}
                              {ex.rest_seconds && <span>{ex.rest_seconds}s rest</span>}
                              {ex.notes && <span className="text-[#3E4452]">{ex.notes}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-5 py-4 text-xs text-[#3E4452]">No exercises added yet.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      }) : (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <Dumbbell className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No plan assigned yet.</p>
          <p className="text-[#3E4452] text-xs mt-1">Your trainer will assign a workout plan to you.</p>
        </div>
      )}
    </div>
  )
}
