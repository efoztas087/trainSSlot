'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  defs,
  linearGradient,
  stop,
} from 'recharts'

interface DataPoint {
  date: string
  revenue: number
  count: number
}

interface RevenueChartProps {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A0B0E] border border-[#1E2229] rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-[#545B6A] mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold text-[#A8FF3A]">
          {p.name === 'revenue' ? `€${(p.value / 100).toFixed(2)}` : `${p.value} payments`}
        </p>
      ))}
    </div>
  )
}

function VolumeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A0B0E] border border-[#1E2229] rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-[#545B6A] mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-[#4D9EFF]">{payload[0]?.value} payments</p>
    </div>
  )
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="space-y-1">
      {/* Main revenue area chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A8FF3A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#A8FF3A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1E2229"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: '#545B6A', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#545B6A', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#A8FF3A', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#A8FF3A"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#A8FF3A', stroke: '#0C0D10', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Volume bars */}
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip content={<VolumeTooltip />} cursor={{ fill: '#1E2229' }} />
          <Bar dataKey="count" name="count" fill="#4D9EFF" opacity={0.5} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
