'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'

export default function Navbar() {
  const [modal, setModal] = useState<'login' | 'signup' | null>(null)

  return (
    <>
      <nav className="fixed top-0 z-40 w-full border-b border-[#2a2a2a] bg-[#0d0d0d]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-[#E8736A] tracking-tight">AnkiConvo</span>

          <div className="flex items-center gap-3">
            <a
              href="#features"
              className="hidden text-sm text-[#888] hover:text-[#f0f0f0] transition sm:block"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hidden text-sm text-[#888] hover:text-[#f0f0f0] transition sm:block"
            >
              Pricing
            </a>

            <button
              onClick={() => setModal('login')}
              className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-[#f0f0f0] transition hover:border-[#E8736A] hover:text-[#E8736A]"
            >
              Log in
            </button>
            <button
              onClick={() => setModal('signup')}
              className="rounded-lg bg-[#E8736A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#F0948D]"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {modal && <AuthModal initialTab={modal} onClose={() => setModal(null)} />}
    </>
  )
}
