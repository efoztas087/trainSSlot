'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Link2, ArrowRight } from 'lucide-react'
import { Suspense } from 'react'

function LinkTrainerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-fill from URL ?code=ABC123
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      const chars = urlCode.toUpperCase().slice(0, 6).split('')
      setCode(chars.concat(Array(6 - chars.length).fill('')))
    }
  }, [searchParams])

  function handleChange(i: number, val: string) {
    const char = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1)
    const next = [...code]
    next[i] = char
    setCode(next)
    if (char && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
    const chars = text.split('')
    setCode(chars.concat(Array(6 - chars.length).fill('')))
    inputs.current[Math.min(chars.length, 5)]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) { setError('Please enter the full 6-character code.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/client/link-trainer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: fullCode }),
    })
    const result = await res.json()

    if (!res.ok) { setError(result.error); setLoading(false); return }

    setSuccess(result.trainerName)
    setTimeout(() => { router.push('/client/dashboard'); router.refresh() }, 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[#0A2415] border border-[#0F3020] flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8 text-[#22D17A]" />
          </div>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl text-[#E8EAF0] uppercase tracking-tight">Linked!</h2>
          <p className="text-sm text-[#545B6A]">You're now connected to <span className="text-[#E8EAF0] font-medium">{success}</span>.</p>
          <p className="text-xs text-[#3E4452]">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0C0D10] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0A0B0E] border-r border-[#1E2229] px-12 py-10">
        <span className="font-[family-name:var(--font-heading)] text-2xl text-[#E8EAF0] tracking-widest uppercase">TrainSlot</span>
        <div>
          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-4">Connect</p>
          <h2 className="font-[family-name:var(--font-heading)] text-6xl text-[#E8EAF0] uppercase leading-none tracking-tight mb-6">
            Link to your<br />trainer.
          </h2>
          <p className="text-[#545B6A] text-sm max-w-xs leading-relaxed">
            Enter the 6-character code your trainer shared with you. You'll instantly get access to your plan, sessions, and direct messaging.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#0F2010] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4 w-4 text-[#A8FF3A]" />
            </div>
            <p className="text-xs text-[#545B6A]">Verified connection to your trainer</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#0F2010] flex items-center justify-center flex-shrink-0">
              <Link2 className="h-4 w-4 text-[#A8FF3A]" />
            </div>
            <p className="text-xs text-[#545B6A]">Instant access to your plan & sessions</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-10">
        <div className="w-full max-w-sm mx-auto">
          <span className="font-[family-name:var(--font-heading)] text-xl text-[#E8EAF0] tracking-widest uppercase block mb-10 lg:hidden">TrainSlot</span>

          <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-widest mb-2">Trainer Code</p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl text-[#E8EAF0] uppercase leading-none tracking-tight mb-1">
            Enter your code
          </h1>
          <p className="text-[#545B6A] text-sm mb-10">Ask your trainer for their 6-character invite code.</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-xl bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">{error}</div>
            )}

            {/* 6-box code input */}
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {code.map((char, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  value={char}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  maxLength={1}
                  className={`h-14 w-11 text-center text-xl font-bold rounded-xl border bg-[#131519] text-[#E8EAF0] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/50 transition-all uppercase ${
                    char ? 'border-[#A8FF3A]/50 text-[#A8FF3A]' : 'border-[#1E2229]'
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 bg-[#A8FF3A] text-[#0A0B0E] font-semibold rounded-xl py-3 text-sm hover:bg-[#C8FF6A] transition-colors disabled:opacity-40"
            >
              {loading ? 'Linking...' : <>Link Account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-[#3E4452] mt-8">
            Don't have a code yet?{' '}
            <span className="text-[#545B6A]">Ask your trainer — they can find it in their Settings page.</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LinkTrainerPage() {
  return (
    <Suspense>
      <LinkTrainerForm />
    </Suspense>
  )
}
