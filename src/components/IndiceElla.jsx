import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Trophy, ChevronLeft, ChevronRight, Download, Sparkles, Loader, Watch, Heart, Zap, Moon, Star } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { storage } from '../utils/storage'

const INDICE_KEY = 'ella_indice_historial'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEtiqueta(score) {
  if (score >= 85) return { label: 'Día de élite',        color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-600'   }
  if (score >= 70) return { label: 'Día sólido',          color: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600' }
  if (score >= 50) return { label: 'Día en construcción', color: '#60a5fa', bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-600'    }
  return              { label: 'Día de recuperación', color: '#9ca3af', bg: 'bg-gray-100',        border: 'border-gray-200',       text: 'text-gray-500'    }
}

function toMMDD(isoDate) {
  const [, mm, dd] = isoDate.split('-')
  return `${mm}/${dd}`
}

function getHabitosScore(date) {
  const cfg   = storage.get('ella_habitos_config', { manana: [], noche: [] })
  const all   = [...(cfg.manana || []), ...(cfg.noche || [])]
  if (!all.length) return 50
  const checks = storage.get(`ella_habitos_check_${date}`, {})
  const done   = all.filter(h => checks[h.id]).length
  return Math.round((done / all.length) * 100)
}

function getWhoopForDate(date) {
  const data = storage.get('ella_whoop', [])
  const mmdd = toMMDD(date)
  return data.find(d => d.fecha === mmdd) || data[data.length - 1] || null
}

function calcularIndice(form, whoopData, habitosScore) {
  // WHOOP pilar (30%)
  let whoopScore = 50
  if (whoopData) {
    const rec  = whoopData.recovery || 0
    const hrv  = Math.min(100, ((whoopData.hrv || 0) / 80) * 100)
    const sueno = Math.min(100, ((whoopData.sueno || 0) / 8) * 100)
    whoopScore = Math.round((rec + hrv + sueno) / 3)
  }

  // Entrenamiento pilar (30%)
  const baseEntreno  = form.sesion === 'si' ? 70 : form.sesion === 'descanso' ? 60 : 20
  const calidadBonus = form.sesion === 'si' ? (form.calidad - 1) * 7.5 : 0
  const entrenoScore = Math.min(100, Math.round(baseEntreno + calidadBonus))

  // Nutrición pilar (20%)
  const nutricionScore = Math.min(100, form.nutricion === 'si' ? 80 + (form.energia - 1) * 5 : 30)

  // Hábitos pilar (20%)
  const habScore = habitosScore

  const indice = Math.round(
    whoopScore   * 0.30 +
    entrenoScore * 0.30 +
    nutricionScore * 0.20 +
    habScore     * 0.20
  )

  return {
    indice,
    pilares: { whoop: whoopScore, entrenamiento: entrenoScore, nutricion: nutricionScore, habitos: habScore },
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Stars({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}>
          <Star
            size={22}
            className={i < value ? 'text-amber-400 fill-amber-400' : 'text-purple-200'}
          />
        </button>
      ))}
    </div>
  )
}

function PillarBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-purple-400 text-xs">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const e = getEtiqueta(payload[0]?.value || 0)
  return (
    <div className="bg-white border border-violet-200 rounded-xl p-3 text-xs shadow-lg">
      <p className="text-purple-700 mb-0.5 font-medium">{label}</p>
      <p style={{ color: e.color }} className="font-bold">{payload[0].value} — {e.label}</p>
    </div>
  )
}

