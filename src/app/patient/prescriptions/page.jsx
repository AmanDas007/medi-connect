'use client'
import { useState } from 'react'

const MOCK_PRESCRIPTIONS = [
  {
    _id: 'rx1',
    doctorName: 'Dr. Ananya Krishnan',
    specialization: 'Cardiologist',
    doctorInitials: 'AK',
    date: '2025-02-10',
    appointmentId: 'a3',
    mode: 'online',
    fileUrl: '/prescriptions/rx1.pdf',
    fileName: 'prescription_10_feb_2025.pdf',
    medicines: [
      { name: 'Atorvastatin 10mg', dosage: '1 tablet', frequency: 'Once daily at night', duration: '30 days' },
      { name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once daily morning', duration: '30 days' },
      { name: 'Metoprolol 25mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days' },
    ],
    diagnosis: 'Mild hypertension with elevated LDL cholesterol',
    notes: 'Follow low-sodium diet. Avoid stress. Report any chest pain immediately. Review after 30 days.',
  },
  {
    _id: 'rx2',
    doctorName: 'Dr. Suresh Nair',
    specialization: 'Orthopedic Surgeon',
    doctorInitials: 'SN',
    date: '2025-01-22',
    appointmentId: 'a4',
    mode: 'offline',
    fileUrl: '/prescriptions/rx2.pdf',
    fileName: 'prescription_22_jan_2025.pdf',
    medicines: [
      { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Three times daily after meals', duration: '7 days' },
      { name: 'Muscle relaxant (Thiocolchicoside 4mg)', dosage: '1 capsule', frequency: 'Twice daily', duration: '7 days' },
    ],
    diagnosis: 'Lumbar muscle strain',
    notes: 'Rest for 5 days. Apply ice pack. Avoid lifting heavy objects. Physiotherapy recommended after pain subsides.',
  },
]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PrescriptionsPage() {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = MOCK_PRESCRIPTIONS.filter(rx =>
    !search ||
    rx.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    rx.diagnosis.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-slate-500 text-sm mt-1">All your digital prescriptions in one place</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by doctor or diagnosis…"
          className="input-base pl-9 py-2 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-sm font-medium text-slate-700 mb-1">No prescriptions found</p>
          <p className="text-xs text-slate-400">Prescriptions will appear here after completed consultations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(rx => (
            <div key={rx._id}>
              <div
                onClick={() => setSelected(selected?._id === rx._id ? null : rx)}
                className={`bg-white rounded-2xl border shadow-card cursor-pointer transition-all duration-200 overflow-hidden
                  ${selected?._id === rx._id ? 'border-primary-300 shadow-card-hover' : 'border-slate-100 hover:shadow-card-hover hover:-translate-y-0.5'}`}
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600 flex-shrink-0">
                      {rx.doctorInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{rx.doctorName}</p>
                      <p className="text-xs text-primary-600 font-medium mt-0.5">{rx.specialization}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(rx.date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${rx.mode === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {rx.mode === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">Diagnosis</p>
                    <p className="text-sm text-slate-700 font-medium">{rx.diagnosis}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400">{rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''} prescribed</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); window.open(rx.fileUrl, '_blank') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg hover:bg-primary-100 transition-colors border border-primary-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </button>
                      <button className={`text-xs text-slate-500 hover:text-slate-700 transition-colors`}>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${selected?._id === rx._id ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded medicine list */}
                {selected?._id === rx._id && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 animate-fade-in">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Medicines</h4>
                    <div className="space-y-3">
                      {rx.medicines.map((med, i) => (
                        <div key={i} className="bg-white rounded-xl p-3.5 border border-slate-100">
                          <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                            <span className="text-xs text-slate-500">💊 {med.dosage}</span>
                            <span className="text-xs text-slate-500">🕐 {med.frequency}</span>
                            <span className="text-xs text-slate-500">📅 {med.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {rx.notes && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Doctor's Notes</h4>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                          <p className="text-sm text-slate-700 leading-relaxed">{rx.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}