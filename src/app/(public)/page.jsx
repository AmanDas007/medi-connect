// Home Page

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const specializations = [
  { name: 'Cardiologist',    icon: '🫀', count: '48 doctors' },
  { name: 'Dermatologist',   icon: '🧴', count: '62 doctors' },
  { name: 'Neurologist',     icon: '🧠', count: '35 doctors' },
  { name: 'Orthopedic',      icon: '🦴', count: '41 doctors' },
  { name: 'Pediatrician',    icon: '👶', count: '57 doctors' },
  { name: 'Gynecologist',    icon: '🌸', count: '44 doctors' },
  { name: 'Psychiatrist',    icon: '💭', count: '29 doctors' },
  { name: 'General Physician',icon: '🩺', count: '93 doctors' },
]

const stats = [
  { value: '10,000+', label: 'Patients Served' },
  { value: '500+',    label: 'Verified Doctors' },
  { value: '50+',     label: 'Specializations' },
  { value: '4.8★',    label: 'Average Rating' },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Patient',
    text: 'Booking an appointment used to be such a hassle. MediConnect made it incredibly smooth — I found a great cardiologist and got an online slot within minutes.',
    rating: 5,
    avatar: 'PS',
  },
  {
    name: 'Dr. Rahul Mehta',
    role: 'Cardiologist',
    text: 'Managing my schedule, availability, and patient interactions — all in one place. MediConnect has genuinely streamlined my practice.',
    rating: 5,
    avatar: 'RM',
  },
  {
    name: 'Arjun Das',
    role: 'Patient',
    text: 'The video consultation experience was seamless. Even got my prescription digitally. Fantastic for someone with a hectic work schedule.',
    rating: 5,
    avatar: 'AD',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Search a Doctor',
    desc: 'Search by name, symptom, specialization, or location. Get instant smart suggestions.',
  },
  {
    step: '02',
    title: 'Book a Slot',
    desc: 'View real-time availability and pick a convenient time for offline or online consultation.',
  },
  {
    step: '03',
    title: 'Get Consultation',
    desc: 'Meet your doctor in-person or join the video call. Receive your prescription digitally.',
  },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/doctors?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/doctors')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-primary-50/60 via-white to-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-100/30 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Pill label */}
            <div className="inline-flex items-center gap-2 bg-white border border-primary-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-slow" />
              <span className="text-xs font-medium text-primary-700">Trusted by 10,000+ patients across India</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-5 text-balance">
              Your health deserves{' '}
              <span className="text-primary-600 italic">better care</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
              Connect with verified doctors for in-clinic or online consultations.
              Book instantly, consult seamlessly, get better faster.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-lg border border-slate-100 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-2 px-3">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search doctor, symptom, or specialization…"
                  className="flex-1 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3 rounded-xl text-sm whitespace-nowrap">
                Find Doctors
              </button>
            </form>

            {/* Quick searches */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {['Heart issue', 'Skin problem', 'Fever', 'Back pain', 'Anxiety'].map(q => (
                <button
                  key={q}
                  onClick={() => router.push(`/doctors?q=${encodeURIComponent(q)}`)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-10 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-1">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Specializations ─── */}
      <section className="py-16 md:py-20 bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title mb-2">Browse by Specialization</h2>
            <p className="text-slate-500 text-sm">Find the right specialist for your health concern</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {specializations.map(spec => (
              <Link
                key={spec.name}
                href={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
                className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3 border border-slate-100 shadow-card
                           hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <span className="text-3xl">{spec.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{spec.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{spec.count}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/doctors" className="btn-secondary text-sm px-5 py-2.5">
              View All Specializations
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">How MediConnect Works</h2>
            <p className="text-slate-500 text-sm">Simple, fast, and reliable — from search to recovery</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary-200 to-transparent -translate-x-4 z-0" />
                )}
                <div className="bg-primary-50 rounded-2xl p-6 relative z-10">
                  <div className="font-mono text-4xl font-bold text-primary-200 mb-4 leading-none">{step.step}</div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Online consultation CTA ─── */}
      <section className="py-12 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                Consult from your home
              </h2>
              <p className="text-primary-100 text-sm md:text-base max-w-md">
                Skip the clinic wait. Connect with top doctors via secure video consultation — anytime, anywhere.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href="/doctors?mode=online"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-700 font-medium text-sm rounded-xl hover:bg-primary-50 transition-colors"
              >
                Book Online Consult
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium text-sm rounded-xl border border-primary-400 hover:bg-primary-400 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 md:py-20 bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title mb-2">What people are saying</h2>
            <p className="text-slate-500 text-sm">Real experiences from patients and doctors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Doctor CTA ─── */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-xl mx-auto">
            <div className="text-3xl mb-4">🩺</div>
            <h2 className="section-title mb-3">Are you a doctor?</h2>
            <p className="text-slate-500 text-sm mb-7">
              Join MediConnect to manage your availability, see appointments, and conduct video consultations — all in one professional platform.
            </p>
            <Link href="/register/doctor" className="btn-primary px-8 py-3 text-sm">
              Join as a Doctor
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}