'use client'

import PatientSidebar from '@/components/patient/PatientSidebar'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

function getStatusClass(status) {
  if (status === 'confirmed') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'pending-payment') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'expired') return 'bg-slate-100 text-slate-600 border-slate-200'
  if (status === 'no-show') return 'bg-orange-50 text-orange-700 border-orange-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function getStatusLabel(status) {
  if (status === 'pending-payment') return 'Pending Payment'
  if (status === 'no-show') return 'No Show'
  return status
}

export default function AppointmentDetailPage() {
  const params = useParams()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const appointmentId = params?.appointmentId

  const fetchAppointment = async () => {
    if (!appointmentId) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/patient/appointments/${appointmentId}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to fetch appointment.')
        setAppointment(null)
        return
      }

      setAppointment(data.appointment)
    } catch {
      setError('Something went wrong while fetching appointment.')
      setAppointment(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointment()
  }, [appointmentId])

  const handleCancelAppointment = async () => {
    if (!appointment?._id || cancelLoading) return

    setCancelLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/patient/appointments/${appointment._id}/cancel`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to cancel appointment.')
        return
      }

      setShowCancelConfirm(false)
      setMessage(data.message || 'Appointment cancelled successfully.')
      await fetchAppointment()
    } catch {
      setError('Something went wrong while cancelling appointment.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2">
        <PatientSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 animate-pulse">
              <div className="flex gap-5">
                <div className="w-24 h-24 rounded-3xl bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-20 bg-slate-100 rounded-2xl mt-5" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!appointment || error) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 text-center max-w-md">
          <div className="text-4xl mb-3">📅</div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Appointment not found
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {error || 'The appointment you are looking for does not exist.'}
          </p>
          <Link href="/appointments" className="btn-primary mt-6">
            Back to Appointments
          </Link>
        </div>
      </div>
    )
  }

  const doctor = appointment.doctor
  const refundAmount = appointment.refundPreview?.refundAmount ?? 0
  const cancellationFee = appointment.refundPreview?.cancellationFee ?? 0

  return (
    <div className="min-h-screen bg-surface-2">
      <PatientSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (!cancelLoading) setShowCancelConfirm(false)
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚠️</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900 text-center">
              Cancel appointment?
            </h2>

            <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
              You are about to cancel your appointment with{' '}
              <span className="font-semibold text-slate-700">
                {doctor?.name || 'Doctor'}
              </span>.
            </p>

            <div className="mt-5 rounded-2xl bg-surface-2 border border-slate-100 p-4 space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Appointment Slot</span>
                <span className="font-semibold text-slate-800 text-right">
                  {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-semibold text-slate-800">
                  ₹{appointment.payment?.amount || 0}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Cancellation Fee</span>
                <span className={cancellationFee > 0 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-600'}>
                  ₹{cancellationFee}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between gap-4 text-sm">
                <span className="text-slate-500 font-medium">Refund Amount</span>
                <span className="font-bold text-primary-700">
                  ₹{refundAmount}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs text-amber-700 leading-relaxed">
                {cancellationFee > 0
                  ? `Since this cancellation is within 2 hours of the appointment slot, ₹${cancellationFee} will be deducted and ₹${refundAmount} will be refunded.`
                  : `You are cancelling before the last 2 hours, so full refund of ₹${refundAmount} will be initiated.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setShowCancelConfirm(false)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleCancelAppointment}
                className="px-5 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

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

              <Link href="/appointments" className="text-sm font-medium text-slate-500 hover:text-primary-600">
                ← Back to appointments
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6">
              <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-28 h-28 rounded-3xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                    {doctor?.profileUrl ? (
                      <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold text-primary-700">
                        {getInitials(doctor?.name || 'Doctor')}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="font-display text-3xl font-bold text-slate-900">
                          {doctor?.name || 'Doctor'}
                        </h1>
                        <p className="text-primary-600 font-medium mt-1">
                          {doctor?.specialization || 'Specialist'}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                          <span className="badge bg-blue-50 text-blue-700 capitalize">
                            {appointment.mode}
                          </span>
                          <span className="badge bg-slate-100 text-slate-600">
                            {doctor?.experienceYears || 0} yrs experience
                          </span>
                        </div>
                      </div>

                      <div className="bg-primary-50 rounded-2xl px-5 py-4">
                        <p className="text-xs text-primary-500">Consultation Fee</p>
                        <p className="text-2xl font-bold text-primary-700">
                          ₹{doctor?.consultationFee || appointment.payment?.amount || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
                <h2 className="section-title mb-5">Appointment Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {formatDate(appointment.slotStart)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Slot</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Mode</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">
                      {appointment.mode}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">
                      {getStatusLabel(appointment.status)}
                    </p>
                  </div>

                  {appointment.cancelledAt && (
                    <div className="md:col-span-2 rounded-2xl bg-red-50 border border-red-100 p-5">
                      <p className="text-xs text-red-500">Cancellation</p>
                      <p className="text-sm font-semibold text-red-700 mt-1">
                        Cancelled by {appointment.cancelledBy} on {formatDate(appointment.cancelledAt)} at {formatTime(appointment.cancelledAt)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
                <h2 className="section-title mb-5">Clinic Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Clinic Name</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {doctor?.clinic?.name || 'Clinic'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {doctor?.clinic?.city || 'City'}, {doctor?.clinic?.state || 'State'}
                    </p>
                  </div>

                  <div className="md:col-span-2 rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Full Address</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {doctor?.clinic?.address || 'Address'}, {doctor?.clinic?.city || 'City'}, {doctor?.clinic?.state || 'State'} - {doctor?.clinic?.pincode || 'Pincode'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <aside className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 h-fit xl:sticky xl:top-24">
              <h2 className="text-lg font-semibold text-slate-900">
                Payment Summary
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">Payment Status</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {appointment.payment?.status || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="font-semibold text-slate-800">
                    ₹{appointment.payment?.amount || 0}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">Refund Amount</span>
                  <span className="font-semibold text-slate-800">
                    ₹{appointment.payment?.refundAmount || 0}
                  </span>
                </div>

                {appointment.payment?.paidAt && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-400">Paid At</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {formatDate(appointment.payment.paidAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Refund Policy
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    If you cancel the appointment before the last 2 hours of the booked slot,
                    the full paid amount will be refunded.
                  </p>

                  <p>
                    If you cancel the appointment within the last 2 hours before the slot starts,
                    ₹50 will be deducted as a cancellation fee and the remaining amount will be refunded.
                  </p>

                  <p>
                    Refunds are initiated to the same payment method used during booking.
                    The final credit time may depend on the payment provider or bank.
                  </p>
                </div>
              </div>

              {appointment.canCancel && appointment.refundPreview && (
                <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Cancellation Refund
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {appointment.refundPreview.isWithinLastTwoHours
                      ? `Cancelling within 2 hours deducts ₹${appointment.refundPreview.cancellationFee}. Refund: ₹${appointment.refundPreview.refundAmount}.`
                      : `You are eligible for full refund of ₹${appointment.refundPreview.refundAmount}.`}
                  </p>
                </div>
              )}

              {appointment.canCancel ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelLoading}
                  className="w-full mt-6 px-5 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Cancellation not available
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Only upcoming confirmed appointments can be cancelled.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}