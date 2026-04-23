import { createClient } from '@/lib/supabase/server'
import { CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function ClientSessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('client_id', user!.id)
    .order('scheduled_at', { ascending: false })

  const now = new Date()
  const upcoming = sessions?.filter(s => new Date(s.scheduled_at) >= now && s.status === 'scheduled') ?? []
  const past = sessions?.filter(s => new Date(s.scheduled_at) < now || s.status !== 'scheduled') ?? []

  const completed = sessions?.filter(s => s.status === 'completed').length ?? 0
  const scheduled = sessions?.filter(s => s.status === 'scheduled').length ?? 0

  const statusStyle: Record<string, string> = {
    scheduled: 'bg-[#081525] text-[#4D9EFF] border border-[#0D2035]',
    completed: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]',
    cancelled: 'bg-[#25090A] text-[#FF6B6B] border border-[#3D1010]',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">Sessions</h1>
        <p className="text-[#545B6A] text-sm mt-2">Your upcoming and past training sessions.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: sessions?.length ?? 0, icon: CalendarDays, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]' },
          { label: 'Completed', value: completed, icon: CheckCircle, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]' },
          { label: 'Upcoming', value: scheduled, icon: Clock, iconBg: 'bg-[#251B08]', iconColor: 'text-[#F5A623]' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#131519] rounded-xl border border-[#1E2229] p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">{stat.label}</p>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#E8EAF0]">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {upcoming.length > 0 && (
        <div className="bg-[#A8FF3A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-[#0A0B0E]" />
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0B0E] uppercase tracking-wide leading-none">
              Upcoming — {upcoming.length} session{upcoming.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="space-y-2">
            {upcoming.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-[#0A0B0E]/15 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#0A0B0E]">
                    {new Date(s.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-[#0A0B0E]/70 mt-0.5">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min
                    {s.notes && ` · ${s.notes}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Past Sessions</h2>
          </div>
          <div className="divide-y divide-[#1E2229]">
            {past.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
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
            ))}
          </div>
        </div>
      )}

      {(!sessions || sessions.length === 0) && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <CalendarDays className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No sessions scheduled yet.</p>
          <p className="text-[#3E4452] text-xs mt-1">Your trainer will schedule sessions for you.</p>
        </div>
      )}
    </div>
  )
}
