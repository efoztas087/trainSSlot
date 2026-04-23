'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClientLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (signInError) { setError(signInError.message); setLoading(false); return }

    if (data.user?.user_metadata?.role !== 'client') {
      await supabase.auth.signOut()
      setError('This account is not a client account. Use the trainer login instead.')
      setLoading(false)
      return
    }

    router.push('/client/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0C0D10] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0A0B0E] border-r border-[#1E2229] px-12 py-10">
        <span className="font-[family-name:var(--font-heading)] text-2xl text-[#E8EAF0] tracking-widest uppercase">TrainSlot</span>
        <div>
          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-4">Client Portal</p>
          <h2 className="font-[family-name:var(--font-heading)] text-6xl text-[#E8EAF0] uppercase leading-none tracking-tight mb-6">
            Your<br />progress.<br />Your<br />results.
          </h2>
          <p className="text-[#545B6A] text-sm max-w-xs leading-relaxed">
            Track your training, view your workout plans, monitor body metrics, and stay connected with your trainer.
          </p>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl text-[#A8FF3A]">100%</p>
            <p className="text-xs text-[#545B6A] mt-0.5">All yours</p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl text-[#E8EAF0]">Live</p>
            <p className="text-xs text-[#545B6A] mt-0.5">Real-time data</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-10">
        <div className="w-full max-w-sm mx-auto">
          <span className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] tracking-widest uppercase block mb-10 lg:hidden">TrainSlot</span>

          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-2">Client Portal</p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl text-[#E8EAF0] uppercase leading-none tracking-tight mb-1">Sign in</h1>
          <p className="text-[#545B6A] text-sm mb-8">Access your training dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full border border-[#1E2229] rounded-xl px-4 py-3 text-sm bg-[#131519] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 focus:border-[#A8FF3A]/40 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Password</label>
              <input
                name="password"
                type="password"
                placeholder="Your password"
                required
                className="w-full border border-[#1E2229] rounded-xl px-4 py-3 text-sm bg-[#131519] text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 focus:border-[#A8FF3A]/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A8FF3A] text-[#0A0B0E] font-semibold rounded-xl py-3 text-sm hover:bg-[#C8FF6A] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 space-y-2 text-center text-sm">
            <p className="text-[#545B6A]">
              No account?{' '}
              <Link href="/client/register" className="text-[#A8FF3A] font-medium hover:underline">
                Create one
              </Link>
            </p>
            <p className="text-[#3E4452]">
              Trainer?{' '}
              <Link href="/login" className="text-[#545B6A] hover:text-[#E8EAF0] transition-colors">
                Trainer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
