'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface Props {
  trainerId: string
}

export function CopyInviteLink({ trainerId }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/client/register?trainer=${trainerId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
        copied
          ? 'border-[#0F3020] bg-[#0A2415] text-[#22D17A]'
          : 'border-[#1E2229] text-[#E8EAF0] hover:bg-[#171A1F]'
      }`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Copy Invite Link'}
    </button>
  )
}
