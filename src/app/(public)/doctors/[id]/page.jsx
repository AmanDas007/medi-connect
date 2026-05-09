'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// Mock doctor data — in real app, fetch by params.id
const MOCK_DOCTOR = {
  _id: '1',
  name: 'Dr. Ananya Krishnan',
  specialization: 'Cardiologist',
  experienceYears: 12,
  consultationFee: 800,
  averageRating: 4.8,
  totalFeedbacks: 142,
  profileUrl: null,
  licenceUrl: null,
  clinic: {
    name: 'Apollo Heart Centre',
    address: '14-B, Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  },
  about: `Dr. Ananya Krishnan is a board-certified Cardiologist with over 12 years of experience in diagnosing and treating heart conditions. She completed her MBBS from AIIMS Delhi and her DM in Cardiology from PGI Chandigarh.\n\nShe specialises in interventional cardiology, echocardiography, and management of complex cardiac conditions including coronary artery disease, heart failure, and arrhythmias. Dr. Krishnan is known for her patient-first approach and thorough consultations.`,
  education: [
    { degree: 'MBBS', institute: 'AIIMS, New Delhi', year: '2007' },
    { degree: 'MD – Internal Medicine', institute: 'PGI Chandigarh', year: '2011' },
    { degree: 'DM – Cardiology', institute: 'PGI Chandigarh', year: '2014' },
  ],
  languages: ['English', 'Hindi', 'Tamil'],
  availability: [
    {
      dayOfWeek: 1, label: 'Mon', isAvailable: true,
      slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '16:00', endTime: '19:00' }],
    },
    {
      dayOfWeek: 2, label: 'Tue', isAvailable: true,
      slots: [{ startTime: '09:00', endTime: '13:00' }],
    },
    {
      dayOfWeek: 3, label: 'Wed', isAvailable: false, slots: [],
    },
    {
      dayOfWeek: 4, label: 'Thu', isAvailable: true,
      slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '16:00', endTime: '19:00' }],
    },
    {
      dayOfWeek: 5, label: 'Fri', isAvailable: true,
      slots: [{ startTime: '09:00', endTime: '13:00' }],
    },
    {
      dayOfWeek: 6, label: 'Sat', isAvailable: true,
      slots: [{ startTime: '10:00', endTime: '14:00' }],
    },
    {
      dayOfWeek: 0, label: 'Sun', isAvailable: false, slots: [],
    },
  ],
}

// Generate next 7 dates with day labels
function getNext7Days() {
  const days = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      date: d,
      dayOfWeek: d.getDay(),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    })
  }
  return days
}

// Generate 30-min slots between startTime and endTime
function generateSlots(startTime, endTime) {
  const slots = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  while (cur + 30 <= end) {
    const hh = String(Math.floor(cur / 60)).padStart(2, '0')
    const mm = String(cur % 60).padStart(2, '0')
    const endH = String(Math.floor((cur + 30) / 60)).padStart(2, '0')
    const endM = String((cur + 30) % 60).padStart(2, '0')
    slots.push({ start: `${hh}:${mm}`, end: `${endH}:${endM}`, label: `${hh}:${mm}` })
    cur += 30
  }
  return slots
}

const FEEDBACKS = [
  { patient: 'Rahul S.', rating: 5, comment: "Very thorough, explained everything clearly. Best cardiologist I've visited.", date: '12 Feb 2025' },
  { patient: 'Meera K.', rating: 5, comment: 'Extremely professional and patient. Diagnosed my issue accurately.', date: '8 Feb 2025' },
  { patient: 'Arjun D.', rating: 4, comment: 'Good experience overall. Clinic wait time was a bit long.', date: '2 Feb 2025' },
]

