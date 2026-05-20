'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import PatientSidebar from '@/components/patient/PatientSidebar'

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function PatientProfilePage() {
  const { data: session, update } = useSession()
  const fileInputRef = useRef(null)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const user = session?.user

  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true)
      setError('')

      try {
        const res = await fetch('/api/patient/profile', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Failed to fetch profile.')
          return
        }

        setName(data.patient?.name || '')
        setEmail(data.patient?.email || '')
        setPreview(data.patient?.profileUrl || null)
        setRemoveImage(false)
        setProfileImage(null)
      } catch (err) {
        setError('Something went wrong while fetching profile.')
      } finally {
        setFetching(false)
      }
    }

    fetchProfile()
  }, [])

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

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()

      formData.append('name', name.trim())
      formData.append('removeImage', removeImage ? 'true' : 'false')

      if (profileImage) {
        formData.append('profileImage', profileImage)
      }

      const res = await fetch('/api/patient/profile', {
        method: 'PATCH',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Profile update failed.')
        return
      }

      const updatedPatient = data.patient

      setName(updatedPatient?.name || name.trim())
      setEmail(updatedPatient?.email || email)
      setPreview(updatedPatient?.profileUrl || null)
      setProfileImage(null)
      setRemoveImage(false)
      setMessage('Profile updated successfully.')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (update) {
        await update({
          name: updatedPatient?.name || name.trim(),
          profileUrl: updatedPatient?.profileUrl || null,
        })
      }
    } catch (err) {
      setError('Something went wrong while updating profile.')
    } finally {
      setLoading(false)
    }
  }

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
              <h1 className="text-lg font-semibold text-slate-900">My Profile</h1>
            </div>

            <Link href="/dashboard" className="cursor-pointer text-sm font-medium text-primary-600">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-slate-900">
                Profile Settings
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Update your name and profile picture. Email cannot be changed.
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer group relative w-28 h-28 rounded-full overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center"
                >
                  {preview ? (
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-primary-700">
                      {getInitials(name || user?.name || 'Patient')}
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
                      className="cursor-pointer btn-secondary px-3 py-2 text-xs"
                    >
                      Upload New
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="cursor-pointer px-3 py-2 rounded-xl text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
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

              <div>
                <label className="label">Full Name</label>
                <input
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setError('')
                    setMessage('')
                  }}
                  className="input-base"
                  placeholder={fetching ? 'Loading...' : 'Your name'}
                  disabled={fetching}
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  value={email || user?.email || ''}
                  disabled
                  className="input-base bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Email is linked with your account and cannot be edited.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || fetching}
                className="cursor-pointer btn-primary w-full py-3"
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