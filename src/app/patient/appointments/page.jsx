'use client'
import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'

const ALL_APPOINTMENTS = [
  {
    _id: 'a1', doctorName: 'Dr. Ananya Krishnan', specialization: 'Cardiologist',
    slotStart: '2025-03-18T16:00:00', slotEnd: '2025-03-18T16:30:00',
    mode: 'online', status: 'confirmed', consultationFee: 800,
    clinicName: 'Apollo Heart Centre', clinicCity: 'Mumbai',
    doctorInitials: 'AK', feedbackGiven: false,
  },
  {
    _id: 'a2', doctorName: 'Dr. Raj Yadav', specialization: 'General Physician',
    slotStart: '2025-03-20T10:00:00', slotEnd: '2025-03-20T10:30:00',
    mode: 'offline', status: 'confirmed', consultationFee: 400,
    clinicName: 'City Health Clinic', clinicCity: 'Delhi',
    doctorInitials: 'RY', feedbackGiven: false,
  },
  {
    _id: 'a3', doctorName: 'Dr. Priya Mehta', specialization: 'Dermatologist',
    slotStart: '2025-02-10T14:00:00', slotEnd: '2025-02-10T14:30:00',
    mode: 'offline', status: 'completed', consultationFee: 600,
    clinicName: 'Skin & Care Clinic', clinicCity: 'Bangalore',
    doctorInitials: 'PM', feedbackGiven: true,
  },
  {
    _id: 'a4', doctorName: 'Dr. Suresh Nair', specialization: 'Orthopedic Surgeon',
    slotStart: '2025-01-22T11:00:00', slotEnd: '2025-01-22T11:30:00',
    mode: 'offline', status: 'completed', consultationFee: 1000,
    clinicName: 'Bone & Joint Hospital', clinicCity: 'Chennai',
    doctorInitials: 'SN', feedbackGiven: false,
  },
  {
    _id: 'a5', doctorName: 'Dr. Fatima Sheikh', specialization: 'Gynecologist',
    slotStart: '2025-01-15T18:30:00', slotEnd: '2025-01-15T19:00:00',
    mode: 'online', status: 'cancelled', consultationFee: 700,
    clinicName: 'Womens Health Centre', clinicCity: 'Hyderabad',
    doctorInitials: 'FS', feedbackGiven: false, cancelledBy: 'patient',
  },
  {
    _id: 'a6', doctorName: 'Dr. Vikram Patel', specialization: 'Neurologist',
    slotStart: '2025-03-10T09:00:00', slotEnd: '2025-03-10T09:30:00',
    mode: 'online', status: 'pending-payment', consultationFee: 1200,
    clinicName: 'Neuro Care Hospital', clinicCity: 'Pune',
    doctorInitials: 'VP', feedbackGiven: false,
  },
]

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function PatientAppointmentsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [cancelModal, setCancelModal] = useState(null) // appointment id
  const [cancelling, setCancelling] = useState(false)

  const now = new Date()

  const filtered = ALL_APPOINTMENTS.filter(a => {
    const matchesTab = activeTab === 'all' ? true
      : activeTab === 'upcoming' ? (a.status === 'confirmed' || a.status === 'pending-payment') && new Date(a.slotStart) >= now
      : activeTab === 'completed' ? a.status === 'completed'
      : activeTab === 'cancelled' ? (a.status === 'cancelled' || a.status === 'expired')
      : true
    const matchesSearch = !searchQ || a.doctorName.toLowerCase().includes(searchQ.toLowerCase()) || a.specialization.toLowerCase().includes(searchQ.toLowerCase())
    return matchesTab && matchesSearch
  }).sort((a, b) => new Date(b.slotStart) - new Date(a.slotStart))

  const handleCancel = async () => {
    setCancelling(true)
    await new Promise(r => setTimeout(r, 800))
    setCancelling(false)
    setCancelModal(null)
    // In real app: call API and update state
  }

  const tabCounts = {
    all: ALL_APPOINTMENTS.length,
    upcoming: ALL_APPOINTMENTS.filter(a => (a.status === 'confirmed' || a.status === 'pending-payment') && new Date(a.slotStart) >= now).length,
    completed: ALL_APPOINTMENTS.filter(a => a.status === 'completed').length,
    cancelled: ALL_APPOINTMENTS.filter(a => a.status === 'cancelled' || a.status === 'expired').length,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage all your consultations</p>
        </div>
        <Link href="/doctors" className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap">
          + Book New
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 mr-3 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap flex items-center gap-2
                ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
              {tabCounts[tab.id] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search doctor or specialization…"
              className="input-base pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-sm font-medium text-slate-700 mb-1">No appointments found</p>
              <p className="text-xs text-slate-400 mb-5">
                {searchQ ? 'Try adjusting your search.' : 'You have no appointments in this category yet.'}
              </p>
              <Link href="/doctors" className="btn-primary text-xs px-4 py-2">Find a Doctor</Link>
            </div>
          ) : (
            filtered.map(appt => (
              <AppointmentRow
                key={appt._id}
                appt={appt}
                onCancel={() => setCancelModal(appt._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Cancel Appointment?</h3>
              <p className="text-sm text-slate-500">This action cannot be undone. Any payment may be refunded per policy.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)}
                className="btn-secondary flex-1 text-sm py-2.5">Keep It</button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentRow({ appt, onCancel }) {
  const [expanded, setExpanded] = useState(false)
  const now = new Date()
  const isUpcoming = new Date(appt.slotStart) >= now && (appt.status === 'confirmed' || appt.status === 'pending-payment')

  return (
    <div className="hover:bg-slate-50/60 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* Doctor avatar */}
        <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600 flex-shrink-0">
          {appt.doctorInitials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-slate-800">{appt.doctorName}</p>
            <StatusBadge status={appt.status} />
          </div>
          <p className="text-xs text-primary-600 font-medium">{appt.specialization}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span>{formatDate(appt.slotStart)}</span>
            <span>·</span>
            <span>{formatTime(appt.slotStart)} – {formatTime(appt.slotEnd)}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${appt.mode === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-700">₹{appt.consultationFee}</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40 animate-fade-in">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Pending payment — pay now */}
            {appt.status === 'pending-payment' && (
              <Link href={`/patient/appointments/${appt._id}/pay`}
                className="btn-primary text-xs px-4 py-2">
                Pay Now
              </Link>
            )}

            {/* Upcoming online — join */}
            {isUpcoming && appt.mode === 'online' && appt.status === 'confirmed' && (
              <Link href={`/patient/consultation/${appt._id}`}
                className="px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-xl hover:bg-emerald-600 transition-colors">
                Join Call
              </Link>
            )}

            {/* Completed — prescription */}
            {appt.status === 'completed' && (
              <Link href={`/patient/prescriptions?appointmentId=${appt._id}`}
                className="btn-secondary text-xs px-4 py-2">
                View Prescription
              </Link>
            )}

            {/* Completed no feedback */}
            {appt.status === 'completed' && !appt.feedbackGiven && (
              <Link href={`/patient/feedback/${appt._id}`}
                className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium rounded-xl hover:bg-amber-100 transition-colors">
                Leave Feedback
              </Link>
            )}

            {/* Completed with feedback */}
            {appt.status === 'completed' && appt.feedbackGiven && (
              <span className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-medium rounded-xl">
                ✓ Feedback given
              </span>
            )}

            {/* Can cancel */}
            {isUpcoming && (
              <button onClick={onCancel}
                className="px-4 py-2 border border-red-200 text-red-500 text-xs font-medium rounded-xl hover:bg-red-50 transition-colors">
                Cancel
              </button>
            )}

            {/* Clinic info */}
            <span className="text-xs text-slate-400 ml-auto">
              {appt.clinicName}, {appt.clinicCity}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}