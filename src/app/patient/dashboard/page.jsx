'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import StatusBadge from '@/components/StatusBadge'

// Mock data
const UPCOMING_APPOINTMENTS = [
  {
    _id: 'a1',
    doctorName: 'Dr. Ananya Krishnan',
    specialization: 'Cardiologist',
    slotStart: '2025-02-18T16:00:00',
    slotEnd: '2025-02-18T16:30:00',
    mode: 'online',
    status: 'confirmed',
    clinicName: 'Apollo Heart Centre',
    doctorInitials: 'AK',
  },
  {
    _id: 'a2',
    doctorName: 'Dr. Raj Yadav',
    specialization: 'General Physician',
    slotStart: '2025-02-20T10:00:00',
    slotEnd: '2025-02-20T10:30:00',
    mode: 'offline',
    status: 'confirmed',
    clinicName: 'City Health Clinic',
    doctorInitials: 'RY',
  },
]

const PAST_APPOINTMENTS = [
  {
    _id: 'a3',
    doctorName: 'Dr. Priya Mehta',
    specialization: 'Dermatologist',
    slotStart: '2025-02-10T14:00:00',
    mode: 'offline',
    status: 'completed',
    feedbackGiven: true,
    doctorInitials: 'PM',
  },
]

const STATS = [
  { label: 'Total Appointments', value: '12', color: 'bg-primary-50 text-primary-700', icon: '📅' },
  { label: 'Completed', value: '9', color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
  { label: 'Upcoming', value: '2', color: 'bg-blue-50 text-blue-700', icon: '🔔' },
  { label: 'Prescriptions', value: '7', color: 'bg-purple-50 text-purple-700', icon: '📋' },
]

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function PatientDashboard() {
  const { data: session } = useSession()
  const user = session?.user
  const firstName = user?.name?.split(' ')[0] || 'there'

  const [activeTab, setActiveTab] = useState('upcoming')

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
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
          <p className="text-slate-500 text-sm mt-1">Here's what's happening with your health today.</p>
        </div>
        <Link href="/doctors" className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap">
          + Book Appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(stat => (
          <div key={stat.label} className={`rounded-2xl p-4 ${stat.color.split(' ')[0]} border border-white`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`font-display text-2xl font-bold ${stat.color.split(' ')[1]} mb-0.5`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/doctors" className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3
          hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">🔍</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Find a Doctor</p>
            <p className="text-xs text-slate-400">Search by symptom or name</p>
          </div>
        </Link>
        <Link href="/patient/prescriptions" className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3
          hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">📋</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">View Prescriptions</p>
            <p className="text-xs text-slate-400">Download your prescriptions</p>
          </div>
        </Link>
        <Link href="/patient/profile" className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-3
          hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg flex-shrink-0">👤</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Update Profile</p>
            <p className="text-xs text-slate-400">Manage your account info</p>
          </div>
        </Link>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Appointments</h2>
          <Link href="/patient/appointments" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5">
          {['upcoming', 'past'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors duration-150 capitalize
                ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {activeTab === 'upcoming' && (
            UPCOMING_APPOINTMENTS.length === 0 ? (
              <EmptyAppointments type="upcoming" />
            ) : (
              UPCOMING_APPOINTMENTS.map(appt => (
                <AppointmentCard key={appt._id} appt={appt} type="upcoming" />
              ))
            )
          )}
          {activeTab === 'past' && (
            PAST_APPOINTMENTS.length === 0 ? (
              <EmptyAppointments type="past" />
            ) : (
              PAST_APPOINTMENTS.map(appt => (
                <AppointmentCard key={appt._id} appt={appt} type="past" />
              ))
            )
          )}
        </div>
      </div>

      {/* Health tip banner */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-white text-sm font-semibold mb-1">💡 Health Reminder</p>
          <p className="text-emerald-50 text-xs leading-relaxed max-w-md">
            Stay consistent with your follow-up appointments. Regular check-ups help detect health issues early.
          </p>
        </div>
        <Link href="/doctors" className="flex-shrink-0 px-4 py-2 bg-white text-accent-700 text-xs font-semibold rounded-xl hover:bg-emerald-50 transition-colors">
          Book Now
        </Link>
      </div>
    </div>
  )
}

function AppointmentCard({ appt, type }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
      {/* Doctor avatar */}
      <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600 flex-shrink-0">
        {appt.doctorInitials}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-800">{appt.doctorName}</p>
          <StatusBadge status={appt.status} />
        </div>
        <p className="text-xs text-primary-600 font-medium">{appt.specialization}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(appt.slotStart)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(appt.slotStart)}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${appt.mode === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
            {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2 flex-shrink-0">
        {type === 'upcoming' && appt.mode === 'online' && appt.status === 'confirmed' && (
          <Link href={`/patient/consultation/${appt._id}`}
            className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors">
            Join Call
          </Link>
        )}
        {type === 'past' && !appt.feedbackGiven && (
          <Link href={`/patient/feedback/${appt._id}`}
            className="px-3 py-1.5 border border-primary-200 text-primary-600 text-xs font-medium rounded-lg hover:bg-primary-50 transition-colors">
            Leave Feedback
          </Link>
        )}
        <Link href={`/patient/appointments`}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
          Details
        </Link>
      </div>
    </div>
  )
}

function EmptyAppointments({ type }) {
  return (
    <div className="text-center py-10">
      <div className="text-4xl mb-3">{type === 'upcoming' ? '📅' : '📋'}</div>
      <p className="text-sm font-medium text-slate-700 mb-1">
        {type === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
      </p>
      <p className="text-xs text-slate-400 mb-4">
        {type === 'upcoming' ? 'Book a consultation with a doctor today.' : 'Your completed appointments will appear here.'}
      </p>
      {type === 'upcoming' && (
        <Link href="/doctors" className="btn-primary text-xs px-4 py-2">Find Doctors</Link>
      )}
    </div>
  )
}