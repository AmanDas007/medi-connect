'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const MOCK_APPOINTMENT = {
  _id: 'da2',
  patientName: 'Priya Das',
  patientInitials: 'PD',
  slotStart: '2025-03-18T10:00:00',
  mode: 'online',
  status: 'completed',
}

const COMMON_MEDICINES = [
  'Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 500mg', 'Azithromycin 500mg',
  'Omeprazole 20mg', 'Pantoprazole 40mg', 'Metformin 500mg', 'Atorvastatin 10mg',
  'Amlodipine 5mg', 'Metoprolol 25mg', 'Aspirin 75mg', 'Clopidogrel 75mg',
]
const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Once daily morning', 'Once daily night', 'Before meals', 'After meals',
  'Every 8 hours', 'Every 12 hours', 'As needed (SOS)',
]
const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months', 'Ongoing']

function generateId() { return Math.random().toString(36).slice(2, 8) }

const EMPTY_MEDICINE = () => ({ id: generateId(), name: '', dosage: '', frequency: 'Once daily', duration: '7 days', notes: '' })

export default function DoctorPrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef(null)
  const appt = MOCK_APPOINTMENT

  const [mode, setMode] = useState('create') // 'create' | 'upload'
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState([EMPTY_MEDICINE()])
  const [doctorNotes, setDoctorNotes] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [medSuggestions, setMedSuggestions] = useState({ show: false, idx: null, query: '' })

  const addMedicine = () => setMedicines(prev => [...prev, EMPTY_MEDICINE()])
  const removeMedicine = (id) => setMedicines(prev => prev.filter(m => m.id !== id))
  const updateMedicine = (id, field, value) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
    setError('')
  }

  const handleMedicineNameChange = (id, value, idx) => {
    updateMedicine(id, 'name', value)
    if (value.length >= 2) {
      const suggestions = COMMON_MEDICINES.filter(m => m.toLowerCase().includes(value.toLowerCase()))
      setMedSuggestions({ show: suggestions.length > 0, idx, query: value, list: suggestions })
    } else {
      setMedSuggestions({ show: false, idx, query: value })
    }
  }

  const selectMedicineSuggestion = (id, name) => {
    updateMedicine(id, 'name', name)
    setMedSuggestions({ show: false })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { setError('Please upload an image or PDF.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return }
    setUploadFile(file)
    if (file.type.startsWith('image/')) {
      setUploadPreview(URL.createObjectURL(file))
    } else {
      setUploadPreview(null)
    }
    setError('')
  }

  const validate = () => {
    if (mode === 'create') {
      if (!diagnosis.trim()) return 'Diagnosis is required.'
      for (const med of medicines) {
        if (!med.name.trim()) return 'All medicine names are required.'
        if (!med.dosage.trim()) return 'All dosage fields are required.'
      }
    } else {
      if (!uploadFile) return 'Please upload a prescription file.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      let body
      if (mode === 'create') {
        body = JSON.stringify({ appointmentId: appt._id, diagnosis, medicines, doctorNotes, followUp })
        const res = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
      } else {
        const formData = new FormData()
        formData.append('appointmentId', appt._id)
        formData.append('prescription', uploadFile)
        const res = await fetch('/api/prescriptions/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to save prescription.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-10 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-10">
          <div className="text-5xl mb-5">📋</div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Prescription Saved!</h2>
          <p className="text-slate-500 text-sm mb-6">
            The prescription for {appt.patientName} has been saved and sent to the patient.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/doctor/appointments" className="btn-primary text-sm py-2.5 text-center">
              Back to Appointments
            </Link>
            <button onClick={() => { setSuccess(false); setDiagnosis(''); setMedicines([EMPTY_MEDICINE()]); setDoctorNotes(''); setFollowUp('') }}
              className="btn-secondary text-sm py-2.5">
              Write Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/doctor/appointments" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to appointments
        </Link>
        <h1 className="font-display text-2xl font-bold text-slate-900">Write Prescription</h1>
        <p className="text-slate-500 text-sm mt-1">Prescribe medicines or upload a signed prescription</p>
      </div>

      {/* Patient info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600 flex-shrink-0">
          {appt.patientInitials}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{appt.patientName}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>{formatDate(appt.slotStart)}</span>
            <span>·</span>
            <span>{formatTime(appt.slotStart)}</span>
            <span className={appt.mode === 'online' ? 'text-emerald-600' : 'text-slate-500'}>
              · {appt.mode === 'online' ? '🎥 Online' : '🏥 Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { id: 'create', label: '✏️ Write Prescription' },
          { id: 'upload', label: '📤 Upload Prescription' },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setError('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${mode === m.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─── CREATE MODE ─── */}
        {mode === 'create' && (
          <>
            {/* Diagnosis */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Diagnosis</h2>
              <input type="text" value={diagnosis} onChange={e => { setDiagnosis(e.target.value); setError('') }}
                placeholder="e.g. Mild hypertension with elevated LDL cholesterol"
                className="input-base" required />
            </div>

            {/* Medicines */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">Medicines</h2>
                <button type="button" onClick={addMedicine}
                  className="text-xs text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Medicine
                </button>
              </div>

              <div className="space-y-5">
                {medicines.map((med, idx) => (
                  <div key={med.id} className="border border-slate-200 rounded-xl p-4 relative group">
                    {/* Remove */}
                    {medicines.length > 1 && (
                      <button type="button" onClick={() => removeMedicine(med.id)}
                        className="absolute top-3 right-3 p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-medium text-slate-500">Medicine {idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Name with autocomplete */}
                      <div className="sm:col-span-2 relative">
                        <label className="label text-xs">Medicine Name</label>
                        <input type="text" value={med.name}
                          onChange={e => handleMedicineNameChange(med.id, e.target.value, idx)}
                          onBlur={() => setTimeout(() => setMedSuggestions({ show: false }), 150)}
                          placeholder="e.g. Atorvastatin 10mg"
                          className="input-base text-sm" required />
                        {medSuggestions.show && medSuggestions.idx === idx && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-modal z-20 overflow-hidden max-h-40 overflow-y-auto">
                            {medSuggestions.list?.map(name => (
                              <button key={name} type="button" onMouseDown={() => selectMedicineSuggestion(med.id, name)}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="label text-xs">Dosage</label>
                        <input type="text" value={med.dosage}
                          onChange={e => updateMedicine(med.id, 'dosage', e.target.value)}
                          placeholder="e.g. 1 tablet" className="input-base text-sm" required />
                      </div>

                      <div>
                        <label className="label text-xs">Frequency</label>
                        <select value={med.frequency} onChange={e => updateMedicine(med.id, 'frequency', e.target.value)} className="input-base text-sm">
                          {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="label text-xs">Duration</label>
                        <select value={med.duration} onChange={e => updateMedicine(med.id, 'duration', e.target.value)} className="input-base text-sm">
                          {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="label text-xs">Special Instructions <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input type="text" value={med.notes}
                          onChange={e => updateMedicine(med.id, 'notes', e.target.value)}
                          placeholder="e.g. Take with food" className="input-base text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor notes + follow-up */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4">
              <div>
                <label className="label">Doctor's Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Follow low-sodium diet. Avoid heavy exercise. Report any chest pain immediately."
                  rows={3} className="input-base resize-none text-sm" />
              </div>
              <div>
                <label className="label">Follow-up Date <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} className="input-base" />
              </div>
            </div>
          </>
        )}

        {/* ─── UPLOAD MODE ─── */}
        {mode === 'upload' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Upload Signed Prescription</h2>
            <p className="text-xs text-slate-400 mb-5">Upload a photo or scanned PDF of your handwritten or stamped prescription.</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150 text-center
                ${uploadFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/40'}`}
            >
              {uploadFile ? (
                <div className="p-6">
                  {uploadPreview ? (
                    <div className="mb-3">
                      <img src={uploadPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain border border-slate-200" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  <p className="text-sm font-medium text-emerald-700">{uploadFile.name}</p>
                  <p className="text-xs text-emerald-500 mt-0.5">Click to replace</p>
                  <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); setUploadPreview(null) }}
                    className="mt-2 text-xs text-red-400 hover:text-red-600">Remove</button>
                </div>
              ) : (
                <div className="p-10">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload prescription</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF · Max 10MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
          </div>
        )}

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving prescription…
            </span>
          ) : mode === 'create' ? 'Save & Send Prescription' : 'Upload & Send Prescription'}
        </button>
      </form>
    </div>
  )
}