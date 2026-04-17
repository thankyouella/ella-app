import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Activity, Heart, Sparkles,
  Plus, Droplets, CheckCircle2, X, Zap,
  Timer, Dumbbell, Watch, BarChart2, Salad, Moon, Sun,
  Trophy, CheckSquare, BookOpen, MessageSquare,
  Flag, Apple, TrendingUp, Settings, Download, Upload,
  User, MapPin, Calendar, Medal, Save, ChevronRight, LogOut,
  Lock, Eye, EyeOff, Loader, Ruler, Cake
} from 'lucide-react'
import Dashboard    from './components/Dashboard'
import Hitos        from './components/Hitos'
import Diario       from './components/Diario'
import IndiceElla   from './components/IndiceElla'
import ChatIA       from './components/ChatIA'
import RunningCoach from './components/RunningCoach'
import Fuerza       from './components/Fuerza'
import InBody       from './components/InBody'
import Nutricion    from './components/Nutricion'
import Whoop        from './components/Whoop'
import Ciclo        from './components/Ciclo'
import Habitos      from './components/Habitos'
import Carreras     from './components/Carreras'
import AuthGate     from './components/AuthGate'
import { storage, KEYS, INITIAL_DATA } from './utils/storage'
import { supabase } from './utils/supabase'
import { pullFromSupabase, initSync, wipeSupabaseData } from './utils/syncEngine'

// ─── Section definitions ─────────────────────────────────────────────────────
const SECTIONS = {
  entrena: {
    tabs: [
      { id: 'running',  label: 'Running',  Icon: Timer    },
      { id: 'fuerza',   label: 'Fuerza',   Icon: Dumbbell },
      { id: 'carreras', label: 'Carreras', Icon: Medal    },
      { id: 'whoop',    label: 'WHOOP',    Icon: Watch    },
    ],
  },
  cuerpo: {
    tabs: [
      { id: 'inbody',    label: 'Composición', Icon: BarChart2 },
      { id: 'nutricion', label: 'Nutrición',   Icon: Salad    },
      { id: 'ciclo',     label: 'Ciclo',       Icon: Moon     },
    ],
  },
  vida: {
    tabs: [
      { id: 'hitos',   label: 'Hitos',   Icon: Trophy     },
      { id: 'habitos', label: 'Hábitos', Icon: CheckSquare },
      { id: 'diario',  label: 'Diario',  Icon: BookOpen   },
      { id: 'indice',  label: 'Índice',  Icon: TrendingUp },
    ],
  },
}

const MAIN_TABS = [
  { id: 'dashboard', label: 'Hoy',     icon: LayoutDashboard },
  { id: 'entrena',   label: 'Entrena', icon: Timer           },
  { id: 'cuerpo',    label: 'Cuerpo',  icon: Apple           },
  { id: 'vida',      label: 'Vida',    icon: Heart           },
  { id: 'chat',      label: 'Coach',   icon: MessageSquare   },
]

// ─── Module renderer ──────────────────────────────────────────────────────────
function renderModule(id, onTabChange) {
  switch (id) {
    case 'dashboard': return <Dashboard onTabChange={onTabChange} />
    case 'running':   return <RunningCoach />
    case 'fuerza':    return <Fuerza />
    case 'carreras':  return <Carreras />
    case 'whoop':     return <Whoop />
    case 'inbody':    return <InBody />
    case 'nutricion': return <Nutricion />
    case 'ciclo':     return <Ciclo />
    case 'hitos':     return <Hitos />
    case 'habitos':   return <Habitos />
    case 'diario':    return <Diario />
    case 'indice':    return <IndiceElla />
    case 'chat':      return <ChatIA />
    default:          return null
  }
}

