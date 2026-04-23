import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { name, email, password, phone, goal, trainerId } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Resolve trainerId: if not provided, get from session (self-registration flow)
  let resolvedTrainerId = trainerId
  if (!resolvedTrainerId) {
    // Self-registration — no trainer assigned yet, we'll link later
    // For now just create the auth user without a clients row
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', name },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Always create a clients row; trainer_id may be null until they link later
  const { error: profileError } = await admin.from('clients').insert({
    id: data.user.id,
    trainer_id: resolvedTrainerId || null,
    name,
    phone: phone || null,
    goal: goal || null,
    status: 'active',
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ userId: data.user.id })
}
