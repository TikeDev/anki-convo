export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <span className="text-lg font-bold text-salmon">AnkiConvo</span>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Review your Anki flashcards through natural voice conversation — anywhere, anytime.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
                Product
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <a href="#features" className="text-text-muted hover:text-text-primary transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-text-muted hover:text-text-primary transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-text-muted hover:text-text-primary transition">
                    Launch App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
                Legal
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <a href="#" className="text-text-muted hover:text-text-primary transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-text-muted hover:text-text-primary transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} AnkiConvo. All rights reserved.
          </p>
          <a
            href="https://github.com/TikeDev/anki-convo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-text-primary transition"
          >
            GitHub →
          </a>
        </div>
      </div>
    </footer>
  )
}
