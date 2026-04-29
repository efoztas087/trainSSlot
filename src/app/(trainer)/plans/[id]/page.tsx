import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlanEditor } from '@/components/trainer/PlanEditor'
import { AssignPlanButton } from '@/components/trainer/AssignPlanButton'
import { Dumbbell, Users } from 'lucide-react'

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: planRaw }, { data: clients }] = await Promise.all([
    (supabase as any)
      .from('workout_plans')
      .select('*, workout_days(*, workout_exercises(*))')
      .eq('id', id)
      .eq('trainer_id', user!.id)
      .order('day_number', { referencedTable: 'workout_days', ascending: true })
      .single(),
    supabase
      .from('clients')
      .select('id, name')
      .eq('trainer_id', user!.id)
      .neq('status', 'inactive'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = planRaw as any
  if (!plan) notFound()

  const { data: assignments } = await supabase
    .from('plan_assignments')
    .select('client_id, is_active, clients(name)')
    .eq('plan_id', id)
    .eq('is_active', true)

  const assignedClientIds = assignments?.map((a: { client_id: string }) => a.client_id) ?? []

  const days = plan.workout_days?.map((d: { workout_exercises?: unknown[] } & Record<string, unknown>) => ({
    ...d,
    workout_exercises: (d.workout_exercises ?? []) as Array<{ id: string; name: string; sets: number | null; reps: string | null; rest_seconds: number | null; notes: string | null; order_index: number }>,
  })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/plans" className="text-sm text-[#545B6A] hover:text-[#E8EAF0] transition-colors">
            ← Back to plans
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight mt-2">
            {plan.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {plan.goal && <span className="text-xs text-[#4D9EFF] font-medium">{plan.goal}</span>}
            <span className="text-xs text-[#545B6A]">{plan.duration_weeks}w program</span>
            {plan.description && <span className="text-xs text-[#545B6A]">· {plan.description}</span>}
          </div>
        </div>
        <div className="flex gap-3 mt-1">
          <AssignPlanButton
            planId={id}
            clients={clients ?? []}
            assignedClientIds={assignedClientIds}
          />
        </div>
      </div>

      {assignments && assignments.length > 0 && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-[#A8FF3A]" />
            <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Assigned Clients</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {assignments.map((a: { client_id: string; clients: { name: string } | null }) => (
              <Link key={a.client_id} href={`/clients/${a.client_id}`}>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A2415] text-[#22D17A] border border-[#0F3020] text-xs font-medium hover:bg-[#0F3020] transition-colors">
                  <span className="h-4 w-4 rounded-full bg-[#22D17A]/20 flex items-center justify-center text-[10px] font-bold">
                    {a.clients?.name?.charAt(0)}
                  </span>
                  {a.clients?.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="h-4 w-4 text-[#A8FF3A]" />
          <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] uppercase tracking-wide leading-none">Training Days</h2>
        </div>
        <PlanEditor planId={id} initialDays={days} />
      </div>
    </div>
  )
}
