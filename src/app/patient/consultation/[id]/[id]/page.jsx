'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const MOCK_CONSULTATION = {
  appointmentId: 'a1',
  doctorName: 'Dr. Ananya Krishnan',
  specialization: 'Cardiologist',
  doctorInitials: 'AK',
  slotStart: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min from now
  slotEnd: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
  vcStatus: 'scheduled', // 'scheduled' | 'started' | 'ended'
  meetingUrl: null, // Provided by backend when doctor starts
}

export default function PatientConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const [consultation, setConsultation] = useState(MOCK_CONSULTATION)
  const [timeLeft, setTimeLeft] = useState('')
  const [polling, setPolling] = useState(true)
  const [joined, setJoined] = useState(false)

  // Countdown to slot
  useEffect(() => {
    const tick = () => {
      const diff = new Date(consultation.slotStart) - new Date()
      if (diff <= 0) {
        setTimeLeft('Your appointment time has started')
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}m ${secs}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [consultation.slotStart])

  // Poll for doctor joining (simulate)
  useEffect(() => {
    if (!polling) return
    const id = setInterval(async () => {
      // Simulated: in real app, poll GET /api/vc/:appointmentId
      // When vcStatus becomes 'started', meetingUrl will be populated
    }, 5000)
    return () => clearInterval(id)
  }, [polling, params.id])

  const handleJoin = () => {
    if (consultation.meetingUrl) {
      window.open(consultation.meetingUrl, '_blank')
    } else {
      setJoined(true)
    }
  }

  const slotStarted = new Date(consultation.slotStart) <= new Date()
  const isLive = consultation.vcStatus === 'started'
  const hasEnded = consultation.vcStatus === 'ended'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/patient/appointments" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to appointments
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">Video Consultation</h1>
      </div>

      {/* Main waiting card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Status banner */}
        <div className={`px-6 py-3 flex items-center gap-2 ${isLive ? 'bg-emerald-500' : hasEnded ? 'bg-slate-200' : 'bg-primary-600'}`}>
          {isLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-sm font-semibold">Live — Doctor is waiting</span>
            </>
          ) : hasEnded ? (
            <span className="text-slate-600 text-sm font-medium">Consultation has ended</span>
          ) : (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm font-medium">Waiting for doctor to start the call…</span>
            </>
          )}
        </div>

        <div className="p-8 text-center">
          {/* Doctor avatar */}
          <div className={`w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center font-display text-3xl font-bold
            border-4 transition-all duration-500
            ${isLive ? 'bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-primary-50 border-primary-200 text-primary-500'}`}>
            {consultation.doctorInitials}
          </div>

          <h2 className="font-display text-xl font-bold text-slate-900 mb-1">{consultation.doctorName}</h2>
          <p className="text-sm text-primary-600 font-medium mb-1">{consultation.specialization}</p>

          {/* Countdown / status */}
          {!hasEnded && !isLive && (
            <div className="mt-5 mb-6">
              <p className="text-xs text-slate-400 mb-1">Appointment starts in</p>
              <p className={`font-mono text-2xl font-bold ${slotStarted ? 'text-emerald-600' : 'text-slate-800'}`}>
                {slotStarted ? 'Now' : timeLeft}
              </p>
            </div>
          )}

          {isLive && (
            <div className="mt-5 mb-6">
              <p className="text-xs text-emerald-600 font-medium">Doctor has started the session</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
              </div>
            </div>
          )}

          {/* Join button */}
          {!hasEnded && (
            <button
              onClick={handleJoin}
              disabled={!isLive && !slotStarted}
              className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                ${isLive
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            >
              {isLive ? '🎥 Join Video Call' : slotStarted ? 'Waiting for Doctor…' : 'Join when it starts'}
            </button>
          )}

          {hasEnded && (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-slate-500">The consultation has been completed.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/patient/prescriptions`}
                  className="btn-primary text-sm px-5 py-2.5 text-center">
                  View Prescription
                </Link>
                <Link href={`/patient/feedback/${consultation.appointmentId}`}
                  className="btn-secondary text-sm px-5 py-2.5 text-center">
                  Give Feedback
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!hasEnded && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Before Your Call</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { emoji: '🔇', title: 'Find a quiet space', desc: "Ensure you're in a well-lit, quiet environment." },
              { emoji: '📶', title: 'Check your connection', desc: 'Stable internet ensures a smooth consultation.' },
              { emoji: '💊', title: 'Keep reports handy', desc: 'Have your previous reports or prescription ready.' },
              { emoji: '🔋', title: 'Charge your device', desc: 'Ensure your device has sufficient battery.' },
            ].map(tip => (
              <div key={tip.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="text-xl flex-shrink-0">{tip.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{tip.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slot info */}
      <div className="bg-primary-50 rounded-2xl border border-primary-100 p-4 flex items-center gap-3">
        <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-primary-700">
          Your slot: {new Date(consultation.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} –{' '}
          {new Date(consultation.slotEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          {' '}· 30 minutes
        </p>
      </div>
    </div>
  )
}