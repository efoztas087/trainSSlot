'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NewPackageForm({ trainerId }: { trainerId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const priceInput = formData.get('price') as string
    const priceCents = Math.round(parseFloat(priceInput) * 100)

    const { error: insertError } = await supabase.from('packages').insert({
      trainer_id: trainerId,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      price_cents: priceCents,
      duration_weeks: parseInt(formData.get('duration_weeks') as string),
      sessions_total: parseInt(formData.get('sessions_total') as string),
      is_active: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ New package</Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Create package</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Package name</Label>
              <Input id="name" name="name" placeholder="e.g. 12-week transformation" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (€)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="149.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessions_total">Sessions</Label>
              <Input id="sessions_total" name="sessions_total" type="number" min="1" placeholder="12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_weeks">Duration (weeks)</Label>
              <Input id="duration_weeks" name="duration_weeks" type="number" min="1" placeholder="12" required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description <span className="text-[#545B6A] font-normal">(optional)</span></Label>
              <Textarea id="description" name="description" placeholder="What's included..." rows={2} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create package'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
