'use client'
import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

export default function PatientProfilePage() {
  const { data: session, update } = useSession()
  const fileInputRef = useRef(null)
  const user = session?.user

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [profilePreview, setProfilePreview] = useState(user?.image || null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleImageChange = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setProfileImage(file)
    setProfilePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
      if (profileImage) formData.append('profileImage', profileImage)

      const res = await fetch('/api/patient/profile', { method: 'PUT', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Update failed')
      setSuccess('Profile updated successfully!')
      setProfileImage(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const initials = (user?.name || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['personal', 'security'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize
              ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'personal' ? 'Personal Info' : 'Security'}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          {/* Avatar section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">Profile Photo</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-50 border-2 border-primary-100 flex items-center justify-center">
                  {profilePreview
                    ? <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="font-display text-2xl font-bold text-primary-400">{initials}</span>
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                    Change Photo
                  </button>
                  {profilePreview && profilePreview !== user?.image && (
                    <button type="button" onClick={() => { setProfileImage(null); setProfilePreview(user?.image || null) }}
                      className="text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Alerts */}
          {success && (
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="label">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="Your full name" className="input-base" />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" className="input-base" disabled={!!user?.image} />
                {user?.image && <p className="text-xs text-slate-400 mt-1">Email linked via OAuth cannot be changed here.</p>}
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+91 98765 43210" className="input-base" />
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange}
                  className="input-base" />
              </div>
              <div>
                <label className="label">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input-base">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input-base">
                  <option value="">Select blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Emergency Contact</label>
                <input type="tel" name="emergencyContact" value={form.emergencyContact} onChange={handleChange}
                  placeholder="+91 99999 00000" className="input-base" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <textarea name="address" value={form.address} onChange={handleChange}
                  placeholder="Your home address" rows={2}
                  className="input-base resize-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading}
              className="btn-primary px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <div className="animate-fade-in space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Password</h2>
            <p className="text-xs text-slate-400 mb-5">Change your account password</p>
            <ChangePasswordForm />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Connected Accounts</h2>
            <p className="text-xs text-slate-400 mb-4">Manage your OAuth login methods</p>
            <div className="space-y-3">
              {[
                { provider: 'Google', icon: '🔵', connected: !!user?.image },
                { provider: 'GitHub', icon: '⚫', connected: false },
              ].map(acc => (
                <div key={acc.provider} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{acc.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{acc.provider}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${acc.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {acc.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
            <h2 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h2>
            <p className="text-xs text-red-500 mb-4">These actions are irreversible. Please be careful.</p>
            <button className="px-4 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChangePasswordForm() {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [show, setShow] = useState({ current: false, newPwd: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.newPwd.length < 6) { setMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return }
    if (form.newPwd !== form.confirm) { setMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/patient/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setMsg({ type: 'success', text: 'Password changed successfully!' })
      setForm({ current: '', newPwd: '', confirm: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg.text && (
        <div className={`px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}
      {[
        { name: 'current', label: 'Current Password', key: 'current' },
        { name: 'newPwd', label: 'New Password', key: 'newPwd' },
        { name: 'confirm', label: 'Confirm New Password', key: 'confirm' },
      ].map(field => (
        <div key={field.name}>
          <label className="label">{field.label}</label>
          <div className="relative">
            <input type={show[field.key] ? 'text' : 'password'} value={form[field.name]}
              onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))}
              className="input-base pr-11" placeholder="••••••••" />
            <button type="button" onClick={() => setShow(p => ({ ...p, [field.key]: !p[field.key] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={show[field.key]
                    ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                    : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} />
              </svg>
            </button>
          </div>
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50">
        {loading ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  )
}