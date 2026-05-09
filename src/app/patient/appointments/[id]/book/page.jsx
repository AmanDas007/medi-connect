'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const MOCK_DOCTOR = {
  _id: '1', name: 'Dr. Ananya Krishnan', specialization: 'Cardiologist',
  experienceYears: 12, consultationFee: 800, averageRating: 4.8,
  clinic: { name: 'Apollo Heart Centre', address: '14-B Linking Road, Bandra West', city: 'Mumbai' },
  profileUrl: null,
}

function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const doctorId = sp.get('doctorId') || '1'
  const date = sp.get('date') || new Date().toISOString().split('T')[0]
  const slotStart = sp.get('slotStart') || '10:00'
  const slotEnd = sp.get('slotEnd') || '10:30'
  const mode = sp.get('mode') || 'offline'

  const doctor = MOCK_DOCTOR
  const initials = doctor.name.split(' ').map(w => w[0]).join('').slice(0, 2)

  const [notes, setNotes] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const platformFee = 50
  const total = doctor.consultationFee + platformFee

  const handleBook = async () => {
    if (!agreed) { setError('Please agree to the terms before proceeding.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, date, slotStart, slotEnd, mode, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Booking failed.')
      // Redirect to payment
      router.push(`/patient/appointments/${data.appointmentId}/pay`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href={`/doctors/${doctorId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to doctor profile
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">Confirm Appointment</h1>
        <p className="text-slate-500 text-sm mt-1">Review your booking details before proceeding to payment</p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: Details */}
        <div className="md:col-span-3 space-y-5">
          {/* Doctor card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Consulting With</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                {doctor.profileUrl
                  ? <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover rounded-xl" />
                  : <span className="font-semibold text-xl text-primary-400">{initials}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-slate-900">{doctor.name}</p>
                <p className="text-sm text-primary-600 font-medium mt-0.5">{doctor.specialization}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{doctor.experienceYears} yrs exp</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <span className="text-amber-400">★</span> {doctor.averageRating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Appointment Details</h2>
            <div className="space-y-3">
              <InfoRow label="Date" value={formatDateFull(date)} />
              <InfoRow label="Time" value={`${slotStart} – ${slotEnd}`} />
              <InfoRow label="Mode"
                value={
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${mode === 'online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {mode === 'online' ? '🎥 Video Consultation' : '🏥 In-Clinic Visit'}
                  </span>
                }
              />
              {mode === 'offline' && (
                <InfoRow label="Clinic"
                  value={<span className="text-right text-xs leading-relaxed">{doctor.clinic.name}<br /><span className="text-slate-400">{doctor.clinic.address}</span></span>}
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Describe your concern <span className="font-normal text-slate-400">(optional)</span></h2>
            <p className="text-xs text-slate-400 mb-3">Briefly mention your symptoms or reason for visit. This helps the doctor prepare.</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Chest discomfort for 2 days, slight shortness of breath…"
              rows={3}
              maxLength={500}
              className="input-base resize-none text-sm"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{notes.length}/500</p>
          </div>
        </div>

        {/* Right: Payment summary */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Payment Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Consultation fee</span>
                <span className="font-medium text-slate-800">₹{doctor.consultationFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Platform fee</span>
                <span className="font-medium text-slate-800">₹{platformFee}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">₹{total}</span>
              </div>
            </div>

            {/* Payment methods info */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-slate-500">Secure payment via Razorpay / Stripe</p>
            </div>

            {/* Agree */}
            <label className="flex items-start gap-2.5 cursor-pointer mb-5">
              <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setError('') }}
                className="mt-0.5 w-4 h-4 rounded accent-primary-600 cursor-pointer" />
              <span className="text-xs text-slate-500 leading-relaxed">
                I agree to MediConnect's{' '}
                <a href="#" className="text-primary-600 hover:underline">cancellation policy</a> and{' '}
                <a href="#" className="text-primary-600 hover:underline">terms of service</a>.
              </span>
            </label>

            <button
              onClick={handleBook}
              disabled={loading}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing…
                </span>
              ) : `Proceed to Pay ₹${total}`}
            </button>

            <p className="text-xs text-slate-400 text-center mt-3">
              Payment must be completed within 10 minutes of booking
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium text-right">{value}</span>
    </div>
  )
}