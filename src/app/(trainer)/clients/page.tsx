import Link from 'next/link'
import { Plus, Users, UserCheck, AlertCircle, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CopyInviteLink } from '@/components/trainer/CopyInviteLink'

const statusConfig = {
  active: { label: 'Active', className: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]' },
  inactive: { label: 'Inactive', className: 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]' },
  needs_attention: { label: 'Needs attention', className: 'bg-[#251B08] text-[#F5A623] border border-[#352508]' },
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, status, goal, joined_at')
    .eq('trainer_id', user!.id)
    .order('joined_at', { ascending: false })

  const total = clients?.length ?? 0
  const active = clients?.filter(c => c.status === 'active').length ?? 0
  const attention = clients?.filter(c => c.status === 'needs_attention').length ?? 0
  const inactive = clients?.filter(c => c.status === 'inactive').length ?? 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
            Your Clients
          </h1>
          <p className="text-[#545B6A] text-sm mt-2">Manage your roster. Track every athlete. Own your business.</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <CopyInviteLink trainerId={user!.id} />
          <Link href="/clients/new">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold hover:bg-[#C8FF6A] transition-colors">
              <Plus className="h-4 w-4" /> Add New Client
            </button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Clients', value: total, icon: Users, iconBg: 'bg-[#081525]', iconColor: 'text-[#4D9EFF]' },
          { label: 'Active', value: active, icon: UserCheck, iconBg: 'bg-[#0A2415]', iconColor: 'text-[#22D17A]' },
          { label: 'Needs Attention', value: attention, icon: AlertCircle, iconBg: 'bg-[#251B08]', iconColor: 'text-[#F5A623]' },
          { label: 'Inactive', value: inactive, icon: UserX, iconBg: 'bg-[#16181E]', iconColor: 'text-[#545B6A]' },
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

      {/* Table */}
      {clients && clients.length > 0 ? (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2229]">
            <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#E8EAF0] uppercase tracking-wide leading-none">Client Roster</h2>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-[#1E2229]">
            {clients.map((client) => {
              const status = statusConfig[client.status as keyof typeof statusConfig]
              return (
                <Link key={client.id} href={`/clients/${client.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#171A1F] transition-colors">
                  <div className="h-10 w-10 rounded-full bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#A8FF3A]">{client.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#E8EAF0] text-sm">{client.name}</p>
                    <p className="text-xs text-[#545B6A] truncate mt-0.5">{client.goal ?? 'No goal set'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status?.className ?? 'bg-[#16181E] text-[#545B6A]'}`}>
                    {status?.label ?? client.status}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2229]">
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Goal</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Start Date</th>
                  <th className="text-left text-xs font-semibold text-[#545B6A] uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2229]">
                {clients.map((client) => {
                  const status = statusConfig[client.status as keyof typeof statusConfig]
                  return (
                    <tr key={client.id} className="hover:bg-[#171A1F] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#A8FF3A]">{client.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <p className="font-semibold text-[#E8EAF0] text-sm">{client.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status?.className ?? 'bg-[#16181E] text-[#545B6A]'}`}>
                          {status?.label ?? client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#545B6A] max-w-xs truncate">{client.goal ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-[#3E4452]">
                        {new Date(client.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/clients/${client.id}`} className="text-xs font-semibold text-[#A8FF3A] hover:text-[#C8FF6A] transition-colors border border-[#A8FF3A]/30 px-3 py-1.5 rounded-lg hover:bg-[#A8FF3A]/10">
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#131519] rounded-xl border border-[#1E2229] py-20 text-center">
          <Users className="h-10 w-10 text-[#1E2229] mx-auto mb-3" />
          <p className="text-[#545B6A] text-sm">No clients yet.</p>
          <Link href="/clients/new">
            <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E2229] text-[#E8EAF0] text-sm font-medium hover:bg-[#171A1F] transition-colors mx-auto">
              <Plus className="h-4 w-4" /> Add your first client
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
