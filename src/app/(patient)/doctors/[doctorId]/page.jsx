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

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [mode, setMode] = useState('online')

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLoginCard, setShowLoginCard] = useState(false)

  const nextDays = useMemo(() => getNextSevenDays(), [])

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

  const handleBookAppointment = () => {
    if (!selectedSlot) return

    if (status !== 'authenticated') {
      setShowLoginCard(true)
      return
    }

    // Later connect this with actual booking page/API
    router.push(
      `/appointments/book?doctorId=${doctor._id}&mode=${mode}&slot=${encodeURIComponent(selectedSlot)}`
    )
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

  const selectedDay = nextDays[selectedIndex]
  const selectedAvailability = getDayAvailability(doctor, selectedDay.dayOfWeek)
  const slots = selectedAvailability?.slots || []

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
                            ★ {doctor.averageRating || 0} rating
                          </span>
                          <span className="badge bg-slate-100 text-slate-600">
                            {doctor.totalFeedbacks || 0} reviews
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
                        `${doctor.name} is a ${doctor.specialization} with ${doctor.experienceYears || 0} years of experience. You can book an online or offline consultation based on available slots.`}
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
            </div>

            <aside className="bg-white rounded-3xl border border-slate-100 shadow-card p-5 h-fit xl:sticky xl:top-24">
              <h2 className="text-lg font-semibold text-slate-900">Book Appointment</h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose consultation mode and available slot.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-5 bg-surface-2 rounded-2xl p-1">
                <button
                  onClick={() => setMode('online')}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    mode === 'online'
                      ? 'bg-white text-primary-700 shadow-card'
                      : 'text-slate-500'
                  }`}
                >
                  Online
                </button>

                <button
                  onClick={() => setMode('offline')}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    mode === 'offline'
                      ? 'bg-white text-primary-700 shadow-card'
                      : 'text-slate-500'
                  }`}
                >
                  Offline
                </button>
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

                {slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot, index) => {
                      const label = `${slot.startTime} - ${slot.endTime}`
                      const active = selectedSlot === label

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedSlot(label)
                            setShowLoginCard(false)
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            active
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {label}
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

              <button
                onClick={handleBookAppointment}
                disabled={!selectedSlot}
                className="btn-primary w-full py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedSlot ? 'Proceed to Book' : 'Select a Slot'}
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