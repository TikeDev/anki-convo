# Product

## Register

product

## Users

Hands-free flashcard reviewers — people doing Anki spaced-repetition study who want to answer cards
out loud instead of typing, often while their hands or eyes are busy (commuting, chores, exercising)
or who simply prefer talking. The job to be done on any given screen: pick a deck, hear or read the
prompt, answer out loud (or type as a fallback), get graded by an AI persona, and quickly act on the
verdict (rate the card, ask a follow-up, move to the next one). Sessions are meant to feel like a
spoken conversation, not a form to fill in.

## Product Purpose

Anki Convo is a voice-first AI client for Anki. It turns flashcard review into a spoken
conversation: the user answers a prompt aloud, an AI persona grades the answer, explains what was
missed, suggests the right Anki button (Again/Hard/Good/Easy), and can drop into a short tutoring
exchange on demand. A text mode covers cases where voice isn't available. Success looks like a
reviewer completing a deck faster and with less friction than typing, while trusting the grading
enough to act on it without double-checking.

## Brand Personality

Voice: a calm, encouraging coach — knowledgeable but never stiff. Plain, confident, supportive
copy; short declaratives; praise before the gap in feedback. No emoji — warmth comes from the logo
character and color, not decoration. Visually: dark-first, cool and quiet, with two saturated brand
pops (cyan, lime) against deep navy doing all the expressive work.

## Anti-references

Not a gamified, mascot-driven, Duolingo-style experience — no streak badges, confetti, or cutesy
illustration carrying the tone. Not a generic, cluttered SaaS/edtech dashboard. No gradients,
imagery, or texture standing in for real visual hierarchy; depth comes from layered navy surfaces
and hairline borders, not decoration.

## Design Principles

- Voice-first, text as fallback: design the spoken interaction first, then make sure every state
  also works for someone reading and typing.
- Show the work, don't just grade: feedback is structured (what's right → gaps → verdict → tips),
  never a bare pass/fail.
- Quiet until it matters: flat surfaces and hairline borders by default; the two accent colors
  (cyan, lime) are reserved for state and action, not ambient decoration.
- Familiar muscle memory wins: keep Anki's Again/Hard/Good/Easy grade scale and colors verbatim so
  existing Anki users don't have to relearn anything.
- Calm under real constraints: the user may be mid-task (driving, walking, hands full) — motion,
  copy, and audio cues should reduce cognitive load, never add ceremony.

## Accessibility & Inclusion

WCAG 2.1 AA as the baseline target. Voice-first interaction must have a complete text-mode
equivalent (typing answers, reading prompts/feedback) for users who can't speak or listen. All
motion respects `prefers-reduced-motion` (already established in the design system — record-button
pulse and grading spinner need reduced-motion fallbacks).
