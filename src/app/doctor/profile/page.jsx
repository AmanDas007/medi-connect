'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import DoctorSidebar from '@/components/doctor/DoctorSidebar.jsx/page'

const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
    'Orthopedic Surgeon', 'Pediatrician', 'Gynecologist', 'Psychiatrist',
    'Ophthalmologist', 'ENT Specialist', 'Gastroenterologist', 'Urologist',
    'Pulmonologist', 'Endocrinologist', 'Rheumatologist', 'Oncologist',
    'Nephrologist', 'Dentist', 'Radiologist', 'Pathologist', 'Anesthesiologist',
]

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function parseSpecializations(value) {
  if (!value) return []
  if (Array.isArray(value)) return value

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export default function DoctorProfilePage() {
  const { status, update } = useSession()
  const fileInputRef = useRef(null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [doctor, setDoctor] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedSpecializations, setSelectedSpecializations] = useState([])
  const [experienceYears, setExperienceYears] = useState('')
  const [consultationFee, setConsultationFee] = useState('')

  const [clinicName, setClinicName] = useState('')
  const [clinicAddress, setClinicAddress] = useState('')
  const [clinicCity, setClinicCity] = useState('')
  const [clinicState, setClinicState] = useState('')
  const [clinicPincode, setClinicPincode] = useState('')
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')

  const [profileImage, setProfileImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)

  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDoctor = async () => {
      if (status !== 'authenticated') return

      setFetching(true)
      setError('')

      try {
        const res = await fetch('/api/doctor/profile', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Failed to fetch profile.')
          return
        }

        const user = data.doctor

        setDoctor(user)
        setName(user.name || '')
        setEmail(user.email || '')
        setSelectedSpecializations(parseSpecializations(user.specialization))
        setExperienceYears(user.experienceYears ?? '')
        setConsultationFee(user.consultationFee ?? '')

        setClinicName(user.clinic?.name || '')
        setClinicAddress(user.clinic?.address || '')
        setClinicCity(user.clinic?.city || '')
        setClinicState(user.clinic?.state || '')
        setClinicPincode(user.clinic?.pincode || '')
        setLongitude(user.clinic?.location?.coordinates?.[0] ?? '')
        setLatitude(user.clinic?.location?.coordinates?.[1] ?? '')

        setPreview(user.profileUrl || null)
        setProfileImage(null)
        setRemoveImage(false)
      } catch {
        setError('Something went wrong while fetching profile.')
      } finally {
        setFetching(false)
      }
    }

    fetchDoctor()
  }, [status])

  const toggleSpecialization = spec => {
    setSelectedSpecializations(prev => {
      if (prev.includes(spec)) {
        return prev.filter(item => item !== spec)
      }

      return [...prev, spec]
    })

    setError('')
    setMessage('')
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }

    setProfileImage(file)
    setPreview(URL.createObjectURL(file))
    setRemoveImage(false)
    setError('')
    setMessage('')
  }

  const handleDeleteImage = () => {
    setProfileImage(null)
    setPreview(null)
    setRemoveImage(true)
    setError('')
    setMessage('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (selectedSpecializations.length === 0) {
      setError('Please select at least one specialization.')
      return
    }

    if (
      !clinicName.trim() ||
      !clinicAddress.trim() ||
      !clinicCity.trim() ||
      !clinicState.trim() ||
      !clinicPincode.trim()
    ) {
      setError('Clinic name, address, city, state and pincode are required.')
      return
    }

    if (!consultationFee || Number(consultationFee) <= 0) {
      setError('Consultation fee is required.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()

      formData.append('specialization', selectedSpecializations.join(', '))
      formData.append('experienceYears', experienceYears || '0')
      formData.append('consultationFee', consultationFee)

      formData.append('clinicName', clinicName.trim())
      formData.append('clinicAddress', clinicAddress.trim())
      formData.append('clinicCity', clinicCity.trim())
      formData.append('clinicState', clinicState.trim())
      formData.append('clinicPincode', clinicPincode.trim())

      if (longitude !== '') formData.append('longitude', longitude)
      if (latitude !== '') formData.append('latitude', latitude)

      formData.append('removeImage', removeImage ? 'true' : 'false')

      if (profileImage) {
        formData.append('profileImage', profileImage)
      }

      const res = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Profile update failed.')
        return
      }

      const updatedDoctor = data.doctor

      setDoctor(updatedDoctor)
      setName(updatedDoctor?.name || name)
      setEmail(updatedDoctor?.email || email)
      setSelectedSpecializations(parseSpecializations(updatedDoctor?.specialization))
      setExperienceYears(updatedDoctor?.experienceYears ?? '')
      setConsultationFee(updatedDoctor?.consultationFee ?? '')

      setClinicName(updatedDoctor?.clinic?.name || '')
      setClinicAddress(updatedDoctor?.clinic?.address || '')
      setClinicCity(updatedDoctor?.clinic?.city || '')
      setClinicState(updatedDoctor?.clinic?.state || '')
      setClinicPincode(updatedDoctor?.clinic?.pincode || '')
      setLongitude(updatedDoctor?.clinic?.location?.coordinates?.[0] ?? '')
      setLatitude(updatedDoctor?.clinic?.location?.coordinates?.[1] ?? '')

      setPreview(updatedDoctor?.profileUrl || null)
      setProfileImage(null)
      setRemoveImage(false)
      setMessage('Profile updated successfully.')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (update) {
        await update({
          profileUrl: updatedDoctor?.profileUrl || null,
          specialization: updatedDoctor?.specialization || selectedSpecializations.join(', '),
        })
      }
    } catch {
      setError('Something went wrong while updating profile.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <DoctorSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

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
              <h1 className="text-lg font-semibold text-slate-900">Doctor Profile</h1>
            </div>

            <Link href="/doctor/dashboard" className="text-sm font-medium text-primary-600">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-slate-900">
                Profile Settings
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Update your clinic, specialization, consultation fee, and profile picture.
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-28 h-28 rounded-full overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center"
                >
                  {preview ? (
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-primary-700">
                      {getInitials(name || doctor?.name || 'Doctor')}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-2xl">📷</span>
                  </div>
                </button>

                <div>
                  <p className="text-sm font-medium text-slate-800">Profile Picture</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP. Max 5MB.</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      Upload New
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Delete Image
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Doctor Name</label>
                  <input
                    value={name}
                    disabled
                    className="input-base bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input
                    value={email}
                    disabled
                    className="input-base bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="label">Experience Years</label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={e => setExperienceYears(e.target.value)}
                    className="input-base"
                    disabled={fetching}
                  />
                </div>

                <div>
                  <label className="label">Consultation Fee</label>
                  <input
                    type="number"
                    min="1"
                    value={consultationFee}
                    onChange={e => setConsultationFee(e.target.value)}
                    className="input-base"
                    disabled={fetching}
                  />
                </div>
              </div>

              <div>
                <label className="label">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => {
                    const active = selectedSpecializations.includes(spec)

                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          active
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'
                        }`}
                      >
                        {spec}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Select one or more specializations.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-4">Clinic Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Clinic Name</label>
                    <input
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>

                  <div>
                    <label className="label">City</label>
                    <input
                      value={clinicCity}
                      onChange={e => setClinicCity(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>

                  <div>
                    <label className="label">State</label>
                    <input
                      value={clinicState}
                      onChange={e => setClinicState(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>

                  <div>
                    <label className="label">Pincode</label>
                    <input
                      value={clinicPincode}
                      onChange={e => setClinicPincode(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <input
                      value={clinicAddress}
                      onChange={e => setClinicAddress(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>

                  <div>
                    <label className="label">Longitude</label>
                    <input
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>

                  <div>
                    <label className="label">Latitude</label>
                    <input
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                      className="input-base"
                      disabled={fetching}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || fetching}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}