// ─── Backup utilities ─────────────────────────────────────────────────────────
function exportData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ella_')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)) } catch { data[key] = localStorage.getItem(key) }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `ella-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(file, onDone) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('ella_')) localStorage.setItem(k, JSON.stringify(v))
      })
      window.dispatchEvent(new Event('ella_update'))
      onDone(true)
    } catch {
      onDone(false)
    }
  }
  reader.readAsText(file)
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose, syncing }) {
  const [user, setUser]         = useState(() => storage.get(KEYS.USER, INITIAL_DATA.user))
  const [saved, setSaved]       = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const importRef = useRef(null)

  const handleSave = () => {
    storage.set(KEYS.USER, user)
    window.dispatchEvent(new Event('ella_update'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    importData(file, (ok) => {
      setImportMsg(ok ? '✅ Datos restaurados correctamente' : '❌ Error al leer el archivo')
      setTimeout(() => setImportMsg(null), 3000)
      if (ok) setUser(storage.get(KEYS.USER, INITIAL_DATA.user))
    })
    e.target.value = ''
  }

  const today = new Date()
  const raceDate = user.fecha_carrera ? new Date(user.fecha_carrera + 'T07:00:00') : null
  const raceOver = raceDate && raceDate < today

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md animate-fade-in"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-violet-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-violet-600" />
            <h3 className="text-gray-900 font-bold">Perfil & Configuración</h3>
            {syncing && (
              <span className="text-[10px] text-purple-400 animate-pulse">Sincronizando…</span>
            )}
          </div>
          <button onClick={onClose} className="text-purple-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* ── Perfil ── */}
          <div>
            <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">Mi perfil</p>
            <div className="space-y-3">
              <div>
                <label className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                  <User size={11} /> Nombre
                </label>
                <input
                  value={user.nombre || ''}
                  onChange={e => setUser(u => ({ ...u, nombre: e.target.value }))}
                  className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div>
                <label className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                  <MapPin size={11} /> Ciudad
                </label>
                <input
                  value={user.ciudad || ''}
                  onChange={e => setUser(u => ({ ...u, ciudad: e.target.value }))}
                  className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div>
                <label className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                  <Medal size={11} /> Próxima carrera
                </label>
                <input
                  value={user.proxima_carrera || ''}
                  onChange={e => setUser(u => ({ ...u, proxima_carrera: e.target.value }))}
                  placeholder="Ej: Dubai 10K"
                  className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div>
                <label className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Fecha de carrera
                </label>
                <input
                  type="date"
                  value={user.fecha_carrera || ''}
                  onChange={e => setUser(u => ({ ...u, fecha_carrera: e.target.value }))}
                  className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
                />
                {raceOver && (
                  <p className="text-amber-500 text-xs mt-1">
                    🎉 Esta carrera ya pasó — actualiza la fecha si tienes una nueva.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                    <Ruler size={11} /> Altura (cm)
                  </label>
                  <input
                    type="number"
                    min="100" max="220"
                    value={user.altura || ''}
                    onChange={e => setUser(u => ({ ...u, altura: e.target.value ? +e.target.value : '' }))}
                    placeholder="Ej: 165"
                    className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-purple-400 text-xs mb-1 flex items-center gap-1">
                    <Cake size={11} /> Nacimiento
                  </label>
                  <input
                    type="date"
                    value={user.fecha_nacimiento || ''}
                    onChange={e => setUser(u => ({ ...u, fecha_nacimiento: e.target.value }))}
                    className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
                  />
                </div>
              </div>
              {user.peso_actual && (
                <p className="text-purple-400 text-xs px-1">
                  ⚖️ Peso actual: <span className="text-violet-600 font-semibold">{user.peso_actual} kg</span>
                  <span className="text-purple-300"> — se actualiza automáticamente con cada InBody</span>
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              className={`w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/20'
                  : 'bg-violet-600 text-white'
              }`}
            >
              {saved ? '✓ Guardado' : 'Guardar cambios'}
            </button>
          </div>

          {/* ── Backup ── */}
          <div>
            <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">Copia de seguridad</p>
            <div className="space-y-2">
              <button
                onClick={exportData}
                className="w-full flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 hover:border-violet-300 transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 bg-violet-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download size={16} className="text-violet-600" />
                </div>
                <div className="text-left">
                  <p className="text-gray-900 text-sm font-medium">Exportar datos</p>
                  <p className="text-purple-300 text-xs">Descarga todos tus datos como JSON</p>
                </div>
                <ChevronRight size={14} className="text-purple-300 ml-auto" />
              </button>

              <button
                onClick={() => importRef.current?.click()}
                className="w-full flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 hover:border-violet-300 transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Upload size={16} className="text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-gray-900 text-sm font-medium">Restaurar datos</p>
                  <p className="text-purple-300 text-xs">Importa un backup JSON anterior</p>
                </div>
                <ChevronRight size={14} className="text-purple-300 ml-auto" />
              </button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

              {importMsg && (
                <p className="text-xs text-center py-2 text-gray-700 animate-fade-in">{importMsg}</p>
              )}

              <p className="text-purple-300 text-[10px] text-center leading-relaxed pt-1">
                Tu perfil, planes, mediciones, hábitos y conversaciones<br/>se incluyen en el backup.
              </p>
            </div>
          </div>

          {/* ── Cuenta ── */}
          {supabase && (
            <div>
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">Cuenta</p>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  onClose()
                }}
                className="w-full flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-gray-900 text-sm hover:border-violet-300 transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LogOut size={15} className="text-violet-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Cerrar sesión</p>
                  <p className="text-purple-300 text-xs">Tus datos quedan guardados en la nube</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Danger zone ── */}
          <div>
            <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">Zona de riesgo</p>
            <button
              onClick={async () => {
                if (window.confirm('¿Borrar TODOS los datos de la app? Esta acción no se puede deshacer.')) {
                  // Wipe localStorage
                  const keys = []
                  for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i)
                    if (k?.startsWith('ella_')) keys.push(k)
                  }
                  keys.forEach(k => localStorage.removeItem(k))
                  // Wipe Supabase
                  if (supabase) await wipeSupabaseData()
                  window.dispatchEvent(new Event('ella_update'))
                  onClose()
                }
              }}
              className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/5 transition-colors"
            >
              Borrar todos los datos
            </button>
          </div>

          <div className="pb-2" />
        </div>
      </div>
    </div>
  )
}

// ─── Metric Pill ──────────────────────────────────────────────────────────────
function MetricPill({ Icon, value, accent = false }) {
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border flex-shrink-0 ${
      accent
        ? 'bg-violet-600/10 border-violet-500/20 text-violet-600'
        : 'bg-violet-50 border-violet-100 text-purple-700'
    }`}>
      <Icon size={11} />
      <span className="text-[11px] font-semibold">{value}</span>
    </div>
  )
}

// ─── Global Header ────────────────────────────────────────────────────────────
function GlobalHeader({ onOpenSettings, darkMode, onToggleDark }) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1)
    window.addEventListener('ella_update', h)
    return () => window.removeEventListener('ella_update', h)
  }, [])

  const today = new Date()
  const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const dateStr     = `${DAY_NAMES[today.getDay()]}, ${today.getDate()} ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`

  const user        = storage.get(KEYS.USER, INITIAL_DATA.user)
  const whoopData   = storage.get('ella_whoop', [])
  const latestWhoop = whoopData[whoopData.length - 1] || null

  const raceDate  = user.fecha_carrera ? new Date(user.fecha_carrera + 'T07:00:00') : null
  const daysToRace = raceDate ? Math.ceil((raceDate - today) / 86400000) : null
  const raceOver   = daysToRace !== null && daysToRace < 0
  const raceToday  = daysToRace === 0

  const racePillValue = raceOver
    ? '🎉 Post-carrera'
    : raceToday
      ? `¡Hoy! 🏁 ${user.proxima_carrera || '10K'}`
      : daysToRace !== null
        ? `${daysToRace}d · ${user.proxima_carrera || '10K'}`
        : 'Sin carrera'

  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/97 backdrop-blur-xl border-b border-violet-100 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
        {/* Logo + nombre */}
        <div className="flex items-center gap-2">
          <img
            src={darkMode ? '/logo-dark.png' : '/logo-light.png'}
            alt="Ella APP"
            className="w-8 h-8 rounded-xl object-cover"
          />
          <span className="text-violet-600 font-black text-[16px] tracking-[0.18em]">ELLA</span>
        </div>
        <span className="text-purple-400 text-[11px] font-medium">{dateStr}</span>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="w-7 h-7 flex items-center justify-center text-purple-400 hover:text-violet-600 transition-colors active:scale-90"
            aria-label="Cambiar tema"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {/* Avatar / settings */}
          <button
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-violet-600 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <span className="text-white text-xs font-bold">
              {user.nombre?.[0]?.toUpperCase() || 'E'}
            </span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <MetricPill Icon={Watch}    value={latestWhoop?.recovery != null ? `${latestWhoop.recovery}% Recov` : '-- Recov'} />
        <MetricPill Icon={Activity} value={latestWhoop?.hrv    ? `${latestWhoop.hrv}ms HRV`     : '-- HRV'}    />
        <MetricPill Icon={Zap}      value={latestWhoop?.strain ? `${latestWhoop.strain} Strain`  : '-- Strain'} />
        <MetricPill Icon={raceOver ? Trophy : Flag} value={racePillValue} accent />
      </div>
    </header>
  )
}

// ─── Sub-tab bar ──────────────────────────────────────────────────────────────
function SubTabBar({ tabs, active, onChange }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-id="${active}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-none border-b border-violet-100 bg-white sticky top-0 z-30"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map(t => (
        <button
          key={t.id}
          data-id={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            active === t.id
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-violet-50 text-purple-400 hover:bg-violet-100/60 hover:text-purple-700'
          }`}
        >
          <t.Icon size={14} />
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Quick Log FAB ────────────────────────────────────────────────────────────
function QuickLogFAB({ onAction }) {
  const [open, setOpen] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const actions = [
    {
      Icon: Droplets,
      label: '+500ml agua',
      color: 'bg-blue-500',
      fn: () => {
        const k = `ella_hidra_${today}`
        storage.set(k, (storage.get(k, 0)) + 500)
        window.dispatchEvent(new Event('ella_update'))
      },
    },
    {
      Icon: Zap,
      label: 'Marcar hábito',
      color: 'bg-amber-500',
      fn: () => onAction('habitos'),
    },
    {
      Icon: CheckCircle2,
      label: 'Registrar carrera',
      color: 'bg-emerald-500',
      fn: () => onAction('carreras'),
    },
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      {open && (
        <div className="fixed right-4 z-50 flex flex-col gap-2 items-end animate-fade-in"
          style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => { a.fn(); setOpen(false) }}
              className="flex items-center gap-3 bg-white border border-violet-200 rounded-2xl pl-4 pr-3 py-2.5 shadow-xl active:scale-95 transition-all"
            >
              <span className="text-purple-700 text-sm font-medium">{a.label}</span>
              <div className={`w-8 h-8 ${a.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <a.Icon size={15} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed right-4 z-50 rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-95 ${
          open ? 'bg-violet-100 rotate-45' : 'bg-violet-600'
        }`}
        style={{ width: 52, height: 52, bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        {open ? <X size={22} className="text-gray-900" /> : <Plus size={22} className="text-white" />}
      </button>
    </>
  )
}

// ─── Bottom Nav Tab ───────────────────────────────────────────────────────────
function NavTab({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex flex-col items-center justify-center gap-[3px] flex-1 pt-2 pb-1 relative transition-all ${
        active ? 'text-violet-600' : 'text-purple-300 hover:text-purple-400'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
        active ? 'bg-violet-600/15' : ''
      }`}>
        <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
      </div>
      <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-violet-600" />
      )}
    </button>
  )
}

// ─── Reset Password Screen ────────────────────────────────────────────────────
function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(onDone, 2000)
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <div className="mb-8 text-center">
        <img src="/logo-dark.png" alt="Ella APP" className="w-20 h-20 rounded-3xl mx-auto mb-4 shadow-lg shadow-violet-200" />
        <h1 className="text-violet-600 font-black text-3xl tracking-[0.25em]">ELLA</h1>
      </div>

      {success ? (
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <p className="text-gray-900 font-bold text-lg">¡Contraseña actualizada!</p>
          <p className="text-purple-400 text-sm">Entrando a tu app...</p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="w-full space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-gray-900 font-bold text-xl">Nueva contraseña</h2>
            <p className="text-purple-400 text-sm mt-1">Elige una contraseña segura</p>
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              required autoFocus
              className="w-full bg-violet-50 border border-violet-200 rounded-2xl pl-10 pr-10 py-3.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-500">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none" />
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirmar contraseña"
              required
              className="w-full bg-violet-50 border border-violet-200 rounded-2xl pl-10 pr-4 py-3.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-rose-500 text-xs text-center bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading
              ? <><Loader size={16} className="animate-spin" /> Guardando...</>
              : <><Save size={16} /> Guardar nueva contraseña</>
            }
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session,    setSession]    = useState(undefined) // undefined = loading
  const [syncing,    setSyncing]    = useState(false)
  const [activeTab,  setActiveTab]  = useState('dashboard')
  const [subTabs,    setSubTabs]    = useState({
    entrena: 'running',
    cuerpo:  'inbody',
    vida:    'hitos',
  })
  const [showSettings,   setShowSettings]   = useState(false)
  const [darkMode,       setDarkMode]       = useState(() => localStorage.getItem('ella_dark_mode') === 'true')
  const [resetPassword,  setResetPassword]  = useState(false) // true when user clicks reset link
  const [, forceUpdate] = useState(0)
  const contentRef = useRef(null)

  // ── Dark mode — apply to <html> and persist ───────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('ella_dark_mode', String(darkMode))
  }, [darkMode])

  // ── Auth + initial sync ────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        setSyncing(true)
        pullFromSupabase().finally(() => setSyncing(false))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset password link — show new-password screen
        setResetPassword(true)
        setSession(session)
        return
      }
      setSession(session)
      if (session) {
        setSyncing(true)
        pullFromSupabase().finally(() => setSyncing(false))
      }
    })

    // Start sync engine (pushes to Supabase on every ella_update)
    const stopSync = initSync()

    return () => {
      subscription.unsubscribe()
      stopSync()
    }
  }, [])

  useEffect(() => {
    if (!storage.get(KEYS.USER))  storage.set(KEYS.USER,  INITIAL_DATA.user)
    if (!storage.get(KEYS.HITOS)) storage.set(KEYS.HITOS, [INITIAL_DATA.hito_activo])

    // Auto-navigate to WHOOP on OAuth callback
    if (new URLSearchParams(window.location.search).has('code')) {
      setActiveTab('entrena')
      setSubTabs(prev => ({ ...prev, entrena: 'whoop' }))
    }
  }, [])

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('ella_update', handler)
    return () => window.removeEventListener('ella_update', handler)
  }, [])

  // ── Loading screen while checking auth ────────────────────────────────────
  if (session === undefined) {
    return (
      <div className="min-h-svh bg-white flex flex-col items-center justify-center max-w-md mx-auto">
        <img src="/logo-dark.png" alt="Ella APP" className="w-16 h-16 rounded-2xl mb-4 animate-pulse" />
        <p className="text-purple-400 text-sm">Cargando...</p>
      </div>
    )
  }

  // ── Auth gate — shown when Supabase configured but no session ─────────────
  if (supabase && !session) {
    return <AuthGate />
  }

  // ── Reset password screen — shown after clicking recovery link ─────────────
  if (resetPassword) {
    return <ResetPasswordScreen onDone={() => setResetPassword(false)} />
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubTabChange = (sectionId, subId) => {
    setSubTabs(prev => ({ ...prev, [sectionId]: subId }))
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateTo = (moduleId) => {
    for (const [sectionId, section] of Object.entries(SECTIONS)) {
      const found = section.tabs.find(t => t.id === moduleId)
      if (found) {
        setActiveTab(sectionId)
        setSubTabs(prev => ({ ...prev, [sectionId]: moduleId }))
        return
      }
    }
    setActiveTab(moduleId)
  }

  const isChatTab  = activeTab === 'chat'
  const section    = SECTIONS[activeTab]
  const activeSubId = section ? subTabs[activeTab] : null

  return (
    <div className="min-h-svh bg-white flex flex-col max-w-md mx-auto relative select-none">
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} syncing={syncing} />}

      <GlobalHeader
        onOpenSettings={() => setShowSettings(true)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <div
        ref={contentRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden ${isChatTab ? 'flex flex-col' : ''}`}
        style={{
          paddingTop: 'calc(76px + env(safe-area-inset-top))',
          paddingBottom: isChatTab
            ? 'calc(64px + env(safe-area-inset-bottom))'
            : 'calc(80px + env(safe-area-inset-bottom))',
        }}
      >
        {section && (
          <SubTabBar
            tabs={section.tabs}
            active={activeSubId}
            onChange={(id) => handleSubTabChange(activeTab, id)}
          />
        )}

        <div key={activeTab + (activeSubId || '')}>
          {activeTab === 'dashboard' && renderModule('dashboard', navigateTo)}
          {activeTab === 'chat'      && renderModule('chat', navigateTo)}
          {section && activeSubId   && renderModule(activeSubId, navigateTo)}
        </div>
      </div>

      {!isChatTab && <QuickLogFAB onAction={navigateTo} />}

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-violet-100 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center h-[60px] px-1">
          {MAIN_TABS.map(tab => (
            <NavTab key={tab.id} tab={tab} active={activeTab === tab.id} onClick={handleTabChange} />
          ))}
        </div>
      </nav>
    </div>
  )
}
