const statusMap = {
    'pending-payment': { label: 'Pending Payment', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    confirmed:         { label: 'Confirmed',        cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    completed:         { label: 'Completed',         cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    cancelled:         { label: 'Cancelled',         cls: 'bg-red-50 text-red-700 border border-red-200' },
    expired:           { label: 'Expired',           cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
    'no-show':         { label: 'No Show',           cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
    // Payment
    created:  { label: 'Created',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    paid:     { label: 'Paid',     cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    failed:   { label: 'Failed',   cls: 'bg-red-50 text-red-700 border border-red-200' },
    refunded: { label: 'Refunded', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
    // VC
    scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    started:   { label: 'Live',      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    ended:     { label: 'Ended',     cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
}
  
export default function StatusBadge({ status }) {
    const s = statusMap[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
        {s.label}
      </span>
    )
}