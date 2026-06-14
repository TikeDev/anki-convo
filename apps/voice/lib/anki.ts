// Per-user Anki MCP endpoint routing.
//
// This is the multi-user crux from the architecture doc: Claude reaches a user's
// cards via `mcp_servers: [{ url }]`, so multi-user means resolving each user to
// THEIR Anki MCP endpoint (see docs/ARCHITECTURE_DEMO_TO_PRODUCT.md §2-3).
//
// TODO: replace this with a lookup against the `anki_links` table (§6) once
// per-user Anki linking exists. For now every user resolves to the single shared
// demo endpoint in MCP_SERVER_URL — matching the hackathon's "one shared
// instance" assumption.
export async function getMcpUrlForUser(_userId: string): Promise<string | null> {
  return process.env.MCP_SERVER_URL ?? null
}
