'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

interface DataPoint {
  month: string
  revenue: number
  count: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A0B0E] border border-[#1E2229] rounded-lg px-3 py-2.5 shadow-xl text-xs">
      <p className="text-[#545B6A] mb-1.5 font-semibold">{label}</p>
      <p className="text-[#A8FF3A] font-bold">€{(payload[0].value / 100).toFixed(0)}</p>
      {payload[1] && <p className="text-[#4D9EFF]">{payload[1].value} payments</p>}
    </div>
  )
}

export function MonthlyRevenueChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2229" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#545B6A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => `€${(v / 100).toFixed(0)}`} tick={{ fill: '#545B6A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E2229' }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.revenue === max ? '#A8FF3A' : '#1E2229'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
