'use client'

import PatientSidebar from '@/components/patient/PatientSidebar'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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

function getStatusClass(status, isMissed) {
  if (isMissed) return 'bg-orange-50 text-orange-700 border-orange-200'
  if (status === 'confirmed') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'pending-payment') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'expired') return 'bg-slate-100 text-slate-600 border-slate-200'
  if (status === 'no-show') return 'bg-orange-50 text-orange-700 border-orange-200'

  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function getStatusLabel(status, isMissed) {
  if (isMissed) return 'Confirmed but missed'
  if (status === 'pending-payment') return 'Pending Payment'
  if (status === 'no-show') return 'No Show'
  return status
}

function AppointmentCard({ appointment }) {
  const doctor = appointment.doctor

  return (
    <Link
      href={`/appointments/${appointment._id}`}
      className="block bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
          {doctor?.profileUrl ? (
            <img
              src={doctor.profileUrl}
              alt={doctor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary-700 font-semibold">
              {getInitials(doctor?.name || 'Doctor')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {doctor?.name || 'Doctor'}
              </h3>

              <p className="text-sm text-primary-600 font-medium mt-0.5">
                {doctor?.specialization || 'Specialist'}
              </p>

              <p className="text-xs text-slate-400 mt-1 truncate">
                {doctor?.clinic?.name || 'Clinic'} · {doctor?.clinic?.city || 'City'}
              </p>
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusClass(
                appointment.status,
                appointment.isMissed
              )}`}
            >
              {getStatusLabel(appointment.status, appointment.isMissed)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-slate-400">Date</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {formatDate(appointment.slotStart)}
              </p>
            </div>

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-slate-400">Slot</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
              </p>
            </div>

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-slate-400">Mode</p>
              <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">
                {appointment.mode}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Payment:{' '}
              <span className="capitalize">
                {appointment.payment?.status || 'N/A'}
              </span>
              {appointment.payment?.refundAmount > 0 && (
                <span> · Refund ₹{appointment.payment.refundAmount}</span>
              )}
            </p>

            <span className="text-sm font-medium text-primary-600">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function PatientAppointmentsPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const [activeTab, setActiveTab] = useState('upcoming')
  const [upcomingStatus, setUpcomingStatus] = useState('all')
  const [pastStatus, setPastStatus] = useState('all')

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentStatus = activeTab === 'upcoming' ? upcomingStatus : pastStatus

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/patient/appointments?type=${activeTab}&status=${currentStatus}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to fetch appointments.')
        setAppointments([])
        return
      }

      setAppointments(data.appointments || [])
    } catch {
      setError('Something went wrong while fetching appointments.')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [activeTab, upcomingStatus, pastStatus])

  return (
    <div className="min-h-screen bg-surface-2">
      <PatientSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="lg:pl-64">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center"
            >
              <span className="text-xl leading-none">≡</span>
            </button>

            <h1 className="text-lg font-semibold text-slate-900">
              My Appointments
            </h1>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />

            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Track your appointments
              </h2>

              <p className="text-primary-100 text-sm md:text-base mt-3">
                View upcoming consultations, past visits, payments, and cancellation status.
              </p>
            </div>
          </section>

          <section className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-card p-5">
            <div className="grid grid-cols-2 gap-2 bg-surface-2 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-primary-700 shadow-card'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Upcoming
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'past'
                    ? 'bg-white text-primary-700 shadow-card'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Past
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 items-end">
              <div>
                <h2 className="section-title">
                  {activeTab === 'upcoming' ? 'Upcoming Appointments' : 'Past Appointments'}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {loading
                    ? 'Loading appointments...'
                    : `${appointments.length} appointment(s) found`}
                </p>
              </div>

              {activeTab === 'upcoming' ? (
                <select
                  value={upcomingStatus}
                  onChange={e => setUpcomingStatus(e.target.value)}
                  className="input-base"
                >
                  <option value="all">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending Payment</option>
                </select>
              ) : (
                <select
                  value={pastStatus}
                  onChange={e => setPastStatus(e.target.value)}
                  className="input-base"
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="missed">Confirmed but missed</option>
                  <option value="expired">Expired</option>
                </select>
              )}
            </div>
          </section>

          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
              {[1, 2, 3, 4].map(item => (
                <div
                  key={item}
                  className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="grid grid-cols-3 gap-3 pt-3">
                        <div className="h-14 bg-slate-100 rounded-xl" />
                        <div className="h-14 bg-slate-100 rounded-xl" />
                        <div className="h-14 bg-slate-100 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : appointments.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
              {appointments.map(appointment => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-card p-10 text-center">
              <div className="text-4xl mb-3">📅</div>

              <h2 className="font-display text-2xl font-bold text-slate-900">
                No appointments found
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                {activeTab === 'upcoming'
                  ? 'Your upcoming appointments will appear here after booking.'
                  : 'Your past appointments will appear here.'}
              </p>

              {activeTab === 'upcoming' && (
                <Link href="/dashboard" className="btn-primary mt-6">
                  Find Doctors
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}