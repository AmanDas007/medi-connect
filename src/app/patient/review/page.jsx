'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const QUESTIONS = [
  'How easy was it to find a doctor?',
  'How was the booking experience?',
  'How would you rate the overall platform?',
]

export default function PlatformReviewPage() {
  const { data: session } = useSession()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState(null) // existing review if any
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // In real app, fetch existing review
  useEffect(() => {
    // Simulate no existing review
    setExisting(null)
  }, [])

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating.'); return }
    if (comment.trim().length < 10) { setError('Please write at least 10 characters in your review.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reviews/platform', {
        method: existing && isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to submit review.')
      setSubmitted(true)
      setExisting({ rating, comment, isEdited: !!existing })
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
          <div className="text-5xl mb-5">🙏</div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Thank you!</h2>
          <p className="text-slate-500 text-sm mb-4">
            Your feedback helps us improve MediConnect for everyone.
          </p>
          <div className="flex gap-1 justify-center mb-6">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-2xl ${i <= rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
            ))}
          </div>
          <blockquote className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
            "{comment}"
          </blockquote>
          <button onClick={() => { setSubmitted(false); setIsEditing(true) }}
            className="mt-6 btn-secondary text-sm px-4 py-2">
            Edit Review
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Platform Review</h1>
        <p className="text-slate-500 text-sm mt-1">
          {existing && !isEditing ? "You've already reviewed MediConnect." : 'Share your experience with MediConnect — your feedback matters.'}
        </p>
      </div>

      {/* Existing review — view mode */}
      {existing && !isEditing && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-1">Your Review</p>
              {existing.isEdited && <span className="text-xs text-slate-400">(edited)</span>}
            </div>
            <button onClick={() => { setIsEditing(true); setRating(existing.rating); setComment(existing.comment) }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium border border-primary-200 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
              Edit
            </button>
          </div>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-xl ${i <= existing.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
            ))}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed italic">"{existing.comment}"</p>
        </div>
      )}

      {/* Form */}
      {(!existing || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Star rating */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">Overall Rating</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { setRating(star); setError('') }}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform duration-100 hover:scale-110 focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <span className={`text-4xl leading-none transition-colors duration-100
                      ${star <= (hovered || rating) ? 'text-amber-400' : 'text-slate-200'}`}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className="text-sm font-semibold text-slate-700 animate-fade-in">
                  {ratingLabels[hovered || rating]}
                </p>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Your Review</h2>
            <p className="text-xs text-slate-400 mb-4">Tell us about your experience booking and consulting on MediConnect</p>
            <textarea
              value={comment}
              onChange={e => { setComment(e.target.value); setError('') }}
              placeholder="Share what you loved or what could be improved…"
              rows={5}
              maxLength={1000}
              className="input-base resize-none text-sm"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-400">Minimum 10 characters</span>
              <span className="text-xs text-slate-400">{comment.length}/1000</span>
            </div>
          </div>

          {/* Prompt questions */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">You might want to mention:</p>
            <div className="flex flex-wrap gap-2">
              {['Ease of booking', 'Doctor quality', 'Video consultation', 'Support', 'Value for money'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setComment(c => c + (c ? ' ' : '') + tag + ': ')}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {isEditing && (
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-shrink-0 px-5 py-3 text-sm">
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading || rating === 0}
              className="btn-primary flex-1 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : isEditing ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Info note */}
      <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
        <p className="text-xs text-primary-700 leading-relaxed">
          ℹ️ You can submit one platform review. You may edit it anytime. Your review may be shown publicly on the MediConnect homepage.
        </p>
      </div>
    </div>
  )
}