import { createClient } from '@/lib/supabase/server'

const statusMap: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]' },
  pending: { label: 'Pending', className: 'bg-[#251B08] text-[#F5A623] border border-[#352508]' },
  failed: { label: 'Failed', className: 'bg-[#25090A] text-[#FF6B6B] border border-[#3D1010]' },
  expired: { label: 'Expired', className: 'bg-[#16181E] text-[#545B6A] border border-[#1E2229]' },
  refunded: { label: 'Refunded', className: 'bg-[#081525] text-[#4D9EFF] border border-[#0D2035]' },
}

export default async function ClientPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, packages(name)')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string
        amount_cents: number
        status: string
        method: string
        created_at: string
        paid_at: string | null
        packages: { name: string } | null
      }> | null
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#E8EAF0]">Payment history</h1>
        <p className="text-[#545B6A] mt-1">{payments?.length ?? 0} transactions</p>
      </div>

      {payments && payments.length > 0 ? (
        <div className="bg-[#131519] rounded-2xl border border-[#1E2229] overflow-hidden">
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
              {payments.map((p) => {
                const s = statusMap[p.status] ?? { label: p.status, className: 'bg-[#16181E] text-[#545B6A]' }
                return (
                  <tr key={p.id} className="hover:bg-[#171A1F] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#E8EAF0]">{p.packages?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#E8EAF0]">€{(p.amount_cents / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#3E4452]">
                      {new Date(p.paid_at ?? p.created_at).toLocaleDateString('nl-NL')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#131519] rounded-2xl border border-[#1E2229] py-16 text-center">
          <p className="text-[#545B6A] text-sm">No payments yet.</p>
        </div>
      )}
    </div>
  )
}
