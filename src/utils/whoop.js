// WHOOP OAuth 2.0 with PKCE (browser-safe — no client_secret in frontend bundle)
const WHOOP_AUTH_URL  = 'https://api.prod.whoop.com/oauth/oauth2/auth'
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'
const WHOOP_API       = 'https://api.prod.whoop.com/developer'

// In production (Vercel) we proxy token exchange through /api/whoop-token
// so the client_secret stays server-side. In local dev we call WHOOP directly.
const USE_TOKEN_PROXY = window.location.hostname !== 'localhost'

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
async function generatePKCE() {
  const array = new Uint8Array(48)
  crypto.getRandomValues(array)
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return { verifier, challenge }
}

// ─── Token exchange helper ────────────────────────────────────────────────────
async function exchangeToken(params) {
  if (USE_TOKEN_PROXY) {
    // Production: server-side proxy adds client_secret
    const res = await fetch('/api/whoop-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return res
  } else {
    // Local dev: direct PKCE call (no client_secret needed for public clients)
    const body = new URLSearchParams(params)
    body.append('client_id', import.meta.env.VITE_WHOOP_CLIENT_ID)
    return fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  }
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────
export async function startWhoopOAuth() {
  const clientId    = import.meta.env.VITE_WHOOP_CLIENT_ID
  const redirectUri = import.meta.env.VITE_WHOOP_REDIRECT_URI || window.location.origin

  if (!clientId) throw new Error('VITE_WHOOP_CLIENT_ID no configurado en .env')

  const { verifier, challenge } = await generatePKCE()
  const state = crypto.randomUUID()

  localStorage.setItem('whoop_pkce_verifier', verifier)
  localStorage.setItem('whoop_oauth_state', state)

  const params = new URLSearchParams({
    client_id:             clientId,
    redirect_uri:          redirectUri,
    response_type:         'code',
    scope:                 'offline read:recovery read:cycles read:sleep read:workout',
    state,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${WHOOP_AUTH_URL}?${params}`
}

export async function handleWhoopCallback(code, state) {
  const savedState = localStorage.getItem('whoop_oauth_state')
  if (state && savedState && state !== savedState) throw new Error('Estado OAuth inválido')

  const redirectUri = import.meta.env.VITE_WHOOP_REDIRECT_URI || window.location.origin
  const verifier    = localStorage.getItem('whoop_pkce_verifier')

  const res = await exchangeToken({
    grant_type:    'authorization_code',
    code,
    redirect_uri:  redirectUri,
    code_verifier: verifier || '',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.error || `Error ${res.status} al obtener token`)
  }

  const tokens = await res.json()
  localStorage.setItem('whoop_access_token', tokens.access_token)
  if (tokens.refresh_token) localStorage.setItem('whoop_refresh_token', tokens.refresh_token)
  localStorage.setItem('whoop_token_expiry', String(Date.now() + tokens.expires_in * 1000))
  localStorage.setItem('whoop_connected_at', new Date().toISOString())
  localStorage.removeItem('whoop_pkce_verifier')
  localStorage.removeItem('whoop_oauth_state')

  return tokens
}

// ─── Token management ─────────────────────────────────────────────────────────
export function getWhoopToken() {
  const token  = localStorage.getItem('whoop_access_token')
  const expiry = localStorage.getItem('whoop_token_expiry')
  if (!token || !expiry) return null
  if (Date.now() > parseInt(expiry) - 60000) return null // expired or near-expiry
  return token
}

export async function refreshWhoopToken() {
  const refreshToken = localStorage.getItem('whoop_refresh_token')
  if (!refreshToken) return null

  try {
    const res = await exchangeToken({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      redirect_uri:  import.meta.env.VITE_WHOOP_REDIRECT_URI || window.location.origin,
    })
    if (!res.ok) { disconnectWhoop(); return null }

    const tokens = await res.json()
    localStorage.setItem('whoop_access_token', tokens.access_token)
    if (tokens.refresh_token) localStorage.setItem('whoop_refresh_token', tokens.refresh_token)
    localStorage.setItem('whoop_token_expiry', String(Date.now() + tokens.expires_in * 1000))
    return tokens.access_token
  } catch {
    return null
  }
}

// Returns a valid token, refreshing if expired
export async function getValidToken() {
  const quick = getWhoopToken()
  if (quick) return quick
  return refreshWhoopToken()
}

export function isWhoopConnected() {
  return !!(getWhoopToken() || localStorage.getItem('whoop_refresh_token'))
}

export function disconnectWhoop() {
  ;['whoop_access_token', 'whoop_refresh_token', 'whoop_token_expiry',
    'whoop_pkce_verifier', 'whoop_oauth_state', 'whoop_connected_at'].forEach(k =>
    localStorage.removeItem(k)
  )
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function whoopGet(path, token) {
  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    disconnectWhoop()
    throw new Error('Sesión WHOOP expirada. Vuelve a conectar.')
  }
  if (!res.ok) throw new Error(`WHOOP API error ${res.status}`)
  return res.json()
}

export async function fetchWhoopMetrics(token) {
  const [recRes, cycRes, slpRes] = await Promise.allSettled([
    whoopGet('/v1/recovery?limit=7', token),
    whoopGet('/v1/cycle?limit=7', token),
    whoopGet('/v1/sleep?limit=7', token),
  ])

  const recoveries = recRes.status === 'fulfilled' ? (recRes.value.records || []) : []
  const cycles     = cycRes.status === 'fulfilled' ? (cycRes.value.records || []) : []
  const sleeps     = slpRes.status === 'fulfilled' ? (slpRes.value.records || []) : []

  const metrics = recoveries.map((r, i) => {
    const cyc = cycles[i] || {}
    const slp = sleeps[i] || {}
    const d   = new Date(r.created_at)
    const mm  = String(d.getMonth() + 1).padStart(2, '0')
    const dd  = String(d.getDate()).padStart(2, '0')
    return {
      fecha:    `${mm}/${dd}`,
      recovery: Math.round(r.score?.recovery_score ?? 0),
      hrv:      Math.round(r.score?.hrv_rmssd_milli ?? 0),
      strain:   parseFloat((cyc.score?.strain ?? 0).toFixed(1)),
      sueno:    parseFloat(((slp.score?.stage_summary?.total_in_bed_time_milli ?? 0) / 3_600_000).toFixed(1)),
    }
  }).filter(m => m.recovery > 0).reverse() // oldest → newest

  return metrics
}
