import { createClient } from '@/lib/supabase/server'
import { Package, CheckCircle, XCircle } from 'lucide-react'
import { NewPackageForm } from '@/components/trainer/NewPackageForm'
import { TogglePackageButton } from '@/components/trainer/TogglePackageButton'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('trainer_id', user!.id)
    .order('is_active', { ascending: false })

  const total = packages?.length ?? 0
  const active = packages?.filter(p => p.is_active).length ?? 0
  const inactive = total - active

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          Packages
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">Create and manage your coaching packages.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Packages', value: total, icon: Package, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]' },
          { label: 'Active', value: active, icon: CheckCircle, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]' },
          { label: 'Inactive', value: inactive, icon: XCircle, iconBg: 'bg-[#16181E]', iconColor: 'text-[#545B6A]' },
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

      <NewPackageForm trainerId={user!.id} />

      {packages && packages.length > 0 && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Package Overview</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2229]">
                <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Package</th>
                <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Sessions</th>
                <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Duration</th>
                <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2229]">
              {packages.map((pkg) => (
                <tr key={pkg.id} className={`hover:bg-[#171A1F] transition-colors ${!pkg.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#E8EAF0]">{pkg.name}</p>
                    {pkg.description && <p className="text-xs text-[#545B6A] mt-0.5 max-w-xs truncate">{pkg.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#E8EAF0]">€{(pkg.price_cents / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-[#545B6A]">{pkg.sessions_total}</td>
                  <td className="px-6 py-4 text-sm text-[#545B6A]">{pkg.duration_weeks}w</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.is_active ? 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]' : 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]'}`}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <TogglePackageButton packageId={pkg.id} isActive={pkg.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!packages || packages.length === 0) && (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-16 text-center">
          <p className="text-[#545B6A] text-sm">No packages yet. Create your first one above.</p>
        </div>
      )}
    </div>
  )
}
