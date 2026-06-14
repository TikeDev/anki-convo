export default function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#0d0d0d]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <span className="text-lg font-bold text-[#E8736A]">AnkiConvo</span>
            <p className="mt-2 text-sm leading-relaxed text-[#888]">
              Review your Anki flashcards through natural voice conversation — anywhere, anytime.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#888]">
                Product
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <a href="#features" className="text-[#888] hover:text-[#f0f0f0] transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-[#888] hover:text-[#f0f0f0] transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#888] hover:text-[#f0f0f0] transition">
                    Launch App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#888]">
                Legal
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <a href="#" className="text-[#888] hover:text-[#f0f0f0] transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#888] hover:text-[#f0f0f0] transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#2a2a2a] pt-8 sm:flex-row">
          <p className="text-xs text-[#888]">
            © {new Date().getFullYear()} AnkiConvo. All rights reserved.
          </p>
          <a
            href="https://github.com/TikeDev/anki-convo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#888] hover:text-[#f0f0f0] transition"
          >
            GitHub →
          </a>
        </div>
      </div>
    </footer>
  )
}
