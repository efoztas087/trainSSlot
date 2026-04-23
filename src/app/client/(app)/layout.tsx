import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientNav } from '@/components/client/ClientNav'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'client') {
    redirect('/client/login')
  }

  const { data: clientRow } = await (supabase as any)
    .from('clients')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0C0D10] flex">
      <ClientNav
        userName={user.user_metadata?.name ?? 'Client'}
        avatarUrl={clientRow?.avatar_url ?? null}
      />
      <main className="flex-1 ml-64 px-8 py-8 max-w-screen-xl">
        {children}
      </main>
    </div>
  )
}
