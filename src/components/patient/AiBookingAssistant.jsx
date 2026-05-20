'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function getInitials(name) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function DoctorOptionCard({ doctor, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doctor)}
      className="cursor-pointer w-full text-left rounded-2xl border border-slate-100 bg-white hover:bg-primary-50 hover:border-primary-200 transition-all p-4"
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {doctor.profileUrl ? (
            <img src={doctor.profileUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary-700">
              {getInitials(doctor.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">
                {doctor.name}
              </h4>
              <p className="text-xs text-primary-600 font-medium mt-0.5">
                {doctor.specialization}
              </p>
            </div>

            <span className="text-sm font-bold text-slate-900 shrink-0">
              ₹{doctor.consultationFee}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
              ★ {doctor.averageRating || 0}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
              {doctor.experienceYears || 0} yrs exp
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2 truncate">
            {doctor.clinic?.name}, {doctor.clinic?.city}
          </p>

          {doctor.distanceKm !== undefined && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              {doctor.distanceKm} km away
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ message, handlers, paymentLoading }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-slate-50 border border-slate-100 text-slate-700'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>

        {message.options?.kind === 'doctors' && (
          <div className="mt-4 space-y-3">
            {message.options.allowNearby && (
              <button
                type="button"
                onClick={handlers.onNearby}
                className="cursor-pointer w-full px-4 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
              >
                Show Nearby Doctors
              </button>
            )}

            {message.options.doctors?.length > 0 ? (
              message.options.doctors.map(doctor => (
                <DoctorOptionCard
                  key={doctor._id}
                  doctor={doctor}
                  onSelect={handlers.onSelectDoctor}
                />
              ))
            ) : (
              <div className="rounded-xl bg-white border border-slate-100 p-4 text-center">
                <p className="text-xs text-slate-500">
                  No doctors found for this specialization.
                </p>
              </div>
            )}
          </div>
        )}

        {message.options?.kind === 'dates' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {message.options.dates?.map(date => (
              <button
                key={date.date}
                type="button"
                onClick={() =>
                  handlers.onSelectDate(date, {
                    doctorId: message.options.doctorId,
                    doctor: message.options.doctor,
                  })
                }
                className="cursor-pointer rounded-xl border border-slate-200 bg-white hover:bg-primary-50 hover:border-primary-200 transition-all px-3 py-3 text-left"
              >
                <p className="text-xs font-semibold text-slate-900">
                  {date.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {date.date}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1">
                  {date.availableSlotsCount} slot(s)
                </p>
              </button>
            ))}
          </div>
        )}

        {message.options?.kind === 'slots' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {message.options.slots?.map(slot => (
              <button
                key={slot.label}
                type="button"
                onClick={() =>
                  handlers.onSelectSlot(slot, {
                    doctorId: message.options.doctorId,
                    doctor: message.options.doctor,
                    date: message.options.date,
                  })
                }
                className="cursor-pointer rounded-xl border border-slate-200 bg-white hover:bg-primary-50 hover:border-primary-200 transition-all px-3 py-2.5 text-xs font-medium text-slate-700"
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}

        {message.options?.kind === 'summary' && (
          <div className="mt-4 rounded-2xl bg-white border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Booking Summary
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Doctor</span>
                <span className="font-semibold text-slate-800 text-right">
                  {message.options.summary?.doctor?.name}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Specialization</span>
                <span className="font-semibold text-slate-800 text-right">
                  {message.options.summary?.doctor?.specialization}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Date</span>
                <span className="font-semibold text-slate-800">
                  {message.options.summary?.date}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Slot</span>
                <span className="font-semibold text-slate-800">
                  {message.options.summary?.slot?.label}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Mode</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {message.options.summary?.mode}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between gap-4">
                <span className="text-slate-500 font-medium">Amount</span>
                <span className="font-bold text-primary-700">
                  ₹{message.options.summary?.amount}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlers.onPayNow(message.options.summary)}
              disabled={paymentLoading}
              className="cursor-pointer w-full mt-4 px-4 py-3 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {paymentLoading ? 'Preparing Payment...' : 'Pay Now'}
            </button>
          </div>
        )}

        {message.options?.kind === 'auth' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="cursor-pointer text-center px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="cursor-pointer text-center px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AiBookingAssistant() {
  const { data: session, status } = useSession()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const [context, setContext] = useState({
    stage: 'idle',
    symptoms: '',
    specialization: '',
    selectedDoctor: null,
    selectedDate: '',
    selectedSlot: null,
  })

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi, I am your MediConnect booking assistant. Tell me your symptoms and I will suggest a suitable specialization, show doctors, and help you book an appointment.',
    },
  ])

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const updateLastAssistant = updater => {
    setMessages(prev => {
      const copy = [...prev]
      const index = copy.length - 1

      if (index >= 0 && copy[index].role === 'assistant') {
        copy[index] = updater(copy[index])
      }

      return copy
    })
  }

  const releasePendingAppointment = async appointmentId => {
    if (!appointmentId) return

    try {
      await fetch('/api/appointments/release-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      })
    } catch {}
  }

  const openRazorpay = async (orderData, summary) => {
    const loaded = await loadRazorpayScript()

    if (!loaded) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Razorpay failed to load. Please check your internet connection and try again.',
        },
      ])
      return
    }

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'MediConnect',
      description: `Offline appointment with ${summary?.doctor?.name || 'doctor'}`,
      order_id: orderData.orderId,

      prefill: {
        name: session?.user?.name || '',
        email: session?.user?.email || '',
      },

      notes: {
        appointmentId: orderData.appointmentId,
        doctorId: summary?.doctor?._id,
        mode: 'offline',
        slot: summary?.slot?.label,
      },

      theme: {
        color: '#2563EB',
      },

      handler: async function (response) {
        setPaymentLoading(true)

        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointmentId: orderData.appointmentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })

          const verifyData = await verifyRes.json()

          if (!verifyRes.ok) {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: verifyData.message || 'Payment verification failed. Please contact support if amount was debited.',
              },
            ])
            return
          }

          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Payment successful! Your appointment is confirmed. You can view it in My Appointments.',
            },
          ])

          setContext({
            stage: 'idle',
            symptoms: '',
            specialization: '',
            selectedDoctor: null,
            selectedDate: '',
            selectedSlot: null,
          })
        } catch {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Something went wrong while verifying payment. Please check My Appointments or contact support if amount was debited.',
            },
          ])
        } finally {
          setPaymentLoading(false)
        }
      },

      modal: {
        ondismiss: async function () {
          await releasePendingAppointment(orderData.appointmentId)

          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Payment was cancelled. The selected slot has been released.',
            },
          ])

          setPaymentLoading(false)
        },
      },
    }

    const razorpay = new window.Razorpay(options)

    razorpay.on('payment.failed', async function (response) {
      await releasePendingAppointment(orderData.appointmentId)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            response.error?.description ||
            response.error?.reason ||
            'Payment failed. Please try again.',
        },
      ])

      setPaymentLoading(false)
    })

    razorpay.open()
  }

  const callAI = async ({ message, action = 'message', extra = {}, silentUserMessage = false }) => {
    if (sending) return

    const userText = message?.trim()

    if (!userText && action === 'message') return

    setSending(true)

    if (!silentUserMessage && userText) {
      setMessages(prev => [...prev, { role: 'user', content: userText }])
    }

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai-booking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: userText,
          context,
          ...extra,
        }),
      })

      if (!res.body) {
        throw new Error('No response stream')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          const event = JSON.parse(line)

          if (event.type === 'token') {
            updateLastAssistant(msg => ({
              ...msg,
              content: msg.content + event.text,
            }))
          }

          if (event.type === 'context') {
            setContext(prev => ({
              ...prev,
              ...event.patch,
            }))
          }

          if (event.type === 'options') {
            updateLastAssistant(msg => ({
              ...msg,
              options: event,
            }))
          }

          if (event.type === 'auth_required') {
            updateLastAssistant(msg => ({
              ...msg,
              options: {
                kind: 'auth',
              },
            }))
          }

          if (event.type === 'error') {
            updateLastAssistant(msg => ({
              ...msg,
              content: msg.content || event.message,
            }))
          }
        }
      }
    } catch {
      updateLastAssistant(msg => ({
        ...msg,
        content: msg.content || 'Something went wrong. Please try again.',
      }))
    } finally {
      setSending(false)
    }
  }

  const handleSend = e => {
    e.preventDefault()

    const value = input.trim()
    if (!value) return

    setInput('')
    callAI({ message: value, action: 'message' })
  }

  const handleNearby = () => {
    if (!navigator.geolocation) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Your browser does not support location access. Please choose from the listed doctors.',
        },
      ])
      return
    }

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: 'Show nearby doctors',
      },
    ])

    navigator.geolocation.getCurrentPosition(
      position => {
        callAI({
          message: 'Show nearby doctors',
          action: 'nearby',
          silentUserMessage: true,
          extra: {
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          },
        })
      },
      () => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Location permission was not allowed. You can still choose from the top doctors list.',
          },
        ])
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }

  const handleSelectDoctor = doctor => {
    const nextContext = {
      ...context,
      selectedDoctor: doctor,
      selectedDate: '',
      selectedSlot: null,
    }

    setContext(nextContext)

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `I want to book with ${doctor.name}`,
      },
    ])

    callAI({
      message: `I want to book with ${doctor.name}`,
      action: 'selectDoctor',
      silentUserMessage: true,
      extra: {
        doctorId: doctor._id,
        context: nextContext,
      },
    })
  }

  const handleSelectDate = (date, meta = {}) => {
    const selectedDoctor = meta.doctor || context.selectedDoctor

    const nextContext = {
      ...context,
      selectedDoctor,
      selectedDate: date.date,
      selectedSlot: null,
    }

    setContext(nextContext)

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `Book on ${date.date}`,
      },
    ])

    callAI({
      message: `Book on ${date.date}`,
      action: 'selectDate',
      silentUserMessage: true,
      extra: {
        doctorId: meta.doctorId || selectedDoctor?._id,
        date: date.date,
        context: nextContext,
      },
    })
  }

  const handleSelectSlot = (slot, meta = {}) => {
    const selectedDoctor = meta.doctor || context.selectedDoctor
    const selectedDate = meta.date || context.selectedDate

    const nextContext = {
      ...context,
      selectedDoctor,
      selectedDate,
      selectedSlot: slot,
    }

    setContext(nextContext)

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `Choose slot ${slot.label}`,
      },
    ])

    callAI({
      message: `Choose slot ${slot.label}`,
      action: 'selectSlot',
      silentUserMessage: true,
      extra: {
        doctorId: selectedDoctor?._id,
        doctor: selectedDoctor,
        date: selectedDate,
        slot,
        context: nextContext,
      },
    })
  }

  const handlePayNow = async summary => {
    if (status !== 'authenticated') {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Please login first to continue with appointment booking.',
          options: {
            kind: 'auth',
          },
        },
      ])
      return
    }

    if (
      !summary?.doctor?._id ||
      !summary?.date ||
      !summary?.slot?.startTime ||
      !summary?.slot?.endTime
    ) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Booking details are incomplete. Please choose doctor, date, and slot again.',
        },
      ])
      return
    }

    setPaymentLoading(true)

    try {
      const createOrderRes = await fetch('/api/appointments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: summary.doctor._id,
          appointmentDate: summary.date,
          startTime: summary.slot.startTime,
          endTime: summary.slot.endTime,
          mode: 'offline',
        }),
      })

      const orderData = await createOrderRes.json()

      if (!createOrderRes.ok) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: orderData.message || 'Failed to create payment order. Please choose another slot.',
          },
        ])
        setPaymentLoading(false)
        return
      }

      await openRazorpay(orderData, summary)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong while starting payment. Please try again.',
        },
      ])
      setPaymentLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`cursor-pointer fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-2xl hover:bg-primary-700 transition-all flex items-center justify-center ${
          open ? 'hidden' : ''
        }`}
      >
        <span className="text-2xl">🤖</span>
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[420px] z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden h-[78vh] sm:h-[620px] flex flex-col">
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-5 py-4 text-white flex items-start justify-between gap-4 shrink-0">
              <div>
                <h3 className="text-base font-semibold">
                  AI Booking Assistant
                </h3>
                <p className="text-xs text-primary-100 mt-0.5">
                  Symptoms → doctor → slot → payment
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  paymentLoading={paymentLoading}
                  handlers={{
                    onNearby: handleNearby,
                    onSelectDoctor: handleSelectDoctor,
                    onSelectDate: handleSelectDate,
                    onSelectSlot: handleSelectSlot,
                    onPayNow: handlePayNow,
                  }}
                />
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="border-t border-slate-100 p-3 bg-white shrink-0"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Describe your symptoms..."
                  className="flex-1 input-base text-sm"
                  disabled={sending || paymentLoading}
                />

                <button
                  type="submit"
                  disabled={sending || paymentLoading || !input.trim()}
                  className="cursor-pointer px-4 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                This assistant does not diagnose. For severe symptoms, seek urgent medical help.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}