export default function DoctorProfilePage({ params }) {
  const router = useRouter()
  const doctor = MOCK_DOCTOR // In real app: fetch from API with params.id

  const [selectedMode, setSelectedMode] = useState('offline')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [activeTab, setActiveTab] = useState('about')

  const days = getNext7Days()
  const selectedDay = days[selectedDayIndex]
  const availDay = doctor.availability.find(a => a.dayOfWeek === selectedDay.dayOfWeek)
  const slotsForDay = availDay?.isAvailable
    ? availDay.slots.flatMap(s => generateSlots(s.startTime, s.endTime))
    : []

  const handleBooking = () => {
    if (!selectedSlot) return
    const dateStr = selectedDay.date.toISOString().split('T')[0]
    router.push(
      `/patient/appointments/book?doctorId=${doctor._id}&date=${dateStr}&slotStart=${selectedSlot.start}&slotEnd=${selectedSlot.end}&mode=${selectedMode}`
    )
  }

  const initials = doctor.name.split(' ').map(w => w[0]).join('').slice(0, 2)

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />

      <div className="pt-16">
        {/* Hero card */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center flex-shrink-0">
                {doctor.profileUrl
                  ? <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
                  : <span className="font-display text-3xl font-bold text-primary-400">{initials}</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">{doctor.name}</h1>
                    <p className="text-primary-600 font-semibold mt-0.5">{doctor.specialization}</p>
                    <p className="text-sm text-slate-500 mt-1">{doctor.experienceYears} years of experience</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      <span className="text-amber-500 text-sm">★</span>
                      <span className="font-bold text-slate-800 text-sm">{doctor.averageRating}</span>
                      <span className="text-slate-400 text-xs">({doctor.totalFeedbacks} reviews)</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">₹{doctor.consultationFee}
                      <span className="text-sm font-normal text-slate-400"> / consult</span>
                    </span>
                  </div>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {doctor.clinic.name}, {doctor.clinic.city}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online Available
                  </span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                    Offline Available
                  </span>
                  {doctor.languages.map(l => (
                    <span key={l} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs">{l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Info tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                <div className="flex border-b border-slate-100">
                  {[
                    { id: 'about', label: 'About' },
                    { id: 'education', label: 'Education' },
                    { id: 'reviews', label: `Reviews (${doctor.totalFeedbacks})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors duration-150
                        ${activeTab === tab.id
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* About */}
                  {activeTab === 'about' && (
                    <div className="animate-fade-in space-y-5">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">About</h3>
                        {doctor.about.split('\n\n').map((para, i) => (
                          <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3 last:mb-0">{para}</p>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Clinic Address</h3>
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                          <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{doctor.clinic.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{doctor.clinic.address}</p>
                            <p className="text-xs text-slate-500">{doctor.clinic.city}, {doctor.clinic.state} – {doctor.clinic.pincode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {activeTab === 'education' && (
                    <div className="animate-fade-in space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Academic Qualifications</h3>
                      {doctor.education.map((edu, i) => (
                        <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-base flex-shrink-0">🎓</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{edu.degree}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{edu.institute}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{edu.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reviews */}
                  {activeTab === 'reviews' && (
                    <div className="animate-fade-in space-y-5">
                      {/* Rating summary */}
                      <div className="flex items-center gap-5 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-5">
                        <div className="text-center">
                          <div className="font-display text-4xl font-bold text-slate-900">{doctor.averageRating}</div>
                          <div className="flex gap-0.5 justify-center mt-1">
                            {[1,2,3,4,5].map(i => (
                              <span key={i} className={`text-sm ${i <= Math.round(doctor.averageRating) ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{doctor.totalFeedbacks} reviews</div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5,4,3,2,1].map(star => (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-3">{star}</span>
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 7 : 3}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {FEEDBACKS.map((fb, i) => (
                        <div key={i} className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">
                                {fb.patient[0]}
                              </div>
                              <span className="text-sm font-semibold text-slate-800">{fb.patient}</span>
                            </div>
                            <span className="text-xs text-slate-400">{fb.date}</span>
                          </div>
                          <div className="flex gap-0.5 mb-2">
                            {[1,2,3,4,5].map(i => (
                              <span key={i} className={`text-xs ${i <= fb.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                            ))}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{fb.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Booking panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 sticky top-24">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Book an Appointment</h2>

                {/* Mode toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
                  {['offline', 'online'].map(m => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMode(m); setSelectedSlot(null) }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize
                        ${selectedMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {m === 'online' ? '🎥 Online' : '🏥 Offline'}
                    </button>
                  ))}
                </div>

                {/* Date selector */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Select Date</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {days.map((day, i) => {
                      const avail = doctor.availability.find(a => a.dayOfWeek === day.dayOfWeek)
                      const isAvail = avail?.isAvailable
                      return (
                        <button
                          key={i}
                          disabled={!isAvail}
                          onClick={() => { setSelectedDayIndex(i); setSelectedSlot(null) }}
                          className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all duration-150 border
                            ${!isAvail ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                              : selectedDayIndex === i
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-white border-slate-200 hover:border-primary-300 hover:bg-primary-50'}`}
                        >
                          <span className={`text-xs font-medium ${selectedDayIndex === i ? 'text-primary-100' : 'text-slate-400'}`}>{day.label.slice(0, 3)}</span>
                          <span className={`text-sm font-bold mt-0.5 ${selectedDayIndex === i ? 'text-white' : 'text-slate-800'}`}>
                            {day.date.getDate()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    {selectedDay.label === 'Today' || selectedDay.label === 'Tomorrow'
                      ? `${selectedDay.label}, ${selectedDay.dateLabel}`
                      : selectedDay.dateLabel}
                  </p>
                </div>

                {/* Slot picker */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Select Time Slot</p>
                  {slotsForDay.length === 0 ? (
                    <div className="text-center py-5 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Not available on this day</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slotsForDay.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-1 rounded-lg text-xs font-medium transition-all duration-150 border
                            ${selectedSlot?.start === slot.start
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50'}`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fee summary */}
                {selectedSlot && (
                  <div className="bg-primary-50 rounded-xl p-3.5 mb-4 border border-primary-100 animate-fade-in">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">Consultation fee</span>
                      <span className="font-semibold text-slate-800">₹{doctor.consultationFee}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{selectedMode === 'online' ? '🎥 Video Consultation' : '🏥 In-Clinic Visit'}</span>
                      <span>{selectedSlot.start} – {selectedSlot.end}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || slotsForDay.length === 0}
                  className="btn-primary w-full py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedSlot ? `Book for ${selectedSlot.start}` : 'Select a slot to book'}
                </button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  You'll be redirected to confirm & pay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}