'use client'
import { useState } from 'react'

const DAYS = [
  { dayOfWeek: 1, label: 'Monday',    short: 'Mon' },
  { dayOfWeek: 2, label: 'Tuesday',   short: 'Tue' },
  { dayOfWeek: 3, label: 'Wednesday', short: 'Wed' },
  { dayOfWeek: 4, label: 'Thursday',  short: 'Thu' },
  { dayOfWeek: 5, label: 'Friday',    short: 'Fri' },
  { dayOfWeek: 6, label: 'Saturday',  short: 'Sat' },
  { dayOfWeek: 0, label: 'Sunday',    short: 'Sun' },
]

const DEFAULT_AVAILABILITY = DAYS.map(d => ({
  dayOfWeek: d.dayOfWeek,
  isAvailable: d.dayOfWeek >= 1 && d.dayOfWeek <= 5,
  slots: d.dayOfWeek >= 1 && d.dayOfWeek <= 5
    ? [{ id: Date.now() + d.dayOfWeek, startTime: '09:00', endTime: '13:00' }]
    : [],
}))

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function validateSlots(slots) {
  for (const slot of slots) {
    if (!slot.startTime || !slot.endTime) return 'All time slots must have start and end times.'
    if (slot.startTime >= slot.endTime) return `Start time must be before end time.`
  }
  // Check overlaps
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].startTime < slots[j].endTime && slots[j].startTime < slots[i].endTime) {
        return 'Time slots overlap. Please fix the conflict.'
      }
    }
  }
  return null
}

