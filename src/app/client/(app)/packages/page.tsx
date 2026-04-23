import { createClient } from '@/lib/supabase/server'
import { Package, CheckCircle, Clock } from 'lucide-react'

export default async function ClientPackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clientPackages } = await supabase
    .from('client_packages')
    .select('*, packages(name, description, sessions_total, duration_weeks)')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  const active = clientPackages?.filter(p => p.is_active) ?? []
  const past = clientPackages?.filter(p => !p.is_active) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          Packages
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">Your active and past training packages.</p>
      </div>

      {active.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-widest">Active</p>
          {active.map(cp => {
            const pct = cp.sessions_total > 0 ? Math.round((cp.sessions_used / cp.sessions_total) * 100) : 0
            const barColor = pct >= 80 ? '#FF6B6B' : pct >= 50 ? '#F5A623' : '#A8FF3A'
            const remaining = cp.sessions_total - cp.sessions_used
            return (
              <div key={cp.id} className="bg-[#131519] rounded-xl border border-[#1E2229] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-[#A8FF3A]" />
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] uppercase tracking-wide leading-none">
                        {cp.packages?.name ?? 'Package'}
                      </h3>
                      {cp.packages?.description && (
                        <p className="text-xs text-[#545B6A] mt-1">{cp.packages.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A2415] text-[#22D17A] border border-[#0F3020]">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-[#0A0B0E] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#A8FF3A]">{remaining}</p>
                    <p className="text-xs text-[#545B6A] mt-0.5">Sessions left</p>
                  </div>
                  <div className="bg-[#0A0B0E] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#E8EAF0]">{cp.sessions_used}</p>
                    <p className="text-xs text-[#545B6A] mt-0.5">Used</p>
                  </div>
                  <div className="bg-[#0A0B0E] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#E8EAF0]">{cp.sessions_total}</p>
                    <p className="text-xs text-[#545B6A] mt-0.5">Total</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#545B6A] mb-2">
                    <span>{pct}% used</span>
                    <span>Started {new Date(cp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="h-2 bg-[#1E2229] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#545B6A] uppercase tracking-widest">Past Packages</p>
          {past.map(cp => (
            <div key={cp.id} className="bg-[#131519] rounded-xl border border-[#1E2229] p-5 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#16181E] flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-[#545B6A]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#E8EAF0]">{cp.packages?.name ?? 'Package'}</p>
                    <p className="text-xs text-[#545B6A]">{cp.sessions_used} / {cp.sessions_total} sessions used</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#16181E] text-[#545B6A] border border-[#1E2229]">Inactive</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(!clientPackages || clientPackages.length === 0) && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <Clock className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No packages assigned yet.</p>
          <p className="text-[#3E4452] text-xs mt-1">Your trainer will assign a package to you.</p>
        </div>
      )}
    </div>
  )
}
