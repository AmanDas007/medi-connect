'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedic Surgeon', 'Pediatrician', 'Gynecologist', 'Psychiatrist',
  'Ophthalmologist', 'ENT Specialist', 'Gastroenterologist', 'Urologist',
  'Pulmonologist', 'Endocrinologist', 'Rheumatologist', 'Oncologist',
  'Nephrologist', 'Dentist', 'Radiologist', 'Pathologist', 'Anesthesiologist',
]

const STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Professional' },
  { id: 3, label: 'Clinic Details' },
]

export default function DoctorRegisterPage() {
  const router = useRouter()
  const profileInputRef = useRef(null)
  const licenceInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    experienceYears: '',
    consultationFee: '',
    clinicName: '',
    clinicAddress: '',
    clinicCity: '',
    clinicState: '',
    clinicPincode: '',
    longitude: '',
    latitude: '',
  })

  const [profileImage, setProfileImage] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [licence, setLicence] = useState(null)
  const [licenceName, setLicenceName] = useState('')

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleProfileImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Profile photo must be an image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Profile photo must be under 5MB.'); return }
    setProfileImage(file)
    setProfilePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleLicence = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { setError('Licence must be an image or PDF.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Licence file must be under 10MB.'); return }
    setLicence(file)
    setLicenceName(file.name)
    setError('')
  }

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.name.trim()) return 'Full name is required.'
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.'
      if (form.password.length < 6) return 'Password must be at least 6 characters.'
      if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    }
    if (s === 2) {
      if (!form.specialization) return 'Please select your specialization.'
      if (!form.experienceYears || isNaN(form.experienceYears) || Number(form.experienceYears) < 0) return 'Valid experience years required.'
      if (!form.consultationFee || isNaN(form.consultationFee) || Number(form.consultationFee) <= 0) return 'Valid consultation fee required.'
      if (!licence) return 'Medical licence is required.'
    }
    if (s === 3) {
      if (!form.clinicName.trim()) return 'Clinic name is required.'
      if (!form.clinicAddress.trim()) return 'Clinic address is required.'
      if (!form.clinicCity.trim()) return 'City is required.'
      if (!form.clinicState.trim()) return 'State is required.'
      if (!form.clinicPincode.trim() || !/^\d{6}$/.test(form.clinicPincode)) return 'Valid 6-digit pincode is required.'
    }
    return null
  }

  const nextStep = () => {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateStep(3)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('email', form.email.trim().toLowerCase())
      formData.append('password', form.password)
      formData.append('specialization', form.specialization)
      formData.append('experienceYears', form.experienceYears)
      formData.append('consultationFee', form.consultationFee)
      formData.append('clinicName', form.clinicName.trim())
      formData.append('clinicAddress', form.clinicAddress.trim())
      formData.append('clinicCity', form.clinicCity.trim())
      formData.append('clinicState', form.clinicState.trim())
      formData.append('clinicPincode', form.clinicPincode.trim())
      if (form.longitude) formData.append('longitude', form.longitude)
      if (form.latitude) formData.append('latitude', form.latitude)
      if (profileImage) formData.append('profileImage', profileImage)
      formData.append('licence', licence)

      const res = await fetch('/api/auth/doctor/register', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.')
      } else {
        setSuccess('Registration successful! Your account is under review. Redirecting to login…')
        setTimeout(() => router.push('/login'), 2500)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-display font-semibold text-base text-slate-900">
            Medi<span className="text-primary-600">Connect</span>
          </span>
        </Link>
        <span className="text-sm text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
        </span>
      </div>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-xl">
          {/* Page title */}
          <div className="text-center mb-7">
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Join as a Doctor</h1>
            <p className="text-slate-500 text-sm">Create your professional profile on MediConnect</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-200
                    ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {step > s.id ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.id}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${step === s.id ? 'text-primary-600' : 'text-slate-400'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-16 mx-2 mb-4 transition-colors duration-200 ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
            {/* Alerts */}
            {success && (
              <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* ─── STEP 1: Personal Info ─── */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Personal Information</h2>

                {/* Profile image */}
                <div>
                  <label className="label">Profile Photo <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center flex-shrink-0">
                      {profilePreview
                        ? <img src={profilePreview} alt="preview" className="w-full h-full object-cover" />
                        : <span className="text-2xl text-primary-200">👤</span>
                      }
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => profileInputRef.current?.click()}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                        {profilePreview ? 'Change photo' : 'Upload photo'}
                      </button>
                      {profilePreview && (
                        <button type="button" onClick={() => { setProfileImage(null); setProfilePreview(null) }}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors text-left">Remove</button>
                      )}
                      <span className="text-xs text-slate-400">JPG, PNG · Max 5MB</span>
                    </div>
                  </div>
                  <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileImage} className="hidden" />
                </div>

                <div>
                  <label htmlFor="name" className="label">Full Name</label>
                  <input id="name" type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Dr. Priya Mehta" autoComplete="name" className="input-base" />
                </div>

                <div>
                  <label htmlFor="email" className="label">Email Address</label>
                  <input id="email" type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="doctor@example.com" autoComplete="email" className="input-base" />
                </div>

                <div>
                  <label htmlFor="password" className="label">Password</label>
                  <div className="relative">
                    <input id="password" type={showPassword ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange} placeholder="Min. 6 characters"
                      autoComplete="new-password" className="input-base pr-11" />
                    <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                  <div className="relative">
                    <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                      value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                      autoComplete="new-password" className="input-base pr-11" />
                    <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                  </div>
                </div>

                <button type="button" onClick={nextStep} className="btn-primary w-full py-3 text-sm mt-2">
                  Continue →
                </button>
              </div>
            )}

            {/* ─── STEP 2: Professional Info ─── */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Professional Details</h2>

                <div>
                  <label htmlFor="specialization" className="label">Specialization</label>
                  <select id="specialization" name="specialization" value={form.specialization} onChange={handleChange} className="input-base">
                    <option value="">Select specialization…</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="experienceYears" className="label">Experience (years)</label>
                    <input id="experienceYears" type="number" name="experienceYears" value={form.experienceYears}
                      onChange={handleChange} placeholder="e.g. 8" min="0" max="70" className="input-base" />
                  </div>
                  <div>
                    <label htmlFor="consultationFee" className="label">Consultation Fee (₹)</label>
                    <input id="consultationFee" type="number" name="consultationFee" value={form.consultationFee}
                      onChange={handleChange} placeholder="e.g. 500" min="0" className="input-base" />
                  </div>
                </div>

                {/* Licence upload */}
                <div>
                  <label className="label">
                    Medical Licence{' '}
                    <span className="text-red-500">*</span>
                    <span className="text-slate-400 font-normal ml-1">(required)</span>
                  </label>
                  <div
                    onClick={() => licenceInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors duration-150 text-center
                      ${licence ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/40'}`}
                  >
                    {licence ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-emerald-700">{licenceName}</p>
                          <p className="text-xs text-emerald-500">Click to replace</p>
                        </div>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setLicence(null); setLicenceName(''); licenceInputRef.current.value = '' }}
                          className="ml-auto text-xs text-red-400 hover:text-red-600"
                        >Remove</button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-700">Upload Medical Licence</p>
                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF · Max 10MB</p>
                      </>
                    )}
                  </div>
                  <input ref={licenceInputRef} type="file" accept="image/*,application/pdf" onChange={handleLicence} className="hidden" />
                  <p className="text-xs text-slate-400 mt-2">
                    Your licence will be reviewed by our team before your profile goes live.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={prevStep} className="btn-secondary flex-1 py-3 text-sm">← Back</button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1 py-3 text-sm">Continue →</button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Clinic Details ─── */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Clinic Details</h2>

                <div>
                  <label htmlFor="clinicName" className="label">Clinic / Hospital Name</label>
                  <input id="clinicName" type="text" name="clinicName" value={form.clinicName} onChange={handleChange}
                    placeholder="Apollo Clinic, Mumbai" className="input-base" />
                </div>

                <div>
                  <label htmlFor="clinicAddress" className="label">Clinic Address</label>
                  <textarea id="clinicAddress" name="clinicAddress" value={form.clinicAddress} onChange={handleChange}
                    placeholder="Building, Street, Area…" rows={2}
                    className="input-base resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clinicCity" className="label">City</label>
                    <input id="clinicCity" type="text" name="clinicCity" value={form.clinicCity} onChange={handleChange}
                      placeholder="Mumbai" className="input-base" />
                  </div>
                  <div>
                    <label htmlFor="clinicState" className="label">State</label>
                    <input id="clinicState" type="text" name="clinicState" value={form.clinicState} onChange={handleChange}
                      placeholder="Maharashtra" className="input-base" />
                  </div>
                </div>

                <div>
                  <label htmlFor="clinicPincode" className="label">Pincode</label>
                  <input id="clinicPincode" type="text" name="clinicPincode" value={form.clinicPincode} onChange={handleChange}
                    placeholder="400001" maxLength={6} className="input-base" />
                </div>

                {/* Optional coordinates */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 select-none list-none flex items-center gap-1.5">
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Add GPS coordinates (optional)
                  </summary>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label htmlFor="latitude" className="label">Latitude</label>
                      <input id="latitude" type="number" name="latitude" value={form.latitude} onChange={handleChange}
                        placeholder="19.0760" step="any" className="input-base" />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="label">Longitude</label>
                      <input id="longitude" type="number" name="longitude" value={form.longitude} onChange={handleChange}
                        placeholder="72.8777" step="any" className="input-base" />
                    </div>
                  </div>
                </details>

                <p className="text-xs text-slate-400 leading-relaxed">
                  By registering, you agree to our{' '}
                  <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:underline">Doctor Code of Conduct</a>.
                  Your account will be reviewed before activation.
                </p>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={prevStep} className="btn-secondary flex-1 py-3 text-sm">← Back</button>
                  <button type="submit" disabled={loading || !!success}
                    className="btn-primary flex-1 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting…
                      </span>
                    ) : 'Submit Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Looking for a patient account?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">Register as patient →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  )
}