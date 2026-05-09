'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// In real app, fetch payment status from API using appointmentId/paymentId
const MOCK_PAYMENT = {
  status: 'paid', // 'paid' | 'failed' | 'pending'
  amount: 850,
  gatewayPaymentId: 'pay_OxTk9231ABZxq',
  doctorName: 'Dr. Ananya Krishnan',
  specialization: 'Cardiologist',
  date: '18 March 2025',
  time: '4:00 PM – 4:30 PM',
  mode: 'online',
  appointmentId: 'appt_001',
}

export default function PaymentStatusPage() {
  const sp = useSearchParams()
  const status = sp.get('status') || MOCK_PAYMENT.status
  const payment = MOCK_PAYMENT

  if (status === 'paid') {
    return <PaymentSuccess payment={payment} />
  } else if (status === 'failed') {
    return <PaymentFailed payment={payment} />
  } else {
    return <PaymentPending />
  }
}

function PaymentSuccess({ payment }) {
  return (
    <div className="max-w-lg mx-auto pt-10 pb-20 px-4 animate-fade-in">
      {/* Success icon */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 relative">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {/* Confetti dots */}
          {['top-0 right-0', 'top-2 -left-3', '-bottom-1 left-2', '-bottom-2 right-0'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-3 h-3 rounded-full ${['bg-emerald-400', 'bg-primary-400', 'bg-amber-400', 'bg-purple-400'][i]}`} />
          ))}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Booking Confirmed!</h1>
        <p className="text-slate-500 text-sm">Your appointment has been successfully booked and payment received.</p>
      </div>

      {/* Booking summary card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-5">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-900">{payment.doctorName}</p>
            <p className="text-sm text-primary-600 font-medium mt-0.5">{payment.specialization}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Amount Paid</p>
            <p className="text-xl font-bold text-slate-900">₹{payment.amount}</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Date', value: payment.date },
            { label: 'Time', value: payment.time },
            {
              label: 'Mode',
              value: payment.mode === 'online' ? '🎥 Video Consultation' : '🏥 In-Clinic Visit'
            },
            { label: 'Payment ID', value: payment.gatewayPaymentId, mono: true },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-500">{row.label}</span>
              <span className={`text-sm font-medium text-slate-800 ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status pill */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
          Appointment Confirmed
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {payment.mode === 'online' && (
          <Link href={`/patient/consultation/${payment.appointmentId}`}
            className="btn-primary text-sm py-3 text-center rounded-xl">
            Join When It's Time
          </Link>
        )}
        <Link href="/patient/appointments"
          className="btn-secondary text-sm py-3 text-center rounded-xl">
          View My Appointments
        </Link>
        <Link href="/doctors"
          className="btn-secondary text-sm py-3 text-center rounded-xl sm:col-span-2">
          Book Another Appointment
        </Link>
      </div>

      {/* Info note */}
      <div className="mt-6 bg-primary-50 rounded-xl p-4 border border-primary-100">
        <p className="text-xs text-primary-700 leading-relaxed">
          📧 A confirmation has been sent to your registered email. You'll receive a reminder 1 hour before your appointment.
        </p>
      </div>
    </div>
  )
}

function PaymentFailed({ payment }) {
  return (
    <div className="max-w-lg mx-auto pt-10 pb-20 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
      <p className="text-slate-500 text-sm mb-8">
        Your payment could not be processed. No amount has been deducted. Please try again.
      </p>
      <div className="grid gap-3">
        <Link href={`/patient/appointments/${payment.appointmentId}/pay`}
          className="btn-primary text-sm py-3 text-center rounded-xl">
          Try Again
        </Link>
        <Link href="/patient/appointments"
          className="btn-secondary text-sm py-3 text-center rounded-xl">
          Go to Appointments
        </Link>
      </div>
    </div>
  )
}

function PaymentPending() {
  return (
    <div className="max-w-lg mx-auto pt-10 pb-20 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Processing Payment…</h1>
      <p className="text-slate-500 text-sm mb-8">
        Please wait while we verify your payment. Do not refresh or close this page.
      </p>
      <p className="text-xs text-slate-400">This usually takes a few seconds.</p>
    </div>
  )
}