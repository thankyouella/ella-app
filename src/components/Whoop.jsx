import { useState, useEffect, useCallback } from 'react'
import { Watch, Heart, Zap, Moon, Plus, RefreshCw, Link, Unplug, AlertCircle, CheckCircle, ExternalLink, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { storage } from '../utils/storage'
import {
  startWhoopOAuth,
  handleWhoopCallback,
  getValidToken,
  isWhoopConnected,
  disconnectWhoop,
  fetchWhoopMetrics,
} from '../utils/whoop'

const WHOOP_KEY = 'ella_whoop'
const SYNCED_AT_KEY = 'whoop_synced_at'

const METRICAS_DEMO = [
  { fecha: '04/07', hrv: 52, recovery: 78, strain: 8.2, sueno: 7.5 },
  { fecha: '04/08', hrv: 48, recovery: 65, strain: 12.1, sueno: 6.8 },
  { fecha: '04/09', hrv: 55, recovery: 82, strain: 6.5, sueno: 8.2 },
  { fecha: '04/10', hrv: 50, recovery: 70, strain: 9.8, sueno: 7.1 },
  { fecha: '04/11', hrv: 58, recovery: 88, strain: 5.2, sueno: 8.5 },
  { fecha: '04/12', hrv: 54, recovery: 76, strain: 11.3, sueno: 7.3 },
  { fecha: '04/13', hrv: 61, recovery: 91, strain: 4.1, sueno: 8.8 },
]

const RECOVERY_CONFIG = {
  high: { min: 67, color: '#34d399', label: 'Verde — Día óptimo', desc: 'Tu cuerpo está listo para rendir. Ideal para sesiones de calidad o tirada larga.' },
  mid:  { min: 34, color: '#fbbf24', label: 'Amarillo — Moderado', desc: 'Puedes entrenar, pero modera la intensidad. Prioriza la recuperación.' },
  low:  { min: 0,  color: '#f87171', label: 'Rojo — Recuperación', desc: 'Tu cuerpo pide descanso. Sesión suave o descanso activo.' },
}

function getRecoveryConfig(val) {
  if (val >= 67) return RECOVERY_CONFIG.high
  if (val >= 34) return RECOVERY_CONFIG.mid
  return RECOVERY_CONFIG.low
}

function RecoveryRing({ value }) {
  const cfg = getRecoveryConfig(value)
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#EDE9F7" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={cfg.color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - value / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{value}%</span>
          <span className="text-xs text-purple-400">Recovery</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p style={{ color: cfg.color }} className="text-xs font-semibold">{cfg.label}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs">
      <p className="text-purple-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function ManualEntryForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hrv: '', recovery: '', strain: '', sueno: ''
  })
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.recovery) return
    onSave({
      fecha: form.fecha.slice(5).replace('-', '/'),
      hrv: +form.hrv || null,
      recovery: +form.recovery,
      strain: +form.strain || null,
      sueno: +form.sueno || null,
    })
  }
  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Ingresar métricas WHOOP</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { k: 'fecha',    label: 'Fecha',        type: 'date' },
          { k: 'recovery', label: 'Recovery (%)', type: 'number', req: true },
          { k: 'hrv',      label: 'HRV (ms)',     type: 'number' },
          { k: 'strain',   label: 'Strain',       type: 'number', step: '0.1' },
          { k: 'sueno',    label: 'Sueño (h)',    type: 'number', step: '0.1' },
        ].map(({ k, label, type, req, step }) => (
          <div key={k} className={k === 'fecha' ? 'col-span-2' : ''}>
            <label className="text-purple-400 text-xs mb-1 block">{label}</label>
            <input type={type} step={step} value={form[k]} onChange={f(k)} required={req}
              className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Guardar</button>
      </div>
    </form>
  )
}

