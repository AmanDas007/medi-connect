'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const MOCK_APPOINTMENT = {
  _id: 'a4',
  doctorName: 'Dr. Suresh Nair',
  specialization: 'Orthopedic Surgeon',
  doctorInitials: 'SN',
  clinicName: 'Bone & Joint Hospital',
  date: '22 January 2025',
  mode: 'offline',
  feedbackGiven: false,
}

const ASPECTS = [
  { id: 'listening', label: 'Listening to concerns', emoji: '👂' },
  { id: 'explanation', label: 'Clarity of explanation', emoji: '💬' },
  { id: 'diagnosis', label: 'Accuracy of diagnosis', emoji: '🔍' },
  { id: 'punctuality', label: 'Punctuality', emoji: '⏱️' },
]

export default function DoctorFeedbackPage() {
  const params = useParams()
  const router = useRouter()

  const appt = MOCK_APPOINTMENT
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [aspectRatings, setAspectRatings] = useState({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(appt.feedbackGiven)

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  const handleAspectRating = (aspect, value) => {
    setAspectRatings(p => ({ ...p, [aspect]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setError('Please provide an overall rating.'); return }
    if (comment.trim().length < 10) { setError('Please write at least 10 characters.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/feedback/doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: params.appointmentId,
          rating,
          comment: comment.trim(),
          aspectRatings,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to submit feedback.')
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto pt-8 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-10">
          <div className="text-5xl mb-5">💙</div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Feedback Submitted!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Thank you for taking the time to review {appt.doctorName}. Your feedback helps other patients make informed decisions.
          </p>
          <div className="flex gap-1 justify-center mb-8">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-2xl ${i <= rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/patient/appointments" className="btn-primary text-sm px-5 py-2.5 text-center">
              My Appointments
            </Link>
            <Link href="/doctors" className="btn-secondary text-sm px-5 py-2.5 text-center">
              Find More Doctors
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
        <h1 className="font-display text-2xl font-bold text-slate-900">Rate Your Doctor</h1>
        <p className="text-slate-500 text-sm mt-1">Your feedback helps other patients choose the right doctor</p>
      </div>

      {/* Doctor card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center font-semibold text-primary-600 text-lg flex-shrink-0">
            {appt.doctorInitials}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{appt.doctorName}</p>
            <p className="text-sm text-primary-600 font-medium mt-0.5">{appt.specialization}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span>{appt.clinicName}</span>
              <span>·</span>
              <span>{appt.date}</span>
              <span>·</span>
              <span className={appt.mode === 'online' ? 'text-emerald-600' : 'text-slate-500'}>
                {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Overall star rating */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">Overall Rating</h2>
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => { setRating(star); setError('') }}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform duration-100 hover:scale-110 focus:outline-none"
                >
                  <span className={`text-4xl leading-none transition-colors duration-100
                    ${star <= (hovered || rating) ? 'text-amber-400' : 'text-slate-200'}`}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-sm font-semibold text-slate-700 animate-fade-in">{ratingLabels[hovered || rating]}</p>
            )}
          </div>
        </div>

        {/* Aspect ratings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Rate Specific Aspects <span className="font-normal text-slate-400">(optional)</span></h2>
          <div className="space-y-4">
            {ASPECTS.map(aspect => (
              <div key={aspect.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base flex-shrink-0">{aspect.emoji}</span>
                  <span className="text-sm text-slate-700">{aspect.label}</span>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleAspectRating(aspect.id, star)}
                      className="focus:outline-none"
                    >
                      <span className={`text-lg leading-none transition-colors duration-100
                        ${star <= (aspectRatings[aspect.id] || 0) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Written Feedback</h2>
          <p className="text-xs text-slate-400 mb-4">Describe your experience with the doctor</p>
          <textarea
            value={comment}
            onChange={e => { setComment(e.target.value); setError('') }}
            placeholder="e.g. Dr. Nair was very thorough and explained my condition clearly…"
            rows={4}
            maxLength={800}
            className="input-base resize-none text-sm"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">Min. 10 characters</span>
            <span className="text-xs text-slate-400">{comment.length}/800</span>
          </div>
        </div>

        <button type="submit" disabled={loading || rating === 0}
          className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </span>
          ) : 'Submit Feedback'}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Your feedback is anonymous to the doctor and may be shown on their public profile.
        </p>
      </form>
    </div>
  )
}