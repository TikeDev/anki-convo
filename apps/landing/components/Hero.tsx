'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'

export default function Hero() {
  const [showSignup, setShowSignup] = useState(false)

  return (
    <>
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <div className="h-[600px] w-[600px] rounded-full bg-salmon opacity-[0.07] blur-[120px]" />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-salmon/30 bg-salmon/10 px-4 py-1.5 text-sm text-salmon">
          <span className="h-2 w-2 rounded-full bg-salmon animate-pulse" />
          Voice-powered flashcard review
        </div>

        <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
          Review Anki Cards{' '}
          <span className="text-salmon">with Your Voice</span>
        </h1>

        <p className="mb-10 max-w-xl text-lg text-text-muted sm:text-xl">
          AnkiConvo turns your flashcard decks into an AI-driven voice conversation — no screen
          needed. Just talk, recall, and remember.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={() => setShowSignup(true)}
            className="rounded-xl bg-salmon px-8 py-4 text-base font-semibold text-white shadow-lg shadow-salmon/20 transition hover:bg-salmon-hover hover:shadow-salmon/30"
          >
            Get Started Free
          </button>
          <a
            href="#"
            className="rounded-xl border border-border px-8 py-4 text-base font-medium text-text-primary transition hover:border-salmon hover:text-salmon"
          >
            Try the App →
          </a>
        </div>

        {/* Floating demo card */}
        <div className="relative mt-20 w-full max-w-lg">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl text-left">
            <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
              <span className="h-2 w-2 rounded-full bg-salmon" />
              AnkiConvo is listening…
            </div>
            <p className="mb-4 text-text-muted text-sm">
              <span className="text-salmon font-medium">AI:</span> What is the powerhouse of the cell?
            </p>
            <p className="text-text-primary text-sm">
              <span className="text-salmon-hover font-medium">You:</span> The mitochondria!
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
              <span className="rounded-md bg-salmon/20 px-2 py-0.5 text-salmon">Correct ✓</span>
              <span>Next card in 2s…</span>
            </div>
          </div>
          {/* glow under card */}
          <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-3/4 rounded-full bg-salmon opacity-10 blur-2xl" />
        </div>
      </section>

      {showSignup && <AuthModal initialTab="signup" onClose={() => setShowSignup(false)} />}
    </>
  )
}
