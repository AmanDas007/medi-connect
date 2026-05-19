'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PatientSidebar from '@/components/patient/PatientSidebar'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getNextSevenDays() {
  const today = new Date()

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)

    return {
      date,
      dayOfWeek: date.getDay(),
      label: index === 0 ? 'Today' : DAYS[date.getDay()],
      dateLabel: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
    }
  })
}

function getDayAvailability(doctor, dayOfWeek) {
  return doctor?.availability?.find(day => day.dayOfWeek === dayOfWeek && day.isAvailable)
}

function getDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getSlotStartDate(selectedDate, startTime) {
  const appointmentDate = getDateString(selectedDate)
  return new Date(`${appointmentDate}T${startTime}:00+05:30`)
}

function getTimeMinutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
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

function RatingFilterButton({ value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
        active
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200'
      }`}
    >
      {value === 'all' ? (
        <span>All</span>
      ) : (
        <>
          <StarDisplay rating={Number(value)} />
          <span className={active ? 'text-white' : 'text-slate-500'}>
            {value}
          </span>
        </>
      )}
    </button>
  )
}

function FeedbackCard({ feedback }) {
  const patient = feedback.patient

  return (
    <div className={`rounded-2xl border p-5 ${
      feedback.isMine
        ? 'bg-primary-50 border-primary-200'
        : 'bg-white border-slate-100'
    }`}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary-100 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {patient?.profileUrl ? (
            <img src={patient.profileUrl} alt={patient.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary-700">
              {getInitials(patient?.name || 'User')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {patient?.name || 'Patient'}
                </h3>

                {feedback.isMine && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-medium">
                    Your feedback
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-0.5">
                {feedback.createdAt ? formatDate(feedback.createdAt) : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StarDisplay rating={feedback.rating} />
              <span className="text-xs font-semibold text-slate-700">
                {feedback.rating}/5
              </span>
            </div>
          </div>

          {feedback.comment ? (
            <p className="text-sm text-slate-600 leading-relaxed mt-3">
              {feedback.comment}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic mt-3">
              No written feedback added.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLoginCard, setShowLoginCard] = useState(false)

  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

  const [bookedSlotLabels, setBookedSlotLabels] = useState([])
  const [bookedSlotsLoading, setBookedSlotsLoading] = useState(false)
  const [nowTick, setNowTick] = useState(Date.now())

  const [feedbacks, setFeedbacks] = useState([])
  const [feedbackStats, setFeedbackStats] = useState({
    averageRating: 0,
    totalFeedbacks: 0,
  })
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all')
  const [feedbacksLoading, setFeedbacksLoading] = useState(false)
  const [feedbacksError, setFeedbacksError] = useState('')
  const [canGiveFeedback, setCanGiveFeedback] = useState(false)
  const [myFeedback, setMyFeedback] = useState(null)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [feedbackSubmitLoading, setFeedbackSubmitLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const nextDays = useMemo(() => getNextSevenDays(), [])

  const selectedDay = nextDays[selectedIndex]
  const selectedAvailability = getDayAvailability(doctor, selectedDay?.dayOfWeek)
  const slots = selectedAvailability?.slots || []

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      return getTimeMinutes(a.startTime) - getTimeMinutes(b.startTime)
    })
  }, [slots])

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now())
    }, 30000)

    return () => clearInterval(timer)
  }, [])

  const isPastSlot = slot => {
    if (!selectedDay?.date || !slot?.startTime) return false

    const slotStart = getSlotStartDate(selectedDay.date, slot.startTime)
    return slotStart.getTime() <= nowTick
  }

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!params?.doctorId) return

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/doctors/${params.doctorId}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Doctor not found')
          setDoctor(null)
          return
        }

        setDoctor(data.doctor)
      } catch (err) {
        setError('Something went wrong while fetching doctor details.')
        setDoctor(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctor()
  }, [params?.doctorId])

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!doctor?._id || !selectedDay?.date) return

      setBookedSlotsLoading(true)

      try {
        const appointmentDate = getDateString(selectedDay.date)

        const res = await fetch(`/api/doctors/${doctor._id}/booked-slots?date=${appointmentDate}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (res.ok && data.success) {
          const labels = data.bookedSlots?.map(slot => slot.label) || []
          setBookedSlotLabels(labels)

          if (selectedSlot && labels.includes(selectedSlot)) {
            setSelectedSlot(null)
          }
        } else {
          setBookedSlotLabels([])
        }
      } catch {
        setBookedSlotLabels([])
      } finally {
        setBookedSlotsLoading(false)
      }
    }

    fetchBookedSlots()
  }, [doctor?._id, selectedIndex])

  useEffect(() => {
    if (!selectedSlot) return

    const selected = sortedSlots.find(slot => `${slot.startTime} - ${slot.endTime}` === selectedSlot)

    if (selected && isPastSlot(selected)) {
      setSelectedSlot(null)
    }
  }, [nowTick, selectedSlot, sortedSlots])

  const fetchFeedbacks = async () => {
    if (!doctor?._id) return

    setFeedbacksLoading(true)
    setFeedbacksError('')

    try {
      const res = await fetch(`/api/doctors/${doctor._id}/feedbacks?rating=${feedbackRatingFilter}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedbacksError(data.message || 'Failed to fetch feedbacks.')
        setFeedbacks([])
        return
      }

      setFeedbacks(data.feedbacks || [])
      setFeedbackStats(data.stats || { averageRating: 0, totalFeedbacks: 0 })
      setCanGiveFeedback(Boolean(data.canGiveFeedback))
      setMyFeedback(data.myFeedback || null)
    } catch {
      setFeedbacksError('Something went wrong while fetching feedbacks.')
      setFeedbacks([])
    } finally {
      setFeedbacksLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [doctor?._id, feedbackRatingFilter, status])

  const handleSubmitFeedback = async e => {
    e.preventDefault()

    if (!doctor?._id || feedbackSubmitLoading) return

    if (!newRating || Number(newRating) < 1 || Number(newRating) > 5) {
      setFeedbacksError('Please choose a rating before submitting your feedback.')
      return
    }

    setFeedbackSubmitLoading(true)
    setFeedbacksError('')
    setFeedbackMessage('')

    try {
      const res = await fetch(`/api/doctors/${doctor._id}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: Number(newRating),
          comment: newComment.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedbacksError(data.message || 'Failed to submit feedback.')
        return
      }

      setFeedbackMessage(data.message || 'Thank you! Your feedback has been submitted.')
      setNewRating(0)
      setNewComment('')
      setCanGiveFeedback(false)
      setMyFeedback(data.feedback || null)

      await fetchFeedbacks()
    } catch {
      setFeedbacksError('Something went wrong while submitting feedback.')
    } finally {
      setFeedbackSubmitLoading(false)
    }
  }

  const releasePendingAppointment = async appointmentId => {
    if (!appointmentId) return

    try {
      await fetch('/api/appointments/release-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      })
    } catch {}
  }

  const handleBookAppointment = async () => {
    if (!selectedSlot || bookingLoading) return

    const selected = sortedSlots.find(slot => `${slot.startTime} - ${slot.endTime}` === selectedSlot)

    if (selected && isPastSlot(selected)) {
      setSelectedSlot(null)
      setBookingError('This slot time has already passed. Please choose another slot.')
      return
    }

    if (bookedSlotLabels.includes(selectedSlot)) {
      setSelectedSlot(null)
      setBookingError('This slot is already booked. Please choose another slot.')
      return
    }

    setBookingError('')
    setBookingSuccess('')
    setShowLoginCard(false)

    if (status !== 'authenticated') {
      setShowLoginCard(true)
      return
    }

    if (session?.user?.role !== 'patient') {
      setBookingError('Only patients can book appointments.')
      return
    }

    const loaded = await loadRazorpayScript()

    if (!loaded) {
      setBookingError('Razorpay failed to load. Please check your internet connection.')
      return
    }

    const [startTime, endTime] = selectedSlot.split(' - ')
    const appointmentDate = getDateString(selectedDay.date)

    setBookingLoading(true)

    try {
      const createOrderRes = await fetch('/api/appointments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor._id,
          appointmentDate,
          startTime,
          endTime,
          mode: 'offline',
        }),
      })

      const orderData = await createOrderRes.json()

      if (!createOrderRes.ok) {
        setBookingError(orderData.message || 'Failed to create payment order.')
        setBookingLoading(false)
        return
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MediConnect',
        description: `Offline appointment with ${doctor.name}`,
        order_id: orderData.orderId,

        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },

        notes: {
          appointmentId: orderData.appointmentId,
          doctorId: doctor._id,
          mode: 'offline',
          slot: selectedSlot,
        },

        theme: {
          color: '#2563EB',
        },

        handler: async function (response) {
          setBookingLoading(true)
          setBookingError('')

          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appointmentId: orderData.appointmentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok) {
              setBookingError(verifyData.message || 'Payment verification failed.')
              return
            }

            setBookingSuccess('Payment successful! Appointment confirmed.')

            setTimeout(() => {
              router.push('/appointments')
            }, 1200)
          } catch {
            setBookingError('Something went wrong while verifying payment.')
          } finally {
            setBookingLoading(false)
          }
        },

        modal: {
          ondismiss: async function () {
            await releasePendingAppointment(orderData.appointmentId)
            setBookingLoading(false)
            setBookingError('Payment was cancelled. Please try booking again.')
          },
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', async function (response) {
        console.log('Razorpay payment failed:', response.error)

        await releasePendingAppointment(orderData.appointmentId)

        setBookingLoading(false)
        setBookingError(
          response.error?.description ||
          response.error?.reason ||
          'Payment failed. Please try again.'
        )
      })

      razorpay.open()
    } catch {
      setBookingLoading(false)
      setBookingError('Something went wrong while starting booking.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2">
        <PatientSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 animate-pulse">
              <div className="flex gap-6">
                <div className="w-28 h-28 rounded-3xl bg-slate-200" />
                <div className="flex-1 space-y-4">
                  <div className="h-7 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!doctor || error) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 text-center max-w-md">
          <div className="text-4xl mb-3">🩺</div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Doctor not found
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {error || 'The doctor profile you are looking for does not exist.'}
          </p>
          <Link href="/dashboard" className="btn-primary mt-6">
            Back to Dashboard
          </Link>
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

              <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-primary-600">
                ← Back to doctors
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-28 h-28 rounded-3xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                    {doctor.profileUrl ? (
                      <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold text-primary-700">
                        {getInitials(doctor.name)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="font-display text-3xl font-bold text-slate-900">
                          {doctor.name}
                        </h1>
                        <p className="text-primary-600 font-medium mt-1">
                          {doctor.specialization}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className="badge bg-emerald-50 text-emerald-700">
                            ★ {feedbackStats.averageRating || doctor.averageRating || 0} rating
                          </span>
                          <span className="badge bg-slate-100 text-slate-600">
                            {feedbackStats.totalFeedbacks || doctor.totalFeedbacks || 0} reviews
                          </span>
                          <span className="badge bg-blue-50 text-blue-700">
                            {doctor.experienceYears || 0} yrs experience
                          </span>
                        </div>
                      </div>

                      <div className="bg-primary-50 rounded-2xl px-5 py-4">
                        <p className="text-xs text-primary-500">Consultation Fee</p>
                        <p className="text-2xl font-bold text-primary-700">
                          ₹{doctor.consultationFee}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mt-6">
                      {doctor.about ||
                        `${doctor.name} is a ${doctor.specialization} with ${doctor.experienceYears || 0} years of experience. You can book an offline appointment based on available slots.`}
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
                <h2 className="section-title mb-5">Clinic Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Clinic Name</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {doctor.clinic?.name}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {doctor.clinic?.city}, {doctor.clinic?.state}
                    </p>
                  </div>

                  <div className="md:col-span-2 rounded-2xl bg-surface-2 p-5">
                    <p className="text-xs text-slate-400">Full Address</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {doctor.clinic?.address}, {doctor.clinic?.city}, {doctor.clinic?.state} - {doctor.clinic?.pincode}
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
                <div className="flex flex-col gap-4 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h2 className="section-title">Patient Feedbacks</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {feedbacksLoading
                          ? 'Loading patient experiences...'
                          : `${feedbacks.length} feedback(s) shown`}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 w-fit">
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={Math.round(feedbackStats.averageRating || doctor.averageRating || 0)} />
                        <span className="text-sm font-bold text-slate-900">
                          {feedbackStats.averageRating || doctor.averageRating || 0}/5
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Based on {feedbackStats.totalFeedbacks || doctor.totalFeedbacks || 0} review(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['all', '5', '4', '3', '2', '1'].map(item => (
                      <RatingFilterButton
                        key={item}
                        value={item}
                        active={feedbackRatingFilter === item}
                        onClick={() => setFeedbackRatingFilter(item)}
                      />
                    ))}
                  </div>
                </div>

                {feedbackMessage && (
                  <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                    <p className="text-sm font-semibold text-emerald-700">
                      {feedbackMessage}
                    </p>
                  </div>
                )}

                {feedbacksError && (
                  <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-4">
                    <p className="text-sm font-semibold text-red-700">
                      {feedbacksError}
                    </p>
                  </div>
                )}

                {canGiveFeedback && (
                  <form
                    onSubmit={handleSubmitFeedback}
                    className="mb-6 rounded-3xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 p-5"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Share your consultation experience
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Your feedback helps other patients understand the doctor’s care, communication, and overall experience.
                      </p>
                    </div>

                    <div className="mt-5">
                      <label className="label">How would you rate this doctor?</label>

                      <div className="flex items-center gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl transition-all ${
                              star <= newRating
                                ? 'bg-amber-50 border-amber-200 text-amber-400 scale-105'
                                : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <p className="text-xs text-slate-500 mt-2">
                        {newRating
                          ? `You selected ${newRating} out of 5.`
                          : 'Tap a star to choose your rating.'}
                      </p>
                    </div>

                    <div className="mt-5">
                      <label className="label">Write your feedback</label>
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        rows={4}
                        placeholder="Example: The doctor explained the problem clearly, listened patiently, and the clinic experience was smooth."
                        className="input-base resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        Keep it honest and helpful for future patients.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={feedbackSubmitLoading}
                      className="btn-primary w-full mt-5 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {feedbackSubmitLoading ? 'Submitting Feedback...' : 'Submit Feedback'}
                    </button>
                  </form>
                )}

                {!canGiveFeedback && !myFeedback && status === 'authenticated' && (
                  <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-sm font-medium text-slate-700">
                      Feedback unlocks after a completed appointment.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      After your appointment with this doctor is completed, you can share one feedback.
                    </p>
                  </div>
                )}

                {feedbacksLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(item => (
                      <div key={item} className="rounded-2xl border border-slate-100 p-5 animate-pulse">
                        <div className="flex gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-slate-200" />
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                            <div className="h-3 bg-slate-200 rounded w-1/4" />
                            <div className="h-12 bg-slate-100 rounded-xl" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {feedbacks.map(feedback => (
                      <FeedbackCard key={feedback._id} feedback={feedback} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-surface-2 border border-slate-100 p-10 text-center">
                    <div className="text-4xl mb-3">⭐</div>
                    <h3 className="font-semibold text-slate-900">No feedbacks yet</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Patient feedbacks will appear here after completed appointments.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <aside className="bg-white rounded-3xl border border-slate-100 shadow-card p-5 h-fit xl:sticky xl:top-24">
              <h2 className="text-lg font-semibold text-slate-900">Book Appointment</h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose an available offline appointment slot.
              </p>

              <div className="mt-5 rounded-2xl bg-primary-50 border border-primary-100 p-4">
                <p className="text-xs text-primary-500">Consultation Mode</p>
                <p className="text-sm font-semibold text-primary-700 mt-1">
                  Offline clinic visit
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Select Date</p>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {nextDays.map((day, index) => {
                    const hasSlots = Boolean(getDayAvailability(doctor, day.dayOfWeek)?.slots?.length)
                    const active = selectedIndex === index

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedIndex(index)
                          setSelectedSlot(null)
                          setShowLoginCard(false)
                          setBookingError('')
                          setBookingSuccess('')
                          setBookedSlotLabels([])
                        }}
                        className={`min-w-[76px] rounded-2xl border px-3 py-3 text-center transition-all ${
                          active
                            ? 'border-primary-300 bg-primary-50 text-primary-700'
                            : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-medium">{day.label}</p>
                        <p className="text-xs mt-1">{day.dateLabel}</p>
                        <p className={`text-[10px] mt-1 ${hasSlots ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {hasSlots ? 'Available' : 'No slots'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Available Slots</p>

                {sortedSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {sortedSlots.map((slot, index) => {
                      const label = `${slot.startTime} - ${slot.endTime}`
                      const active = selectedSlot === label
                      const isBooked = bookedSlotLabels.includes(label)
                      const isPast = isPastSlot(slot)

                      return (
                        <button
                          key={index}
                          disabled={isBooked || isPast || bookedSlotsLoading}
                          onClick={() => {
                            if (isBooked || isPast) return

                            setSelectedSlot(label)
                            setShowLoginCard(false)
                            setBookingError('')
                            setBookingSuccess('')
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            isBooked || isPast
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                              : active
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {isBooked ? `${label} Booked` : isPast ? `${label} Past` : label}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-sm font-medium text-slate-700">No slots available</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose another date to see available timings.
                    </p>
                  </div>
                )}
              </div>

              {showLoginCard && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    You are not logged in
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please login first to book an appointment with this doctor.
                  </p>

                  <div className="flex gap-2 mt-3">
                    <Link
                      href="/login"
                      className="flex-1 text-center px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center px-3 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}

              {bookingError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    {bookingError}
                  </p>
                </div>
              )}

              {bookingSuccess && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">
                    {bookingSuccess}
                  </p>
                </div>
              )}

              <button
                onClick={handleBookAppointment}
                disabled={!selectedSlot || bookingLoading || bookedSlotsLoading}
                className="btn-primary w-full py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading
                  ? 'Processing...'
                  : bookedSlotsLoading
                    ? 'Checking Slots...'
                    : selectedSlot
                      ? 'Proceed to Book'
                      : 'Select a Slot'}
              </button>

              <p className="text-xs text-slate-400 text-center mt-3">
                Payment will be done after slot confirmation.
              </p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
