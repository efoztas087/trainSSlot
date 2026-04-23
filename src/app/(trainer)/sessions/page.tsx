import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, CheckCircle, XCircle, CalendarDays } from 'lucide-react'
import { AddSessionForm } from '@/components/trainer/AddSessionForm'
import { CompleteSessionButton } from '@/components/trainer/CompleteSessionButton'

type Session = {
  id: string
  scheduled_at: string
  duration_minutes: number
  notes: string | null
  status: string
  clients: { id: string; name: string } | null
}

const statusStyle: Record<string, string> = {
  scheduled: 'bg-[#081525] text-[#4D9EFF] border border-[#0D2035]',
  completed: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]',
  cancelled: 'bg-[#25090A] text-[#FF6B6B] border border-[#3D1010]',
}

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const [sessionsResult, clientsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, clients(id, name)')
      .eq('trainer_id', user!.id)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('clients')
      .select('id, name')
      .eq('trainer_id', user!.id)
      .neq('status', 'inactive'),
  ])
  const sessions = sessionsResult.data as Session[] | null
  const clients = clientsResult.data

  const todaySessions = sessions?.filter(s => {
    const d = new Date(s.scheduled_at)
    return d >= today && d <= todayEnd && s.status === 'scheduled'
  }) ?? []

  const upcoming = sessions?.filter(s => {
    const d = new Date(s.scheduled_at)
    return d > todayEnd && s.status === 'scheduled'
  }) ?? []

  const past = sessions?.filter(s => {
    const d = new Date(s.scheduled_at)
    return d < today || s.status !== 'scheduled'
  }) ?? []

  const total = sessions?.length ?? 0
  const scheduled = sessions?.filter(s => s.status === 'scheduled').length ?? 0
  const completed = sessions?.filter(s => s.status === 'completed').length ?? 0
  const cancelled = sessions?.filter(s => s.status === 'cancelled').length ?? 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          Sessions
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">Schedule and track every client session.</p>
      </div>

      {/* Schedule form + stats side by side */}
      <div className="flex gap-6 items-start">
        <div className="flex-shrink-0">
          <AddSessionForm trainerId={user!.id} clients={clients ?? []} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: total, icon: CalendarDays, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]' },
          { label: 'Upcoming', value: scheduled, icon: Calendar, iconBg: 'bg-[#251B08]', iconColor: 'text-[#F5A623]' },
          { label: 'Completed', value: completed, icon: CheckCircle, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]' },
          { label: 'Cancelled', value: cancelled, icon: XCircle, iconBg: 'bg-[#25090A]', iconColor: 'text-[#FF6B6B]' },
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

      {/* Today's sessions alert */}
      {todaySessions.length > 0 && (
        <div className="bg-[#A8FF3A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-[#0A0B0E]" />
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0B0E] uppercase tracking-wide leading-none">
              Today — {todaySessions.length} session{todaySessions.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="space-y-2">
            {todaySessions.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-[#0A0B0E]/15 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#0A0B0E]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0A0B0E]">{s.clients?.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A0B0E]">{s.clients?.name}</p>
                    <p className="text-xs text-[#0A0B0E]/70">
                      {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min
                    </p>
                  </div>
                </div>
                <CompleteSessionButton sessionId={s.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Upcoming</h2>
            <p className="text-xs text-[#545B6A] mt-0.5">{upcoming.length} scheduled</p>
          </div>
          <div className="divide-y divide-[#1E2229]">
            {upcoming.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#171A1F] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-[#131519] border border-[#1E2229] rounded-lg px-3 py-2 min-w-[52px]">
                    <p className="text-[10px] font-bold text-[#545B6A] uppercase">
                      {new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-[family-name:var(--font-heading)] text-[#E8EAF0] leading-none">
                      {new Date(s.scheduled_at).getDate()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#E8EAF0]">{s.clients?.name}</p>
                    <p className="text-xs text-[#545B6A] mt-0.5">
                      {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min
                      {s.notes && ` · ${s.notes}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[s.status]}`}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                  <CompleteSessionButton sessionId={s.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past sessions */}
      {past.length > 0 && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Past Sessions</h2>
            <p className="text-xs text-[#545B6A] mt-0.5">{past.length} entries</p>
          </div>
          <div className="divide-y divide-[#1E2229]">
            {past.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#E8EAF0]">{s.clients?.name}</p>
                    <p className="text-xs text-[#545B6A] mt-0.5">
                      {new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.duration_minutes}min
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle[s.status]}`}>
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!sessions || sessions.length === 0) && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <Calendar className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No sessions yet.</p>
          <p className="text-[#3E4452] text-xs mt-1">Schedule your first session above.</p>
        </div>
      )}
    </div>
  )
}
