'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [modal, setModal] = useState<'login' | 'signup' | null>(null)

  return (
    <>
      <nav className="fixed top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-salmon tracking-tight">AnkiConvo</span>

          <div className="flex items-center gap-3">
            <a href="#features" className="hidden text-sm text-text-muted hover:text-text-primary transition sm:block">
              Features
            </a>
            <a href="#pricing" className="hidden text-sm text-text-muted hover:text-text-primary transition sm:block">
              Pricing
            </a>

            <ThemeToggle />

            <button
              onClick={() => setModal('login')}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition hover:border-salmon hover:text-salmon"
            >
              Log in
            </button>
            <button
              onClick={() => setModal('signup')}
              className="rounded-lg bg-salmon px-4 py-2 text-sm font-semibold text-white transition hover:bg-salmon-hover"
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
