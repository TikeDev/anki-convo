import { createClient } from '@supabase/supabase-js'

// Minimal user shape the broker needs. The full Supabase user object is a
// superset of this.
export interface BrokerUser {
  id: string
}

// Validate the caller's Supabase access token (sent as `Authorization: Bearer
// <jwt>`) and return the user, or null if unauthenticated. Every metered broker
// route gates on this — an unauthenticated endpoint to Claude/Deepgram is a
// direct, unbounded bill (see docs/ARCHITECTURE_DEMO_TO_PRODUCT.md §4 Security).
//
// Dev escape hatch: set BROKER_DEV_ALLOW_UNAUTH=true to bypass auth while the
// frontend isn't issuing JWTs yet. NEVER set this in production — it opens the
// broker to anyone.
export async function getUserFromRequest(req: Request): Promise<BrokerUser | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!token) {
    if (process.env.BROKER_DEV_ALLOW_UNAUTH === 'true') {
      return { id: 'dev-user' }
    }
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null

  return { id: data.user.id }
}