export default function DoctorAvailabilityPage() {
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [copySourceDay, setCopySourceDay] = useState(null)
  const [copyModal, setCopyModal] = useState(false)
  const [copyTargets, setCopyTargets] = useState([])
  const [selectedDay, setSelectedDay] = useState(1) // currently selected dayOfWeek for mobile

  const getDay = (dow) => availability.find(a => a.dayOfWeek === dow)

  const toggleDay = (dow) => {
    setAvailability(prev => prev.map(a =>
      a.dayOfWeek === dow ? { ...a, isAvailable: !a.isAvailable, slots: !a.isAvailable && a.slots.length === 0 ? [{ id: generateId(), startTime: '09:00', endTime: '13:00' }] : a.slots } : a
    ))
  }

  const addSlot = (dow) => {
    setAvailability(prev => prev.map(a =>
      a.dayOfWeek === dow ? {
        ...a,
        slots: [...a.slots, { id: generateId(), startTime: '', endTime: '' }]
      } : a
    ))
  }

  const removeSlot = (dow, slotId) => {
    setAvailability(prev => prev.map(a =>
      a.dayOfWeek === dow ? { ...a, slots: a.slots.filter(s => s.id !== slotId) } : a
    ))
  }

  const updateSlot = (dow, slotId, field, value) => {
    setAvailability(prev => prev.map(a =>
      a.dayOfWeek === dow ? {
        ...a,
        slots: a.slots.map(s => s.id === slotId ? { ...s, [field]: value } : s)
      } : a
    ))
    setError('')
  }

  const openCopyModal = (dow) => {
    setCopySourceDay(dow)
    setCopyTargets([])
    setCopyModal(true)
  }

  const handleCopy = () => {
    const source = getDay(copySourceDay)
    if (!source) return
    setAvailability(prev => prev.map(a =>
      copyTargets.includes(a.dayOfWeek)
        ? { ...a, isAvailable: source.isAvailable, slots: source.slots.map(s => ({ ...s, id: generateId() })) }
        : a
    ))
    setCopyModal(false)
    setCopyTargets([])
  }

  const handleSave = async () => {
    // Validate all available days
    for (const day of availability) {
      if (day.isAvailable) {
        if (day.slots.length === 0) {
          setError(`${DAYS.find(d => d.dayOfWeek === day.dayOfWeek)?.label} is marked available but has no slots.`)
          return
        }
        const err = validateSlots(day.slots)
        if (err) { setError(err); return }
      }
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/doctor/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save.')
      setSuccess('Availability saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Manage Availability</h1>
          <p className="text-slate-500 text-sm mt-1">
            Set your weekly schedule. Patients can only book during your available slots.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary px-6 py-3 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </span>
          ) : 'Save All Changes'}
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Weekly summary pills */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(d => {
          const avail = getDay(d.dayOfWeek)
          return (
            <button
              key={d.dayOfWeek}
              onClick={() => setSelectedDay(d.dayOfWeek)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-150
                ${avail?.isAvailable
                  ? selectedDay === d.dayOfWeek
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300'
                  : selectedDay === d.dayOfWeek
                    ? 'bg-slate-700 border-slate-700 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
            >
              {d.short}
              {avail?.isAvailable && avail.slots.length > 0 && (
                <span className={`ml-1.5 text-xs ${selectedDay === d.dayOfWeek ? 'text-primary-100' : 'text-emerald-500'}`}>
                  {avail.slots.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Day cards — full weekly view on desktop */}
      <div className="hidden md:grid md:grid-cols-1 gap-4">
        {DAYS.map(day => {
          const avail = getDay(day.dayOfWeek)
          if (!avail) return null
          return (
            <DayCard
              key={day.dayOfWeek}
              day={day}
              avail={avail}
              onToggle={() => toggleDay(day.dayOfWeek)}
              onAddSlot={() => addSlot(day.dayOfWeek)}
              onRemoveSlot={(id) => removeSlot(day.dayOfWeek, id)}
              onUpdateSlot={(id, field, val) => updateSlot(day.dayOfWeek, id, field, val)}
              onCopy={() => openCopyModal(day.dayOfWeek)}
            />
          )
        })}
      </div>

      {/* Mobile: single day view */}
      <div className="md:hidden">
        {DAYS.map(day => {
          if (day.dayOfWeek !== selectedDay) return null
          const avail = getDay(day.dayOfWeek)
          if (!avail) return null
          return (
            <DayCard
              key={day.dayOfWeek}
              day={day}
              avail={avail}
              onToggle={() => toggleDay(day.dayOfWeek)}
              onAddSlot={() => addSlot(day.dayOfWeek)}
              onRemoveSlot={(id) => removeSlot(day.dayOfWeek, id)}
              onUpdateSlot={(id, field, val) => updateSlot(day.dayOfWeek, id, field, val)}
              onCopy={() => openCopyModal(day.dayOfWeek)}
            />
          )
        })}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={loading}
          className="btn-primary px-8 py-3 text-sm disabled:opacity-50">
          {loading ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      {/* Copy modal */}
      {copyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal p-6 max-w-sm w-full animate-slide-up">
            <h3 className="font-semibold text-slate-900 mb-1">Copy Slots To</h3>
            <p className="text-sm text-slate-500 mb-4">
              Copy {DAYS.find(d => d.dayOfWeek === copySourceDay)?.label}'s time slots to:
            </p>
            <div className="space-y-2 mb-6">
              {DAYS.filter(d => d.dayOfWeek !== copySourceDay).map(d => (
                <label key={d.dayOfWeek} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={copyTargets.includes(d.dayOfWeek)}
                    onChange={e => setCopyTargets(prev =>
                      e.target.checked ? [...prev, d.dayOfWeek] : prev.filter(t => t !== d.dayOfWeek)
                    )}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{d.label}</span>
                  {getDay(d.dayOfWeek)?.isAvailable && (
                    <span className="ml-auto text-xs text-slate-400">{getDay(d.dayOfWeek)?.slots.length} slots</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCopyModal(false)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
              <button
                onClick={handleCopy}
                disabled={copyTargets.length === 0}
                className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Copy to {copyTargets.length} day{copyTargets.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DayCard({ day, avail, onToggle, onAddSlot, onRemoveSlot, onUpdateSlot, onCopy }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-card transition-all duration-200 overflow-hidden
      ${avail.isAvailable ? 'border-slate-100' : 'border-slate-100 opacity-75'}`}>
      {/* Day header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${avail.isAvailable ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex items-center gap-3">
          {/* Toggle */}
          <button
            type="button"
            onClick={onToggle}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
              ${avail.isAvailable ? 'bg-primary-600' : 'bg-slate-300'}`}
            aria-label={avail.isAvailable ? 'Mark unavailable' : 'Mark available'}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
              ${avail.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <div>
            <span className="font-semibold text-slate-900 text-sm">{day.label}</span>
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full
              ${avail.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {avail.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        {avail.isAvailable && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="text-xs text-slate-500 hover:text-primary-600 border border-slate-200 hover:border-primary-200 bg-white hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to
            </button>
            <button
              type="button"
              onClick={onAddSlot}
              className="text-xs text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Slot
            </button>
          </div>
        )}
      </div>

      {/* Slots */}
      <div className="px-5 py-4">
        {!avail.isAvailable ? (
          <div className="flex flex-col items-center justify-center py-5 text-center">
            <div className="text-3xl mb-2 opacity-40">🚫</div>
            <p className="text-sm text-slate-400">Not available on {day.label}</p>
            <button onClick={onToggle}
              className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
              Mark Available
            </button>
          </div>
        ) : avail.slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-5 text-center">
            <p className="text-sm text-slate-400 mb-3">No slots added yet</p>
            <button onClick={onAddSlot}
              className="text-xs text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
              + Add First Slot
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {avail.slots.map((slot, idx) => (
              <div key={slot.id} className="flex items-center gap-3 group">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">Start</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => onUpdateSlot(slot.id, 'startTime', e.target.value)}
                        className="input-base py-2 text-sm"
                      />
                    </div>
                    <div className="text-slate-300 font-medium text-sm mt-4 flex-shrink-0">→</div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">End</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => onUpdateSlot(slot.id, 'endTime', e.target.value)}
                        className="input-base py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Duration badge */}
                  {slot.startTime && slot.endTime && slot.startTime < slot.endTime && (
                    <div className="hidden sm:flex flex-shrink-0 mt-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">
                        {(() => {
                          const [sh, sm] = slot.startTime.split(':').map(Number)
                          const [eh, em] = slot.endTime.split(':').map(Number)
                          const diff = (eh * 60 + em) - (sh * 60 + sm)
                          const hrs = Math.floor(diff / 60)
                          const mins = diff % 60
                          return hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Conflict warning */}
                  {slot.startTime && slot.endTime && slot.startTime >= slot.endTime && (
                    <span className="text-xs text-red-500 flex-shrink-0 mt-4">Invalid</span>
                  )}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemoveSlot(slot.id)}
                  className="mt-4 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Remove slot"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add another */}
            <button
              type="button"
              onClick={onAddSlot}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50 rounded-xl text-sm text-slate-400 hover:text-primary-600 transition-all duration-150 mt-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add another slot
            </button>
          </div>
        )}
      </div>
    </div>
  )
}