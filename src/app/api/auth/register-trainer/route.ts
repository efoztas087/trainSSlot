import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create user with email_confirm: true — skips all email sending
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'trainer', name },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Insert trainer profile
  const { error: profileError } = await admin
    .from('trainers')
    .insert({ id: data.user.id, name })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ userId: data.user.id })
}
