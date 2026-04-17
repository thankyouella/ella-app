/**
 * Vercel Serverless Function — WHOOP Token Exchange
 *
 * Proxies the OAuth code→token exchange so the WHOOP Client Secret
 * stays server-side and is never exposed in the browser bundle.
 *
 * POST /api/whoop-token
 * Body: { code, code_verifier, redirect_uri, grant_type }
 *       or { refresh_token, grant_type: "refresh_token" }
 */

const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

export default async function handler(req, res) {
  // CORS — allow same origin + localhost dev
  const origin = req.headers.origin || ''
  const allowed = [
    process.env.VITE_WHOOP_REDIRECT_URI?.replace('/whoop/callback', ''),
    'http://localhost:5173',
    'http://localhost:4173',
  ].filter(Boolean)

  if (allowed.some(o => origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  const clientId     = process.env.VITE_WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET

  if (!clientId) return res.status(500).json({ error: 'VITE_WHOOP_CLIENT_ID not configured' })

  const { grant_type, code, code_verifier, redirect_uri, refresh_token } = req.body || {}

  const body = new URLSearchParams({ grant_type, client_id: clientId })
  if (clientSecret)   body.append('client_secret', clientSecret)
  if (code)           body.append('code', code)
  if (code_verifier)  body.append('code_verifier', code_verifier)
  if (redirect_uri)   body.append('redirect_uri', redirect_uri)
  if (refresh_token)  body.append('refresh_token', refresh_token)

  try {
    const upstream = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Upstream WHOOP error', detail: err.message })
  }
}
