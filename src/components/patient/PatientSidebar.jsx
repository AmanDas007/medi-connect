'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Appointments', href: '/appointments' },
  { label: 'Profile', href: '/profile' },
]

export default function PatientSidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname()

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-display font-semibold text-lg text-slate-900">
            Medi<span className="text-primary-600">Connect</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 px-4 py-5 space-y-1">
        {navItems.map(item => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen?.(false)}
              className={active ? 'nav-item-active' : 'nav-item'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 flex-col z-40">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-modal">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}