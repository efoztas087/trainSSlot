import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientStatusSelect } from '@/components/trainer/ClientStatusSelect'
import { CopyClientInviteLink } from '@/components/trainer/CopyClientInviteLink'
import { AddProgressForm } from '@/components/trainer/AddProgressForm'
import { AddCheckinForm } from '@/components/trainer/AddCheckinForm'
import { TrainerNotesForm } from '@/components/trainer/TrainerNotesForm'
import { ProgressChart } from '@/components/charts/ProgressChart'
import { TrendingUp, ClipboardList, CreditCard, CalendarDays, Dumbbell, MessageSquare } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]' },
  inactive: { label: 'Inactive', className: 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]' },
  needs_attention: { label: 'Needs attention', className: 'bg-[#251B08] text-[#F5A623] border border-[#352508]' },
}

const paymentStatusMap: Record<string, string> = {
  paid: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]',
  pending: 'bg-[#251B08] text-[#F5A623] border border-[#352508]',
  failed: 'bg-[#25090A] text-[#FF6B6B] border border-[#3D1010]',
  expired: 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]',
  refunded: 'bg-[#081525] text-[#4D9EFF] border border-[#0D2035]',
}

const scoreColor = (n: number) => {
  if (n >= 4) return 'text-[#22D17A]'
  if (n >= 3) return 'text-[#F5A623]'
  return 'text-[#FF6B6B]'
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!client) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [progressRes, paymentsRes, sessionsRes, checkinsRes, planAssignRes, notesRes] = await Promise.all([
    db.from('progress_entries').select('*').eq('client_id', id).order('date', { ascending: false }),
    db.from('payments').select('*, packages(name)').eq('client_id', id).order('created_at', { ascending: false }),
    db.from('sessions').select('*').eq('client_id', id).order('scheduled_at', { ascending: false }),
    db.from('client_checkins').select('*').eq('client_id', id).order('date', { ascending: false }),
    db.from('plan_assignments').select('*, workout_plans(id, name, goal, duration_weeks)').eq('client_id', id).eq('is_active', true),
    db.from('trainer_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  type ProgressEntry = { id: string; date: string; weight_kg: number | null; body_fat_pct: number | null; chest_cm: number | null; waist_cm: number | null; hips_cm: number | null; shoulders_cm: number | null; left_arm_cm: number | null; right_arm_cm: number | null; notes: string | null }
  type Session = { id: string; scheduled_at: string; duration_minutes: number; status: string; notes: string | null }
  type Checkin = { id: string; date: string; weight_kg: number | null; energy_level: number | null; sleep_quality: number | null; adherence_score: number | null; stress_level: number | null; notes: string | null }
  type TrainerNote = { id: string; message: string; created_at: string }

  const progressEntries: ProgressEntry[] = progressRes.data ?? []
  const payments = paymentsRes.data as Array<{ id: string; amount_cents: number; status: string; created_at: string; packages: { name: string } | null }> ?? []
  const sessions: Session[] = sessionsRes.data ?? []
  const checkins: Checkin[] = checkinsRes.data ?? []
  const planAssignments = planAssignRes.data ?? []
  const trainerNotes: TrainerNote[] = notesRes.data ?? []

  const scheduledSessions = sessions.filter(s => s.status === 'scheduled').length
  const completedSessions = sessions.filter(s => s.status === 'completed').length

  const chartData = progressEntries.map(e => ({
    date: e.date,
    weight_kg: e.weight_kg ?? null,
    body_fat_pct: e.body_fat_pct ?? null,
  }))

  const sc = statusConfig[client.status] ?? statusConfig.active

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm text-[#545B6A] hover:text-[#E8EAF0] transition-colors">
            ← Back to clients
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-12 w-12 rounded-full bg-[#0F2010] flex items-center justify-center">
              <span className="text-lg font-bold text-[#A8FF3A]">{client.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl text-[#E8EAF0] uppercase leading-none tracking-tight">
                {client.name}
              </h1>
              {client.goal && <p className="text-sm text-[#545B6A] mt-0.5">Goal: {client.goal}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.className}`}>{sc.label}</span>
          <CopyClientInviteLink trainerId={user!.id} clientName={client.name} />
          <ClientStatusSelect clientId={id} currentStatus={client.status} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Sessions Done', value: completedSessions, icon: CalendarDays, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]' },
          { label: 'Upcoming', value: scheduledSessions, icon: CalendarDays, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]' },
          { label: 'Check-ins', value: checkins.length, icon: ClipboardList, iconBg: 'bg-[#251B08]', iconColor: 'text-[#F5A623]' },
          { label: 'Progress Logs', value: progressEntries.length, icon: TrendingUp, iconBg: 'bg-[#0F2010]', iconColor: 'text-[#A8FF3A]' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#131519] rounded-xl border border-[#1E2229] p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">{stat.label}</p>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#E8EAF0]">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* PROGRESS TAB */}
        <TabsContent value="progress" className="space-y-5 mt-5">
          <AddProgressForm clientId={id} trainerId={user!.id} />

          {chartData.length > 1 && (
            <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-[#A8FF3A]" />
                <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Weight & Body Fat Trend</h3>
              </div>
              <ProgressChart data={chartData} />
            </div>
          )}

          {progressEntries.length > 0 ? (
            <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E2229]">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Entry History</h3>
              </div>
              <div className="divide-y divide-[#1E2229]">
                {progressEntries.map(entry => (
                  <div key={entry.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-[#E8EAF0]">
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {entry.weight_kg && <span className="text-[#A8FF3A] font-semibold">{entry.weight_kg} kg</span>}
                      {entry.body_fat_pct && <span className="text-[#4D9EFF]">{entry.body_fat_pct}% body fat</span>}
                      {entry.chest_cm && <span className="text-[#545B6A]">Chest: {entry.chest_cm}cm</span>}
                      {entry.waist_cm && <span className="text-[#545B6A]">Waist: {entry.waist_cm}cm</span>}
                      {entry.hips_cm && <span className="text-[#545B6A]">Hips: {entry.hips_cm}cm</span>}
                      {entry.shoulders_cm && <span className="text-[#545B6A]">Shoulders: {entry.shoulders_cm}cm</span>}
                      {entry.left_arm_cm && <span className="text-[#545B6A]">L.Arm: {entry.left_arm_cm}cm</span>}
                      {entry.right_arm_cm && <span className="text-[#545B6A]">R.Arm: {entry.right_arm_cm}cm</span>}
                    </div>
                    {entry.notes && <p className="text-xs text-[#545B6A] mt-2">{entry.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#545B6A] text-center py-10">No progress entries yet.</p>
          )}
        </TabsContent>

        {/* CHECK-INS TAB */}
        <TabsContent value="checkins" className="space-y-5 mt-5">
          <AddCheckinForm clientId={id} trainerId={user!.id} />

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
            <p className="text-sm text-[#545B6A] text-center py-10">No check-ins yet.</p>
          )}
        </TabsContent>

        {/* SESSIONS TAB */}
        <TabsContent value="sessions" className="space-y-4 mt-5">
          {sessions.length > 0 ? (
            <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E2229]">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">All Sessions</h3>
              </div>
              <div className="divide-y divide-[#1E2229]">
                {sessions.map(s => {
                  const statusStyle: Record<string, string> = {
                    scheduled: 'bg-[#081525] text-[#4D9EFF] border border-[#0D2035]',
                    completed: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]',
                    cancelled: 'bg-[#25090A] text-[#FF6B6B] border border-[#3D1010]',
                  }
                  return (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-[#E8EAF0]">
                          {new Date(s.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[#545B6A] mt-0.5">
                          {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[s.status] ?? ''}`}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#545B6A] text-center py-10">No sessions yet.</p>
          )}
        </TabsContent>

        {/* PLAN TAB */}
        <TabsContent value="plan" className="space-y-4 mt-5">
          {planAssignments.length > 0 ? (
            <div className="space-y-4">
              {planAssignments.map((a: { id: string; workout_plans: { id: string; name: string; goal: string | null; duration_weeks: number } | null }) => (
                a.workout_plans && (
                  <Link key={a.id} href={`/plans/${a.workout_plans.id}`}>
                    <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5 hover:border-[#A8FF3A]/30 transition-all cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="h-5 w-5 text-[#A8FF3A]" />
                        </div>
                        <div>
                          <h3 className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] uppercase tracking-wide leading-none">{a.workout_plans.name}</h3>
                          <p className="text-xs text-[#545B6A] mt-1">{a.workout_plans.goal} · {a.workout_plans.duration_weeks}w</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Dumbbell className="h-8 w-8 text-[#1E2229] mx-auto mb-3" />
              <p className="text-sm text-[#545B6A]">No plan assigned yet.</p>
              <Link href="/plans" className="text-sm text-[#A8FF3A] hover:underline font-medium mt-1 inline-block">Go to Plans</Link>
            </div>
          )}
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="space-y-5 mt-5">
          <TrainerNotesForm clientId={id} trainerId={user!.id} />
          {trainerNotes.length > 0 ? (
            <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E2229]">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-[#E8EAF0] uppercase tracking-wide leading-none">Note History</h3>
              </div>
              <div className="divide-y divide-[#1E2229]">
                {trainerNotes.map(note => (
                  <div key={note.id} className="px-5 py-4">
                    <p className="text-sm text-[#E8EAF0] leading-relaxed">{note.message}</p>
                    <p className="text-xs text-[#3E4452] mt-2">
                      {new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#545B6A] text-center py-10">No notes yet. Send one above.</p>
          )}
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="mt-5">
          {payments.length > 0 ? (
            <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E2229]">
                    <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Package</th>
                    <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2229]">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-[#171A1F] transition-colors">
                      <td className="px-6 py-4 text-sm text-[#E8EAF0]">{p.packages?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#E8EAF0]">€{(p.amount_cents / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusMap[p.status] ?? 'bg-[#16181E] text-[#545B6A]'}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#3E4452]">
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#545B6A] text-center py-10">No payments yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
