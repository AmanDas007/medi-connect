'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import PatientSidebar from '@/components/patient/PatientSidebar'
import { mockDoctors } from '@/data/mockDoctors'

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function DoctorCard({ doctor }) {
  return (
    <Link
      href={`/doctors/${doctor._id}`}
      className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
            {doctor.profileUrl ? (
              <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-700 font-semibold">
                {getInitials(doctor.name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {doctor.name}
            </h3>
            <p className="text-sm text-primary-600 font-medium mt-0.5">
              {doctor.specialization}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="badge bg-emerald-50 text-emerald-700">
                ★ {doctor.averageRating}
              </span>
              <span className="badge bg-slate-100 text-slate-600">
                {doctor.experienceYears} yrs exp
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Fee</span>
            <span className="font-semibold text-slate-800">₹{doctor.consultationFee}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Clinic</span>
            <span className="font-medium text-slate-700 text-right">{doctor.clinic.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Location</span>
            <span className="font-medium text-slate-700 text-right">
              {doctor.clinic.city}, {doctor.clinic.state}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 truncate pr-3">
            {doctor.clinic.address}
          </p>
          <span className="text-sm font-medium text-primary-600 shrink-0">
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function PatientDashboardPage() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const user = session?.user

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return mockDoctors

    return mockDoctors.filter(doctor => {
      const searchText = [
        doctor.name,
        doctor.specialization,
        doctor.clinic.city,
        doctor.clinic.state,
        doctor.clinic.address,
        doctor.clinic.name,
        doctor.about,
      ]
        .join(' ')
        .toLowerCase()

      return searchText.includes(q)
    })
  }, [query])

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

              <div>
                <p className="text-xs text-slate-400">Welcome,</p>
                <h1 className="text-lg font-semibold text-slate-900">
                  {user?.name || 'Patient'}
                </h1>
              </div>
            </div>

            <Link
              href="/profile"
              className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden hover:ring-[3px] hover:ring-primary-500/10 transition-all"
            >
              {user?.profileUrl ? (
                <img src={user.profileUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-primary-700">
                  {getInitials(user?.name || 'Patient')}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <section className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Find the right doctor for your care
              </h2>
              <p className="text-primary-100 text-sm md:text-base mt-3">
                Search by doctor name, specialization, symptom, clinic, or city.
              </p>
            </div>
          </section>

          <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-card p-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 pl-3 text-2xl">⌕</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by doctor name, specialization, city, clinic..."
                className="flex-1 py-3 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-3"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Available Doctors</h2>
              <p className="text-sm text-slate-500 mt-1">
                {filteredDoctors.length} doctor(s) found
              </p>
            </div>
          </div>

          {filteredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
              {filteredDoctors.map(doctor => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <div className="text-4xl mb-3">🔎</div>
              <h3 className="font-semibold text-slate-900">No doctors found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Try searching with a different name, specialization, or city.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}