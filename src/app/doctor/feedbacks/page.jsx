'use client'

import { useEffect, useState } from 'react'
import DoctorSidebar from '@/components/doctor/DoctorSidebar'

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

function StarDisplay({ rating, size = 'text-sm' }) {
  const value = Number(rating) || 0

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`${size} ${star <= value ? 'text-amber-400' : 'text-slate-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function RatingFilterButton({ value, active, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
        active
          ? 'bg-primary-600 border-primary-600 text-white shadow-card'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200'
      }`}
    >
      {value === 'all' ? (
        <>
          <span>All</span>
          <span className={active ? 'text-primary-100' : 'text-slate-400'}>
            {count}
          </span>
        </>
      ) : (
        <>
          <StarDisplay rating={Number(value)} />
          <span className={active ? 'text-white' : 'text-slate-500'}>
            {count}
          </span>
        </>
      )}
    </button>
  )
}

function FeedbackCard({ feedback }) {
  const patient = feedback.patient

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {patient?.profileUrl ? (
            <img
              src={patient.profileUrl}
              alt={patient.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-primary-700">
              {getInitials(patient?.name || 'Patient')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {patient?.name || 'Patient'}
              </h3>

              <p className="text-sm text-slate-500 truncate mt-0.5">
                {patient?.email || 'Email not available'}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {feedback.createdAt ? formatDate(feedback.createdAt) : ''}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2 w-fit">
              <div className="flex items-center gap-2">
                <StarDisplay rating={feedback.rating} />
                <span className="text-xs font-bold text-slate-800">
                  {feedback.rating}/5
                </span>
              </div>
            </div>
          </div>

          {feedback.comment ? (
            <p className="text-sm text-slate-600 leading-relaxed mt-4">
              {feedback.comment}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic mt-4">
              No written feedback added.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoctorFeedbacksPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const [ratingFilter, setRatingFilter] = useState('all')
  const [feedbacks, setFeedbacks] = useState([])
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingCounts: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchFeedbacks = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/doctor/feedbacks?rating=${ratingFilter}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to fetch feedbacks.')
        setFeedbacks([])
        return
      }

      setFeedbacks(data.feedbacks || [])
      setStats(
        data.stats || {
          totalFeedbacks: 0,
          averageRating: 0,
          ratingCounts: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        }
      )
    } catch {
      setError('Something went wrong while fetching feedbacks.')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [ratingFilter])

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
              <h1 className="text-lg font-semibold text-slate-900">
                View Feedbacks
              </h1>
            </div>

            <button
              type="button"
              onClick={fetchFeedbacks}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />

            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Patient Feedbacks
              </h2>
              <p className="text-primary-100 text-sm md:text-base mt-3">
                See how patients rated their consultation experience with you.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400">Average Rating</p>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-3xl font-bold text-slate-900">
                  {stats.averageRating || 0}
                </p>
                <StarDisplay rating={Math.round(stats.averageRating || 0)} size="text-base" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400">Total Feedbacks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalFeedbacks || 0}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400">Selected Filter</p>
              <div className="mt-2">
                {ratingFilter === 'all' ? (
                  <p className="text-2xl font-bold text-slate-900">All Ratings</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={Number(ratingFilter)} size="text-base" />
                    <span className="text-xl font-bold text-slate-900">
                      {ratingFilter}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-3xl border border-slate-100 shadow-card p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <h2 className="section-title">All Patient Reviews</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {loading
                    ? 'Loading feedbacks...'
                    : `${feedbacks.length} feedback(s) found`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <RatingFilterButton
                  value="all"
                  active={ratingFilter === 'all'}
                  count={stats.totalFeedbacks || 0}
                  onClick={() => setRatingFilter('all')}
                />

                {[5, 4, 3, 2, 1].map(rating => (
                  <RatingFilterButton
                    key={rating}
                    value={String(rating)}
                    active={ratingFilter === String(rating)}
                    count={stats.ratingCounts?.[rating] || 0}
                    onClick={() => setRatingFilter(String(rating))}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={fetchFeedbacks}
              className="sm:hidden w-full mt-4 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>

            {error && (
              <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                {[1, 2, 3, 4].map(item => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-100 p-5 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-14 bg-slate-100 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : feedbacks.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                {feedbacks.map(feedback => (
                  <FeedbackCard key={feedback._id} feedback={feedback} />
                ))}
              </div>
            ) : (
              <div className="mt-5 bg-surface-2 rounded-2xl border border-slate-100 p-10 text-center">
                <div className="text-4xl mb-3">⭐</div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  No feedbacks found
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Patient feedbacks and ratings will appear here after completed consultations.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}