import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  // Find trainer by join code (case-insensitive)
  const { data: trainer } = await admin
    .from('trainers')
    .select('id, name')
    .eq('join_code', code.toUpperCase().trim())
    .single()

  if (!trainer) return NextResponse.json({ error: 'Invalid code. Please check with your trainer.' }, { status: 404 })

  // Check client isn't already linked
  const { data: client } = await admin.from('clients').select('trainer_id').eq('id', user.id).single()
  if (client?.trainer_id) return NextResponse.json({ error: 'Your account is already linked to a trainer.' }, { status: 409 })

  // Link the client to the trainer
  const { error } = await admin.from('clients').update({ trainer_id: trainer.id }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ trainerName: trainer.name })
}
