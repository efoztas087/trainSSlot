'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Flame,
  CalendarDays,
  Dumbbell,
  MessageSquare,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Sessions', href: '/sessions', icon: CalendarDays },
  { label: 'Plans', href: '/plans', icon: Dumbbell },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Packages', href: '/packages', icon: Package },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

// 5 most important items shown in the mobile bottom bar
const mobileTabItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Sessions', href: '/sessions', icon: CalendarDays },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface TrainerNavProps {
  userName: string
  avatarUrl?: string | null
}

export function TrainerNav({ userName, avatarUrl }: TrainerNavProps) {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', user.id)
        .eq('sender_role', 'client')
        .is('read_at', null)
      setUnread(count ?? 0)
    }
    loadUnread()
    const supabase2 = supabaseRef.current
    const channel = (supabase2 as any)
      .channel('trainer-nav-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadUnread())
      .subscribe()
    return () => { supabase2.removeChannel(channel) }
  }, [])

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#0A0B0E] flex-col border-r border-[#1E2229] z-40">
        {/* User card */}
        <div className="p-4 border-b border-[#1E2229]">
          <div className="flex items-center gap-3 bg-[#131519] rounded-xl p-3">
            <div className="h-10 w-10 rounded-full bg-[#A8FF3A] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                : <span className="text-sm font-bold text-[#0A0B0E]">{userName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#E8EAF0] truncate">{userName}</p>
              <p className="text-xs text-[#545B6A]">Head Trainer</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#3E4452] uppercase tracking-widest mb-3 px-2">Menu</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#A8FF3A]/10 text-[#A8FF3A]'
                      : 'text-[#545B6A] hover:bg-[#171A1F] hover:text-[#E8EAF0]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="h-4 w-4" />
                    {item.href === '/messages' && unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-[#A8FF3A] rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-[#0A0B0E]">{unread > 9 ? '9+' : unread}</span>
                      </span>
                    )}
                  </div>
                  {item.label}
                  {item.href === '/messages' && unread > 0 && (
                    <span className="ml-auto bg-[#A8FF3A] text-[#0A0B0E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Motivational card */}
        <div className="p-4">
          <div className="bg-[#A8FF3A] rounded-2xl p-4">
            <Flame className="h-6 w-6 text-[#0A0B0E] mb-3" />
            <p className="font-[family-name:var(--font-heading)] text-xl text-[#0A0B0E] uppercase tracking-wide leading-none">Push Harder</p>
            <p className="text-xs text-[#0A0B0E]/70 mt-2 leading-relaxed">Your clients are counting on you. Track every session.</p>
            <Link href="/clients">
              <button className="mt-3 w-full bg-[#0A0B0E]/15 hover:bg-[#0A0B0E]/25 text-[#0A0B0E] text-xs font-semibold py-2 rounded-lg transition-colors">
                View Clients
              </button>
            </Link>
          </div>

          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-[#545B6A] hover:bg-[#171A1F] hover:text-[#E8EAF0] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0B0E] border-t border-[#1E2229] flex items-stretch">
        {mobileTabItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? 'text-[#A8FF3A]' : 'text-[#3E4452]'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.href === '/messages' && unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-[#A8FF3A] rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[#0A0B0E]">{unread > 9 ? '9+' : unread}</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
