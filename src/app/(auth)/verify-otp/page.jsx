'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const OTP_LENGTH = 6

export default function VerifyOtpPage() {
  const router = useRouter()
  const inputRefs = useRef([])

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reset_email')
    if (!storedEmail) {
      router.push('/forgot-password')
      return
    }
    setEmail(storedEmail)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const focusInput = (index) => {
    if (inputRefs.current[index]) inputRefs.current[index].focus()
  }

  const handleOtpChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    if (error) setError('')
    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const newOtp = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Invalid OTP. Please try again.')
        setOtp(Array(OTP_LENGTH).fill(''))
        focusInput(0)
      } else {
        // Store resetToken for the next page
        sessionStorage.setItem('reset_token', data.resetToken)
        setSuccess('OTP verified! Redirecting…')
        setTimeout(() => router.push('/reset-password'), 1200)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setResending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to resend OTP.')
      } else {
        setOtp(Array(OTP_LENGTH).fill(''))
        focusInput(0)
        setCountdown(60)
        setCanResend(false)
        setSuccess('OTP resent successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : ''

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-display font-semibold text-lg text-slate-900">
              Medi<span className="text-primary-600">Connect</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              We sent a 6-digit OTP to{' '}
              <span className="font-semibold text-slate-700">{maskedEmail}</span>.
              <br />Enter it below to continue.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* OTP inputs */}
            <div className="flex items-center justify-center gap-2.5 mb-7" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`otp-input transition-all duration-150 
                    ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-900'}
                    ${error ? 'border-red-300 bg-red-50' : ''}`}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < OTP_LENGTH}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : 'Verify OTP'}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-5">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {resending ? 'Resending…' : 'Resend OTP'}
              </button>
            ) : (
              <p className="text-sm text-slate-400">
                Resend OTP in{' '}
                <span className="font-mono font-semibold text-slate-600">
                  {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5 text-sm">
          <Link href="/forgot-password" className="text-slate-500 hover:text-slate-700">
            ← Change email
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/login" className="text-slate-500 hover:text-slate-700">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}