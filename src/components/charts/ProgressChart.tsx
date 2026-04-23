'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface DataPoint {
  date: string
  weight_kg: number | null
  body_fat_pct: number | null
}

interface Props {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A0B0E] border border-[#1E2229] rounded-lg px-3 py-2.5 shadow-xl text-xs">
      <p className="text-[#545B6A] mb-1.5 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function ProgressChart({ data }: Props) {
  const hasWeight = data.some(d => d.weight_kg !== null)
  const hasBodyFat = data.some(d => d.body_fat_pct !== null)

  const formatted = data
    .filter(d => d.weight_kg !== null || d.body_fat_pct !== null)
    .map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
    .reverse()

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2229" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#545B6A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#545B6A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {hasWeight && (
          <Line type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#A8FF3A" strokeWidth={2} dot={{ fill: '#A8FF3A', r: 3 }} activeDot={{ fill: '#A8FF3A', stroke: '#0A0B0E', strokeWidth: 2, r: 5 }} />
        )}
        {hasBodyFat && (
          <Line type="monotone" dataKey="body_fat_pct" name="Body fat %" stroke="#4D9EFF" strokeWidth={2} dot={{ fill: '#4D9EFF', r: 3 }} activeDot={{ fill: '#4D9EFF', stroke: '#0A0B0E', strokeWidth: 2, r: 5 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
