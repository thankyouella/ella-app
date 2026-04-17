import { useState, useEffect, useCallback } from 'react'
import {
  Droplets, Moon, Trophy, Target, Flame,
  ChevronRight, Plus, Sun, Zap, Heart, Flag, Sparkles,
  Brain, RefreshCw
} from 'lucide-react'
import { storage, KEYS, INITIAL_DATA } from '../utils/storage'
import { calcFaseCiclo } from './Ciclo'
import { RUNNING_PLAN_KEY } from './RunningCoach'

// ─── Frases del día ────────────────────────────────────────────────────────
const FRASES = [
  "Cada kilómetro que corres hoy es una promesa que te cumples a ti misma.",
  "La disciplina es elegirte a ti misma incluso cuando nadie está mirando.",
  "Tu cuerpo puede. Tu mente decide. Tu corazón lidera.",
  "No corres para escapar de algo. Corres hacia quien quieres ser.",
  "El progreso no siempre se ve — pero siempre se construye.",
  "Eres más fuerte de lo que crees, más rápida de lo que piensas.",
  "Un día a la vez, un kilómetro a la vez, una versión mejor de ti.",
  "La carrera más importante es la que tienes contigo misma.",
  "Cada entrenamiento es un depósito en el banco de tu mejor versión.",
  "Confía en el proceso. La línea de llegada llega para quien no se rinde.",
]

// ─── Colores por fase ciclo ───────────────────────────────────────────────
const CICLO_CFG = {
  menstruacion: { Icon: Moon,     label: 'Menstruación', color: 'text-rose-400',    bg: 'bg-rose-500/10',    tip: 'Movimiento suave hoy — escucha tu cuerpo.' },
  folicular:    { Icon: Sun,      label: 'Folicular',    color: 'text-amber-400',   bg: 'bg-amber-500/10',   tip: 'Energía en alza — buen día para entrenar fuerte.' },
  ovulacion:    { Icon: Zap,      label: 'Ovulación',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', tip: 'Pico de energía — ideal para sesión de calidad.' },
  lutea:        { Icon: Droplets, label: 'Lútea',        color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  tip: 'Reduce intensidad progresivamente esta semana.' },
}

// ─── Badge de intensidad ──────────────────────────────────────────────────
const INTENSIDAD_CFG = {
  'Suave':    { cls: 'bg-blue-500/15 text-blue-600 border-blue-500/20',        dot: 'bg-blue-500'    },
  'Moderado': { cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500' },
  'Alto':     { cls: 'bg-amber-500/15 text-amber-600 border-amber-500/20',     dot: 'bg-amber-500'   },
  'Máximo':   { cls: 'bg-rose-500/15 text-rose-600 border-rose-500/20',        dot: 'bg-rose-500'    },
}

// ─── Recovery ring ────────────────────────────────────────────────────────
function RecoveryRing({ value, size = 100 }) {
  const r = size * 0.42
  const circ = 2 * Math.PI * r
  const color = value >= 67 ? '#34d399' : value >= 34 ? '#fbbf24' : '#f87171'
  const label = value >= 67 ? 'Óptimo' : value >= 34 ? 'Moderado' : 'Recuperación'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EDE9F7" strokeWidth={size*0.085} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={size*0.085}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - value / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-gray-900" style={{ fontSize: size * 0.24 }}>{value}%</span>
          <span className="text-purple-400" style={{ fontSize: size * 0.1 }}>recovery</span>
        </div>
      </div>
      <span style={{ color }} className="text-xs font-semibold">{label}</span>
    </div>
  )
}

// ─── Habits ring (Apple Watch style) ─────────────────────────────────────
function HabitsRing({ done, total, size = 56 }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EDE9F7" strokeWidth={size*0.1} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={pct >= 1 ? '#34d399' : '#9333EA'} strokeWidth={size*0.1}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-gray-900 font-bold" style={{ fontSize: size * 0.22 }}>{done}</span>
        <span className="text-purple-300" style={{ fontSize: size * 0.16 }}>/{total}</span>
      </div>
    </div>
  )
}

// ─── Countdown ────────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const [state, setState] = useState({ days: 0, hours: 0, mins: 0 })
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate + 'T07:00:00') - new Date()
      setState({
        days:  Math.max(0, Math.floor(diff / 86400000)),
        hours: Math.max(0, Math.floor((diff % 86400000) / 3600000)),
        mins:  Math.max(0, Math.floor((diff % 3600000) / 60000)),
        over:  diff < 0,
      })
    }
    update()
    const t = setInterval(update, 60000)
    return () => clearInterval(t)
  }, [targetDate])
  return state
}

