'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ImagePlus, X, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  trainer_id: string
  client_id: string
  sender_role: 'trainer' | 'client'
  content: string
  attachment_url: string | null
  created_at: string
  read_at: string | null
}

interface Props {
  trainerId: string
  clientId: string
  senderRole: 'trainer' | 'client'
  clientName: string
  onBack?: () => void
}

export function ChatWindow({ trainerId, clientId, senderRole, clientName, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
      // Mark incoming messages as read when chat opens
      const otherRole = senderRole === 'trainer' ? 'client' : 'trainer'
      await (supabase as any).from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('trainer_id', trainerId)
        .eq('client_id', clientId)
        .eq('sender_role', otherRole)
        .is('read_at', null)
    }
    load()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel(`chat-${trainerId}-${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `trainer_id=eq.${trainerId}` },
        (payload: { new: Message }) => {
          if (payload.new.client_id === clientId) {
            setMessages(prev =>
              prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
            )
            // Mark as read immediately if it's from the other party
            if (payload.new.sender_role !== senderRole) {
              ;(supabase as any).from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', payload.new.id)
                .then(() => {})
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [trainerId, clientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview({ file, url: URL.createObjectURL(file) })
    e.target.value = ''
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
  }

  async function send() {
    const text = input.trim()
    if ((!text && !imagePreview) || sending) return
    setSending(true)
    setInput('')

    let attachmentUrl: string | null = null

    if (imagePreview) {
      setUploading(true)
      const ext = imagePreview.file.name.split('.').pop()
      const path = `${trainerId}/${clientId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('chat-attachments')
        .upload(path, imagePreview.file, { contentType: imagePreview.file.type })
      if (upErr) {
        console.error('Upload error:', upErr.message)
        setUploading(false)
        setSending(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path)
      attachmentUrl = publicUrl
      clearImage()
      setUploading(false)
    }

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      trainer_id: trainerId,
      client_id: clientId,
      sender_role: senderRole,
      content: text,
      attachment_url: attachmentUrl,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages(prev => [...prev, optimistic])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('messages').insert({
      trainer_id: trainerId,
      client_id: clientId,
      sender_role: senderRole,
      content: text,
      attachment_url: attachmentUrl,
    }).select().single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
    }
    setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1E2229] flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#131519] text-[#545B6A] hover:text-[#E8EAF0] transition-colors flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="h-8 w-8 rounded-full bg-[#0F2010] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#A8FF3A]">{clientName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E8EAF0]">{clientName}</p>
            <p className="text-xs text-[#545B6A]">Private conversation</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#3E4452]">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_role === senderRole
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl ${
                isMe ? 'bg-[#A8FF3A] text-[#0A0B0E] rounded-br-sm' : 'bg-[#1E2229] text-[#E8EAF0] rounded-bl-sm'
              } overflow-hidden`}>
                {m.attachment_url && (
                  <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={m.attachment_url}
                      alt="attachment"
                      className="max-w-full max-h-64 object-cover block"
                    />
                  </a>
                )}
                {m.content && (
                  <div className="px-4 py-2.5">
                    <p className="text-sm leading-relaxed">{m.content}</p>
                  </div>
                )}
                <div className={`px-4 pb-2 ${!m.content ? 'pt-1' : ''}`}>
                  <p className={`text-[10px] ${isMe ? 'text-[#0A0B0E]/50' : 'text-[#545B6A]'}`}>
                    {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview above input */}
      {imagePreview && (
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview.url} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-[#1E2229]" />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-[#FF6B6B] rounded-full flex items-center justify-center"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1E2229] flex-shrink-0">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-xl border border-[#1E2229] flex items-center justify-center flex-shrink-0 hover:bg-[#131519] transition-colors text-[#545B6A] hover:text-[#E8EAF0]"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            className="flex-1 bg-[#0A0B0E] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/40 resize-none transition-colors"
          />
          <button
            onClick={send}
            disabled={(!input.trim() && !imagePreview) || sending || uploading}
            className="h-10 w-10 rounded-xl bg-[#A8FF3A] flex items-center justify-center flex-shrink-0 hover:bg-[#C8FF6A] transition-colors disabled:opacity-40"
          >
            {uploading
              ? <div className="h-4 w-4 border-2 border-[#0A0B0E] border-t-transparent rounded-full animate-spin" />
              : <Send className="h-4 w-4 text-[#0A0B0E]" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
