'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
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

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user?.user_metadata?.role !== 'trainer') {
      await supabase.auth.signOut()
      setError('This account is not a trainer account. Please use the client login.')
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
            Manage<br />
            <span className="text-[#A8FF3A]">your</span><br />
            clients.
          </h1>
          <p className="text-[#545B6A] mt-6 text-sm leading-relaxed max-w-xs">
            Built for personal trainers who take their business seriously.
          </p>
        </div>

        <div className="flex gap-10 relative">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-4xl text-[#E8EAF0]">100%</p>
            <p className="text-[#545B6A] text-xs mt-0.5 uppercase tracking-wider">Progress visibility</p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-4xl text-[#E8EAF0]">iDEAL</p>
            <p className="text-[#545B6A] text-xs mt-0.5 uppercase tracking-wider">Payments supported</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <span className="font-bold text-[#E8EAF0] text-sm tracking-widest uppercase">TrainSlot</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#E8EAF0]">Trainer login</h1>
            <p className="text-[#545B6A] text-sm mt-1">Sign in to manage your clients</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Your password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-[#545B6A]">
              No account yet?{' '}
              <Link href="/register" className="text-[#A8FF3A] font-medium hover:underline">
                Create one
              </Link>
            </p>
            <p className="text-[#3E4452]">
              Are you a client?{' '}
              <Link href="/client/login" className="text-[#545B6A] hover:text-[#E8EAF0] transition-colors">
                Client login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
