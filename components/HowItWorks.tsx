const steps = [
  {
    number: '01',
    title: 'Connect Your Deck',
    description:
      'Link your Anki account and pick any deck. AnkiConvo syncs your cards and due items automatically.',
  },
  {
    number: '02',
    title: 'Start a Voice Session',
    description:
      'Open the app and press record. The AI reads your cards aloud and listens for your answers in real time.',
  },
  {
    number: '03',
    title: 'Review Hands-Free',
    description:
      'Walk, commute, or cook while you review. Ratings are synced back to Anki so your schedule stays on track.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-28">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold text-[#f0f0f0]">How It Works</h2>
        <p className="text-[#888]">Three steps from setup to stress-free review.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="group relative rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 transition hover:border-[#E8736A]/40"
          >
            <span className="mb-4 block text-5xl font-extrabold text-[#E8736A]/20 group-hover:text-[#E8736A]/40 transition">
              {step.number}
            </span>
            <h3 className="mb-3 text-lg font-semibold text-[#f0f0f0]">{step.title}</h3>
            <p className="text-sm leading-relaxed text-[#888]">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
