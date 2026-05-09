'use client'
import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'

const ALL_APPOINTMENTS = [
  {
    _id: 'da1', patientName: 'Rahul Sharma', patientInitials: 'RS',
    slotStart: '2025-03-18T09:00:00', slotEnd: '2025-03-18T09:30:00',
    mode: 'offline', status: 'confirmed', consultationFee: 800,
    notes: 'Recurring chest discomfort for 2 days.',
  },
  {
    _id: 'da2', patientName: 'Priya Das', patientInitials: 'PD',
    slotStart: '2025-03-18T10:00:00', slotEnd: '2025-03-18T10:30:00',
    mode: 'online', status: 'confirmed', consultationFee: 800,
    notes: 'Follow-up after ECG report.',
  },
  {
    _id: 'da3', patientName: 'Arjun Mehta', patientInitials: 'AM',
    slotStart: '2025-03-18T11:00:00', slotEnd: '2025-03-18T11:30:00',
    mode: 'online', status: 'confirmed', consultationFee: 800,
    notes: 'Shortness of breath during exercise.',
  },
  {
    _id: 'da4', patientName: 'Sunita Rao', patientInitials: 'SR',
    slotStart: '2025-03-18T14:00:00', slotEnd: '2025-03-18T14:30:00',
    mode: 'offline', status: 'confirmed', consultationFee: 800,
    notes: '',
  },
  {
    _id: 'da5', patientName: 'Kiran Patel', patientInitials: 'KP',
    slotStart: '2025-03-15T10:00:00', slotEnd: '2025-03-15T10:30:00',
    mode: 'online', status: 'completed', consultationFee: 800,
    notes: 'Palpitations.',
  },
  {
    _id: 'da6', patientName: 'Deepa Verma', patientInitials: 'DV',
    slotStart: '2025-03-14T09:30:00', slotEnd: '2025-03-14T10:00:00',
    mode: 'offline', status: 'completed', consultationFee: 800,
    notes: 'Annual cardiac check-up.',
  },
  {
    _id: 'da7', patientName: 'Raj Kumar', patientInitials: 'RK',
    slotStart: '2025-03-12T11:00:00', slotEnd: '2025-03-12T11:30:00',
    mode: 'offline', status: 'no-show', consultationFee: 800,
    notes: '',
  },
  {
    _id: 'da8', patientName: 'Meena Singh', patientInitials: 'MS',
    slotStart: '2025-03-20T15:00:00', slotEnd: '2025-03-20T15:30:00',
    mode: 'online', status: 'confirmed', consultationFee: 800,
    notes: 'High BP readings at home.',
  },
]

