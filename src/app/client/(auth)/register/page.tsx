'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trainerId = searchParams.get('trainer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const res = await fetch('/api/auth/register-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, trainerId }),
    })

    const result = await res.json()
    if (!res.ok) { setError(result.error); setLoading(false); return }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) { setError(signInError.message); setLoading(false); return }

    router.push('/client/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0C0D10] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0A0B0E] border-r border-[#1E2229] px-12 py-10">
        <span className="font-[family-name:var(--font-heading)] text-2xl text-[#E8EAF0] tracking-widest uppercase">TrainSlot</span>
        <div>
          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-4">
            {trainerId ? 'You were invited' : 'Get started'}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-6xl text-[#E8EAF0] uppercase leading-none tracking-tight mb-6">
            Join your<br />training<br />program.
          </h2>
          <p className="text-[#545B6A] text-sm max-w-xs leading-relaxed">
            {trainerId
              ? 'Your trainer has invited you. Create your account to access your workout plan, sessions, and progress tracking.'
              : 'Create your client account to access your personalized workout plan, track progress and stay in sync with your trainer.'}
          </p>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl text-[#A8FF3A]">Free</p>
            <p className="text-xs text-[#545B6A] mt-0.5">Client access</p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl text-[#E8EAF0]">Instant</p>
            <p className="text-xs text-[#545B6A] mt-0.5">Setup</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-10">
        <div className="w-full max-w-sm mx-auto">
          <span className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] tracking-widest uppercase block mb-10 lg:hidden">TrainSlot</span>

          {trainerId && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-[#0A2415] border border-[#0F3020] text-sm text-[#22D17A]">
              You were invited by your trainer. Fill in your details below.
            </div>
          )}

          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-2">Client Portal</p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl text-[#E8EAF0] uppercase leading-none tracking-tight mb-1">Create account</h1>
          <p className="text-[#545B6A] text-sm mb-8">Sign up to access your training plan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Full name</label>
              <input name="name" placeholder="Jane Doe" required className="w-full border border-[#1E2229] rounded-xl px-4 py-3 text-sm bg-[#131519] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Email</label>
              <input name="email" type="email" placeholder="you@example.com" required className="w-full border border-[#1E2229] rounded-xl px-4 py-3 text-sm bg-[#131519] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Password</label>
              <input name="password" type="password" placeholder="Min. 8 characters" minLength={8} required className="w-full border border-[#1E2229] rounded-xl px-4 py-3 text-sm bg-[#131519] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 transition-colors" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#A8FF3A] text-[#0A0B0E] font-semibold rounded-xl py-3 text-sm hover:bg-[#C8FF6A] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-8 space-y-2 text-center text-sm">
            <p className="text-[#545B6A]">
              Already have an account?{' '}
              <Link href="/client/login" className="text-[#A8FF3A] font-medium hover:underline">Sign in</Link>
            </p>
            <p className="text-[#3E4452]">
              Trainer?{' '}
              <Link href="/register" className="text-[#545B6A] hover:text-[#E8EAF0] transition-colors">Trainer registration</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientRegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