export default function Whoop() {
  const [data, setData]         = useState(() => storage.get(WHOOP_KEY, METRICAS_DEMO))
  const [showForm, setShowForm] = useState(false)
  const [grafico, setGrafico]   = useState('recovery')
  const [connected, setConnected] = useState(() => isWhoopConnected())
  const [syncing, setSyncing]   = useState(false)
  const [syncedAt, setSyncedAt] = useState(() => localStorage.getItem(SYNCED_AT_KEY))
  const [error, setError]       = useState(null)
  const [callbackMsg, setCallbackMsg] = useState(null)

  // Handle OAuth callback (?code=...&state=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code  = params.get('code')
    const state = params.get('state')
    if (!code) return

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname)

    handleWhoopCallback(code, state)
      .then(() => {
        setConnected(true)
        setCallbackMsg('Cuenta WHOOP conectada correctamente.')
        return syncNow()
      })
      .catch(err => setError(err.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncNow = useCallback(async () => {
    const token = await getValidToken()
    if (!token) {
      setConnected(false)
      setError('Sesión expirada. Vuelve a conectar tu cuenta WHOOP.')
      return
    }
    setSyncing(true)
    setError(null)
    try {
      const metrics = await fetchWhoopMetrics(token)
      if (metrics.length > 0) {
        setData(metrics)
        storage.set(WHOOP_KEY, metrics)
        window.dispatchEvent(new Event('ella_update'))
      }
      const ts = new Date().toISOString()
      localStorage.setItem(SYNCED_AT_KEY, ts)
      setSyncedAt(ts)
    } catch (err) {
      setError(err.message)
      // If 401, token was invalidated — update connected state
      if (err.message?.includes('expirada')) setConnected(false)
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => { storage.set(WHOOP_KEY, data) }, [data])

  // Auto-sync on mount when connected and last sync was >4h ago (or never)
  useEffect(() => {
    if (!isWhoopConnected()) return
    const lastSync = localStorage.getItem(SYNCED_AT_KEY)
    const stale = !lastSync || (Date.now() - new Date(lastSync).getTime() > 4 * 3600 * 1000)
    if (stale) syncNow()
  }, [syncNow])

  const handleConnect = async () => {
    try {
      setError(null)
      await startWhoopOAuth()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDisconnect = () => {
    disconnectWhoop()
    setConnected(false)
    setSyncedAt(null)
    setCallbackMsg(null)
    setError(null)
  }

  const latest = data[data.length - 1] || {}
  const recoveryCfg = getRecoveryConfig(latest.recovery || 0)

  const GRAFICOS = [
    { key: 'recovery', label: 'Recovery', color: '#34d399' },
    { key: 'hrv',      label: 'HRV',      color: '#818cf8' },
    { key: 'strain',   label: 'Strain',   color: '#fb923c' },
    { key: 'sueno',    label: 'Sueño',    color: '#60a5fa' },
  ]

  const fmtSyncedAt = syncedAt
    ? new Date(syncedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null

  const hasClientId = !!(import.meta.env.VITE_WHOOP_CLIENT_ID)

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">WHOOP</h2>
            <p className="text-purple-400 text-xs mt-0.5">Recuperación & rendimiento</p>
          </div>
          <div className="flex gap-2">
            {connected && (
              <button onClick={syncNow} disabled={syncing}
                className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center transition-colors disabled:opacity-50">
                <RefreshCw size={16} className={`text-purple-700 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button onClick={() => setShowForm(!showForm)}
              className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-purple-700" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Feedback banners */}
        {callbackMsg && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
            <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 text-xs">{callbackMsg}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3">
            <AlertCircle size={15} className="text-rose-500 flex-shrink-0" />
            <p className="text-rose-700 text-xs">{error}</p>
          </div>
        )}

        {showForm && (
          <ManualEntryForm
            onSave={(m) => { setData(prev => [...prev, m]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Setup guide — shown when client_id not configured */}
        {!hasClientId && !connected && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info size={15} className="text-amber-600 flex-shrink-0" />
              <p className="text-amber-700 text-sm font-semibold">Configura tu app WHOOP</p>
            </div>
            <ol className="space-y-2 text-xs text-amber-700 list-decimal list-inside leading-relaxed">
              <li>Regístrate en <span className="font-semibold">developer.whoop.com</span> y crea una app</li>
              <li>En <em>Redirect URIs</em> agrega: <code className="bg-amber-500/15 px-1 rounded font-mono text-[10px]">http://localhost:5173</code></li>
              <li>Copia tu <em>Client ID</em> (y Client Secret si lo diera)</li>
              <li>Pégalos en el archivo <code className="bg-amber-500/15 px-1 rounded font-mono text-[10px]">.env</code> del proyecto y reinicia el servidor</li>
            </ol>
            <a
              href="https://developer.whoop.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold"
            >
              <ExternalLink size={12} />
              Ir a developer.whoop.com
            </a>
          </div>
        )}

        {/* WHOOP connection card */}
        <div className={`rounded-2xl border p-4 ${
          connected
            ? 'bg-emerald-500/8 border-emerald-500/20'
            : 'bg-violet-50 border-violet-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                connected ? 'bg-emerald-500/15' : 'bg-violet-100'
              }`}>
                <Watch size={18} className={connected ? 'text-emerald-600' : 'text-purple-400'} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${connected ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {connected ? 'Cuenta conectada' : 'Conectar WHOOP'}
                </p>
                <p className="text-purple-400 text-xs">
                  {connected
                    ? (fmtSyncedAt ? `Sincronizado hoy a las ${fmtSyncedAt}` : 'Sincronización pendiente')
                    : 'Sincroniza tu recovery, HRV y strain'}
                </p>
              </div>
            </div>
            {connected ? (
              <button onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-medium active:scale-95 transition-all">
                <Unplug size={13} />
                Desconectar
              </button>
            ) : (
              <button onClick={handleConnect}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold active:scale-95 transition-all">
                <Link size={13} />
                Conectar
              </button>
            )}
          </div>
        </div>

        {/* Recovery ring + recomendación */}
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <div className="flex items-center gap-4">
            <RecoveryRing value={latest.recovery || 0} />
            <div className="flex-1">
              <p className="text-gray-900 font-semibold text-sm mb-1">Recomendación de hoy</p>
              <p className="text-purple-700 text-xs leading-relaxed">{recoveryCfg.desc}</p>
              <div className="mt-3 space-y-1">
                {latest.hrv != null && (
                  <div className="flex items-center gap-2">
                    <Heart size={12} className="text-indigo-400" />
                    <span className="text-purple-400 text-xs">HRV: <span className="text-indigo-600 font-semibold">{latest.hrv} ms</span></span>
                  </div>
                )}
                {latest.strain != null && (
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-orange-400" />
                    <span className="text-purple-400 text-xs">Strain: <span className="text-orange-600 font-semibold">{latest.strain}</span></span>
                  </div>
                )}
                {latest.sueno != null && (
                  <div className="flex items-center gap-2">
                    <Moon size={12} className="text-blue-400" />
                    <span className="text-purple-400 text-xs">Sueño: <span className="text-blue-600 font-semibold">{latest.sueno}h</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-purple-700 text-sm font-medium">Historial 7 días</p>
            <div className="flex gap-1">
              {GRAFICOS.map(g => (
                <button key={g.key} onClick={() => setGrafico(g.key)}
                  className={`text-xs px-2 py-0.5 rounded-lg transition-all ${
                    grafico === g.key ? 'bg-violet-100/60 text-gray-900 border border-violet-200' : 'text-purple-300 hover:text-purple-400'
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data.slice(-7)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={GRAFICOS.find(g => g.key === grafico)?.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GRAFICOS.find(g => g.key === grafico)?.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9F7" />
              <XAxis dataKey="fecha" tick={{ fill: '#a78bfa', fontSize: 10 }} />
              <YAxis tick={{ fill: '#a78bfa', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={grafico}
                stroke={GRAFICOS.find(g => g.key === grafico)?.color}
                fill="url(#colorGrad)"
                strokeWidth={2}
                dot={{ fill: GRAFICOS.find(g => g.key === grafico)?.color, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
