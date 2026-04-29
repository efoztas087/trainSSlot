'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { MessageSquare, Search } from 'lucide-react'

interface Client {
  id: string
  name: string
  status: string
}

interface LastMessage {
  clientId: string
  content: string
  created_at: string
  sender_role: string
}

export default function TrainerMessagesPage() {
  const [trainerId, setTrainerId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessage>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  async function loadMessages(tid: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: msgs } = await (supabase as any)
      .from('messages')
      .select('client_id, content, created_at, sender_role, read_at')
      .eq('trainer_id', tid)
      .order('created_at', { ascending: false })

    if (msgs) {
      const map: Record<string, LastMessage> = {}
      const unread: Record<string, number> = {}
      for (const m of msgs) {
        if (!map[m.client_id]) {
          map[m.client_id] = { clientId: m.client_id, content: m.content, created_at: m.created_at, sender_role: m.sender_role }
        }
        if (m.sender_role === 'client' && !m.read_at) {
          unread[m.client_id] = (unread[m.client_id] ?? 0) + 1
        }
      }
      setLastMessages(map)
      setUnreadCounts(unread)
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setTrainerId(user.id)

      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name, status')
        .eq('trainer_id', user.id)
        .neq('status', 'inactive')
        .order('name')

      setClients(clientData ?? [])
      if (clientData && clientData.length > 0) {
        await loadMessages(user.id)
      }

      // Real-time: update list when any message arrives
      const channel = (supabase as any)
        .channel('messages-list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trainer_id=eq.${user.id}` },
          () => { loadMessages(user.id) }
        )
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `trainer_id=eq.${user.id}` },
          () => { loadMessages(user.id) }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When a client is selected, clear their unread count optimistically
  function selectClient(c: Client) {
    setSelected(c)
    setMobileView('chat')
    setUnreadCounts(prev => ({ ...prev, [c.id]: 0 }))
  }

  // Sort clients: conversations with messages sorted by latest, others alphabetically after
  const filtered = clients
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const ta = lastMessages[a.id]?.created_at ?? ''
      const tb = lastMessages[b.id]?.created_at ?? ''
      if (ta && tb) return tb.localeCompare(ta)
      if (ta) return -1
      if (tb) return 1
      return a.name.localeCompare(b.name)
    })

  if (!trainerId) return null

  return (
    <div className="flex h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-4rem)] -mx-4 -my-6 sm:-mx-6 sm:-my-8 lg:-mx-8 lg:-my-8 overflow-hidden">

      {/* Client list */}
      <div className={`
        ${mobileView === 'chat' ? 'hidden' : 'flex'} lg:flex
        w-full lg:w-72 flex-shrink-0 border-r border-[#1E2229] flex-col bg-[#0A0B0E]
      `}>
        <div className="px-4 py-5 border-b border-[#1E2229]">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[#E8EAF0] uppercase tracking-wide leading-none mb-3">
            Messages
          </h1>
          <div className="flex items-center gap-2 bg-[#131519] border border-[#1E2229] rounded-lg px-3 py-2">
            <Search className="h-3.5 w-3.5 text-[#3E4452] flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="flex-1 bg-transparent text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#545B6A]">No clients found.</p>
            </div>
          ) : (
            <div className="py-2">
              {filtered.map(c => {
                const last = lastMessages[c.id]
                const unread = unreadCounts[c.id] ?? 0
                const isSelected = selected?.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => selectClient(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                      isSelected ? 'bg-[#A8FF3A]/10 border-r-2 border-[#A8FF3A]' : 'hover:bg-[#131519]'
                    }`}
                  >
                    <div className="relative h-9 w-9 rounded-full bg-[#0F2010] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#A8FF3A]">{c.name.charAt(0).toUpperCase()}</span>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#A8FF3A] rounded-full flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#0A0B0E]">{unread > 9 ? '9+' : unread}</span>
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-[#E8EAF0]' : isSelected ? 'font-semibold text-[#A8FF3A]' : 'font-semibold text-[#E8EAF0]'}`}>{c.name}</p>
                      {last ? (
                        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-[#E8EAF0]' : 'text-[#545B6A]'}`}>
                          {last.sender_role === 'trainer' ? 'You: ' : ''}{last.content}
                        </p>
                      ) : (
                        <p className="text-xs text-[#3E4452] mt-0.5">No messages yet</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {last && (
                        <p className="text-[10px] text-[#3E4452]">
                          {new Date(last.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`
        ${mobileView === 'list' ? 'hidden' : 'flex'} lg:flex
        flex-1 bg-[#0C0D10] flex-col min-w-0
      `}>
        {selected ? (
          <ChatWindow
            trainerId={trainerId}
            clientId={selected.id}
            senderRole="trainer"
            clientName={selected.name}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-[#131519] border border-[#1E2229] flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-[#3E4452]" />
            </div>
            <p className="text-sm text-[#545B6A]">Select a client to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