// ─── Build HOY prompt ─────────────────────────────────────────────────────
function buildHoyPrompt({ fecha, fase, diaCiclo, whoop, sesionHoy, indiceAyer, hitoActivo }) {
  return `Eres el coach personal de Ella, una corredora en Dubai. Analiza su estado HOY y da recomendaciones personalizadas y concretas.

FECHA: ${fecha}
FASE DEL CICLO: ${fase ? `${fase}${diaCiclo ? `, día ${diaCiclo} del ciclo` : ''}` : 'desconocida'}
WHOOP: ${whoop
    ? `Recovery ${whoop.recovery}%, HRV ${whoop.hrv || '?'} ms, Sueño ${whoop.sueno || '?'}h, Strain ${whoop.strain || '?'}`
    : 'Sin datos hoy'}
SESIÓN PLANIFICADA HOY: ${sesionHoy || 'No definida'}
ÍNDICE AYER: ${indiceAyer ? `${indiceAyer.score}/100 — sensación: "${indiceAyer.palabra || 'sin nota'}"` : 'Sin registro'}
HITO ACTIVO: ${hitoActivo ? `"${hitoActivo.nombre}" al ${hitoActivo.progreso}%` : 'Ninguno definido'}

Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto extra):
{
  "saludo": "frase corta motivadora y personal para Ella hoy (máx 10 palabras)",
  "recomendacion_entrenamiento": "recomendación concreta para la sesión de hoy según todos los datos (1-2 oraciones)",
  "recomendacion_recuperacion": "tip específico de recuperación o bienestar para hoy (1 oración)",
  "tip_del_dia": "consejo corto basado en la fase del ciclo y los datos (1 oración)",
  "nivel_intensidad": "Suave|Moderado|Alto|Máximo"
}`
}

