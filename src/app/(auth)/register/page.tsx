'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
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

    const res = await fetch('/api/auth/register-trainer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0C0D10] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-[#1E2229] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A8FF3A]/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative">
          <span className="font-bold text-[#E8EAF0] text-sm tracking-widest uppercase">TrainSlot</span>
        </div>

        <div className="relative">
          <h1 className="font-[family-name:var(--font-heading)] text-[5.5rem] text-[#E8EAF0] leading-none uppercase tracking-tight">
            Start<br />
            <span className="text-[#A8FF3A]">growing</span><br />
            today.
          </h1>
          <ul className="mt-6 space-y-3">
            {[
              'Track client progress & check-ins',
              'Create and sell coaching packages',
              'Accept iDEAL payments',
              'One dashboard for everything',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#545B6A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A8FF3A] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[#3E4452] text-xs relative">Free to get started · No credit card required</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <span className="font-bold text-[#E8EAF0] text-sm tracking-widest uppercase">TrainSlot</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#E8EAF0]">Create trainer account</h1>
            <p className="text-[#545B6A] text-sm mt-1">Get started for free — no credit card needed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="John Smith" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Min. 8 characters" minLength={8} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-[#545B6A]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#A8FF3A] font-medium hover:underline">
                Sign in
              </Link>
            </p>
            <div className="border-t border-[#1E2229] pt-3">
              <p className="text-[#3E4452] mb-2">Are you a client?</p>
              <Link href="/client/register">
                <Button type="button" variant="outline" className="w-full">
                  Create a client account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