// ─── Cierre de día form ───────────────────────────────────────────────────────
function CierreDia({ date, onSave, onCancel }) {
  const [form, setForm] = useState({
    sesion: 'si', calidad: 3, nutricion: 'si', energia: 3, animo: 3, palabra: '',
  })

  const whoopData    = getWhoopForDate(date)
  const habitosScore = getHabitosScore(date)

  const handleSubmit = (e) => {
    e.preventDefault()
    const { indice, pilares } = calcularIndice(form, whoopData, habitosScore)
    const etq = getEtiqueta(indice)
    onSave({
      fecha: date,
      indice,
      etiqueta: etq.label,
      pilares,
      cierre: { energia: form.energia, animo: form.animo, palabra: form.palabra },
      whoop: whoopData ? {
        recovery: whoopData.recovery, hrv: whoopData.hrv,
        strain: whoopData.strain, sueno: whoopData.sueno,
      } : null,
      sesion: form.sesion,
    })
  }

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-5 space-y-4 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Cierre del día</h3>

      {/* Entrenamiento */}
      <div>
        <label className="text-purple-400 text-xs mb-2 block">¿Completaste tu sesión?</label>
        <div className="flex gap-2">
          {[['si', 'Sí'], ['descanso', 'Descanso'], ['no', 'No']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => setForm(p => ({ ...p, sesion: val }))}
              className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                form.sesion === val ? 'bg-violet-600/15 border-violet-500/30 text-violet-600 font-semibold' : 'bg-white border-violet-100 text-purple-400'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {form.sesion === 'si' && (
        <div>
          <label className="text-purple-400 text-xs mb-2 block">Calidad del entrenamiento</label>
          <Stars value={form.calidad} onChange={f('calidad')} />
        </div>
      )}

      {/* Nutrición */}
      <div>
        <label className="text-purple-400 text-xs mb-2 block">¿Nutrición en punto?</label>
        <div className="flex gap-2">
          {[['si', 'Sí'], ['no', 'No']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => setForm(p => ({ ...p, nutricion: val }))}
              className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                form.nutricion === val ? 'bg-violet-600/15 border-violet-500/30 text-violet-600 font-semibold' : 'bg-white border-violet-100 text-purple-400'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Subjetivo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-purple-400 text-xs mb-2 block">Energía</label>
          <Stars value={form.energia} onChange={f('energia')} max={5} />
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-2 block">Ánimo</label>
          <Stars value={form.animo} onChange={f('animo')} max={5} />
        </div>
      </div>

      <div>
        <label className="text-purple-400 text-xs mb-1 block">Una palabra para hoy</label>
        <input
          type="text" maxLength={30} value={form.palabra}
          onChange={e => setForm(p => ({ ...p, palabra: e.target.value }))}
          placeholder="Enfocada, agotada, tranquila..."
          className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
        />
      </div>

      {/* Preview score */}
      {(() => {
        const { indice } = calcularIndice(form, whoopData, habitosScore)
        const e = getEtiqueta(indice)
        return (
          <div className={`flex items-center justify-between ${e.bg} ${e.border} border rounded-xl px-4 py-2`}>
            <span className="text-xs text-purple-400">Índice estimado</span>
            <span className="font-bold text-base" style={{ color: e.color }}>{indice} — {e.label}</span>
          </div>
        )
      })()}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Cerrar día</button>
      </div>
    </form>
  )
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DiaView({ entry, inbodyEntry }) {
  const e = getEtiqueta(entry.indice)
  const { pilares, cierre, whoop } = entry

  const PILLAR_COLORS = ['#818cf8', '#34d399', '#f97316', '#a78bfa']
  const PILLAR_LABELS = ['WHOOP', 'Entrenamiento', 'Nutrición', 'Hábitos']
  const PILLAR_KEYS   = ['whoop', 'entrenamiento', 'nutricion', 'habitos']

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score card */}
      <div className={`${e.bg} ${e.border} border rounded-2xl p-5 text-center`}>
        <p style={{ color: e.color }} className="text-[64px] font-black leading-none">{entry.indice}</p>
        <p style={{ color: e.color }} className="text-base font-semibold mt-1">{e.label}</p>
        {cierre?.palabra && (
          <p className="text-purple-400 text-sm mt-1 italic">"{cierre.palabra}"</p>
        )}
      </div>

      {/* Pillars */}
      <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4 space-y-3">
        <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-1">Desglose de pilares</p>
        {PILLAR_KEYS.map((k, i) => (
          <PillarBar key={k} label={PILLAR_LABELS[i]} score={pilares[k] || 0} color={PILLAR_COLORS[i]} />
        ))}
      </div>

      {/* WHOOP */}
      {whoop && (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-3">WHOOP del día</p>
          <div className="grid grid-cols-2 gap-3">
            {whoop.recovery != null && (
              <div className="flex items-center gap-2">
                <Watch size={13} className="text-indigo-400" />
                <span className="text-purple-400 text-xs">Recovery: <span className="text-indigo-600 font-semibold">{whoop.recovery}%</span></span>
              </div>
            )}
            {whoop.hrv != null && (
              <div className="flex items-center gap-2">
                <Heart size={13} className="text-pink-400" />
                <span className="text-purple-400 text-xs">HRV: <span className="text-pink-600 font-semibold">{whoop.hrv} ms</span></span>
              </div>
            )}
            {whoop.strain != null && (
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-orange-400" />
                <span className="text-purple-400 text-xs">Strain: <span className="text-orange-600 font-semibold">{whoop.strain}</span></span>
              </div>
            )}
            {whoop.sueno != null && (
              <div className="flex items-center gap-2">
                <Moon size={13} className="text-blue-400" />
                <span className="text-purple-400 text-xs">Sueño: <span className="text-blue-600 font-semibold">{whoop.sueno}h</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* InBody if today */}
      {inbodyEntry && (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-3">InBody del día</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-purple-400">Peso: <span className="text-gray-900 font-semibold">{inbodyEntry.peso} kg</span></span>
            {inbodyEntry.grasa_pct != null && <span className="text-purple-400">Grasa: <span className="text-gray-900 font-semibold">{inbodyEntry.grasa_pct}%</span></span>}
            {inbodyEntry.musculo_kg != null && <span className="text-purple-400">Músculo: <span className="text-gray-900 font-semibold">{inbodyEntry.musculo_kg} kg</span></span>}
            {inbodyEntry.imc != null && <span className="text-purple-400">IMC: <span className="text-gray-900 font-semibold">{inbodyEntry.imc}</span></span>}
          </div>
        </div>
      )}

      {/* Señales */}
      {cierre && (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-3">Señales del día</p>
          <div className="flex gap-6">
            <div>
              <p className="text-purple-400 text-xs mb-1">Energía</p>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < cierre.energia ? 'text-amber-400 fill-amber-400' : 'text-purple-100'} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-purple-400 text-xs mb-1">Ánimo</p>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < cierre.animo ? 'text-amber-400 fill-amber-400' : 'text-purple-100'} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Week view ────────────────────────────────────────────────────────────────
function SemanaView({ historial }) {
  const [insight, setInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [insightError, setInsightError] = useState(null)

  const today = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const weekData = weekDays.map(date => {
    const entry = historial.find(e => e.fecha === date)
    const [, mm, dd] = date.split('-')
    return { fecha: `${mm}/${dd}`, indice: entry?.indice ?? null, full: entry }
  })

  const withData = weekData.filter(d => d.indice !== null)
  const avg = withData.length ? Math.round(withData.reduce((s, d) => s + d.indice, 0) / withData.length) : null
  const best = withData.length ? withData.reduce((a, b) => b.indice > a.indice ? b : a) : null

  const generateInsight = async () => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || localStorage.getItem('ella_api_key')
    if (!apiKey || !withData.length) return
    setLoadingInsight(true)
    setInsightError(null)
    try {
      const context = withData.map(d => `${d.fecha}: ${d.indice} (${d.full?.etiqueta}), pilares: WHOOP ${d.full?.pilares?.whoop}, Entreno ${d.full?.pilares?.entrenamiento}, Nutrición ${d.full?.pilares?.nutricion}, Hábitos ${d.full?.pilares?.habitos}`).join('\n')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Eres la coach de Ella, una runner en Dubai. Analiza estos 7 días de su Índice Ella y da UNA observación de patrón en 2-3 frases cortas, directas y motivadoras. Solo el texto, sin saludos.\n\n${context}`,
          }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setInsight(data.content[0].text)
      } else {
        setInsightError('No se pudo generar el insight')
      }
    } catch {
      setInsightError('Error de conexión')
    } finally {
      setLoadingInsight(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary pills */}
      <div className="flex gap-2">
        {avg !== null && (
          <div className="flex-1 bg-violet-50 rounded-2xl border border-violet-100 p-3 text-center">
            <p className="text-violet-600 font-bold text-xl">{avg}</p>
            <p className="text-purple-400 text-xs">Promedio</p>
          </div>
        )}
        {best && (
          <div className="flex-1 bg-amber-500/10 rounded-2xl border border-amber-500/20 p-3 text-center">
            <p className="text-amber-600 font-bold text-xl">{best.indice}</p>
            <p className="text-purple-400 text-xs">Mejor día</p>
          </div>
        )}
        <div className="flex-1 bg-violet-50 rounded-2xl border border-violet-100 p-3 text-center">
          <p className="text-violet-600 font-bold text-xl">{withData.length}</p>
          <p className="text-purple-400 text-xs">Días cerrados</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
        <p className="text-purple-700 text-sm font-medium mb-3">Índice — últimos 7 días</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE9F7" />
            <XAxis dataKey="fecha" tick={{ fill: '#a78bfa', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#a78bfa', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="indice" radius={[4, 4, 0, 0]}>
              {weekData.map((d, i) => (
                <Cell key={i} fill={d.indice !== null ? getEtiqueta(d.indice).color : '#EDE9F7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      <div className="bg-indigo-500/8 rounded-2xl border border-indigo-500/15 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-500" />
            <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wide">Insight semanal</p>
          </div>
          <button onClick={generateInsight} disabled={loadingInsight || !withData.length}
            className="flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-500/25 rounded-lg px-2.5 py-1 disabled:opacity-40 active:scale-95 transition-all">
            {loadingInsight ? <Loader size={11} className="animate-spin" /> : <Sparkles size={11} />}
            Generar
          </button>
        </div>
        <p className="text-indigo-700/80 text-xs leading-relaxed">
          {insightError
            ? <span className="text-rose-400">{insightError}</span>
            : insight || (withData.length ? 'Genera un análisis de tus patrones de esta semana.' : 'Cierra al menos un día para obtener insights.')}
        </p>
      </div>
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────
function MesView({ historial }) {
  const [insight, setInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [insightError, setInsightError] = useState(null)

  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()

  const monthEntries = historial.filter(e => {
    const d = new Date(e.fecha)
    return d.getFullYear() === year && d.getMonth() === month
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  const chartData = monthEntries.map(e => ({
    fecha: toMMDD(e.fecha),
    indice: e.indice,
  }))

  // Counts
  const elite   = monthEntries.filter(e => e.indice >= 85).length
  const solido  = monthEntries.filter(e => e.indice >= 70 && e.indice < 85).length
  const const_  = monthEntries.filter(e => e.indice >= 50 && e.indice < 70).length
  const recov   = monthEntries.filter(e => e.indice < 50).length

  // Longest streak (consecutive days with indice >= 70)
  let maxRacha = 0, racha = 0
  const sorted = [...monthEntries].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].indice >= 70) {
      racha++
      if (i > 0) {
        const prev = new Date(sorted[i - 1].fecha)
        const curr = new Date(sorted[i].fecha)
        const diff = (curr - prev) / 86400000
        if (diff > 1) racha = 1
      }
      maxRacha = Math.max(maxRacha, racha)
    } else {
      racha = 0
    }
  }

  // InBody this month
  const inbody = storage.get('ella_inbody', [])
  const inbodyMes = inbody.filter(m => {
    const d = new Date(m.fecha)
    return d.getFullYear() === year && d.getMonth() === month
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const firstIB = inbodyMes[0]
  const lastIB  = inbodyMes[inbodyMes.length - 1]

  const generateInsight = async () => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || localStorage.getItem('ella_api_key')
    if (!apiKey || !monthEntries.length) return
    setLoadingInsight(true)
    setInsightError(null)
    try {
      const monthName = today.toLocaleString('es-ES', { month: 'long' })
      const context = monthEntries.map(e => `${toMMDD(e.fecha)}: ${e.indice} (${e.etiqueta})`).join(', ')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 250,
          messages: [{
            role: 'user',
            content: `Eres la coach de Ella, runner en Dubai. Analiza su mes de ${monthName} completo y da 2-3 frases de observación de patrón mensual, directas y motivadoras. Solo el texto.\n\nDatos: ${context}`,
          }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setInsight(data.content[0].text)
      } else {
        setInsightError('No se pudo generar el insight')
      }
    } catch {
      setInsightError('Error de conexión')
    } finally {
      setLoadingInsight(false)
    }
  }

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Month title */}
      <p className="text-purple-400 text-xs uppercase tracking-wider">{MONTH_NAMES[month]} {year}</p>

      {/* Line chart */}
      {chartData.length > 0 ? (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-purple-700 text-sm font-medium mb-3">Evolución del mes</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE9F7" />
              <XAxis dataKey="fecha" tick={{ fill: '#a78bfa', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a78bfa', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="indice" stroke="#9333EA" strokeWidth={2}
                dot={{ fill: '#9333EA', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-purple-300 text-sm text-center py-6">No hay datos este mes aún.</p>
      )}

      {/* Day type counters */}
      {monthEntries.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { count: elite,  label: 'Élite',       color: 'text-amber-600',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
            { count: solido, label: 'Sólidos',      color: 'text-emerald-600',bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { count: const_, label: 'Construc.',    color: 'text-blue-600',   bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
            { count: recov,  label: 'Recup.',       color: 'text-gray-500',   bg: 'bg-gray-100',       border: 'border-gray-200' },
          ].map(({ count, label, color, bg, border }) => (
            <div key={label} className={`${bg} ${border} border rounded-xl p-2 text-center`}>
              <p className={`font-bold text-lg ${color}`}>{count}</p>
              <p className="text-purple-400 text-[10px] leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Racha */}
      {maxRacha > 0 && (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4 flex items-center justify-between">
          <p className="text-purple-400 text-sm">Racha más larga del mes</p>
          <p className="text-violet-600 font-bold">{maxRacha} días consecutivos</p>
        </div>
      )}

      {/* InBody evolution */}
      {inbodyMes.length >= 2 && (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-3">InBody este mes</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Peso', key: 'peso', unit: 'kg', better: 'down' },
              { label: 'Músculo', key: 'musculo_kg', unit: 'kg', better: 'up' },
              { label: 'Grasa', key: 'grasa_pct', unit: '%', better: 'down' },
            ].map(({ label, key, unit, better }) => {
              const start = firstIB[key], end = lastIB[key]
              if (!start || !end) return null
              const delta = +(end - start).toFixed(1)
              const positive = (better === 'down' && delta < 0) || (better === 'up' && delta > 0)
              return (
                <div key={key} className="text-center">
                  <p className="text-purple-400 text-[10px] mb-0.5">{label}</p>
                  <p className="text-gray-900 font-bold">{end}{unit}</p>
                  <p className={`text-[10px] font-medium ${positive ? 'text-emerald-500' : delta === 0 ? 'text-purple-300' : 'text-rose-400'}`}>
                    {delta > 0 ? '+' : ''}{delta}{unit}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="bg-indigo-500/8 rounded-2xl border border-indigo-500/15 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-500" />
            <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wide">Insight mensual</p>
          </div>
          <button onClick={generateInsight} disabled={loadingInsight || !monthEntries.length}
            className="flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-500/25 rounded-lg px-2.5 py-1 disabled:opacity-40 active:scale-95 transition-all">
            {loadingInsight ? <Loader size={11} className="animate-spin" /> : <Sparkles size={11} />}
            Generar
          </button>
        </div>
        <p className="text-indigo-700/80 text-xs leading-relaxed">
          {insightError
            ? <span className="text-rose-400">{insightError}</span>
            : insight || (monthEntries.length ? 'Genera un análisis de tu mes completo.' : 'Cierra al menos un día para obtener insights.')}
        </p>
      </div>
    </div>
  )
}

// ─── Export helper ────────────────────────────────────────────────────────────
function exportarTxt(historial) {
  const lines = ['ÍNDICE ELLA — Historial de rendimiento', '═'.repeat(40), '']
  const sorted = [...historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  sorted.forEach(e => {
    lines.push(`${e.fecha}  │  ${String(e.indice).padStart(3)} pts  │  ${e.etiqueta}`)
    if (e.pilares) {
      lines.push(`   WHOOP ${e.pilares.whoop} · Entreno ${e.pilares.entrenamiento} · Nutrición ${e.pilares.nutricion} · Hábitos ${e.pilares.habitos}`)
    }
    if (e.cierre?.palabra) lines.push(`   "${e.cierre.palabra}" — E:${e.cierre.energia}★ Á:${e.cierre.animo}★`)
    lines.push('')
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'indice-ella.txt'; a.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IndiceElla() {
  const [historial, setHistorial] = useState(() => storage.get(INDICE_KEY, []))
  const [view, setView]           = useState('dia')
  const [showCierre, setShowCierre] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { storage.set(INDICE_KEY, historial) }, [historial])

  const today = new Date().toISOString().split('T')[0]
  const todayClosed = historial.some(e => e.fecha === today)
  const selectedEntry = historial.find(e => e.fecha === selectedDate)

  const inbodyEntry = (() => {
    const inbody = storage.get('ella_inbody', [])
    return inbody.find(m => m.fecha === selectedDate) || null
  })()

  const handleSaveCierre = useCallback((entry) => {
    setHistorial(prev => {
      const filtered = prev.filter(e => e.fecha !== entry.fecha)
      return [...filtered, entry]
    })
    setShowCierre(false)
    setSelectedDate(today)
    setView('dia')
  }, [today])

  const navigateDay = (dir) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + dir)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const fmtDate = (iso) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="animate-fade-in pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Índice Ella</h2>
            <p className="text-purple-400 text-xs mt-0.5">{historial.length} días registrados</p>
          </div>
          <div className="flex gap-2">
            {historial.length > 0 && (
              <button onClick={() => exportarTxt(historial)}
                className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center active:scale-95 transition-all">
                <Download size={16} className="text-purple-700" />
              </button>
            )}
            {!todayClosed && (
              <button onClick={() => setShowCierre(true)}
                className="h-10 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold flex items-center gap-2 active:scale-95">
                <TrendingUp size={15} />
                Cerrar día
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Cierre form */}
        {showCierre && (
          <CierreDia date={today} onSave={handleSaveCierre} onCancel={() => setShowCierre(false)} />
        )}

        {/* Empty state */}
        {historial.length === 0 && !showCierre && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Trophy size={28} className="text-amber-500" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Tu historial está vacío</p>
            <p className="text-purple-400 text-sm max-w-[220px] leading-relaxed">
              Cierra tu primer día para comenzar tu historial de rendimiento.
            </p>
          </div>
        )}

        {/* View tabs + navigation */}
        {historial.length > 0 && !showCierre && (
          <>
            <div className="flex gap-1 bg-violet-50 border border-violet-100 rounded-xl p-1">
              {[['dia','Día'], ['semana','Semana'], ['mes','Mes']].map(([v, lbl]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    view === v ? 'bg-violet-600 text-white shadow-sm' : 'text-purple-400 hover:text-purple-700'
                  }`}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Day navigator (only in día view) */}
            {view === 'dia' && (
              <div className="flex items-center justify-between">
                <button onClick={() => navigateDay(-1)}
                  className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center active:scale-95">
                  <ChevronLeft size={16} className="text-purple-400" />
                </button>
                <span className="text-purple-700 text-sm font-medium">{fmtDate(selectedDate)}</span>
                <button onClick={() => navigateDay(1)} disabled={selectedDate >= today}
                  className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center active:scale-95 disabled:opacity-30">
                  <ChevronRight size={16} className="text-purple-400" />
                </button>
              </div>
            )}

            {/* Content per view */}
            {view === 'dia' && selectedEntry && (
              <DiaView entry={selectedEntry} inbodyEntry={inbodyEntry} />
            )}
            {view === 'dia' && !selectedEntry && (
              <div className="text-center py-10">
                <p className="text-purple-300 text-sm">Sin datos para {fmtDate(selectedDate)}.</p>
                {selectedDate === today && (
                  <button onClick={() => setShowCierre(true)}
                    className="mt-3 text-violet-600 text-sm border border-violet-500/30 rounded-xl px-4 py-2">
                    Cerrar hoy
                  </button>
                )}
              </div>
            )}
            {view === 'semana' && <SemanaView historial={historial} />}
            {view === 'mes'    && <MesView    historial={historial} />}
          </>
        )}
      </div>
    </div>
  )
}
