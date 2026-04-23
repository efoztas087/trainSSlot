import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Package, Target, ArrowRight, Zap, Clock, MessageSquare, Dumbbell, ShieldCheck, MapPin, Award } from 'lucide-react'
import Link from 'next/link'

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const [clientRes, packageRes, progressRes, sessionsRes, notesRes, planRes] = await Promise.all([
    supabase.from('clients').select('goal, trainer_id, trainers(name, bio, avatar_url, specialties, location, studio_name, certification, years_experience)').eq('id', user!.id).single(),
    db.from('client_packages').select('sessions_used, sessions_total, packages(name)').eq('client_id', user!.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('progress_entries').select('weight_kg, date, notes').eq('client_id', user!.id).order('date', { ascending: false }).limit(2),
    db.from('sessions').select('id, scheduled_at, duration_minutes, notes').eq('client_id', user!.id).eq('status', 'scheduled').gte('scheduled_at', now.toISOString()).order('scheduled_at', { ascending: true }).limit(3),
    db.from('trainer_notes').select('id, message, created_at').eq('client_id', user!.id).order('created_at', { ascending: false }).limit(3),
    db.from('plan_assignments').select('workout_plans(name, goal)').eq('client_id', user!.id).eq('is_active', true).limit(1).maybeSingle(),
  ])

  type TrainerProfile = { name: string; bio: string | null; avatar_url: string | null; specialties: string[] | null; location: string | null; studio_name: string | null; certification: string | null; years_experience: number | null }
  const clientData = clientRes.data as { goal: string | null; trainer_id: string | null; trainers: TrainerProfile | null } | null
  const activePackage = packageRes.data as { sessions_used: number; sessions_total: number; packages: { name: string } | null } | null
  const progressEntries = progressRes.data ?? []
  type ClientSession = { id: string; scheduled_at: string; duration_minutes: number; notes: string | null }
  const upcomingSessions: ClientSession[] = sessionsRes.data ?? []
  const trainerNotes = notesRes.data ?? []
  const activePlan = planRes.data?.workout_plans as { name: string; goal: string | null } | null

  const latest = progressEntries[0] ?? null
  const previous = progressEntries[1] ?? null
  const weightDiff = latest?.weight_kg && previous?.weight_kg ? latest.weight_kg - previous.weight_kg : null
  const sessionsProgress = activePackage && activePackage.sessions_total > 0
    ? (activePackage.sessions_used / activePackage.sessions_total) * 100
    : 0

  const todaySessions = upcomingSessions.filter(s => {
    const d = new Date(s.scheduled_at)
    return d >= todayStart && d <= todayEnd
  })

  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  const firstName = (user?.user_metadata?.name ?? 'there').split(' ')[0].toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-1">{dayName} · {dateStr}</p>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">
          {clientData?.trainers ? `Coached by ${clientData.trainers.name}` : "Here's your training overview."}
        </p>
      </div>

      {/* Trainer connection card */}
      {/* Link trainer banner — shown when account not yet linked */}
      {!clientData?.trainer_id && (
        <Link href="/client/link-trainer">
          <div className="bg-[#0F2010] border border-[#A8FF3A]/30 rounded-2xl p-5 flex items-center gap-4 hover:border-[#A8FF3A]/60 transition-all cursor-pointer">
            <div className="h-12 w-12 rounded-xl bg-[#A8FF3A]/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-[#A8FF3A]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#E8EAF0]">Connect to your trainer</p>
              <p className="text-xs text-[#545B6A] mt-0.5">Enter the 6-character code your trainer shared with you to get linked.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#A8FF3A] flex-shrink-0" />
          </div>
        </Link>
      )}

      {clientData?.trainers ? (
        <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-xl bg-[#0F2010] border border-[#A8FF3A]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {clientData.trainers.avatar_url
                ? <img src={clientData.trainers.avatar_url} alt={clientData.trainers.name} className="h-full w-full object-cover" />
                : <span className="text-xl font-bold text-[#A8FF3A]">{clientData.trainers.name.charAt(0).toUpperCase()}</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] uppercase tracking-wide leading-none">
                  {clientData.trainers.name}
                </p>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#22D17A] bg-[#0A2415] border border-[#0F3020] px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Linked Trainer
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                {clientData.trainers.studio_name && (
                  <p className="text-xs text-[#545B6A]">{clientData.trainers.studio_name}</p>
                )}
                {clientData.trainers.location && (
                  <p className="text-xs text-[#545B6A] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{clientData.trainers.location}
                  </p>
                )}
                {clientData.trainers.years_experience && (
                  <p className="text-xs text-[#545B6A]">{clientData.trainers.years_experience} yrs experience</p>
                )}
                {clientData.trainers.certification && (
                  <p className="text-xs text-[#545B6A] flex items-center gap-1">
                    <Award className="h-3 w-3" />{clientData.trainers.certification}
                  </p>
                )}
              </div>

              {clientData.trainers.bio && (
                <p className="text-xs text-[#545B6A] mt-2 leading-relaxed line-clamp-2">{clientData.trainers.bio}</p>
              )}

              {clientData.trainers.specialties && clientData.trainers.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {clientData.trainers.specialties.map(s => (
                    <span key={s} className="text-[10px] font-medium text-[#A8FF3A] bg-[#0F2010] border border-[#1B3A20] px-2 py-0.5 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Message button */}
            <Link href="/client/messages" className="flex items-center gap-1.5 px-3 py-2 bg-[#131519] border border-[#1E2229] rounded-xl text-xs font-medium text-[#E8EAF0] hover:bg-[#1E2229] transition-colors flex-shrink-0">
              <MessageSquare className="h-3.5 w-3.5 text-[#A8FF3A]" />
              Message
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-5 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#3E4452]" />
          <p className="text-sm text-[#545B6A]">No trainer linked yet. Ask your trainer to send you an invite link.</p>
        </div>
      )}

      {/* Today's session alert */}
      {todaySessions.length > 0 && (
        <div className="bg-[#A8FF3A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-[#0A0B0E]" />
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0B0E] uppercase tracking-wide leading-none">
              Today — {todaySessions.length} session{todaySessions.length > 1 ? 's' : ''} scheduled
            </h2>
          </div>
          <div className="space-y-2">
            {todaySessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-[#0A0B0E]/15 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-[#0A0B0E]">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min
                  </p>
                  {s.notes && <p className="text-xs text-[#0A0B0E]/70">{s.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Package */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Package</p>
            <div className="h-8 w-8 rounded-lg bg-[#081525] flex items-center justify-center">
              <Package className="h-4 w-4 text-[#4D9EFF]" />
            </div>
          </div>
          {activePackage ? (
            <>
              <p className="font-semibold text-[#E8EAF0] text-base">{activePackage.packages?.name}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[#545B6A] mb-1.5">
                  <span>{activePackage.sessions_used} used</span>
                  <span>{activePackage.sessions_total} total</span>
                </div>
                <div className="h-1.5 bg-[#1E2229] rounded-full overflow-hidden">
                  <div className="h-full bg-[#A8FF3A] rounded-full" style={{ width: `${Math.min(sessionsProgress, 100)}%` }} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#545B6A]">No active package</p>
          )}
        </div>

        {/* Weight */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Current Weight</p>
            <div className="h-8 w-8 rounded-lg bg-[#0A2415] flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#22D17A]" />
            </div>
          </div>
          {latest?.weight_kg ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#E8EAF0]">{latest.weight_kg}</span>
              <span className="text-sm text-[#545B6A]">kg</span>
              {weightDiff !== null && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${weightDiff < 0 ? 'bg-[#0A2415] text-[#22D17A]' : 'bg-[#25090A] text-[#FF6B6B]'}`}>
                  {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#545B6A]">No entries yet</p>
          )}
        </div>

        {/* Goal */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Goal</p>
            <div className="h-8 w-8 rounded-lg bg-[#251B08] flex items-center justify-center">
              <Target className="h-4 w-4 text-[#F5A623]" />
            </div>
          </div>
          <p className="text-sm text-[#E8EAF0] leading-relaxed">{clientData?.goal ?? 'No goal set yet.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trainer notes */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2229]">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Trainer Notes</h2>
              <p className="text-xs text-[#545B6A] mt-0.5">Messages from your trainer</p>
            </div>
            <MessageSquare className="h-4 w-4 text-[#545B6A]" />
          </div>
          {trainerNotes.length > 0 ? (
            <div className="divide-y divide-[#1E2229]">
              {trainerNotes.map((n: { id: string; message: string; created_at: string }) => (
                <div key={n.id} className="px-6 py-4">
                  <p className="text-sm text-[#E8EAF0] leading-relaxed">{n.message}</p>
                  <p className="text-xs text-[#3E4452] mt-2">
                    {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-[#545B6A]">No notes yet from your trainer.</p>
            </div>
          )}
        </div>

        {/* Upcoming sessions */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2229]">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Upcoming Sessions</h2>
              <p className="text-xs text-[#545B6A] mt-0.5">Next scheduled sessions</p>
            </div>
            <Link href="/client/sessions" className="text-xs text-[#A8FF3A] hover:text-[#C8FF6A] font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingSessions.length > 0 ? (
            <div className="divide-y divide-[#1E2229]">
              {upcomingSessions.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="text-center bg-[#0A0B0E] border border-[#1E2229] rounded-lg px-3 py-2 min-w-[48px]">
                    <p className="text-[10px] font-bold text-[#545B6A] uppercase">
                      {new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-[family-name:var(--font-heading)] text-[#E8EAF0] leading-none">
                      {new Date(s.scheduled_at).getDate()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E8EAF0]">
                      {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-[#545B6A] mt-0.5">{s.duration_minutes}min{s.notes && ` · ${s.notes}`}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-[#545B6A]">No upcoming sessions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Active plan banner */}
      {activePlan && (
        <Link href="/client/plan">
          <div className="bg-[#131519] rounded-xl border border-[#1E2229] p-5 hover:border-[#A8FF3A]/30 transition-all cursor-pointer flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#0F2010] flex items-center justify-center flex-shrink-0">
              <Dumbbell className="h-5 w-5 text-[#A8FF3A]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider mb-0.5">Active Plan</p>
              <p className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] uppercase tracking-wide leading-none">{activePlan.name}</p>
              {activePlan.goal && <p className="text-xs text-[#A8FF3A] mt-1">{activePlan.goal}</p>}
            </div>
            <ArrowRight className="h-4 w-4 text-[#545B6A]" />
          </div>
        </Link>
      )}

      {/* Motivational banner */}
      <div className="bg-[#A8FF3A] rounded-2xl p-8 flex items-center justify-between">
        <div>
          <Zap className="h-8 w-8 text-[#0A0B0E] mb-3" />
          <h2 className="font-[family-name:var(--font-heading)] text-4xl text-[#0A0B0E] uppercase leading-none tracking-tight">Own the week.</h2>
          <p className="text-[#0A0B0E]/70 text-sm mt-2 max-w-sm">Stay consistent, trust the process, and let the data prove your progress.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/client/checkins">
            <button className="px-5 py-2.5 bg-[#0A0B0E] text-[#E8EAF0] text-sm font-semibold rounded-lg hover:bg-[#131519] transition-colors">
              Log Check-in
            </button>
          </Link>
          <Link href="/client/plan">
            <button className="px-5 py-2.5 bg-[#0A0B0E]/15 text-[#0A0B0E] text-sm font-semibold rounded-lg border border-[#0A0B0E]/20 hover:bg-[#0A0B0E]/25 transition-colors">
              View Plan
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
