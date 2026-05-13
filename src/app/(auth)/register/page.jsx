'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function PatientRegisterPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [profileImage, setProfileImage] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setProfileImage(file)
    setProfilePreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setProfileImage(null)
    setProfilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
  
    const validationError = validate()
  
    if (validationError) {
      setError(validationError)
      return
    }
  
    setLoading(true)
    setError('')
    setSuccess('')
  
    try {
      const formData = new FormData()
  
      formData.append('name', form.name.trim())
      formData.append('email', form.email.trim().toLowerCase())
      formData.append('password', form.password)
  
      if (profileImage) {
        formData.append('profileImage', profileImage)
      }
  
      const res = await fetch('/api/auth/patient/register', {
        method: 'POST',
        body: formData,
      })
  
      const data = await res.json()
  
      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.')
        return
      }
  
      setSuccess('Account created successfully! Logging you in...')
  
      const loginResult = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      })
  
      if (loginResult?.error) {
        setSuccess('Account created successfully! Please login now.')
        setTimeout(() => {
          router.push('/login')
        }, 1200)
        return
      }
  
      router.push('/login')
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
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
        </span>
      </div>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
            {/* Header */}
            <div className="mb-7">
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
              <p className="text-slate-500 text-sm">Join MediConnect as a patient — it's free</p>
            </div>

            {/* Success */}
            {success && (
              <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile image */}
              <div>
                <label className="label">Profile Photo <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="flex items-center gap-4">
                  {/* Avatar preview */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center flex-shrink-0">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-primary-300">👤</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {profilePreview ? 'Change photo' : 'Upload photo'}
                    </button>
                    {profilePreview && (
                      <button type="button" onClick={removeImage} className="text-xs text-slate-400 hover:text-red-500 transition-colors text-left">
                        Remove
                      </button>
                    )}
                    <span className="text-xs text-slate-400">JPG, PNG, WEBP · Max 5MB</span>
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

              {/* Name */}
              <div>
                <label htmlFor="name" className="label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Rahul Sharma"
                  autoComplete="name"
                  className="input-base"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="rahul@example.com"
                  autoComplete="email"
                  className="input-base"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="input-base pr-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`input-base pr-11 ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-300 focus:border-red-400' : ''}`}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <p className="text-xs text-slate-400 leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.
              </p>

              <button
                type="submit"
                disabled={loading || !!success}
                className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Are you a doctor?{' '}
            <Link href="/register/doctor" className="font-medium text-primary-600 hover:text-primary-700">
              Register as doctor →
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
