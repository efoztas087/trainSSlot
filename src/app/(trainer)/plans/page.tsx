import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Dumbbell, Plus, Users, CheckCircle } from 'lucide-react'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plans } = await supabase
    .from('workout_plans')
    .select('*, plan_assignments(id, is_active)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: false })

  const total = plans?.length ?? 0
  const active = plans?.filter(p => p.is_active).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
            Workout Plans
          </h1>
          <p className="text-[#545B6A] text-sm mt-2">Build and assign training programs to your clients.</p>
        </div>
        <Link href="/plans/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold hover:bg-[#C8FF6A] transition-colors mt-1">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Plans', value: total, icon: Dumbbell, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]' },
          { label: 'Active Plans', value: active, icon: CheckCircle, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]' },
          { label: 'Assigned', value: plans?.reduce((sum, p) => sum + (p.plan_assignments?.filter((a: { is_active: boolean }) => a.is_active).length ?? 0), 0) ?? 0, icon: Users, iconBg: 'bg-[#251B08]', iconColor: 'text-[#F5A623]' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">{stat.label}</p>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#E8EAF0]">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {plans.map(plan => {
            const assignedCount = plan.plan_assignments?.filter((a: { is_active: boolean }) => a.is_active).length ?? 0
            return (
              <Link key={plan.id} href={`/plans/${plan.id}`}>
                <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5 hover:border-[#A8FF3A]/30 hover:bg-[#171A1F] transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="h-5 w-5 text-[#A8FF3A]" />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${plan.is_active ? 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]' : 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] uppercase tracking-wide leading-none">{plan.name}</h3>
                  {plan.description && <p className="text-sm text-[#545B6A] mt-1.5 line-clamp-2">{plan.description}</p>}
                  <div className="flex items-center gap-4 mt-4 text-xs text-[#545B6A]">
                    {plan.goal && <span className="text-[#4D9EFF]">Goal: {plan.goal}</span>}
                    <span>{plan.duration_weeks}w program</span>
                    {assignedCount > 0 && <span className="text-[#A8FF3A]">{assignedCount} client{assignedCount > 1 ? 's' : ''} assigned</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <Dumbbell className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No plans yet.</p>
          <Link href="/plans/new" className="text-sm text-[#A8FF3A] hover:underline font-medium mt-1 inline-block">
            Create your first plan
          </Link>
        </div>
      )}
    </div>
  )
}
