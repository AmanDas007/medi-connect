'use client'

import { useEffect, useState } from 'react'
import DoctorSidebar from '@/components/doctor/DoctorSidebar'

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status) {
  if (status === 'completed') return 'Completed'
  if (status === 'not-done') return 'Not Done'
  if (status === 'confirmed') return 'Not Done'
  if (status === 'no-show') return 'Not Done'
  return status
}

function getStatusClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'not-done') return 'bg-orange-50 text-orange-700 border-orange-200'
  if (status === 'confirmed') return 'bg-orange-50 text-orange-700 border-orange-200'
  if (status === 'no-show') return 'bg-orange-50 text-orange-700 border-orange-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function HistoryCard({ appointment }) {
  const patient = appointment.patient
  const historyStatus = appointment.historyStatus || appointment.status

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {patient?.profileUrl ? (
            <img src={patient.profileUrl} alt={patient.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-primary-700">
              {getInitials(patient?.name || appointment.patientName || 'Patient')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {patient?.name || appointment.patientName || 'Patient'}
              </h3>

              <p className="text-sm text-slate-500 truncate mt-0.5">
                {patient?.email || 'Email not available'}
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusClass(historyStatus)}`}
            >
              {getStatusLabel(historyStatus)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-xs text-blue-500">Date</p>
              <p className="text-sm font-semibold text-blue-700 mt-1">
                {formatDate(appointment.slotStart)}
              </p>
            </div>

            <div className="rounded-xl bg-primary-50 p-3">
              <p className="text-xs text-primary-500">Slot</p>
              <p className="text-sm font-semibold text-primary-700 mt-1">
                {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Fee</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                ₹{appointment.payment?.amount || 0}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="badge bg-slate-100 text-slate-600 capitalize">
              {appointment.mode || 'offline'}
            </span>

            <span className="badge bg-slate-100 text-slate-600">
              Payment: {appointment.payment?.status || 'N/A'}
            </span>
          </div>

          {historyStatus === 'not-done' && (
            <div className="mt-4 rounded-2xl bg-orange-50 border border-orange-200 p-3">
              <p className="text-xs text-orange-700 leading-relaxed">
                This appointment slot is already over, but it was not marked as completed.
              </p>
            </div>
          )}

          {historyStatus === 'completed' && (
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-xs text-emerald-700 leading-relaxed">
                This appointment was completed successfully.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoctorHistoryPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState('all')
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    all: 0,
    completed: 0,
    notDone: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/doctor/history?status=${statusFilter}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to fetch history.')
        setAppointments([])
        return
      }

      const filteredAppointments = (data.appointments || []).filter(
        appointment => appointment.status !== 'cancelled'
      )

      setAppointments(filteredAppointments)
      setStats(data.stats || {
        all: 0,
        completed: 0,
        notDone: 0,
      })
    } catch {
      setError('Something went wrong while fetching history.')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [statusFilter])

  return (
    <div className="min-h-screen bg-surface-2">
      <DoctorSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="lg:pl-64">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center"
              >
                <span className="text-xl leading-none">≡</span>
              </button>
              <h1 className="text-lg font-semibold text-slate-900">History</h1>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />

            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Consultation History
              </h2>
              <p className="text-primary-100 text-sm md:text-base mt-3">
                View your completed and missed past appointments in one place.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400">All Past</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.all}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400">Not Done</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.notDone}</p>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="section-title">Past Appointments</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {loading
                    ? 'Loading history...'
                    : `${appointments.length} appointment(s) found`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="input-base text-sm py-2 sm:w-44"
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="not-done">Not Done</option>
                </select>

                <button
                  type="button"
                  onClick={fetchHistory}
                  className="sm:hidden px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                {[1, 2, 3, 4].map(item => (
                  <div key={item} className="rounded-2xl border border-slate-100 p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-2/3" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-16 bg-slate-100 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                {appointments.map(appointment => (
                  <HistoryCard key={appointment._id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <div className="mt-5 bg-surface-2 rounded-2xl border border-slate-100 p-10 text-center">
                <div className="text-4xl mb-3">📜</div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  No history found
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Past completed or not-done appointments will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}