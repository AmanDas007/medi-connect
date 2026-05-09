'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import StatusBadge from '@/components/StatusBadge'

const TODAY_APPOINTMENTS = [
  {
    _id: 'ta1', patientName: 'Rahul Sharma', slotStart: '2025-02-18T09:00:00',
    slotEnd: '2025-02-18T09:30:00', mode: 'offline', status: 'confirmed',
    patientInitials: 'RS',
  },
  {
    _id: 'ta2', patientName: 'Priya Das', slotStart: '2025-02-18T10:00:00',
    slotEnd: '2025-02-18T10:30:00', mode: 'online', status: 'confirmed',
    patientInitials: 'PD',
  },
  {
    _id: 'ta3', patientName: 'Arjun Mehta', slotStart: '2025-02-18T11:00:00',
    slotEnd: '2025-02-18T11:30:00', mode: 'online', status: 'confirmed',
    patientInitials: 'AM',
  },
  {
    _id: 'ta4', patientName: 'Sunita Rao', slotStart: '2025-02-18T14:00:00',
    slotEnd: '2025-02-18T14:30:00', mode: 'offline', status: 'confirmed',
    patientInitials: 'SR',
  },
]

const STATS = [
  { label: "Today's Appointments", value: '4', icon: '📅', bg: 'bg-primary-50', text: 'text-primary-700' },
  { label: 'This Week', value: '18', icon: '📆', bg: 'bg-blue-50', text: 'text-blue-700' },
  { label: 'Total Patients', value: '142', icon: '👥', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { label: 'Avg. Rating', value: '4.8★', icon: '⭐', bg: 'bg-amber-50', text: 'text-amber-700' },
]

const WEEKLY_EARNINGS = [
  { day: 'Mon', amount: 2400 }, { day: 'Tue', amount: 1800 }, { day: 'Wed', amount: 3200 },
  { day: 'Thu', amount: 2800 }, { day: 'Fri', amount: 3600 }, { day: 'Sat', amount: 1200 },
  { day: 'Sun', amount: 0 },
]
const maxEarning = Math.max(...WEEKLY_EARNINGS.map(e => e.amount))

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function DoctorDashboard() {
  const { data: session } = useSession()
  const user = session?.user
  const firstName = user?.name?.split(' ')[0] || 'Doctor'

  const now = new Date()
  const currentHour = now.getHours()
  const currentMin = now.getMinutes()

  const getNextAppt = () => {
    return TODAY_APPOINTMENTS.find(a => {
      const start = new Date(a.slotStart)
      return start.getHours() > currentHour || (start.getHours() === currentHour && start.getMinutes() > currentMin)
    })
  }
  const nextAppt = getNextAppt()

  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning'
    if (currentHour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/doctor/availability" className="btn-secondary text-sm px-4 py-2">
            Manage Availability
          </Link>
          <Link href="/doctor/appointments" className="btn-primary text-sm px-4 py-2">
            View All
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-white`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`font-display text-2xl font-bold ${stat.text} mb-0.5`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Next appointment alert */}
      {nextAppt && (
        <div className="bg-primary-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
              {nextAppt.patientInitials}
            </div>
            <div>
              <p className="text-white/70 text-xs mb-0.5">Next appointment</p>
              <p className="text-white font-semibold text-sm">{nextAppt.patientName}</p>
              <p className="text-primary-200 text-xs mt-0.5">
                {formatTime(nextAppt.slotStart)} · {nextAppt.mode === 'online' ? '🎥 Video Call' : '🏥 In-Clinic'}
              </p>
            </div>
          </div>
          {nextAppt.mode === 'online' && (
            <Link href={`/doctor/consultation/${nextAppt._id}`}
              className="px-4 py-2 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-colors flex-shrink-0">
              Join Call
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Today's Schedule</h2>
            <span className="text-xs text-slate-400">{TODAY_APPOINTMENTS.length} appointments</span>
          </div>

          <div className="divide-y divide-slate-100">
            {TODAY_APPOINTMENTS.map((appt, i) => {
              const startTime = new Date(appt.slotStart)
              const isPast = startTime < now
              const isCurrent = startTime.getHours() === currentHour

              return (
                <div key={appt._id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isCurrent ? 'bg-primary-50' : isPast ? 'opacity-50' : ''}`}>
                  {/* Time */}
                  <div className="w-14 flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-700">{formatTime(appt.slotStart)}</p>
                  </div>

                  {/* Timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-primary-600 ring-4 ring-primary-200' : isPast ? 'bg-slate-300' : 'bg-slate-300'}`} />
                    {i < TODAY_APPOINTMENTS.length - 1 && <div className="w-px h-8 bg-slate-200 mt-1" />}
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                      {appt.patientInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{appt.patientName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${appt.mode === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                          {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {appt.mode === 'online' && !isPast && (
                      <Link href={`/doctor/consultation/${appt._id}`}
                        className="px-2.5 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                        Start
                      </Link>
                    )}
                    <Link href={`/doctor/prescription/${appt._id}`}
                      className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Rx
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Weekly earnings bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Weekly Revenue</h3>
              <span className="text-xs text-emerald-600 font-medium">₹{WEEKLY_EARNINGS.reduce((a, e) => a + e.amount, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {WEEKLY_EARNINGS.map(({ day, amount }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative flex items-end" style={{ height: 64 }}>
                    <div
                      className="w-full rounded-t-md bg-primary-200 hover:bg-primary-400 transition-colors cursor-pointer"
                      style={{ height: amount > 0 ? `${(amount / maxEarning) * 64}px` : 4 }}
                      title={`₹${amount}`}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: '/doctor/availability', label: 'Update Availability', icon: '🕐' },
                { href: '/doctor/appointments', label: 'All Appointments', icon: '📋' },
                { href: '/doctor/profile', label: 'Edit Profile', icon: '✏️' },
                { href: '/doctor/report', label: 'Report an Issue', icon: '🔔' },
              ].map(action => (
                <Link key={action.href} href={action.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="text-base">{action.icon}</span>
                  <span className="text-sm text-slate-700 font-medium">{action.label}</span>
                  <svg className="w-4 h-4 text-slate-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent feedback */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Feedback</h3>
            <div className="space-y-3">
              {[
                { name: 'Rahul S.', rating: 5, comment: 'Very thorough and patient. Explained everything clearly.' },
                { name: 'Meera K.', rating: 5, comment: 'Excellent doctor, highly recommend!' },
              ].map((fb, i) => (
                <div key={i} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{fb.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: fb.rating }).map((_, j) => (
                        <span key={j} className="text-amber-400 text-xs">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">"{fb.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}