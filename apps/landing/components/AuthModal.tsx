'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface AuthModalProps {
  initialTab: 'login' | 'signup'
  onClose: () => void
}

export default function AuthModal({ initialTab, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email to confirm your account.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        onClose()
      }
    }

    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 shadow-2xl">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-[#0d0d0d] p-1">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setSuccess(null) }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-[#E8736A] text-white'
                  : 'text-[#888] hover:text-[#f0f0f0]'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-[#888]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-[#f0f0f0] placeholder-[#444] outline-none transition focus:border-[#E8736A]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#888]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-[#f0f0f0] placeholder-[#444] outline-none transition focus:border-[#E8736A]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-green-900/30 px-4 py-2 text-sm text-green-400">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[#E8736A] py-3 font-semibold text-white transition hover:bg-[#F0948D] disabled:opacity-60"
          >
            {loading ? 'Loading…' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-[#888] hover:text-[#f0f0f0] transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
