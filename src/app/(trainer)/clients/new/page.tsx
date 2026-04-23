'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewClientPage() {
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
    const phone = formData.get('phone') as string
    const goal = formData.get('goal') as string
    const password = formData.get('password') as string

    const supabase = createClient()
    const { data: { user: trainer } } = await supabase.auth.getUser()

    const res = await fetch('/api/auth/register-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, goal, trainerId: trainer!.id }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/clients')
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-[#545B6A] hover:text-[#E8EAF0] transition-colors">
          ← Back to clients
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add new client</CardTitle>
          <CardDescription>Create a login account for your client so they can access their dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Jane Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="client@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" type="text" placeholder="They can change this later" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-[#545B6A] font-normal">(optional)</span></Label>
              <Input id="phone" name="phone" type="tel" placeholder="+31 6 12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal <span className="text-[#545B6A] font-normal">(optional)</span></Label>
              <Input id="goal" name="goal" placeholder="e.g. Lose 10kg, build muscle" />
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create client'}
            </Button>
            <Link href="/clients">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
