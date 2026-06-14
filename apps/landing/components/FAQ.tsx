'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'How do I use Anki?',
    a: 'Anki is a free flashcard app that uses spaced repetition — it shows you cards right before you\'re about to forget them. Download it at ankiweb.net, create a deck, add cards, and review daily. AnkiConvo plugs directly into your existing Anki decks so you can review them by talking out loud instead of clicking buttons.',
  },
  {
    q: 'Is Anki a paid product? Do I need to buy anything?',
    a: 'Anki is free on desktop (Mac, Windows, Linux) and Android. The iOS app (AnkiMobile) costs $24.99 — a one-time purchase that also funds the project. AnkiConvo itself is free to try. You do not need AnkiMobile; the desktop app works fine for syncing.',
  },
  {
    q: 'Does AnkiConvo work with my existing decks?',
    a: 'Yes. It connects to your AnkiWeb account and reads whatever decks you already have. No import or reformatting needed.',
  },
  {
    q: 'Will this mess up my Anki scheduling?',
    a: 'No. AnkiConvo only rates cards you\'ve actually answered — the same way you would in Anki itself. Your review intervals are calculated by Anki\'s algorithm exactly as normal.',
  },
  {
    q: 'Do I need Anki Desktop open while using AnkiConvo?',
    a: 'For the local setup, yes — Anki Desktop must be running so AnkiConnect can receive requests. With the cloud setup, Anki runs on our server and you only need a browser.',
  },
  {
    q: 'Is my Anki data private? What do you send to Claude?',
    a: 'We send the text content of your due cards to Claude to generate quiz prompts and evaluate answers. We do not store your cards. Audio is processed by Deepgram and is not retained.',
  },
  {
    q: "What if I don't know the answer — can I skip a card?",
    a: 'Yes. Just say "skip" or "I don\'t know." The AI will rate the card as "Again" (the lowest rating), which means Anki will show it to you again soon.',
  },
  {
    q: 'Can I use this on my phone?',
    a: 'The web app is mobile-friendly and works in any browser. For full sync, your Anki account must be connected via AnkiWeb (free). No app install required.',
  },
  {
    q: 'How is this different from just using Anki normally?',
    a: 'Speaking answers out loud forces active recall more deeply than clicking buttons. The AI gives immediate, conversational feedback — not just "right/wrong" — which helps you understand why you got something wrong.',
  },
  {
    q: 'What happens to cards I get right every time?',
    a: "Anki's algorithm automatically increases the interval — you might see an easy card weeks or months later. AnkiConvo feeds directly into this system, so acing a card here means you won't see it again for a long time.",
  },
]

function FAQCard({ q, a }: { q: string; a: string }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="relative h-48 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-expanded={flipped}
      aria-label={`Question: ${q}. Answer: ${a}`}
    >
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-surface p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-sm font-semibold leading-snug text-text-primary">{q}</p>
          <p className="text-xs text-text-muted">Tap to reveal ↩</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-salmon bg-surface p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-sm leading-relaxed text-text-primary">{a}</p>
          <p className="text-xs text-salmon">✓ Got it — tap to flip back</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-6 py-28">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold text-text-primary">Frequently Asked Questions</h2>
        <p className="text-text-muted">Tap any card to reveal the answer.</p>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {faqs.map((faq) => (
          <FAQCard key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </section>
  )
}
