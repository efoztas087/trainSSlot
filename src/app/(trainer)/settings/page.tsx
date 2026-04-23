import { createClient } from '@/lib/supabase/server'
import { TrainerSettingsForm } from '@/components/trainer/TrainerSettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select('name, bio, specialties, years_experience, location, studio_name, phone, website, instagram, certification, avatar_url, join_code')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-5xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          Settings
        </h1>
        <p className="text-[#545B6A] text-sm mt-2">Manage your trainer profile and account.</p>
      </div>
      <TrainerSettingsForm
        trainerId={user!.id}
        email={user!.email ?? ''}
        defaultValues={{
          name: trainer?.name ?? '',
          bio: trainer?.bio ?? '',
          specialties: trainer?.specialties ?? [],
          years_experience: trainer?.years_experience ?? null,
          location: trainer?.location ?? '',
          studio_name: trainer?.studio_name ?? '',
          phone: trainer?.phone ?? '',
          website: trainer?.website ?? '',
          instagram: trainer?.instagram ?? '',
          certification: trainer?.certification ?? '',
          avatar_url: trainer?.avatar_url ?? null,
          join_code: trainer?.join_code ?? null,
        }}
      />
    </div>
  )
}
