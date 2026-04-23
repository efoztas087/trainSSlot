'use client'

import { DayPicker } from 'react-day-picker'
import { Clock } from 'lucide-react'
import 'react-day-picker/dist/style.css'

interface CalendarPanelProps {
  selected: Date
  hour: string
  minute: string
  onDaySelect: (day: Date | undefined) => void
  onHour: (h: string) => void
  onMinute: (m: string) => void
  onConfirm: () => void
}

export function CalendarPanel({ selected, hour, minute, onDaySelect, onHour, onMinute, onConfirm }: CalendarPanelProps) {
  return (
    <div className="bg-[#131519] border border-[#1E2229] rounded-xl shadow-2xl p-5 w-[380px] flex-shrink-0">
      <style>{`
        .rdp { --rdp-accent-color: #A8FF3A; --rdp-background-color: #A8FF3A22; color: #E8EAF0; margin: 0; }
        .rdp-day { color: #E8EAF0; border-radius: 8px; }
        .rdp-day:hover:not(.rdp-day_selected) { background: #1E2229 !important; color: #E8EAF0; }
        .rdp-day_selected { background: #A8FF3A !important; color: #0A0B0E !important; font-weight: 700; }
        .rdp-day_today:not(.rdp-day_selected) { color: #A8FF3A; font-weight: 700; }
        .rdp-day_outside { color: #3E4452; }
        .rdp-head_cell { color: #545B6A; font-size: 11px; font-weight: 600; }
        .rdp-caption_label { color: #E8EAF0; font-weight: 700; font-size: 14px; }
        .rdp-nav_button { color: #545B6A; border-radius: 8px; }
        .rdp-nav_button:hover { background: #1E2229; color: #E8EAF0; }
      `}</style>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onDaySelect}
        weekStartsOn={1}
      />

      <div className="border-t border-[#1E2229] pt-3 mt-1">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-3.5 w-3.5 text-[#545B6A]" />
          <span className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Time</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={hour}
            onChange={e => onHour(e.target.value)}
            className="flex-1 border border-[#1E2229] rounded-lg px-2 py-1.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-1 focus:ring-[#A8FF3A]/40"
          >
            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
          <span className="text-[#545B6A] font-bold">:</span>
          <select
            value={minute}
            onChange={e => onMinute(e.target.value)}
            className="flex-1 border border-[#1E2229] rounded-lg px-2 py-1.5 text-sm bg-[#0A0B0E] text-[#E8EAF0] focus:outline-none focus:ring-1 focus:ring-[#A8FF3A]/40"
          >
            {['00', '15', '30', '45'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="mt-3 w-full bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-lg py-2 hover:bg-[#C8FF6A] transition-colors"
      >
        Confirm
      </button>
    </div>
  )
}
