'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'

const plans = [
  {
    id: 'monthly' as const,
    name: 'Monthly',
    price: '—',
    period: '/ month',
    description: 'Perfect for trying it out. Cancel any time.',
    features: [
      'Unlimited voice review sessions',
      'Sync with any Anki deck',
      'Conversation-based recall',
      'Cross-device access',
    ],
    badge: null,
    highlight: false,
  },
  {
    id: 'lifetime' as const,
    name: 'Lifetime',
    price: '—',
    period: 'one-time',
    description: 'Pay once, own it forever. Best value.',
    features: [
      'Everything in Monthly',
      'Lifetime access & updates',
      'Priority support',
      'Early access to new features',
    ],
    badge: 'Best Value',
    highlight: true,
  },
]

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  async function handleCheckout(plan: 'monthly' | 'lifetime') {
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned', data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-28">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-text-primary">Simple Pricing</h2>
          <p className="text-text-muted">No hidden fees. Upgrade or cancel whenever you want.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 transition ${
                plan.highlight
                  ? 'border-salmon bg-surface shadow-lg shadow-salmon/10'
                  : 'border-border bg-surface'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-salmon px-4 py-0.5 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold text-text-primary">{plan.name}</h3>
                <p className="text-sm text-text-muted">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-text-primary">{plan.price}</span>
                <span className="mb-1 text-sm text-text-muted">{plan.period}</span>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-0.5 text-salmon">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`mt-auto w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  plan.highlight
                    ? 'bg-salmon text-white hover:bg-salmon-hover'
                    : 'border border-border text-text-primary hover:border-salmon hover:text-salmon'
                }`}
              >
                {loading === plan.id ? 'Redirecting…' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Not ready to pay?{' '}
          <button onClick={() => setShowAuth(true)} className="text-salmon hover:underline">
            Sign up for free
          </button>{' '}
          and explore first.
        </p>
      </section>

      {showAuth && <AuthModal initialTab="signup" onClose={() => setShowAuth(false)} />}
    </>
  )
}
