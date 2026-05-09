import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="font-display font-semibold text-white text-base">
                Medi<span className="text-primary-400">Connect</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Connecting patients with trusted healthcare professionals. Your health, simplified.
            </p>
          </div>

          {/* For Patients */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">For Patients</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/doctors" className="hover:text-white transition-colors">Find Doctors</Link></li>
              <li><Link href="/doctors?mode=online" className="hover:text-white transition-colors">Online Consult</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* For Doctors */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">For Doctors</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register/doctor" className="hover:text-white transition-colors">Join as Doctor</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Doctor Login</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-600">© 2025 MediConnect. All rights reserved.</p>
          <p className="text-xs text-slate-600">Made with care for better healthcare access.</p>
        </div>
      </div>
    </footer>
  )
}