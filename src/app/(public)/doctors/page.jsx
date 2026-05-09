// Doctor search/listing

'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedic Surgeon', 'Pediatrician', 'Gynecologist', 'Psychiatrist',
  'Ophthalmologist', 'ENT Specialist', 'Gastroenterologist', 'Dentist',
]

const MODES = ['All', 'Online', 'Offline']
const SORTS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Rating', value: 'rating' },
  { label: 'Experience', value: 'experience' },
  { label: 'Fee: Low to High', value: 'fee_asc' },
  { label: 'Fee: High to Low', value: 'fee_desc' },
]

// Mock doctor data
const MOCK_DOCTORS = [
  {
    _id: '1', name: 'Dr. Ananya Krishnan', specialization: 'Cardiologist',
    experienceYears: 12, consultationFee: 800, averageRating: 4.8, totalFeedbacks: 142,
    clinic: { name: 'Apollo Heart Centre', city: 'Mumbai' },
    profileUrl: null, isOnlineAvailable: true, nextSlot: 'Today, 4:00 PM',
  },
  {
    _id: '2', name: 'Dr. Raj Yadav', specialization: 'General Physician',
    experienceYears: 8, consultationFee: 400, averageRating: 4.6, totalFeedbacks: 89,
    clinic: { name: 'City Health Clinic', city: 'Delhi' },
    profileUrl: null, isOnlineAvailable: true, nextSlot: 'Tomorrow, 10:00 AM',
  },
  {
    _id: '3', name: 'Dr. Priya Mehta', specialization: 'Dermatologist',
    experienceYears: 6, consultationFee: 600, averageRating: 4.9, totalFeedbacks: 203,
    clinic: { name: 'Skin & Care Clinic', city: 'Bangalore' },
    profileUrl: null, isOnlineAvailable: false, nextSlot: 'Wed, 2:00 PM',
  },
  {
    _id: '4', name: 'Dr. Suresh Nair', specialization: 'Orthopedic Surgeon',
    experienceYears: 15, consultationFee: 1000, averageRating: 4.7, totalFeedbacks: 178,
    clinic: { name: 'Bone & Joint Hospital', city: 'Chennai' },
    profileUrl: null, isOnlineAvailable: false, nextSlot: 'Thu, 11:00 AM',
  },
  {
    _id: '5', name: 'Dr. Fatima Sheikh', specialization: 'Gynecologist',
    experienceYears: 10, consultationFee: 700, averageRating: 4.8, totalFeedbacks: 156,
    clinic: { name: 'Womens Health Centre', city: 'Hyderabad' },
    profileUrl: null, isOnlineAvailable: true, nextSlot: 'Today, 6:30 PM',
  },
  {
    _id: '6', name: 'Dr. Vikram Patel', specialization: 'Neurologist',
    experienceYears: 14, consultationFee: 1200, averageRating: 4.5, totalFeedbacks: 97,
    clinic: { name: 'Neuro Care Hospital', city: 'Pune' },
    profileUrl: null, isOnlineAvailable: true, nextSlot: 'Fri, 3:00 PM',
  },
]

// Suggestions mock
const SYMPTOM_MAP = {
  'heart': { label: 'Cardiologist', type: 'specialization' },
  'chest': { label: 'Cardiologist', type: 'specialization' },
  'skin': { label: 'Dermatologist', type: 'specialization' },
  'rash': { label: 'Dermatologist', type: 'specialization' },
  'teeth': { label: 'Dentist', type: 'specialization' },
  'fever': { label: 'General Physician', type: 'specialization' },
  'headache': { label: 'Neurologist', type: 'specialization' },
  'bone': { label: 'Orthopedic Surgeon', type: 'specialization' },
  'anxiety': { label: 'Psychiatrist', type: 'specialization' },
}

