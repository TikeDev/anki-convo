import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email } = await req.json()

  const { error } = await resend.emails.send({
    from: 'AnkiConvo <onboarding@resend.dev>', // swap for your domain once verified
    to: [email],
    subject: 'Welcome to AnkiConvo!',
    html: `
      <p>Hey — welcome to AnkiConvo!</p>
      <p>You're all set to review your Anki decks with your voice. Check your email for a confirmation link, then you're good to go.</p>
      <p>— The AnkiConvo team</p>
    `,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
