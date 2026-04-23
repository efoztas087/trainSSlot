import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClientProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('*, trainers(name)')
    .eq('id', user!.id)
    .single() as {
      data: {
        name: string
        phone: string | null
        goal: string | null
        status: string
        joined_at: string
        trainers: { name: string } | null
      } | null
    }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-[#E8EAF0]">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Name" value={client?.name ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Phone" value={client?.phone ?? '—'} />
          <Row label="Trainer" value={client?.trainers?.name ?? '—'} />
          <Row label="Goal" value={client?.goal ?? '—'} />
          <Row
            label="Member since"
            value={client ? new Date(client.joined_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[#1E2229] last:border-0">
      <span className="text-sm text-[#545B6A]">{label}</span>
      <span className="text-sm font-medium text-[#E8EAF0]">{value}</span>
    </div>
  )
}