// ─── HOY Card ─────────────────────────────────────────────────────────────
function HoyCard() {
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const cacheKey = `ella_recomendacion_hoy_${todayStr}`

  const [rec,     setRec]     = useState(() => storage.get(cacheKey, null))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchRec = useCallback(async () => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || localStorage.getItem('ella_api_key') || ''
    if (!apiKey) { setError('Configura tu API key en Chat IA'); return }

    setLoading(true)
    setError(null)

    try {
      // Ciclo phase
      const cicloConfig   = storage.get('ella_ciclo_config', null)
      const faseCicloData = cicloConfig
        ? calcFaseCiclo(cicloConfig.fechaInicio, cicloConfig.duracionCiclo, cicloConfig.duracionPeriodo)
        : null
      const cicloReg  = storage.get('ella_ciclo', [])
      const faseKey   = faseCicloData?.fase || cicloReg[0]?.fase || null
      const faseName  = faseKey ? CICLO_CFG[faseKey]?.label : null
      const diaCiclo  = faseCicloData?.diaCiclo || cicloReg[0]?.diaDelCiclo || null

      // WHOOP
      const whoopArr   = storage.get('ella_whoop', [])
      const latestWhoop = whoopArr[whoopArr.length - 1] || null

      // Running plan — today's session
      const runningPlan = storage.get(RUNNING_PLAN_KEY, [])
      const dayIdx      = today.getDay() === 0 ? 6 : today.getDay() - 1
      const sesionHoy   = Array.isArray(runningPlan) && runningPlan[dayIdx]?.tipo
        ? runningPlan[dayIdx].tipo
        : null

      // Yesterday's Índice
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const yStr       = yesterday.toISOString().split('T')[0]
      const historial  = storage.get('ella_indice_historial', [])
      const indiceAyer = historial.find(e => e.fecha === yStr) || null

      // Active hito
      const hitos      = storage.get(KEYS.HITOS, [])
      const hitoActivo = hitos.find(h => !h.completado) || null

      const prompt = buildHoyPrompt({
        fecha: today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
        fase: faseName,
        diaCiclo,
        whoop: latestWhoop,
        sesionHoy,
        indiceAyer,
        hitoActivo,
      })

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const raw  = data.content[0].text.trim()
        .replace(/^```json?\s*/i, '').replace(/\s*```$/, '')
      const json = JSON.parse(raw)
      storage.set(cacheKey, json)
      setRec(json)
    } catch (e) {
      setError('No se pudo obtener la recomendación')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [cacheKey])

  // Auto-fetch on mount if no cache
  useEffect(() => {
    if (!rec) fetchRec()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const intensidadCfg = rec
    ? (INTENSIDAD_CFG[rec.nivel_intensidad] || INTENSIDAD_CFG['Moderado'])
    : null

  return (
    <div className="px-4 mb-4">
      <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/5 rounded-3xl border border-violet-500/20 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-violet-600" />
            <span className="text-violet-600 text-xs font-semibold uppercase tracking-wider">Recomendación de hoy</span>
          </div>
          <button
            onClick={fetchRec}
            disabled={loading}
            className="flex items-center gap-1 text-purple-400 hover:text-violet-600 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="text-[10px]">Regenerar</span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-5">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-purple-400 text-xs">Analizando tu día…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-3">
            <p className="text-rose-400 text-xs mb-2">{error}</p>
            <button
              onClick={fetchRec}
              className="text-violet-600 text-xs underline underline-offset-2"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Recommendation */}
        {!loading && rec && (
          <div className="space-y-3">
            {/* Saludo + badge intensidad */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-gray-900 font-semibold text-sm leading-snug flex-1">
                "{rec.saludo}"
              </p>
              {intensidadCfg && (
                <span className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${intensidadCfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${intensidadCfg.dot}`} />
                  {rec.nivel_intensidad}
                </span>
              )}
            </div>

            {/* Detalles */}
            <div className="space-y-2 pt-0.5">
              <div className="flex gap-2.5 items-start">
                <span className="text-base leading-none mt-0.5">🏃‍♀️</span>
                <p className="text-gray-700 text-xs leading-relaxed">{rec.recomendacion_entrenamiento}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-base leading-none mt-0.5">💆‍♀️</span>
                <p className="text-gray-700 text-xs leading-relaxed">{rec.recomendacion_recuperacion}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-base leading-none mt-0.5">🌙</span>
                <p className="text-purple-500 text-xs leading-relaxed italic">{rec.tip_del_dia}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Today's plan ─────────────────────────────────────────────────────────
const DAY_PLAN   = ['Descanso activo', 'Rodaje fácil', 'Fuerza + Core', 'Rodaje con tempo', 'Descanso', 'Tirada larga', 'Recuperación']
const DAY_COLORS = [
  'bg-violet-50 text-purple-400',
  'bg-blue-500/15 text-blue-600',
  'bg-orange-500/15 text-orange-600',
  'bg-purple-500/15 text-purple-600',
  'bg-violet-50 text-purple-300',
  'bg-violet-600/15 text-violet-600',
  'bg-indigo-500/15 text-indigo-600',
]

// ─── Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ onTabChange }) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1)
    window.addEventListener('ella_update', h)
    return () => window.removeEventListener('ella_update', h)
  }, [])

  const today      = new Date()
  const todayStr   = today.toISOString().split('T')[0]
  const dayOfWeek  = today.getDay() // 0=Sun
  const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const dayNames   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const dateStr    = `${dayNames[dayOfWeek]}, ${today.getDate()} de ${monthNames[today.getMonth()]}`
  const frase      = FRASES[today.getDate() % FRASES.length]

  // ── Live data ──
  const user        = storage.get(KEYS.USER, INITIAL_DATA.user)
  const hitos       = storage.get(KEYS.HITOS, [INITIAL_DATA.hito_activo])
  const hitoActivo  = hitos.find(h => !h.completado)
  const hidra       = storage.get(`ella_hidra_${todayStr}`, 0)
  const habitConfig = storage.get('ella_habitos_config', { manana: [], noche: [] })
  const habitChecks = storage.get(`ella_habitos_check_${todayStr}`, {})
  const allHabits   = [...(habitConfig.manana || []), ...(habitConfig.noche || [])]
  const doneHabits  = allHabits.filter(h => habitChecks[h.id]).length
  const whoopData   = storage.get('ella_whoop', [])
  const latestWhoop = whoopData[whoopData.length - 1] || null
  const streaks     = storage.get('ella_habitos_streaks', { dias: 0 })
  const countdown   = useCountdown(user.fecha_carrera)

  // ── Ciclo: prefer auto-calc from config, fallback to manual registry ──
  const cicloConfig   = storage.get('ella_ciclo_config', null)
  const faseCicloData = cicloConfig
    ? calcFaseCiclo(cicloConfig.fechaInicio, cicloConfig.duracionCiclo, cicloConfig.duracionPeriodo)
    : null
  const cicloReg    = storage.get('ella_ciclo', [])
  const faseKey     = faseCicloData?.fase || cicloReg[0]?.fase || null
  const diaCicloNum = faseCicloData?.diaCiclo || cicloReg[0]?.diaDelCiclo || null
  const cicloFase   = CICLO_CFG[faseKey] || null

  // ── Running plan — today's session ──
  const runningPlan  = storage.get(RUNNING_PLAN_KEY, [])
  const todayPlanIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const todaySesion  = Array.isArray(runningPlan) && runningPlan[todayPlanIdx]
    ? runningPlan[todayPlanIdx]
    : { tipo: DAY_PLAN[todayPlanIdx], completado: false }

  // ── Hydration ──
  const hidraTarget = 2500
  const hidraPct    = Math.min((hidra / hidraTarget) * 100, 100)

  // ── Recovery recommendation ──
  const recoveryVal = latestWhoop?.recovery || 0
  const recRec = latestWhoop
    ? recoveryVal >= 67
      ? { text: 'Día óptimo para entrenar al máximo', color: 'text-emerald-400', icon: '🟢' }
      : recoveryVal >= 34
        ? { text: 'Entrena con moderación hoy',       color: 'text-amber-400',   icon: '🟡' }
        : { text: 'Prioriza la recuperación activa',  color: 'text-rose-400',    icon: '🔴' }
    : null

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-400 text-xs font-medium tracking-wide">{dateStr}</p>
            <h1 className="text-gray-900 text-[28px] font-bold mt-1 leading-tight">
              Hola, <span className="text-violet-600">{user.nombre}</span>{' '}
              <Sparkles size={22} className="text-violet-400 inline align-text-bottom" />
            </h1>
            <p className="text-purple-300 text-xs mt-1">{user.ciudad}</p>
          </div>
          {/* Race countdown / post-race badge */}
          {countdown.days > 0 ? (
            <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl px-3 py-2 text-right flex-shrink-0">
              <p className="text-violet-600 font-bold text-2xl leading-none">{countdown.days}</p>
              <p className="text-violet-600/60 text-[10px] leading-tight">días · {user.proxima_carrera || '10K'}</p>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2 text-right flex-shrink-0">
              <p className="text-2xl leading-none">🎉</p>
              <p className="text-amber-600 text-[10px] leading-tight font-semibold">¡Completada!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── HOY Card (Claude AI) ── */}
      <HoyCard />

      {/* ── Hero section: Recovery + Today's plan ── */}
      <div className="px-4 mb-4">
        <div className="bg-violet-50 rounded-3xl border border-violet-100 p-5">
          <div className="flex items-center justify-between gap-4">
            {/* Recovery ring */}
            <div className="flex-shrink-0">
              {latestWhoop
                ? <RecoveryRing value={recoveryVal} size={96} />
                : (
                  <div
                    className="flex flex-col items-center justify-center bg-violet-100/50 rounded-2xl cursor-pointer hover:bg-violet-100 transition-colors"
                    style={{ width: 96, height: 96 }}
                    onClick={() => onTabChange('whoop')}
                  >
                    <span className="text-2xl">⌚</span>
                    <p className="text-purple-300 text-[10px] text-center mt-1 leading-tight">Conecta<br/>WHOOP</p>
                  </div>
                )
              }
            </div>

            {/* Right: today's workout + recommendation */}
            <div className="flex-1 min-w-0">
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-2">Plan de hoy</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-2 ${
                DAY_COLORS[todayPlanIdx]
              }`}>
                {todaySesion.completado ? '✓ ' : ''}{todaySesion.tipo}
              </div>
              {recRec && (
                <p className={`text-xs leading-relaxed ${recRec.color}`}>
                  {recRec.icon} {recRec.text}
                </p>
              )}
              {!recRec && cicloFase && (
                <p className={`text-xs leading-relaxed ${cicloFase.color}`}>{cicloFase.tip}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Ciclo fase chip ── */}
      {cicloFase && (
        <div className="px-4 mb-4">
          <div className={`flex items-center gap-2 ${cicloFase.bg} rounded-2xl px-4 py-2.5 border border-violet-100`}>
            <cicloFase.Icon size={18} className={cicloFase.color} />
            <div>
              <span className={`text-xs font-semibold ${cicloFase.color}`}>Fase {cicloFase.label}</span>
              {diaCicloNum && (
                <span className="text-purple-300 text-xs ml-2">· Día {diaCicloNum}</span>
              )}
              <p className="text-purple-400 text-xs mt-0.5">{cicloFase.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Metrics row: Hydration + Habits + Streak ── */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-3">
        {/* Hydration */}
        <button
          onClick={() => onTabChange('nutricion')}
          className="bg-violet-50 rounded-2xl border border-violet-100 p-3 flex flex-col items-center gap-2 hover:border-blue-500/20 transition-colors active:scale-95"
        >
          <Droplets size={18} className="text-blue-400" />
          <div className="w-full h-1.5 bg-violet-100/60 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${hidraPct}%` }} />
          </div>
          <div className="text-center">
            <p className="text-gray-900 font-bold text-sm leading-none">{(hidra/1000).toFixed(1)}L</p>
            <p className="text-purple-300 text-[10px]">de 2.5L</p>
          </div>
        </button>

        {/* Habits ring */}
        <button
          onClick={() => onTabChange('habitos')}
          className="bg-violet-50 rounded-2xl border border-violet-100 p-3 flex flex-col items-center gap-1.5 hover:border-violet-500/20 transition-colors active:scale-95"
        >
          <HabitsRing done={doneHabits} total={allHabits.length || 1} size={48} />
          <p className="text-purple-300 text-[10px]">hábitos</p>
        </button>

        {/* Streak */}
        <button
          onClick={() => onTabChange('habitos')}
          className="bg-violet-50 rounded-2xl border border-violet-100 p-3 flex flex-col items-center gap-1.5 hover:border-orange-500/20 transition-colors active:scale-95"
        >
          <Flame size={18} className="text-orange-400" />
          <div className="text-center">
            <p className="text-gray-900 font-bold text-xl leading-none">{streaks.dias}</p>
            <p className="text-purple-300 text-[10px]">días racha</p>
          </div>
        </button>
      </div>

      {/* ── Active milestone ── */}
      {hitoActivo && (
        <div className="px-4 mb-4">
          <button
            onClick={() => onTabChange('hitos')}
            className="w-full bg-violet-50 rounded-2xl border border-violet-500/15 p-4 text-left hover:border-violet-500/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-violet-600" />
                <span className="text-violet-600 text-xs font-semibold uppercase tracking-wider">Hito activo</span>
              </div>
              <ChevronRight size={14} className="text-purple-300" />
            </div>
            <p className="text-gray-900 font-semibold text-sm mb-2 leading-snug">{hitoActivo.nombre}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-violet-100/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-400 to-violet-600 rounded-full transition-all duration-700"
                  style={{ width: `${hitoActivo.progreso}%` }} />
              </div>
              <span className="text-violet-600 text-sm font-bold flex-shrink-0">{hitoActivo.progreso}%</span>
            </div>
          </button>
        </div>
      )}

      {/* ── WHOOP snapshot ── */}
      {latestWhoop && (
        <div className="px-4 mb-4">
          <button
            onClick={() => onTabChange('whoop')}
            className="w-full bg-violet-50 rounded-2xl border border-violet-100 p-4 hover:border-violet-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-400 text-xs uppercase tracking-wider">WHOOP · hoy</span>
              <ChevronRight size={14} className="text-purple-300" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {latestWhoop.hrv && (
                <div className="text-center">
                  <p className="text-indigo-600 font-bold text-lg leading-none">{latestWhoop.hrv}</p>
                  <p className="text-purple-300 text-xs mt-0.5">HRV ms</p>
                </div>
              )}
              {latestWhoop.strain && (
                <div className="text-center">
                  <p className="text-orange-600 font-bold text-lg leading-none">{latestWhoop.strain}</p>
                  <p className="text-purple-300 text-xs mt-0.5">Strain</p>
                </div>
              )}
              {latestWhoop.sueno && (
                <div className="text-center">
                  <p className="text-blue-600 font-bold text-lg leading-none">{latestWhoop.sueno}h</p>
                  <p className="text-purple-300 text-xs mt-0.5">Sueño</p>
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* ── Motivational quote ── */}
      <div className="px-4 mb-6">
        <div className="border-l-2 border-violet-500/30 pl-4">
          <p className="text-purple-400 text-sm italic leading-relaxed">"{frase}"</p>
        </div>
      </div>
    </div>
  )
}
