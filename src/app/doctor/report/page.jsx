'use client'
import { useState, useRef } from 'react'

const ISSUE_CATEGORIES = [
  { id: 'payment', label: 'Payment Issue', emoji: '💳', desc: 'Problem with fees, payouts, or refunds' },
  { id: 'technical', label: 'Technical Problem', emoji: '🔧', desc: 'App bugs, loading issues, errors' },
  { id: 'patient', label: 'Patient Concern', emoji: '👤', desc: 'Inappropriate behaviour or false booking' },
  { id: 'profile', label: 'Profile / Account', emoji: '⚙️', desc: 'Unable to update info or settings' },
  { id: 'consultation', label: 'Consultation Issue', emoji: '🎥', desc: 'Video call problems or no-shows' },
  { id: 'other', label: 'Other', emoji: '📝', desc: 'Any other concern not listed above' },
]

const PAST_REPORTS = [
  {
    _id: 'r1',
    title: 'Payment not credited to account',
    category: 'payment',
    status: 'resolved',
    createdAt: '2025-02-05',
    adminReply: 'The payment has been credited. Please check after 2 business days.',
  },
  {
    _id: 'r2',
    title: 'Video call disconnected repeatedly',
    category: 'consultation',
    status: 'in-review',
    createdAt: '2025-03-01',
    adminReply: null,
  },
]

const STATUS_MAP = {
  'open':      { label: 'Open',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'in-review': { label: 'In Review', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'resolved':  { label: 'Resolved',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'closed':    { label: 'Closed',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DoctorReportPage() {
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('new')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [form, setForm] = useState({ title: '', description: '' })
  const [attachment, setAttachment] = useState(null)
  const [attachmentName, setAttachmentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [expandedReport, setExpandedReport] = useState(null)

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleAttachment = e => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { setError('Only image or PDF files are allowed.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return }
    setAttachment(file)
    setAttachmentName(file.name)
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!selectedCategory) { setError('Please select an issue category.'); return }
    if (!form.title.trim()) { setError('Please enter a title for the issue.'); return }
    if (form.description.trim().length < 20) { setError('Please describe the issue in at least 20 characters.'); return }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('category', selectedCategory)
      formData.append('title', form.title.trim())
      formData.append('description', form.description.trim())
      if (attachment) formData.append('attachment', attachment)

      const res = await fetch('/api/doctor/report', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to submit report.')
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setSelectedCategory('')
    setForm({ title: '', description: '' })
    setAttachment(null)
    setAttachmentName('')
    setError('')
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-10 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-10">
          <div className="text-5xl mb-5">✅</div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Report Submitted!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Our team will review your issue and respond within 24–48 hours. You can track the status in "My Reports".
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { resetForm(); setActiveTab('history') }}
              className="btn-secondary text-sm px-5 py-2.5">
              View My Reports
            </button>
            <button onClick={resetForm} className="btn-primary text-sm px-5 py-2.5">
              Report Another Issue
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
        <h1 className="font-display text-2xl font-bold text-slate-900">Report an Issue</h1>
        <p className="text-slate-500 text-sm mt-1">
          Facing a problem? Let us know and we'll resolve it as quickly as possible.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { id: 'new', label: 'New Report' },
          { id: 'history', label: `My Reports (${PAST_REPORTS.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── NEW REPORT ─── */}
      {activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Category */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Issue Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ISSUE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.id); setError('') }}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150
                    ${selectedCategory === cat.id
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-slate-200 hover:border-primary-200 hover:bg-primary-50/30'}`}
                >
                  <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                  <div>
                    <p className={`text-sm font-semibold ${selectedCategory === cat.id ? 'text-primary-700' : 'text-slate-800'}`}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Issue Details</h2>

            <div>
              <label className="label">Title / Subject</label>
              <input type="text" name="title" value={form.title} onChange={handleChange}
                placeholder="Brief description of the issue…" maxLength={100}
                className="input-base" required />
              <p className="text-xs text-slate-400 text-right mt-1">{form.title.length}/100</p>
            </div>

            <div>
              <label className="label">Detailed Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Please describe the issue in detail — what happened, when it occurred, steps to reproduce if applicable…"
                rows={5} maxLength={2000} className="input-base resize-none text-sm" required />
              <p className="text-xs text-slate-400 text-right mt-1">{form.description.length}/2000</p>
            </div>

            {/* Attachment */}
            <div>
              <label className="label">Attachment <span className="text-slate-400 font-normal">(optional)</span></label>
              {attachment ? (
                <div className="flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700 truncate">{attachmentName}</p>
                    <button type="button" onClick={() => { setAttachment(null); setAttachmentName(''); fileInputRef.current.value = '' }}
                      className="text-xs text-red-400 hover:text-red-600 mt-0.5">Remove</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 p-3.5 border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50/40 rounded-xl transition-all duration-150 text-left">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Attach screenshot or file</p>
                    <p className="text-xs text-slate-400">JPG, PNG, PDF · Max 10MB</p>
                  </div>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleAttachment} className="hidden" />
            </div>
          </div>

          {/* Info note */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
            <p className="text-xs text-primary-700 leading-relaxed">
              ℹ️ Our support team reviews all reports within 24–48 hours. For urgent issues, please also reach out via the contact email in the footer.
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting report…
              </span>
            ) : 'Submit Report'}
          </button>
        </form>
      )}

      {/* ─── HISTORY ─── */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          {PAST_REPORTS.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-16 text-center">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm font-medium text-slate-700 mb-1">No reports yet</p>
              <p className="text-xs text-slate-400">Your submitted reports will appear here.</p>
            </div>
          ) : (
            PAST_REPORTS.map(report => {
              const s = STATUS_MAP[report.status] || STATUS_MAP.open
              const cat = ISSUE_CATEGORIES.find(c => c.id === report.category)
              return (
                <div key={report._id} className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                  <div
                    className="flex items-start gap-4 p-5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                    onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                      {cat?.emoji || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800">{report.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{cat?.label}</span>
                        <span>·</span>
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 mt-1 ${expandedReport === report._id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {expandedReport === report._id && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-5 animate-fade-in">
                      {report.adminReply ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Admin Response</p>
                          <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary-600">M</span>
                              </div>
                              <span className="text-xs font-semibold text-slate-700">MediConnect Support</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{report.adminReply}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-400 rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-xs text-slate-400">Our team is reviewing your report. We'll respond soon.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}