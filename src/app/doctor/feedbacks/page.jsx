'use client'

import { useState } from 'react'
import DoctorSidebar from '@/components/doctor/DoctorSidebar'

export default function DoctorFeedbacksPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-2">
      <DoctorSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="lg:pl-64">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center"
            >
              <span className="text-xl leading-none">≡</span>
            </button>
            <h1 className="text-lg font-semibold text-slate-900">View Feedbacks</h1>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-10 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              No feedbacks yet
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Patient feedbacks and ratings will appear here after consultations.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}