'use client'

import { useEffect, useMemo, useState } from 'react'
import DoctorSidebar from '@/components/doctor/DoctorSidebar'

const APPLICANTS_PER_PAGE = 6

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

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getPageNumbers(page, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 3) {
    return [1, 2, 3, 4, totalPages]
  }

  if (page >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, page - 1, page, page + 1, totalPages]
}

function StatusBadge({ status }) {
  const cls =
    status === 'confirmed'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : status === 'pending-payment'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status === 'pending-payment' ? 'Pending Payment' : status}
    </span>
  )
}

function ApplicantCard({ appointment }) {
  const patient = appointment.patient

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {patient?.profileUrl ? (
            <img
              src={patient.profileUrl}
              alt={patient.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-primary-700">
              {getInitials(patient?.name || appointment.patientName || 'Patient')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {patient?.name || appointment.patientName || 'Patient'}
              </h3>
              <p className="text-sm text-slate-500 truncate mt-0.5">
                {patient?.email || 'Email not available'}
              </p>
            </div>

            <StatusBadge status={appointment.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-slate-400">Time</p>
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

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs text-slate-400">Payment</p>
              <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">
                {appointment.payment?.status || 'Not found'}
              </p>
            </div>
          </div>

          {patient?.isBlocked && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs font-medium text-red-700">
                This patient account is currently blocked.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoctorApplicantsPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [date, setDate] = useState(getTodayDateString())
  const [statusFilter, setStatusFilter] = useState('confirmed')
  const [page, setPage] = useState(1)

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pagination, setPagination] = useState({
    page: 1,
    limit: APPLICANTS_PER_PAGE,
    totalAppointments: 0,
    totalPages: 0,
    hasPrevPage: false,
    hasNextPage: false,
  })

  const minDate = useMemo(() => getTodayDateString(), [])

  const pageNumbers = useMemo(() => {
    return getPageNumbers(page, pagination.totalPages || 0)
  }, [page, pagination.totalPages])

  const fetchApplicants = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        date,
        status: statusFilter,
        page: String(page),
        limit: String(APPLICANTS_PER_PAGE),
      })

      const res = await fetch(`/api/doctor/applicants?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to fetch applicants.')
        setAppointments([])
        setPagination({
          page: 1,
          limit: APPLICANTS_PER_PAGE,
          totalAppointments: 0,
          totalPages: 0,
          hasPrevPage: false,
          hasNextPage: false,
        })
        return
      }

      setAppointments(data.appointments || [])

      setPagination(data.pagination || {
        page,
        limit: APPLICANTS_PER_PAGE,
        totalAppointments: data.appointments?.length || 0,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
      })

      if (
        data.pagination?.totalPages > 0 &&
        page > data.pagination.totalPages
      ) {
        setPage(data.pagination.totalPages)
      }
    } catch {
      setError('Something went wrong while fetching applicants.')
      setAppointments([])
      setPagination({
        page: 1,
        limit: APPLICANTS_PER_PAGE,
        totalAppointments: 0,
        totalPages: 0,
        hasPrevPage: false,
        hasNextPage: false,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants()
  }, [date, statusFilter, page])

  return (
    <div className="min-h-screen bg-surface-2">
      <DoctorSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="lg:pl-64">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center cursor-pointer"
            >
              <span className="text-xl leading-none">≡</span>
            </button>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Patient Applicants
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Check upcoming patient bookings by date
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />

            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                View upcoming patients
              </h2>
              <p className="text-primary-100 text-sm md:text-base mt-3">
                Select a future date to see confirmed patient appointments for that day.
              </p>
            </div>
          </section>

          <section className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-card p-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_160px] gap-4 items-end">
              <div>
                <label className="label">Select Date</label>
                <input
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={e => {
                    setDate(e.target.value)
                    setPage(1)
                  }}
                  className="input-base cursor-pointer"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="input-base cursor-pointer"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending Payment</option>
                  <option value="all">All</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchApplicants}
                className="btn-primary w-full py-3 cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </section>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="section-title">
                Applicants for {formatDate(date)}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {loading
                  ? 'Loading applicants...'
                  : `${pagination.totalAppointments || 0} appointment(s) found`}
              </p>
            </div>
          </div>

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
                    <div className="w-14 h-14 rounded-2xl bg-slate-200" />
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
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
                {appointments.map(appointment => (
                  <ApplicantCard
                    key={appointment._id}
                    appointment={appointment}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-slate-500 text-center sm:text-left">
                      Showing page{' '}
                      <span className="font-semibold text-slate-800">
                        {pagination.page}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-slate-800">
                        {pagination.totalPages}
                      </span>
                    </p>

                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={!pagination.hasPrevPage || loading}
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>

                      {pageNumbers.map((item, index) => {
                        const active = item === page

                        return (
                          <button
                            key={`${item}-${index}`}
                            type="button"
                            onClick={() => setPage(item)}
                            disabled={active || loading}
                            className={`cursor-pointer min-w-10 px-3 py-2 rounded-xl border text-sm font-medium transition-all disabled:cursor-not-allowed ${
                              active
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      })}

                      <button
                        type="button"
                        disabled={!pagination.hasNextPage || loading}
                        onClick={() => setPage(prev => prev + 1)}
                        className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-card p-10 text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                No applicants found
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                No patient appointments are available for the selected date and status.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}