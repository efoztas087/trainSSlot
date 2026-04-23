'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  notes: string | null
  order_index: number
}

interface Day {
  id: string
  day_number: number
  name: string
  focus: string | null
  workout_exercises: Exercise[]
}

interface Props {
  planId: string
  initialDays: Day[]
}

export function PlanEditor({ planId, initialDays }: Props) {
  const router = useRouter()
  const [days, setDays] = useState<Day[]>(initialDays)
  const [expandedDay, setExpandedDay] = useState<string | null>(initialDays[0]?.id ?? null)
  const [loading, setLoading] = useState(false)

  async function addDay() {
    const supabase = createClient()
    const dayNum = days.length + 1
    const { data } = await supabase
      .from('workout_days')
      .insert({ plan_id: planId, day_number: dayNum, name: `Day ${dayNum}` })
      .select()
      .single()
    if (data) {
      setDays(prev => [...prev, { ...data, workout_exercises: [] }])
      setExpandedDay(data.id)
    }
  }

  async function removeDay(dayId: string) {
    const supabase = createClient()
    await supabase.from('workout_days').delete().eq('id', dayId)
    setDays(prev => prev.filter(d => d.id !== dayId))
  }

  async function updateDayName(dayId: string, name: string) {
    const supabase = createClient()
    await supabase.from('workout_days').update({ name }).eq('id', dayId)
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, name } : d))
  }

  async function updateDayFocus(dayId: string, focus: string) {
    const supabase = createClient()
    await supabase.from('workout_days').update({ focus }).eq('id', dayId)
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, focus } : d))
  }

  async function addExercise(dayId: string) {
    const supabase = createClient()
    const day = days.find(d => d.id === dayId)
    const orderIndex = (day?.workout_exercises.length ?? 0)
    const { data } = await supabase
      .from('workout_exercises')
      .insert({ day_id: dayId, name: 'New Exercise', order_index: orderIndex })
      .select()
      .single()
    if (data) {
      setDays(prev => prev.map(d =>
        d.id === dayId ? { ...d, workout_exercises: [...d.workout_exercises, data] } : d
      ))
    }
  }

  async function updateExercise(dayId: string, exId: string, field: string, value: string | number | null) {
    const supabase = createClient()
    await supabase.from('workout_exercises').update({ [field]: value }).eq('id', exId)
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, workout_exercises: d.workout_exercises.map(e => e.id === exId ? { ...e, [field]: value } : e) }
        : d
    ))
  }

  async function removeExercise(dayId: string, exId: string) {
    const supabase = createClient()
    await supabase.from('workout_exercises').delete().eq('id', exId)
    setDays(prev => prev.map(d =>
      d.id === dayId ? { ...d, workout_exercises: d.workout_exercises.filter(e => e.id !== exId) } : d
    ))
  }

  return (
    <div className="space-y-3">
      {days.map(day => (
        <div key={day.id} className="bg-[#131519] rounded-xl border border-[#1E2229] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <button
              type="button"
              onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
              className="text-[#545B6A] hover:text-[#E8EAF0]"
            >
              {expandedDay === day.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <input
              value={day.name}
              onChange={e => updateDayName(day.id, e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold text-[#E8EAF0] focus:outline-none"
            />
            <input
              value={day.focus ?? ''}
              onChange={e => updateDayFocus(day.id, e.target.value)}
              placeholder="Focus (e.g. Chest & Triceps)"
              className="w-48 bg-transparent text-xs text-[#545B6A] focus:outline-none focus:text-[#E8EAF0] text-right"
            />
            <span className="text-xs text-[#3E4452]">{day.workout_exercises.length} exercise{day.workout_exercises.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => removeDay(day.id)} className="text-[#545B6A] hover:text-[#FF6B6B] transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {expandedDay === day.id && (
            <div className="border-t border-[#1E2229] px-5 py-4 space-y-2">
              {day.workout_exercises.length === 0 && (
                <p className="text-xs text-[#3E4452] text-center py-4">No exercises yet. Add one below.</p>
              )}
              {day.workout_exercises.map((ex, idx) => (
                <div key={ex.id} className="flex items-center gap-2 bg-[#0A0B0E] rounded-lg px-3 py-2.5">
                  <span className="text-xs text-[#3E4452] w-5 flex-shrink-0">{idx + 1}.</span>
                  <input
                    value={ex.name}
                    onChange={e => updateExercise(day.id, ex.id, 'name', e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1 bg-transparent text-sm text-[#E8EAF0] focus:outline-none min-w-0"
                  />
                  <input
                    type="number"
                    value={ex.sets ?? ''}
                    onChange={e => updateExercise(day.id, ex.id, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Sets"
                    className="w-14 bg-transparent text-xs text-[#545B6A] focus:outline-none text-center border border-[#1E2229] rounded px-1.5 py-1"
                  />
                  <span className="text-[#3E4452] text-xs">×</span>
                  <input
                    value={ex.reps ?? ''}
                    onChange={e => updateExercise(day.id, ex.id, 'reps', e.target.value || null)}
                    placeholder="Reps"
                    className="w-16 bg-transparent text-xs text-[#545B6A] focus:outline-none text-center border border-[#1E2229] rounded px-1.5 py-1"
                  />
                  <input
                    value={ex.notes ?? ''}
                    onChange={e => updateExercise(day.id, ex.id, 'notes', e.target.value || null)}
                    placeholder="Notes"
                    className="w-28 bg-transparent text-xs text-[#3E4452] focus:outline-none focus:text-[#545B6A]"
                  />
                  <button type="button" onClick={() => removeExercise(day.id, ex.id)} className="text-[#3E4452] hover:text-[#FF6B6B] transition-colors flex-shrink-0">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addExercise(day.id)}
                className="flex items-center gap-1.5 text-xs text-[#545B6A] hover:text-[#A8FF3A] transition-colors mt-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add exercise
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addDay}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-[#1E2229] text-sm text-[#545B6A] hover:border-[#A8FF3A]/40 hover:text-[#A8FF3A] transition-colors"
      >
        <Plus className="h-4 w-4" /> Add training day
      </button>
    </div>
  )
}
