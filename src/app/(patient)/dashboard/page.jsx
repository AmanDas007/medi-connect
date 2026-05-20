'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import PatientSidebar from '@/components/patient/PatientSidebar'

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isUpcomingConfirmedTodayAppointment(appointment) {
  return (
    appointment.status === 'confirmed' &&
    new Date(appointment.slotEnd).getTime() > Date.now()
  )
}

function DoctorCard({ doctor }) {
  return (
    <Link
      href={`/doctors/${doctor._id}`}
      className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
            {doctor.profileUrl ? (
              <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-700 font-semibold">
                {getInitials(doctor.name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {doctor.name}
            </h3>
            <p className="text-sm text-primary-600 font-medium mt-0.5">
              {doctor.specialization}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="badge bg-emerald-50 text-emerald-700">
                ★ {doctor.averageRating || 0}
              </span>
              <span className="badge bg-slate-100 text-slate-600">
                {doctor.experienceYears || 0} yrs exp
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Fee</span>
            <span className="font-semibold text-slate-800">₹{doctor.consultationFee}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Clinic</span>
            <span className="font-medium text-slate-700 text-right">
              {doctor.clinic?.name || 'Clinic'}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Location</span>
            <span className="font-medium text-slate-700 text-right">
              {doctor.clinic?.city || 'City'}, {doctor.clinic?.state || 'State'}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 truncate pr-3">
            {doctor.clinic?.address || 'Clinic address'}
          </p>
          <span className="text-sm font-medium text-primary-600 shrink-0">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}

function ReminderCard({ appointment }) {
  const doctor = appointment.doctor

  return (
    <Link
      href={`/appointments/${appointment._id}`}
      className="block bg-white rounded-2xl border border-primary-100 shadow-card p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {doctor?.profileUrl ? (
            <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-primary-700">
              {getInitials(doctor?.name || 'Doctor')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary-600 mb-1">
                Today&apos;s Appointment
              </p>
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {doctor?.name || 'Doctor'}
              </h3>
              <p className="text-sm text-slate-500 truncate mt-0.5">
                {doctor?.specialization || 'Specialist'}
              </p>
            </div>

            <span className="badge bg-blue-50 text-blue-700 capitalize">
              {appointment.mode}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-primary-50 p-3">
              <p className="text-xs text-primary-500">Slot</p>
              <p className="text-sm font-semibold text-primary-700 mt-1">
                {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xs text-emerald-600">Status</p>
              <p className="text-sm font-semibold text-emerald-700 mt-1 capitalize">
                {appointment.status}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Fee Paid</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                ₹{appointment.payment?.amount || doctor?.consultationFee || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function PatientDashboardPage() {
  const { status } = useSession()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [doctorsError, setDoctorsError] = useState('')

  const [loggedInUser, setLoggedInUser] = useState(null)
  const [meLoading, setMeLoading] = useState(false)

  const [todayAppointments, setTodayAppointments] = useState([])
  const [todayAppointmentsLoading, setTodayAppointmentsLoading] = useState(false)

  const isLoggedIn = status === 'authenticated'
  const user = loggedInUser

  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorsLoading(true)
      setDoctorsError('')

      try {
        const res = await fetch('/api/doctors', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!res.ok) {
          setDoctorsError(data.message || 'Failed to fetch doctors.')
          return
        }

        setDoctors(data.doctors || [])
      } catch (error) {
        setDoctorsError('Something went wrong while fetching doctors.')
      } finally {
        setDoctorsLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  useEffect(() => {
    const fetchMe = async () => {
      if (status !== 'authenticated') {
        setLoggedInUser(null)
        return
      }

      setMeLoading(true)

      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setLoggedInUser(data.user)
        } else {
          setLoggedInUser(null)
        }
      } catch (error) {
        setLoggedInUser(null)
      } finally {
        setMeLoading(false)
      }
    }

    fetchMe()
  }, [status])

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      if (status !== 'authenticated') {
        setTodayAppointments([])
        return
      }

      setTodayAppointmentsLoading(true)

      try {
        const res = await fetch('/api/patient/appointments/today', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (res.ok && data.success) {
          const upcomingConfirmedAppointments = (data.appointments || []).filter(
            isUpcomingConfirmedTodayAppointment
          )

          setTodayAppointments(upcomingConfirmedAppointments)
        } else {
          setTodayAppointments([])
        }
      } catch {
        setTodayAppointments([])
      } finally {
        setTodayAppointmentsLoading(false)
      }
    }

    fetchTodayAppointments()
  }, [status])

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return doctors

    return doctors.filter(doctor => {
      const searchText = [
        doctor.name,
        doctor.specialization,
        doctor.clinic?.city,
        doctor.clinic?.state,
        doctor.clinic?.address,
        doctor.clinic?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchText.includes(q)
    })
  }, [query, doctors])

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
      <PatientSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

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
                  {isLoggedIn ? (meLoading || !user ? 'Loading...' : user.name) : 'to this platform'}
                </h1>
              </div>
            </div>

            {isLoggedIn ? (
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden hover:ring-[3px] hover:ring-primary-500/10 transition-all"
              >
                {meLoading || !user ? (
                  <div className="w-full h-full bg-slate-100 animate-pulse" />
                ) : user?.profileUrl ? (
                  <img src={user.profileUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-primary-700">
                    {getInitials(user?.name || 'Patient')}
                  </span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Find the right doctor for your care
              </h2>
              <p className="text-primary-100 text-sm md:text-base mt-3">
                Search by doctor name, specialization, symptom, clinic, or city.
              </p>
            </div>
          </section>

          {isLoggedIn && (todayAppointmentsLoading || todayAppointments.length > 0) && (
            <section className="mt-6">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="section-title">Reminder</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Your upcoming confirmed appointments for today
                  </p>
                </div>
              </div>

              {todayAppointmentsLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-14 bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {todayAppointments.map(appointment => (
                    <ReminderCard key={appointment._id} appointment={appointment} />
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-card p-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 pl-3 text-2xl">⌕</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by doctor name, specialization, city, clinic..."
                className="flex-1 py-3 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-3"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Available Doctors</h2>
              <p className="text-sm text-slate-500 mt-1">
                {doctorsLoading
                  ? 'Loading doctors...'
                  : `${filteredDoctors.length} doctor(s) found`}
              </p>
            </div>
          </div>

          {doctorsError && (
            <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {doctorsError}
            </div>
          )}

          {doctorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
              {[1, 2, 3].map(item => (
                <div key={item} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
              {filteredDoctors.map(doctor => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <div className="text-4xl mb-3">🔎</div>
              <h3 className="font-semibold text-slate-900">No doctors found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Try searching with a different name, specialization, or city.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}