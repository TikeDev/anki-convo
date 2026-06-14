const features = [
  {
    icon: '🎙️',
    title: 'Voice-First Reviews',
    description:
      'Speak your answers naturally. The AI understands context and partial responses — no rigid keyword matching.',
  },
  {
    icon: '📱',
    title: 'Works on Any Device',
    description:
      'Browser-based with no app install required. Use it on your phone, tablet, laptop, or desktop.',
  },
  {
    icon: '🧠',
    title: 'Conversation-Based Recall',
    description:
      'Cards are delivered as a flowing conversation, not a pop-quiz. Recall feels natural, not stressful.',
  },
  {
    icon: '⏱️',
    title: 'Smart Scheduling',
    description:
      'Ratings sync back to Anki after every session so your spaced-repetition schedule stays accurate.',
  },
  {
    icon: '🌐',
    title: 'Any Language, Any Subject',
    description:
      'From Japanese vocab to anatomy diagrams — the voice agent adapts to your deck content automatically.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description:
      'Your cards and progress are stored securely. We never sell your data or use it to train models.',
  },
]

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold text-[#f0f0f0]">Everything You Need</h2>
        <p className="text-[#888]">Built for learners who want to make every moment count.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-7 transition hover:border-[#E8736A]/40 hover:bg-[#1f1f1f]"
          >
            <div className="mb-4 text-3xl">{f.icon}</div>
            <h3 className="mb-2 text-base font-semibold text-[#f0f0f0]">{f.title}</h3>
            <p className="text-sm leading-relaxed text-[#888]">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