export default function SearchDoctorsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef(null)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSpec, setActiveSpec] = useState(searchParams.get('specialization') || 'All')
  const [activeMode, setActiveMode] = useState('All')
  const [sortBy, setSortBy] = useState('relevance')
  const [doctors, setDoctors] = useState(MOCK_DOCTORS)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!searchParams.get('q'))

  // Generate suggestions from query
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return }
    const q = query.toLowerCase()

    const relatedSpecs = []
    const doctorMatches = []

    // Symptom/keyword → specialization
    Object.entries(SYMPTOM_MAP).forEach(([keyword, spec]) => {
      if (q.includes(keyword) && !relatedSpecs.find(s => s.label === spec.label)) {
        relatedSpecs.push(spec)
      }
    })

    // Doctor name fuzzy match
    MOCK_DOCTORS.forEach(d => {
      if (d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q)) {
        doctorMatches.push({ label: d.name, sub: d.specialization, type: 'doctor', id: d._id })
      }
    })

    setSuggestions({ doctors: doctorMatches.slice(0, 3), specializations: relatedSpecs.slice(0, 3) })
  }, [query])

  const handleSearch = (e) => {
    e?.preventDefault()
    setShowSuggestions(false)
    setSearched(true)
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      if (query.trim()) {
        const q = query.toLowerCase()
        const filtered = MOCK_DOCTORS.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          Object.entries(SYMPTOM_MAP).some(([kw, spec]) => q.includes(kw) && d.specialization === spec.label)
        )
        setDoctors(filtered)
      } else {
        setDoctors(MOCK_DOCTORS)
      }
      setLoading(false)
    }, 600)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'doctor') {
      router.push(`/doctors/${suggestion.id}`)
    } else if (suggestion.type === 'specialization') {
      setActiveSpec(suggestion.label)
      setQuery(suggestion.label)
      setShowSuggestions(false)
      setSearched(true)
    }
  }

  // Filter displayed doctors
  const filteredDoctors = doctors.filter(d => {
    if (activeSpec !== 'All' && d.specialization !== activeSpec) return false
    if (activeMode === 'Online' && !d.isOnlineAvailable) return false
    if (activeMode === 'Offline' && d.isOnlineAvailable) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.averageRating - a.averageRating
    if (sortBy === 'experience') return b.experienceYears - a.experienceYears
    if (sortBy === 'fee_asc') return a.consultationFee - b.consultationFee
    if (sortBy === 'fee_desc') return b.consultationFee - a.consultationFee
    return 0
  })

  const hasSuggestions = suggestions.doctors?.length > 0 || suggestions.specializations?.length > 0

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />

      {/* Search hero */}
      <div className="pt-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-5">Find Doctors</h1>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search by name, symptom, or specialization…"
                  className="input-base pl-10 py-3"
                />
                {/* Suggestions dropdown */}
                {showSuggestions && hasSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-modal z-50 overflow-hidden">
                    {suggestions.doctors?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50">
                          Doctors
                        </div>
                        {suggestions.doctors.map(s => (
                          <button key={s.id} type="button" onMouseDown={() => handleSuggestionClick(s)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600 flex-shrink-0">
                              {s.label.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">{s.label}</div>
                              <div className="text-xs text-slate-400">{s.sub}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestions.specializations?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 border-t border-slate-100">
                          Related Specializations
                        </div>
                        {suggestions.specializations.map(s => (
                          <button key={s.label} type="button" onMouseDown={() => handleSuggestionClick(s)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <span className="text-sm text-slate-800">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary px-5 py-3 text-sm whitespace-nowrap">Search</button>
            </form>
          </div>

          {/* Specialization pills */}
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide">
            {SPECIALIZATIONS.map(spec => (
              <button
                key={spec}
                onClick={() => { setActiveSpec(spec); setSearched(true) }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border
                  ${activeSpec === spec
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'}`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {/* Mode filter */}
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
              {MODES.map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                    ${activeMode === m ? 'bg-primary-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {searched && (
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{filteredDoctors.length}</span> doctors found
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-primary-400"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="h-9 bg-slate-200 rounded-xl mt-5" />
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-5">🔍</div>
            <h3 className="font-display text-xl font-semibold text-slate-800 mb-2">No doctors found</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Try adjusting your filters, or search with a different term like a symptom or specialization.
            </p>
            <button
              onClick={() => { setQuery(''); setActiveSpec('All'); setActiveMode('All'); setDoctors(MOCK_DOCTORS) }}
              className="mt-5 btn-secondary text-sm px-5 py-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredDoctors.map(doctor => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

function DoctorCard({ doctor }) {
  const initials = doctor.name.split(' ').map(w => w[0]).join('').slice(0, 2)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col">
      <div className="flex gap-4 mb-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center flex-shrink-0">
          {doctor.profileUrl ? (
            <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-primary-600 text-lg">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm truncate">{doctor.name}</h3>
          <p className="text-xs text-primary-600 font-medium mt-0.5">{doctor.specialization}</p>
          <p className="text-xs text-slate-500 mt-0.5">{doctor.experienceYears} yrs experience</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs font-semibold text-slate-700">{doctor.averageRating}</span>
            <span className="text-xs text-slate-400">({doctor.totalFeedbacks})</span>
          </div>
        </div>
      </div>

      {/* Clinic */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="truncate">{doctor.clinic.name}, {doctor.clinic.city}</span>
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {doctor.isOnlineAvailable && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">Offline</span>
      </div>

      {/* Fee + slot */}
      <div className="flex items-center justify-between mb-4 pt-3 border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400">Fee</span>
          <p className="text-sm font-semibold text-slate-800">₹{doctor.consultationFee}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Next slot</span>
          <p className="text-xs font-medium text-emerald-600">{doctor.nextSlot}</p>
        </div>
      </div>

      {/* CTA */}
      <Link href={`/doctors/${doctor._id}`}
        className="btn-primary text-sm py-2.5 text-center mt-auto">
        View Profile & Book
      </Link>
    </div>
  )
}