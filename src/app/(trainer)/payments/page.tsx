import { createClient } from '@/lib/supabase/server'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { MonthlyRevenueChart } from '@/components/charts/MonthlyRevenueChart'
import { AssignPackageForm } from '@/components/trainer/AssignPackageForm'

const statusMap: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]' },
  pending: { label: 'Pending', className: 'bg-[#251B08] text-[#F5A623] border border-[#352508]' },
  failed: { label: 'Failed', className: 'bg-[#25090A] text-[#FF6B6B] border border-[#3D1010]' },
  expired: { label: 'Expired', className: 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]' },
  refunded: { label: 'Refunded', className: 'bg-[#081525] text-[#4D9EFF] border border-[#0D2035]' },
}

function buildChartData(payments: Array<{ amount_cents: number; status: string; paid_at: string | null; created_at: string }>) {
  const now = new Date()
  const days: Record<string, { revenue: number; count: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    days[key] = { revenue: 0, count: 0 }
  }
  for (const p of payments) {
    if (p.status !== 'paid') continue
    const d = new Date(p.paid_at ?? p.created_at)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (days[key]) { days[key].revenue += p.amount_cents; days[key].count += 1 }
  }
  return Object.entries(days).map(([date, v]) => ({ date, ...v }))
}

function buildMonthlyData(payments: Array<{ amount_cents: number; status: string; paid_at: string | null; created_at: string }>) {
  const months: Record<string, { revenue: number; count: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    months[key] = { revenue: 0, count: 0 }
  }
  for (const p of payments) {
    if (p.status !== 'paid') continue
    const d = new Date(p.paid_at ?? p.created_at)
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (months[key]) { months[key].revenue += p.amount_cents; months[key].count += 1 }
  }
  return Object.entries(months).map(([month, v]) => ({ month, ...v }))
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clientRows } = await supabase
    .from('clients')
    .select('id, name')
    .eq('trainer_id', user!.id)

  const clientIds = clientRows?.map(c => c.id) ?? []

  const [paymentsRes, packagesRes, clientPackagesRes] = await Promise.all([
    supabase
      .from('payments')
      .select('*, clients(name), packages(name)')
      .in('client_id', clientIds.length > 0 ? clientIds : [''])
      .order('created_at', { ascending: false }),
    supabase
      .from('packages')
      .select('id, name, sessions_total')
      .eq('trainer_id', user!.id)
      .eq('is_active', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('client_packages') as any)
      .select('*, clients(name), packages(name)')
      .eq('trainer_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const payments = paymentsRes.data as Array<{
    id: string; amount_cents: number; status: string; created_at: string
    paid_at: string | null; clients: { name: string } | null; packages: { name: string } | null
  }> | null

  const clientPackages = clientPackagesRes.data as Array<{
    id: string; sessions_used: number; sessions_total: number; start_date: string
    clients: { name: string } | null; packages: { name: string } | null
  }> | null

  const totalRevenue = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount_cents, 0) ?? 0
  const outstanding = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount_cents, 0) ?? 0
  const paidCount = payments?.filter(p => p.status === 'paid').length ?? 0
  const pendingCount = payments?.filter(p => p.status === 'pending').length ?? 0

  const chartData = buildChartData(payments ?? [])
  const monthlyData = buildMonthlyData(payments ?? [])
  const chartHasData = chartData.some(d => d.revenue > 0)
  const monthlyHasData = monthlyData.some(d => d.revenue > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">Payments</h1>
        <p className="text-[#545B6A] text-sm mt-2">Track every transaction and keep your cashflow strong.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `€${(totalRevenue / 100).toFixed(2)}`, icon: CreditCard, iconBg: 'bg-[#0F2010]', iconColor: 'text-[#A8FF3A]', sub: `${paidCount} payments` },
          { label: 'Outstanding', value: `€${(outstanding / 100).toFixed(2)}`, icon: AlertCircle, iconBg: 'bg-[#251B08]', iconColor: 'text-[#F5A623]', sub: `${pendingCount} pending` },
          { label: 'Paid in Full', value: paidCount, icon: CheckCircle, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]', sub: 'Completed' },
          { label: 'Total Entries', value: payments?.length ?? 0, icon: TrendingUp, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]', sub: 'All time' },
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

      {/* Charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-day trading view chart */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#1E2229]">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Last 30 Days</h2>
              <p className="text-xs text-[#545B6A] mt-0.5">Area = revenue · Bars = volume</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#545B6A]">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#A8FF3A]" />Revenue</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#4D9EFF]" />Volume</div>
            </div>
          </div>
          <div className="px-4 py-4">
            {chartHasData ? <RevenueChart data={chartData} /> : (
              <div className="h-48 flex flex-col items-center justify-center">
                <TrendingUp className="h-8 w-8 text-[#1E2229] mb-2" />
                <p className="text-[#545B6A] text-sm">No data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Monthly Revenue</h2>
            <p className="text-xs text-[#545B6A] mt-0.5">Last 12 months · Highest month highlighted</p>
          </div>
          <div className="px-4 py-4">
            {monthlyHasData ? <MonthlyRevenueChart data={monthlyData} /> : (
              <div className="h-48 flex flex-col items-center justify-center">
                <TrendingUp className="h-8 w-8 text-[#1E2229] mb-2" />
                <p className="text-[#545B6A] text-sm">No data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package session tracker */}
      <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2229]">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Package Assignments</h2>
            <p className="text-xs text-[#545B6A] mt-0.5">Track sessions used per client package</p>
          </div>
          <AssignPackageForm
            trainerId={user!.id}
            clients={clientRows?.map(c => ({ id: c.id, name: c.name })) ?? []}
            packages={packagesRes.data ?? []}
          />
        </div>
        {clientPackages && clientPackages.length > 0 ? (
          <div className="divide-y divide-[#1E2229]">
            {clientPackages.map(cp => {
              const pct = cp.sessions_total > 0 ? Math.round((cp.sessions_used / cp.sessions_total) * 100) : 0
              const barColor = pct >= 80 ? '#FF6B6B' : pct >= 50 ? '#F5A623' : '#A8FF3A'
              return (
                <div key={cp.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#0A2415] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#22D17A]">{cp.clients?.name?.charAt(0).toUpperCase() ?? '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E8EAF0]">{cp.clients?.name ?? '—'}</p>
                        <p className="text-xs text-[#545B6A]">{cp.packages?.name ?? '—'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: barColor }}>
                      {cp.sessions_used} / {cp.sessions_total} sessions
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1E2229] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-[#545B6A] text-sm">No package assignments yet.</p>
          </div>
        )}
      </div>

      {/* Payment records */}
      {payments && payments.length > 0 ? (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Payment Records</h2>
            <p className="text-xs text-[#545B6A] mt-0.5">{payments.length} entries</p>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-[#1E2229]">
            {payments.map((p) => {
              const s = statusMap[p.status] ?? { label: p.status, className: 'bg-[#16181E] text-[#545B6A]' }
              return (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#0A2415] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#22D17A]">{p.clients?.name?.charAt(0).toUpperCase() ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#E8EAF0] truncate">{p.clients?.name ?? '—'}</p>
                    <p className="text-xs text-[#545B6A]">{p.packages?.name ?? '—'} · {new Date(p.paid_at ?? p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-[#E8EAF0]">€{(p.amount_cents / 100).toFixed(2)}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.className}`}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2229]">
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Package</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2229]">
                {payments.map((p) => {
                  const s = statusMap[p.status] ?? { label: p.status, className: 'bg-[#16181E] text-[#545B6A]' }
                  return (
                    <tr key={p.id} className="hover:bg-[#171A1F] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#0A2415] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#22D17A]">{p.clients?.name?.charAt(0).toUpperCase() ?? '?'}</span>
                          </div>
                          <span className="text-sm font-medium text-[#E8EAF0]">{p.clients?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#545B6A]">{p.packages?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#E8EAF0]">€{(p.amount_cents / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#3E4452]">
                        {new Date(p.paid_at ?? p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-16 text-center">
          <p className="text-[#545B6A] text-sm">No payments yet.</p>
        </div>
      )}
    </div>
  )
}
