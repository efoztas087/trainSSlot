import { createClient } from '@/lib/supabase/server'
import { TrendingDown, TrendingUp, Minus, Scale, Calendar } from 'lucide-react'

export default async function ClientProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('client_id', user!.id)
    .order('date', { ascending: false })

  const latest = entries?.[0] ?? null
  const first = entries?.[entries.length - 1] ?? null
  const totalChange = latest?.weight_kg && first?.weight_kg
    ? latest.weight_kg - first.weight_kg
    : null
  const lastUpdateDays = latest
    ? Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          My Progress
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">Track every rep, every pound, every win. Own your journey.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: entries?.length ?? 0, icon: Scale, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]', sub: 'Logged entries' },
          { label: 'Current Weight', value: latest?.weight_kg ? `${latest.weight_kg} kg` : '—', icon: TrendingUp, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]', sub: 'Latest measurement' },
          {
            label: 'Total Change',
            value: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg` : '—',
            icon: totalChange !== null && totalChange < 0 ? TrendingDown : TrendingUp,
            iconBg: totalChange !== null && totalChange < 0 ? 'bg-[#0A2415]' : 'bg-[#251B08]',
            iconColor: totalChange !== null && totalChange < 0 ? 'text-[#22D17A]' : 'text-[#F5A623]',
            sub: 'Since first entry',
          },
          { label: 'Last Update', value: lastUpdateDays !== null ? `${lastUpdateDays}d ago` : '—', icon: Calendar, iconBg: 'bg-[#16181E]', iconColor: 'text-[#545B6A]', sub: 'Since last log' },
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
              <p className={`text-3xl font-bold ${stat.label === 'Total Change' && totalChange !== null && totalChange < 0 ? 'text-[#22D17A]' : stat.label === 'Total Change' && totalChange !== null && totalChange > 0 ? 'text-[#F5A623]' : 'text-[#E8EAF0]'}`}>{stat.value}</p>
              <p className="text-xs text-[#545B6A] mt-1">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Progress history */}
      {entries && entries.length > 0 ? (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Progress History</h2>
            <p className="text-xs text-[#545B6A] mt-0.5">{entries.length} entries</p>
          </div>
          <div className="divide-y divide-[#1E2229]">
            {entries.map((entry, index) => {
              const prev = entries[index + 1]
              const weightDiff = entry.weight_kg && prev?.weight_kg
                ? entry.weight_kg - prev.weight_kg
                : null

              return (
                <div key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-[#171A1F] transition-colors">
                  <div className="flex-shrink-0 text-center bg-[#A8FF3A] rounded-lg px-3 py-2 min-w-[52px]">
                    <p className="text-[10px] font-bold text-[#0A0B0E] uppercase">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-[family-name:var(--font-heading)] text-[#0A0B0E] leading-none">
                      {new Date(entry.date).getDate()}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      {entry.weight_kg && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-[#E8EAF0]">{entry.weight_kg}</span>
                          <span className="text-sm text-[#545B6A]">kg</span>
                          {weightDiff !== null && (
                            <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${weightDiff < 0 ? 'bg-[#0A2415] text-[#22D17A]' : weightDiff > 0 ? 'bg-[#25090A] text-[#FF6B6B]' : 'bg-[#16181E] text-[#545B6A]'}`}>
                              {weightDiff < 0 ? <TrendingDown className="h-3 w-3" /> : weightDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}
                            </span>
                          )}
                        </div>
                      )}
                      {entry.body_fat_pct && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-semibold text-[#E8EAF0]">{entry.body_fat_pct}%</span>
                          <span className="text-xs text-[#545B6A]">body fat</span>
                        </div>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-[#545B6A] mt-2 leading-relaxed">{entry.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <p className="text-[#545B6A] text-sm">No progress entries yet.</p>
          <p className="text-[#3E4452] text-xs mt-1">Your trainer will add entries after each session.</p>
        </div>
      )}
    </div>
  )
}
