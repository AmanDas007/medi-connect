'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const MOCK_CONSULTATION = {
  appointmentId: 'da2',
  patientName: 'Priya Das',
  patientInitials: 'PD',
  slotStart: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // started 2 mins ago
  slotEnd: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
  vcStatus: 'scheduled', // 'scheduled' | 'started' | 'ended'
  meetingUrl: null,
}

export default function DoctorConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const [consultation, setConsultation] = useState(MOCK_CONSULTATION)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [endingLoading, setEndingLoading] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const [notes, setNotes] = useState('')

  // Elapsed timer when session is running
  useEffect(() => {
    if (!sessionStarted || sessionEnded) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [sessionStarted, sessionEnded])

  const formatElapsed = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const handleStart = async () => {
    setStartLoading(true)
    try {
      // In real app: POST /api/vc/:appointmentId/start → get meetingUrl
      await new Promise(r => setTimeout(r, 800))
      setSessionStarted(true)
      setStartTime(new Date())
      setConsultation(c => ({ ...c, vcStatus: 'started' }))
      // If meetingUrl provided, open it
      // window.open(data.meetingUrl, '_blank')
    } finally {
      setStartLoading(false)
    }
  }

  const handleEnd = async () => {
    setEndingLoading(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      setSessionEnded(true)
      setConsultation(c => ({ ...c, vcStatus: 'ended' }))
    } finally {
      setEndingLoading(false)
    }
  }

  const slotTimeLeft = () => {
    const diff = new Date(consultation.slotEnd) - new Date()
    if (diff <= 0) return '0:00 left'
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${m}m ${s}s left in slot`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/doctor/appointments" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to appointments
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">Video Consultation</h1>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl px-5 py-3 flex items-center gap-3
        ${sessionEnded ? 'bg-slate-200' : sessionStarted ? 'bg-emerald-500' : 'bg-primary-600'}`}>
        {sessionEnded ? (
          <span className="text-slate-700 text-sm font-semibold">Session ended</span>
        ) : sessionStarted ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
            <span className="text-white text-sm font-semibold">Session Live</span>
            <span className="ml-auto font-mono text-white text-sm font-bold">{formatElapsed(elapsed)}</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-white text-sm font-medium">Ready to start</span>
            <span className="ml-auto text-primary-200 text-xs">{slotTimeLeft()}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Patient + controls */}
        <div className="md:col-span-2 space-y-5">
          {/* Patient card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-2xl font-bold border-4 transition-all duration-500
                ${sessionStarted && !sessionEnded ? 'bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-primary-50 border-primary-200 text-primary-500'}`}>
                {consultation.patientInitials}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">{consultation.patientName}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Slot: {new Date(consultation.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} –{' '}
                  {new Date(consultation.slotEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                {sessionStarted && !sessionEnded && (
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Session
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            {!sessionStarted && !sessionEnded && (
              <div className="space-y-3">
                <button
                  onClick={handleStart}
                  disabled={startLoading}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {startLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Video Session
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-400 text-center">Patient will be notified once you start</p>
              </div>
            )}

            {sessionStarted && !sessionEnded && (
              <div className="space-y-3">
                {consultation.meetingUrl && (
                  <a href={consultation.meetingUrl} target="_blank" rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Open Video Call
                  </a>
                )}
                <button
                  onClick={handleEnd}
                  disabled={endingLoading}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {endingLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Ending…</>
                  ) : 'End Session'}
                </button>
              </div>
            )}

            {sessionEnded && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-emerald-700 font-semibold text-sm mb-0.5">Session Completed</p>
                  <p className="text-emerald-600 text-xs">Duration: {formatElapsed(elapsed)}</p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/doctor/prescription/${consultation.appointmentId}`}
                    className="btn-primary flex-1 text-sm py-2.5 text-center">
                    Write Prescription
                  </Link>
                  <Link href="/doctor/appointments"
                    className="btn-secondary flex-1 text-sm py-2.5 text-center">
                    Back
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Session notes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Quick Session Notes</h3>
            <p className="text-xs text-slate-400 mb-3">Jot down observations during the call. These are private and will not be shared with the patient.</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Symptoms noted, observations, follow-up actions…"
              rows={4}
              className="input-base resize-none text-sm"
            />
          </div>
        </div>

        {/* Right: Info + checklist */}
        <div className="space-y-5">
          {/* Slot info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Appointment Info</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Patient', value: consultation.patientName },
                { label: 'Date', value: new Date(consultation.slotStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
                { label: 'Time', value: new Date(consultation.slotStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) },
                { label: 'Duration', value: '30 minutes' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-xs font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-call checklist */}
          {!sessionStarted && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Before Starting</h3>
              <div className="space-y-2.5">
                {[
                  'Camera and mic are working',
                  'In a private, quiet space',
                  'Patient records reviewed',
                  'Stable internet connection',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-300 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                { href: `/doctor/prescription/${consultation.appointmentId}`, label: 'Write Prescription', icon: '📋' },
                { href: '/doctor/appointments', label: 'All Appointments', icon: '📅' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700">
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}