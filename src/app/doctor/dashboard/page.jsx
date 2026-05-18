'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import DoctorSidebar from '@/components/doctor/DoctorSidebar'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getTodayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'pending-payment') return 'Pending Payment'
  return status
}

function PatientCard({ appointment }) {
  const patient = appointment.patient

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
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {patient?.name || appointment.patientName || 'Patient'}
          </h3>

          <p className="text-sm text-slate-500 truncate mt-0.5">
            {patient?.email || 'Email not available'}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge bg-blue-50 text-blue-700">
              {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
            </span>

            <span className="badge bg-emerald-50 text-emerald-700 capitalize">
              {appointment.mode}
            </span>

            <span
              className={`badge ${
                appointment.status === 'confirmed'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {getStatusLabel(appointment.status)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DoctorDashboardPage() {
  const { status } = useSession()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [todayAppointments, setTodayAppointments] = useState([])
  const [statusFilter, setStatusFilter] = useState('confirmed')

  const [doctorLoading, setDoctorLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [error, setError] = useState('')

  const isLoggedIn = status === 'authenticated'

  useEffect(() => {
    const fetchDoctor = async () => {
      if (status !== 'authenticated') {
        setDoctorLoading(false)
        return
      }

      setDoctorLoading(true)

      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setDoctor(data.user)
        } else {
          setError(data.message || 'Failed to fetch doctor profile.')
        }
      } catch {
        setError('Something went wrong while fetching doctor profile.')
      } finally {
        setDoctorLoading(false)
      }
    }

    fetchDoctor()
  }, [status])

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      if (status !== 'authenticated') {
        setAppointmentsLoading(false)
        return
      }

      setAppointmentsLoading(true)

      try {
        const today = getTodayDateString()

        const res = await fetch(`/api/doctor/applicants?date=${today}&status=${statusFilter}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setTodayAppointments(data.appointments || [])
        } else {
          setTodayAppointments([])
        }
      } catch {
        setTodayAppointments([])
      } finally {
        setAppointmentsLoading(false)
      }
    }

    fetchTodayAppointments()
  }, [status, statusFilter])

  const todayAvailability = useMemo(() => {
    if (!doctor?.availability) return null

    const today = new Date().getDay()

    return doctor.availability.find(day => day.dayOfWeek === today)
  }, [doctor])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading…</span>
        </div>
      </div>
    )
  }

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

              <div>
                <p className="text-xs text-slate-400">Welcome,</p>
                <h1 className="text-lg font-semibold text-slate-900">
                  {isLoggedIn ? (doctorLoading ? 'Loading...' : doctor?.name || 'Doctor') : 'Guest'}
                </h1>
              </div>
            </div>

            {isLoggedIn ? (
              <Link
                href="/doctor/profile"
                className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden hover:ring-[3px] hover:ring-primary-500/10 transition-all"
              >
                {doctorLoading || !doctor ? (
                  <div className="w-full h-full bg-slate-100 animate-pulse" />
                ) : doctor?.profileUrl ? (
                  <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-primary-700">
                    {getInitials(doctor?.name || 'Doctor')}
                  </span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <Link href="/login" className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link href="/register/doctor" className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />

            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Manage your clinic smoothly
              </h2>
              <p className="text-primary-100 text-sm md:text-base mt-3">
                Track today’s booked patients, availability, feedbacks, and consultation history from one place.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 mt-6">
            <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="section-title">Today&apos;s Booked Patients</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {appointmentsLoading
                      ? 'Loading today appointments...'
                      : `${todayAppointments.length} appointment(s) found today`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="input-base text-sm py-2 sm:w-44"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending Payment</option>
                    <option value="all">All</option>
                  </select>

                  <Link
                    href="/doctor/applicants"
                    className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700 sm:justify-center"
                  >
                    View by date →
                  </Link>
                </div>
              </div>

              {appointmentsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(item => (
                    <div key={item} className="rounded-2xl border border-slate-100 p-5 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-2/3" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                          <div className="h-6 bg-slate-100 rounded w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todayAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayAppointments.map(appointment => (
                    <PatientCard key={appointment._id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-2 border border-slate-100 p-10 text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="font-semibold text-slate-900">No bookings today</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Patients who book today&apos;s appointments will appear here based on the selected status.
                  </p>
                </div>
              )}
            </section>

            <aside className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 h-fit">
              <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Availability</h2>
              <p className="text-sm text-slate-500 mt-1">
                {DAYS[new Date().getDay()]}
              </p>

              <div className="mt-5">
                {doctorLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-slate-200 rounded-xl" />
                    <div className="h-10 bg-slate-200 rounded-xl" />
                  </div>
                ) : todayAvailability?.isAvailable && todayAvailability?.slots?.length > 0 ? (
                  <div className="space-y-2">
                    {todayAvailability.slots.map((slot, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          Slot {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-primary-700">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-sm font-medium text-slate-700">Not available today</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Update your availability from profile.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}