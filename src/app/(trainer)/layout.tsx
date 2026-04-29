import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainerNav } from '@/components/trainer/TrainerNav'

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'trainer') {
    redirect('/login')
  }

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0C0D10] flex">
      <TrainerNav
        userName={user.user_metadata?.name ?? 'Trainer'}
        avatarUrl={trainer?.avatar_url ?? null}
      />
      <main className="flex-1 lg:ml-64 px-4 py-6 sm:px-6 sm:py-8 max-w-screen-xl pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  )
}
