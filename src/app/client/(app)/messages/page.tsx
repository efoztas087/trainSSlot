'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { MessageSquare } from 'lucide-react'

export default function ClientMessagesPage() {
  const [ids, setIds] = useState<{ trainerId: string; clientId: string; trainerName: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase
        .from('clients')
        .select('trainer_id, trainers(name)')
        .eq('id', user.id)
        .single() as { data: { trainer_id: string; trainers: { name: string } | null } | null }

      if (client?.trainer_id) {
        setIds({
          trainerId: client.trainer_id,
          clientId: user.id,
          trainerName: client.trainers?.name ?? 'Your Trainer',
        })
      }
    }
    load()
  }, [])

  if (!ids) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="h-14 w-14 rounded-2xl bg-[#131519] border border-[#1E2229] flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-[#3E4452]" />
        </div>
        <p className="text-sm text-[#545B6A]">No trainer linked to your account yet.</p>
        <p className="text-xs text-[#3E4452]">Ask your trainer to send you an invite link.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-4rem)] -mx-4 -my-6 sm:-mx-6 sm:-my-8 lg:-mx-8 lg:-my-8">
      <div className="px-4 sm:px-8 py-5 border-b border-[#1E2229] flex-shrink-0">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#E8EAF0] uppercase leading-none tracking-tight">
          Messages
        </h1>
        <p className="text-xs text-[#545B6A] mt-1">Private conversation with {ids.trainerName}</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWindow
          trainerId={ids.trainerId}
          clientId={ids.clientId}
          senderRole="client"
          clientName={ids.trainerName}
        />
      </div>
    </div>
  )
}
