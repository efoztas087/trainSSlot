import Link from 'next/link'
import { Users, TrendingUp, AlertCircle, CreditCard, ArrowRight, Zap, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Session = { id: string; scheduled_at: string; duration_minutes: number; clients: { name: string } | null }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const [{ count: totalClients }, { count: activeClients }, { count: needsAttention }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('trainer_id', user!.id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('trainer_id', user!.id).eq('status', 'active'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('trainer_id', user!.id).eq('status', 'needs_attention'),
  ])

  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('id, scheduled_at, duration_minutes, clients(name)')
    .eq('trainer_id', user!.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', todayStart.toISOString())
    .lte('scheduled_at', todayEnd.toISOString())
    .order('scheduled_at', { ascending: true }) as { data: Session[] | null }

  type PaymentWithClient = { id: string; amount_cents: number; created_at: string; clients: { name: string } | null }
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount_cents, created_at, clients(name)')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(5) as { data: PaymentWithClient[] | null }

  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, name, status, joined_at')
    .eq('trainer_id', user!.id)
    .order('joined_at', { ascending: false })
    .limit(4)

  const totalRevenue = recentPayments?.reduce((sum, p) => sum + p.amount_cents, 0) ?? 0

  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  const trainerName = (user?.user_metadata?.name ?? 'Trainer').split(' ')[0].toUpperCase()

  const statusStyles: Record<string, string> = {
    active: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]',
    inactive: 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]',
    needs_attention: 'bg-[#251B08] text-[#F5A623] border border-[#352508]',
  }
  const statusLabels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    needs_attention: 'Needs attention',
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-1">
            {dayName} · {dateStr}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
            Welcome back, {trainerName}
          </h1>
          <p className="text-[#545B6A] text-sm mt-2">Here's how your training business is performing today.</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link href="/clients/new">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E2229] text-[#E8EAF0] text-sm font-medium hover:bg-[#171A1F] transition-colors">
              <Users className="h-4 w-4" /> Add Client
            </button>
          </Link>
          <Link href="/payments">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold hover:bg-[#C8FF6A] transition-colors">
              <CreditCard className="h-4 w-4" /> Record Payment
            </button>
          </Link>
        </div>
      </div>

      {/* Today's sessions alert */}
      {todaySessions && todaySessions.length > 0 && (
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
                <div className="h-7 w-7 rounded-full bg-[#0A0B0E]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#0A0B0E]">{s.clients?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0A0B0E]">{s.clients?.name}</p>
                  <p className="text-xs text-[#0A0B0E]/70">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes}min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Active Clients',
            value: activeClients ?? 0,
            icon: Users,
            iconBg: 'bg-[#081525]',
            iconColor: 'text-[#4D9EFF]',
            sub: `${totalClients ?? 0} total`,
          },
          {
            label: 'Needs Attention',
            value: needsAttention ?? 0,
            icon: AlertCircle,
            iconBg: 'bg-[#251B08]',
            iconColor: 'text-[#F5A623]',
            sub: needsAttention ? 'Follow up soon' : 'All good',
          },
          {
            label: 'Revenue Collected',
            value: `€${(totalRevenue / 100).toFixed(0)}`,
            icon: CreditCard,
            iconBg: 'bg-[#0F2010]',
            iconColor: 'text-[#A8FF3A]',
            sub: 'Recent payments',
          },
          {
            label: 'Total Clients',
            value: totalClients ?? 0,
            icon: TrendingUp,
            iconBg: 'bg-[#0A2415]',
            iconColor: 'text-[#22D17A]',
            sub: 'All time',
          },
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
              <p className="text-xs text-[#545B6A] mt-1">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent clients */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2229]">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Recent Clients</h2>
              <p className="text-xs text-[#545B6A] mt-0.5">Latest additions to your roster</p>
            </div>
            <Link href="/clients" className="text-xs text-[#A8FF3A] hover:text-[#C8FF6A] font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentClients && recentClients.length > 0 ? (
            <div className="divide-y divide-[#1E2229]">
              {recentClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#171A1F] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#0F2010] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#A8FF3A]">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#E8EAF0]">{client.name}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[client.status] ?? 'bg-[#16181E] text-[#545B6A]'}`}>
                    {statusLabels[client.status] ?? client.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#545B6A]">No clients yet.</p>
              <Link href="/clients/new" className="text-sm text-[#A8FF3A] hover:underline font-medium mt-1 inline-block">Add your first client</Link>
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2229]">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Recent Payments</h2>
              <p className="text-xs text-[#545B6A] mt-0.5">Latest 5 payment entries</p>
            </div>
            <Link href="/payments" className="text-xs text-[#A8FF3A] hover:text-[#C8FF6A] font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentPayments && recentPayments.length > 0 ? (
            <div className="divide-y divide-[#1E2229]">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#0A2415] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#22D17A]">
                        {p.clients?.name?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#E8EAF0]">{p.clients?.name ?? '—'}</p>
                      <p className="text-xs text-[#545B6A]">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#22D17A]">+€{(p.amount_cents / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#545B6A]">No payments yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Own the week banner */}
      <div className="bg-[#A8FF3A] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Zap className="h-8 w-8 text-[#0A0B0E] mb-3" />
            <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[#0A0B0E] uppercase leading-none tracking-tight">Own the week.</h2>
            <p className="text-[#0A0B0E]/70 text-sm mt-2 max-w-sm">
              Stay consistent, track every client, and let the data prove your impact.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/clients">
              <button className="px-5 py-2.5 bg-[#0A0B0E] text-[#E8EAF0] text-sm font-semibold rounded-lg hover:bg-[#131519] transition-colors">
                View Clients
              </button>
            </Link>
            <Link href="/packages">
              <button className="px-5 py-2.5 bg-[#0A0B0E]/15 text-[#0A0B0E] text-sm font-semibold rounded-lg border border-[#0A0B0E]/20 hover:bg-[#0A0B0E]/25 transition-colors">
                Packages
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
