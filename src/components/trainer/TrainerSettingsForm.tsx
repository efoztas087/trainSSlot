'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Briefcase, Lock, X, Plus, Check, AlertCircle, Camera, Copy, QrCode } from 'lucide-react'

interface DefaultValues {
  name: string
  bio: string
  specialties: string[]
  years_experience: number | null
  location: string
  studio_name: string
  phone: string
  website: string
  instagram: string
  certification: string
  avatar_url?: string | null
  join_code?: string | null
}

interface Props {
  trainerId: string
  email: string
  defaultValues: DefaultValues
}

const SPECIALTY_SUGGESTIONS = [
  'Weight Loss', 'Muscle Building', 'HIIT', 'Strength Training', 'Yoga',
  'Pilates', 'Boxing', 'CrossFit', 'Rehabilitation', 'Nutrition',
  'Endurance', 'Mobility', 'Powerlifting', 'Calisthenics', 'Sports Performance',
]

export function TrainerSettingsForm({ trainerId, email, defaultValues }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'security'>('profile')

  const [codeCopied, setCodeCopied] = useState(false)
  const joinCode = defaultValues.join_code ?? null

  function copyCode(text: string) {
    navigator.clipboard.writeText(text)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(defaultValues.avatar_url ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [name, setName] = useState(defaultValues.name)
  const [bio, setBio] = useState(defaultValues.bio)
  const [specialties, setSpecialties] = useState<string[]>(defaultValues.specialties)
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [years, setYears] = useState(defaultValues.years_experience?.toString() ?? '')
  const [certification, setCertification] = useState(defaultValues.certification)

  // Business state
  const [studioName, setStudioName] = useState(defaultValues.studio_name)
  const [location, setLocation] = useState(defaultValues.location)
  const [phone, setPhone] = useState(defaultValues.phone)
  const [website, setWebsite] = useState(defaultValues.website)
  const [instagram, setInstagram] = useState(defaultValues.instagram)

  // Security state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addSpecialty(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties(prev => [...prev, trimmed])
    }
    setSpecialtyInput('')
    setShowSuggestions(false)
  }

  function removeSpecialty(tag: string) {
    setSpecialties(prev => prev.filter(s => s !== tag))
  }

  function handleSpecialtyKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSpecialty(specialtyInput)
    } else if (e.key === 'Backspace' && !specialtyInput && specialties.length > 0) {
      setSpecialties(prev => prev.slice(0, -1))
    }
  }

  const filteredSuggestions = SPECIALTY_SUGGESTIONS.filter(
    s => s.toLowerCase().includes(specialtyInput.toLowerCase()) && !specialties.includes(s)
  )

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setError(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${trainerId}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) { setError(uploadErr.message); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await (supabase as any).from('trainers').update({ avatar_url: publicUrl }).eq('id', trainerId)
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    router.refresh()
  }

  async function saveProfile() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()

    // Update auth metadata so the nav picks up the new name immediately
    await supabase.auth.updateUser({ data: { name } })

    const { error: err } = await (supabase as any)
      .from('trainers')
      .update({
        name,
        bio: bio || null,
        specialties,
        years_experience: years ? parseInt(years) : null,
        certification: certification || null,
      })
      .eq('id', trainerId)

    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setSaving(false)
    router.refresh()
  }

  async function saveBusiness() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('trainers')
      .update({
        studio_name: studioName || null,
        location: location || null,
        phone: phone || null,
        website: website || null,
        instagram: instagram || null,
      })
      .eq('id', trainerId)

    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setSaving(false)
    router.refresh()
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setSaving(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'business' as const, label: 'Business', icon: Briefcase },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ]

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-[#131519] border border-[#1E2229] rounded-xl p-1 w-fit">
        {tabs.map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSaved(false); setError(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-[#A8FF3A] text-[#0A0B0E]' : 'text-[#545B6A] hover:text-[#E8EAF0]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#25090A] border border-[#3D1010] px-4 py-3 text-sm text-[#FF6B6B]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-[#0A2415] border border-[#0F3020] px-4 py-3 text-sm text-[#22D17A]">
          <Check className="h-4 w-4 flex-shrink-0" />
          Changes saved successfully.
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar card */}
          <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-6 flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-2xl bg-[#0F2010] border-2 border-[#A8FF3A]/30 flex items-center justify-center flex-shrink-0 overflow-hidden group"
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                : <span className="text-3xl font-bold text-[#A8FF3A]">{name.charAt(0).toUpperCase() || '?'}</span>
              }
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading
                  ? <div className="h-5 w-5 border-2 border-[#A8FF3A] border-t-transparent rounded-full animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div>
              <p className="text-sm font-semibold text-[#E8EAF0]">{name || 'Your Name'}</p>
              <p className="text-xs text-[#545B6A] mt-0.5">{email}</p>
              <p className="text-xs text-[#3E4452] mt-2">Click the avatar to upload a photo.</p>
            </div>
          </div>

          {/* Join code card */}
          {joinCode && (
            <div className="bg-[#0C0D10] border border-[#A8FF3A]/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="h-4 w-4 text-[#A8FF3A]" />
                    <p className="text-xs font-semibold text-[#A8FF3A] uppercase tracking-wider">Your Invite Code</p>
                  </div>
                  <p className="text-xs text-[#545B6A] mb-4">Share this with clients so they can link their account to you.</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {joinCode.split('').map((char, i) => (
                        <div key={i} className="h-12 w-10 bg-[#131519] border border-[#1E2229] rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold text-[#A8FF3A]">{char}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyCode(joinCode)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        codeCopied
                          ? 'bg-[#0A2415] text-[#22D17A] border border-[#0F3020]'
                          : 'bg-[#131519] text-[#E8EAF0] border border-[#1E2229] hover:bg-[#1E2229]'
                      }`}
                    >
                      {codeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {codeCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <button
                    type="button"
                    onClick={() => copyCode(`${typeof window !== 'undefined' ? window.location.origin : ''}/client/link-trainer?code=${joinCode}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#545B6A] border border-[#1E2229] hover:bg-[#131519] transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-[#E8EAF0]">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Full Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={years}
                  onChange={e => setYears(e.target.value)}
                  className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Certification / Qualification</label>
              <input
                value={certification}
                onChange={e => setCertification(e.target.value)}
                className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                placeholder="e.g. NASM CPT, ACE, NSCA CSCS..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30 resize-none"
                placeholder="Tell clients about your background, philosophy, and what makes your training unique..."
              />
              <p className="text-[10px] text-[#3E4452]">{bio.length} / 500 characters</p>
            </div>

            {/* Specialties tag input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Specialties</label>
              <div className="relative">
                <div className="min-h-[44px] bg-[#131519] border border-[#1E2229] rounded-xl px-3 py-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#A8FF3A]/30">
                  {specialties.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-[#0F2010] text-[#A8FF3A] text-xs font-medium px-2.5 py-1 rounded-lg border border-[#1B3A20]">
                      {tag}
                      <button type="button" onClick={() => removeSpecialty(tag)} className="hover:text-white transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={specialtyInput}
                    onChange={e => { setSpecialtyInput(e.target.value); setShowSuggestions(true) }}
                    onKeyDown={handleSpecialtyKey}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder={specialties.length === 0 ? 'Add specialties...' : ''}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none"
                  />
                </div>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#131519] border border-[#1E2229] rounded-xl overflow-hidden z-10 shadow-lg">
                    {filteredSuggestions.slice(0, 6).map(s => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => addSpecialty(s)}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#E8EAF0] hover:bg-[#1E2229] flex items-center gap-2"
                      >
                        <Plus className="h-3 w-3 text-[#3E4452]" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#3E4452]">Press Enter or comma to add. Click suggestions to pick quickly.</p>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-xl hover:bg-[#C8FF6A] disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* BUSINESS TAB */}
      {activeTab === 'business' && (
        <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#E8EAF0]">Business Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Studio / Gym Name</label>
              <input
                value={studioName}
                onChange={e => setStudioName(e.target.value)}
                className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                placeholder="Elite Fitness Studio"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                placeholder="Amsterdam, Netherlands"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
              placeholder="+31 6 12345678"
            />
          </div>

          <div className="border-t border-[#1E2229] pt-5 space-y-4">
            <h3 className="text-xs font-semibold text-[#545B6A] uppercase tracking-wider">Online Presence</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Website</label>
              <div className="flex items-center bg-[#131519] border border-[#1E2229] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#A8FF3A]/30">
                <span className="px-3 text-xs text-[#3E4452] border-r border-[#1E2229] py-2.5 bg-[#0A0B0E]">https://</span>
                <input
                  value={website.replace(/^https?:\/\//, '')}
                  onChange={e => setWebsite(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none"
                  placeholder="yoursite.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Instagram</label>
              <div className="flex items-center bg-[#131519] border border-[#1E2229] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#A8FF3A]/30">
                <span className="px-3 text-xs text-[#3E4452] border-r border-[#1E2229] py-2.5 bg-[#0A0B0E]">@</span>
                <input
                  value={instagram.replace(/^@/, '')}
                  onChange={e => setInstagram(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none"
                  placeholder="yourusername"
                />
              </div>
            </div>
          </div>

          <button
            onClick={saveBusiness}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-xl hover:bg-[#C8FF6A] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Business Info'}
          </button>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-[#E8EAF0]">Account</h2>
            <div className="flex items-center justify-between py-3 border-b border-[#1E2229]">
              <div>
                <p className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Email Address</p>
                <p className="text-sm text-[#E8EAF0] mt-0.5">{email}</p>
              </div>
              <span className="text-xs bg-[#0A2415] text-[#22D17A] border border-[#0F3020] px-2.5 py-1 rounded-full">Verified</span>
            </div>
          </div>

          <div className="bg-[#0C0D10] border border-[#1E2229] rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-[#E8EAF0]">Change Password</h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#545B6A] uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-[#131519] border border-[#1E2229] rounded-xl px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#3E4452] focus:outline-none focus:ring-2 focus:ring-[#A8FF3A]/30"
                placeholder="Repeat new password"
              />
              {newPassword && confirmPassword && (
                <p className={`text-[10px] mt-1 ${newPassword === confirmPassword ? 'text-[#22D17A]' : 'text-[#FF6B6B]'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Password strength */}
            {newPassword && (
              <div className="space-y-1.5">
                <p className="text-xs text-[#545B6A]">Password strength</p>
                <div className="flex gap-1">
                  {[8, 12, 16, 20].map((threshold, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        newPassword.length >= threshold
                          ? i === 0 ? 'bg-[#FF6B6B]' : i === 1 ? 'bg-[#F5A623]' : i === 2 ? 'bg-[#22D17A]' : 'bg-[#A8FF3A]'
                          : 'bg-[#1E2229]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-[#3E4452]">
                  {newPassword.length < 8 ? 'Too short' : newPassword.length < 12 ? 'Weak' : newPassword.length < 16 ? 'Good' : newPassword.length < 20 ? 'Strong' : 'Very strong'}
                </p>
              </div>
            )}

            <button
              onClick={savePassword}
              disabled={saving || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#A8FF3A] text-[#0A0B0E] text-sm font-semibold rounded-xl hover:bg-[#C8FF6A] disabled:opacity-40 transition-colors"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          <div className="bg-[#0C0D10] border border-[#3D1010] rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-[#FF6B6B]">Danger Zone</h2>
            <p className="text-xs text-[#545B6A]">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button
              className="px-4 py-2 text-xs font-semibold text-[#FF6B6B] border border-[#3D1010] rounded-xl hover:bg-[#25090A] transition-colors"
              onClick={() => alert('Please contact support to delete your account.')}
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