const TABS = [
  { id: 'today', label: "Today" },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function isToday(dateStr) {
  const d = new Date(dateStr)
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

export default function DoctorAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('today')
  const [searchQ, setSearchQ] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [selectedAppt, setSelectedAppt] = useState(null)

  const now = new Date()

  const filtered = ALL_APPOINTMENTS.filter(a => {
    const matchesTab =
      activeTab === 'today' ? isToday(a.slotStart) :
      activeTab === 'upcoming' ? new Date(a.slotStart) > now && a.status === 'confirmed' :
      activeTab === 'completed' ? a.status === 'completed' :
      true
    const matchesSearch = !searchQ || a.patientName.toLowerCase().includes(searchQ.toLowerCase())
    const matchesMode = modeFilter === 'all' || a.mode === modeFilter
    return matchesTab && matchesSearch && matchesMode
  }).sort((a, b) => new Date(a.slotStart) - new Date(b.slotStart))

  const tabCounts = {
    today: ALL_APPOINTMENTS.filter(a => isToday(a.slotStart)).length,
    upcoming: ALL_APPOINTMENTS.filter(a => new Date(a.slotStart) > now && a.status === 'confirmed').length,
    completed: ALL_APPOINTMENTS.filter(a => a.status === 'completed').length,
    all: ALL_APPOINTMENTS.length,
  }

  // Group by date for 'all' tab
  const grouped = filtered.reduce((acc, appt) => {
    const key = formatDate(appt.slotStart)
    if (!acc[key]) acc[key] = []
    acc[key].push(appt)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'online', 'offline'].map(m => (
            <button key={m} onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 capitalize
                ${modeFilter === m ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {m === 'online' ? '🎥 Online' : m === 'offline' ? '🏥 Offline' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today", value: tabCounts.today, color: 'text-primary-700', bg: 'bg-primary-50 border-primary-100' },
          { label: "Upcoming", value: tabCounts.upcoming, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: "Completed", value: tabCounts.completed, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          { label: "Total", value: tabCounts.all, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="flex border-b border-slate-100 px-5 gap-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 mr-4 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5
                ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
              {tabCounts[tab.id] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search patient name…" className="input-base pl-9 py-2 text-sm" />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm font-medium text-slate-700 mb-1">No appointments found</p>
            <p className="text-xs text-slate-400">
              {activeTab === 'today' ? "You have no appointments scheduled for today." : "No appointments match your filters."}
            </p>
          </div>
        ) : activeTab === 'all' ? (
          // Grouped by date
          <div className="divide-y divide-slate-100">
            {Object.entries(grouped).map(([date, appts]) => (
              <div key={date}>
                <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{date}</span>
                </div>
                {appts.map(appt => (
                  <AppointmentRow key={appt._id} appt={appt} onSelect={() => setSelectedAppt(appt)} selected={selectedAppt?._id === appt._id} />
                ))}
              </div>
            ))}
          </div>
        ) : activeTab === 'today' ? (
          // Timeline view for today
          <div className="p-5 space-y-3">
            {filtered.map((appt, i) => (
              <TodayTimelineRow key={appt._id} appt={appt} index={i} total={filtered.length} onSelect={() => setSelectedAppt(appt)} selected={selectedAppt?._id === appt._id} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(appt => (
              <AppointmentRow key={appt._id} appt={appt} onSelect={() => setSelectedAppt(appt)} selected={selectedAppt?._id === appt._id} />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedAppt && (
        <AppointmentDetail appt={selectedAppt} onClose={() => setSelectedAppt(null)} />
      )}
    </div>
  )
}

function TodayTimelineRow({ appt, index, total, onSelect, selected }) {
  const now = new Date()
  const start = new Date(appt.slotStart)
  const end = new Date(appt.slotEnd)
  const isPast = end < now
  const isCurrent = start <= now && now <= end
  const isNext = !isCurrent && !isPast && index === 0

  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-150 border
        ${selected ? 'border-primary-300 bg-primary-50/40' : isCurrent ? 'border-emerald-200 bg-emerald-50/40' : 'border-transparent hover:border-slate-200 hover:bg-slate-50/60'}`}
    >
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0 w-14">
        <span className={`text-xs font-semibold ${isCurrent ? 'text-emerald-600' : isPast ? 'text-slate-400' : 'text-slate-700'}`}>
          {formatTime(appt.slotStart)}
        </span>
        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0
          ${isCurrent ? 'bg-emerald-500 ring-4 ring-emerald-100' : isPast ? 'bg-slate-300' : isNext ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-slate-200'}`} />
        {index < total - 1 && <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[32px]" />}
      </div>

      {/* Patient card */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
          ${isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {appt.patientInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{appt.patientName}</span>
            {isCurrent && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">Now</span>}
            {isNext && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Next</span>}
            <StatusBadge status={appt.status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span className={appt.mode === 'online' ? 'text-emerald-600' : 'text-slate-500'}>
              {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
            </span>
            {appt.notes && <span className="truncate text-slate-400">· {appt.notes}</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {appt.mode === 'online' && appt.status === 'confirmed' && !isPast && (
          <Link href={`/doctor/consultation/${appt._id}`} onClick={e => e.stopPropagation()}
            className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors">
            Start
          </Link>
        )}
        <Link href={`/doctor/prescription/${appt._id}`} onClick={e => e.stopPropagation()}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
          Rx
        </Link>
      </div>
    </div>
  )
}

function AppointmentRow({ appt, onSelect, selected }) {
  const now = new Date()
  const isPast = new Date(appt.slotEnd) < now

  return (
    <div onClick={onSelect}
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 cursor-pointer transition-colors
        ${selected ? 'bg-primary-50/60' : 'hover:bg-slate-50/60'}`}>
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 flex-shrink-0">
        {appt.patientInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-800">{appt.patientName}</span>
          <StatusBadge status={appt.status} />
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
          <span>{formatDate(appt.slotStart)}</span>
          <span>·</span>
          <span>{formatTime(appt.slotStart)}</span>
          <span className={appt.mode === 'online' ? 'text-emerald-600' : 'text-slate-500'}>
            · {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {appt.mode === 'online' && appt.status === 'confirmed' && !isPast && (
          <Link href={`/doctor/consultation/${appt._id}`} onClick={e => e.stopPropagation()}
            className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors">
            Start Call
          </Link>
        )}
        <Link href={`/doctor/prescription/${appt._id}`} onClick={e => e.stopPropagation()}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
          Prescription
        </Link>
        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

function AppointmentDetail({ appt, onClose }) {
  return (
    <div className="bg-white rounded-2xl border border-primary-200 shadow-card p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600">
            {appt.patientInitials}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{appt.patientName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={appt.status} />
              <span className={`text-xs ${appt.mode === 'online' ? 'text-emerald-600' : 'text-slate-500'}`}>
                {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Date', value: formatDate(appt.slotStart) },
          { label: 'Time', value: `${formatTime(appt.slotStart)} – ${formatTime(appt.slotEnd)}` },
          { label: 'Fee', value: `₹${appt.consultationFee}` },
        ].map(item => (
          <div key={item.label} className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
            <p className="text-sm font-semibold text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>

      {appt.notes && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 mb-1">Patient's Note</p>
          <p className="text-sm text-slate-700">{appt.notes}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {appt.mode === 'online' && appt.status === 'confirmed' && (
          <Link href={`/doctor/consultation/${appt._id}`}
            className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors">
            Start Video Call
          </Link>
        )}
        <Link href={`/doctor/prescription/${appt._id}`}
          className="btn-primary text-sm px-4 py-2">
          Write Prescription
        </Link>
        {appt.status === 'confirmed' && (
          <button className="px-4 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors">
            Mark No-Show
          </button>
        )}
      </div>
    </div>
  )
}