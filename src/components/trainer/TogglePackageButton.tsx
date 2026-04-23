'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function TogglePackageButton({ packageId, isActive }: { packageId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('packages').update({ is_active: !isActive }).eq('id', packageId)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading} className="w-full">
      {loading ? '...' : isActive ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
