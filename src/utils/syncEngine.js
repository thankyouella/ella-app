/**
 * Sync Engine — localStorage ↔ Supabase
 *
 * Strategy:
 *  - On login:  pull all ella_* rows from Supabase → write to localStorage
 *  - On write:  components write to localStorage + dispatch 'ella_update'
 *               sync engine listens and pushes to Supabase (debounced 2s)
 *  - Offline:   app works normally via localStorage; sync resumes on reconnect
 */

import { supabase } from './supabase'

let _pushTimer = null
const PUSH_DEBOUNCE = 2000 // ms

// ─── Pull: Supabase → localStorage ───────────────────────────────────────────
export async function pullFromSupabase() {
  if (!supabase) return false

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('ella_data')
      .select('key, value')
      .eq('user_id', user.id)

    if (error) { console.warn('[sync] pull error:', error.message); return false }
    if (!data?.length) return true // no remote data yet — first login

    data.forEach(({ key, value }) => {
      if (key?.startsWith('ella_')) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    })

    // Notify all components to re-read from localStorage
    window.dispatchEvent(new Event('ella_update'))
    return true
  } catch (err) {
    console.warn('[sync] pull failed:', err.message)
    return false
  }
}

// ─── Push: localStorage → Supabase ───────────────────────────────────────────
export async function pushToSupabase() {
  if (!supabase) return false

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Keys to exclude from sync (device-local preferences or ephemeral caches)
    const EXCLUDE = ['ella_dark_mode']
    const EXCLUDE_PREFIX = ['ella_recomendacion_hoy_']

    const rows = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('ella_')) continue
      if (EXCLUDE.includes(key)) continue
      if (EXCLUDE_PREFIX.some(p => key.startsWith(p))) continue
      try {
        const raw = localStorage.getItem(key)
        const value = JSON.parse(raw)
        rows.push({ user_id: user.id, key, value })
      } catch {
        // skip keys with non-JSON values
      }
    }

    if (!rows.length) return true

    const { error } = await supabase
      .from('ella_data')
      .upsert(rows, { onConflict: 'user_id,key' })

    if (error) { console.warn('[sync] push error:', error.message); return false }
    return true
  } catch (err) {
    console.warn('[sync] push failed:', err.message)
    return false
  }
}

// ─── Debounced push trigger ───────────────────────────────────────────────────
export function schedulePush() {
  clearTimeout(_pushTimer)
  _pushTimer = setTimeout(pushToSupabase, PUSH_DEBOUNCE)
}

// ─── Init: listen to ella_update and schedule push ───────────────────────────
export function initSync() {
  if (!supabase) return () => {}

  const handler = () => schedulePush()
  window.addEventListener('ella_update', handler)

  return () => {
    window.removeEventListener('ella_update', handler)
    clearTimeout(_pushTimer)
  }
}

// ─── Delete a single key from Supabase (for danger zone) ─────────────────────
export async function deleteFromSupabase(key) {
  if (!supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('ella_data').delete().eq('user_id', user.id).eq('key', key)
}

// ─── Wipe all user data from Supabase ────────────────────────────────────────
export async function wipeSupabaseData() {
  if (!supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('ella_data').delete().eq('user_id', user.id)
}
