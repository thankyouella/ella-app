import { useState, useEffect } from 'react'
import { Plus, Droplets, Apple, FileText, ChevronDown, ChevronUp, Edit3, Check, Pencil, Loader, Flame } from 'lucide-react'
import { storage } from '../utils/storage'

const HIDRA_META = 2500 // ml
const HIDRA_KEY = 'ella_hidra'
const COMIDAS_KEY = 'ella_comidas'
const INDICACIONES_KEY = 'ella_indicaciones_nutri'
const ALIMENTOS_KEY = 'ella_alimentos_fav'

const ALIMENTOS_DEFAULT = [
  'Avena con plátano', 'Huevos revueltos', 'Pollo con arroz', 'Salmón con vegetales',
  'Greek yogurt con frutos rojos', 'Batata asada', 'Ensalada niçoise', 'Smoothie de proteína',
]

const INDICACIONES_DEFAULT = `📋 Indicaciones de nutricionista:

• Priorizar carbohidratos complejos antes de sesiones de running
• Proteína en cada comida: mínimo 25-30g
• Evitar grasas pesadas 3h antes de entrenar
• Post-entreno: proteína + carbo en los primeros 30 min
• Hidratación: 2.5L base + 500ml extra por hora de ejercicio en Dubai
• Electrolitos en sesiones largas (>60 min)
• Descanso digestivo 2h antes de carrera oficial`

const ENERGIAS = ['⚡ Alta', '🙂 Normal', '😴 Baja']
const DIGESTIONES = ['😊 Perfecta', '😐 Ok', '😣 Pesada']

const GOALS_KEY = 'ella_nutri_goals'
const GOALS_DEFAULT = { calorias: 1600, proteina: 120, carbos: 150, grasas: 50 }

const MACRO_CONFIG = [
  { key: 'calorias', label: 'Calorías', unit: 'kcal', color: 'violet', bar: 'bg-violet-500', pill: 'bg-violet-100 text-violet-700' },
  { key: 'proteina', label: 'Proteína', unit: 'g', color: 'emerald', bar: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700' },
  { key: 'carbos', label: 'Carbos', unit: 'g', color: 'amber', bar: 'bg-amber-500', pill: 'bg-amber-100 text-amber-700' },
  { key: 'grasas', label: 'Grasas', unit: 'g', color: 'rose', bar: 'bg-rose-500', pill: 'bg-rose-100 text-rose-700' },
]

// ─── Macro estimation via Claude Haiku ───────────────────────────────────────
async function estimarMacros(nombre, descripcion) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || localStorage.getItem('ella_api_key')
  if (!apiKey) return null

  const prompt = `Estima los macronutrientes aproximados de esta comida.
Comida: ${nombre}${descripcion ? ` — ${descripcion}` : ''}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra:
{"calorias":número,"proteina":número,"carbos":número,"grasas":número}

Valores en enteros. Proteína, carbos y grasas en gramos. Calorías en kcal.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data.content[0].text.trim()
    // Extract JSON even if there's surrounding text
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function MetasNutri({ goals, onSave }) {
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(goals)

  const handleEdit = (e) => {
    e.stopPropagation()
    setDraft(goals)
    setEditing(true)
    setCollapsed(false)
  }

  const handleSave = () => {
    const parsed = {}
    for (const m of MACRO_CONFIG) {
      parsed[m.key] = Math.max(0, parseInt(draft[m.key]) || 0)
    }
    onSave(parsed)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(goals)
    setEditing(false)
  }

  return (
    <div className="bg-violet-50 rounded-2xl border border-violet-100">
      {/* Header */}
      <button
        onClick={() => { if (!editing) setCollapsed(c => !c) }}
        className="flex items-center justify-between w-full p-4"
      >
        <span className="text-purple-700 text-sm font-medium">Objetivos nutricionales</span>
        <div className="flex items-center gap-2">
          <span
            role="button"
            onClick={handleEdit}
            className="text-purple-300 hover:text-violet-600 transition-colors"
          >
            <Pencil size={14} />
          </span>
          {collapsed
            ? <ChevronDown size={14} className="text-purple-300" />
            : <ChevronUp size={14} className="text-purple-300" />
          }
        </div>
      </button>

      {collapsed ? (
        /* Collapsed: 4 pills en una fila */
        <div className="flex gap-2 px-4 pb-4 flex-wrap">
          {MACRO_CONFIG.map(m => (
            <span key={m.key} className={`text-xs font-medium px-2.5 py-1 rounded-full ${m.pill}`}>
              {m.label === 'Calorías' ? goals[m.key] + ' kcal' : goals[m.key] + 'g ' + m.label.toLowerCase()}
            </span>
          ))}
        </div>
      ) : editing ? (
        /* Editing: 4 inputs numéricos */
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {MACRO_CONFIG.map(m => (
              <div key={m.key}>
                <label className="text-purple-400 text-xs mb-1 block">{m.label} ({m.unit})</label>
                <input
                  type="number"
                  min="0"
                  value={draft[m.key]}
                  onChange={e => setDraft(d => ({ ...d, [m.key]: e.target.value }))}
                  className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel} className="flex-1 py-2 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Guardar</button>
          </div>
        </div>
      ) : (
        /* Expanded: objetivos en grid */
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {MACRO_CONFIG.map(m => (
              <div key={m.key} className={`rounded-xl px-3 py-2.5 ${m.pill}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.label}</p>
                <p className="text-base font-bold">{goals[m.key]} <span className="text-xs font-normal">{m.unit}</span></p>
              </div>
            ))}
          </div>
          <p className="text-purple-300 text-[10px] text-center mt-2">Toca el lápiz para editar tus objetivos</p>
        </div>
      )}
    </div>
  )
}

function HidraTracker({ ml, onAdd }) {
  const pct = Math.min((ml / HIDRA_META) * 100, 100)
  const vasos = Math.round(ml / 250)

  return (
    <div className="bg-violet-50 rounded-2xl border border-blue-500/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-blue-400" />
          <p className="text-purple-700 text-sm font-medium">Hidratación</p>
        </div>
        <span className="text-blue-400 font-bold text-sm">{(ml / 1000).toFixed(1)}L / {HIDRA_META / 1000}L</span>
      </div>

      {/* Visual vasos */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`w-7 h-8 rounded-lg border-2 transition-all ${
            i < vasos ? 'bg-blue-500/40 border-blue-400' : 'bg-violet-50 border-violet-200'
          }`} />
        ))}
      </div>

      <div className="h-2 bg-violet-100/60 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-2">
        {[250, 500, 750].map(v => (
          <button key={v} onClick={() => onAdd(v)}
            className="flex-1 py-2 rounded-xl border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/10 transition-all active:scale-95">
            +{v}ml
          </button>
        ))}
      </div>
      {ml >= HIDRA_META && (
        <p className="text-emerald-400 text-xs text-center mt-2">¡Meta de hidratación alcanzada! 💧</p>
      )}
    </div>
  )
}

// ─── Daily macro totals card ──────────────────────────────────────────────────
function MacrosTotalesCard({ comidas, goals }) {
  const hasMacros = comidas.some(c => c.macros)
  if (!hasMacros) return null

  const totales = comidas.reduce((acc, c) => {
    if (!c.macros) return acc
    return {
      calorias: acc.calorias + (c.macros.calorias || 0),
      proteina: acc.proteina + (c.macros.proteina || 0),
      carbos:   acc.carbos   + (c.macros.carbos   || 0),
      grasas:   acc.grasas   + (c.macros.grasas   || 0),
    }
  }, { calorias: 0, proteina: 0, carbos: 0, grasas: 0 })

  return (
    <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/5 rounded-2xl border border-violet-500/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={15} className="text-violet-500" />
        <p className="text-purple-700 text-sm font-semibold">Total consumido hoy</p>
        <span className="text-purple-300 text-[10px]">estimado por IA</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MACRO_CONFIG.map(m => {
          const val = totales[m.key]
          const goal = goals[m.key]
          const pct = goal > 0 ? Math.min(Math.round((val / goal) * 100), 100) : 0
          return (
            <div key={m.key} className="text-center">
              <p className="text-[10px] text-purple-400 uppercase tracking-wide mb-0.5">{m.label}</p>
              <p className="text-gray-900 font-bold text-sm">{val}</p>
              <p className="text-purple-300 text-[10px]">{m.unit}</p>
              <div className="h-1 bg-violet-100 rounded-full mt-1 overflow-hidden">
                <div className={`h-full ${m.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-purple-300 text-[10px] mt-0.5">{pct}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Meal card ────────────────────────────────────────────────────────────────
function ComidaCard({ comida }) {
  return (
    <div className="bg-violet-50 rounded-xl border border-violet-100 p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-gray-900 text-sm font-medium">{comida.nombre}</p>
        <span className="text-purple-300 text-xs flex-shrink-0">{comida.hora}</span>
      </div>
      {comida.descripcion && <p className="text-purple-400 text-xs mb-2">{comida.descripcion}</p>}

      {/* Macros estimados */}
      {comida.macros && (
        <div className="flex gap-2 flex-wrap mb-2">
          <span className="text-[10px] bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium">
            🔥 {comida.macros.calorias} kcal
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-medium">
            P {comida.macros.proteina}g
          </span>
          <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
            C {comida.macros.carbos}g
          </span>
          <span className="text-[10px] bg-rose-100 text-rose-700 rounded-full px-2 py-0.5 font-medium">
            G {comida.macros.grasas}g
          </span>
        </div>
      )}
      {comida.estimandoMacros && (
        <div className="flex items-center gap-1.5 mb-2">
          <Loader size={10} className="text-violet-400 animate-spin" />
          <span className="text-[10px] text-purple-300">Estimando macros...</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {comida.energia && <span className="text-xs text-purple-400">{comida.energia}</span>}
        {comida.digestion && <span className="text-xs text-purple-400">· {comida.digestion}</span>}
        {comida.notas && <span className="text-xs text-purple-300 italic">· {comida.notas}</span>}
      </div>
    </div>
  )
}

function NuevaComidaForm({ onSave, onCancel, alimentosFav }) {
  const [form, setForm] = useState({
    nombre: '',
    hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    descripcion: '',
    energia: '🙂 Normal',
    digestion: '😊 Perfecta',
    notas: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    onSave({ id: `c${Date.now()}`, fecha: new Date().toISOString().split('T')[0], ...form })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Registrar comida</h3>

      <div>
        <label className="text-purple-400 text-xs mb-1 block">¿Qué comiste?</label>
        <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Avena con plátano y almendras"
          className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          required
        />
        {/* Alimentos favoritos */}
        <div className="flex gap-1.5 flex-wrap mt-2">
          {alimentosFav.slice(0, 4).map(a => (
            <button key={a} type="button" onClick={() => setForm(f => ({ ...f, nombre: a }))}
              className="text-xs text-purple-400 border border-violet-200 rounded-lg px-2 py-0.5 hover:border-violet-200 hover:text-purple-700">
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Hora</label>
          <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Descripción breve</label>
          <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Detalle opcional"
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Energía después</label>
          <select value={form.energia} onChange={e => setForm(f => ({ ...f, energia: e.target.value }))}
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none">
            {ENERGIAS.map(e => <option key={e} value={e} className="bg-white">{e}</option>)}
          </select>
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Digestión</label>
          <select value={form.digestion} onChange={e => setForm(f => ({ ...f, digestion: e.target.value }))}
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none">
            {DIGESTIONES.map(d => <option key={d} value={d} className="bg-white">{d}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Guardar</button>
      </div>
    </form>
  )
}

export default function Nutricion() {
  const today = new Date().toISOString().split('T')[0]
  const hidraKey = `${HIDRA_KEY}_${today}`

  const [hidra, setHidra] = useState(() => storage.get(hidraKey, 0))
  const [goals, setGoals] = useState(() => storage.get(GOALS_KEY, GOALS_DEFAULT))
  const [comidas, setComidas] = useState(() => storage.get(COMIDAS_KEY, []))
  const [indicaciones, setIndicaciones] = useState(() => storage.get(INDICACIONES_KEY, INDICACIONES_DEFAULT))
  const [alimentosFav] = useState(() => storage.get(ALIMENTOS_KEY, ALIMENTOS_DEFAULT))
  const [showForm, setShowForm] = useState(false)
  const [showIndicaciones, setShowIndicaciones] = useState(false)
  const [editingIndicaciones, setEditingIndicaciones] = useState(false)
  const [tempIndicaciones, setTempIndicaciones] = useState(indicaciones)

  useEffect(() => { storage.set(hidraKey, hidra) }, [hidra, hidraKey])
  useEffect(() => { storage.set(GOALS_KEY, goals) }, [goals])
  useEffect(() => { storage.set(COMIDAS_KEY, comidas) }, [comidas])
  useEffect(() => { storage.set(INDICACIONES_KEY, indicaciones) }, [indicaciones])

  const comidasHoy = comidas.filter(c => c.fecha === today)

  const handleAddHidra = (ml) => {
    setHidra(prev => prev + ml)
    window.dispatchEvent(new Event('ella_update'))
  }

  const handleSaveComida = async (c) => {
    // Add meal immediately with estimandoMacros flag
    const comidaConFlag = { ...c, estimandoMacros: true }
    setComidas(prev => [comidaConFlag, ...prev])
    setShowForm(false)

    // Async macro estimation
    const macros = await estimarMacros(c.nombre, c.descripcion)

    // Update the specific meal with macros (or remove flag if estimation failed)
    setComidas(prev => {
      const updated = prev.map(m =>
        m.id === c.id
          ? { ...m, macros: macros || undefined, estimandoMacros: false }
          : m
      )
      storage.set(COMIDAS_KEY, updated)
      window.dispatchEvent(new Event('ella_update'))
      return updated
    })
  }

  const handleSaveIndicaciones = () => {
    setIndicaciones(tempIndicaciones)
    setEditingIndicaciones(false)
  }

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Nutrición</h2>
            <p className="text-purple-400 text-xs mt-0.5">{comidasHoy.length} comidas hoy</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95">
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {showForm && (
          <NuevaComidaForm
            onSave={handleSaveComida}
            onCancel={() => setShowForm(false)}
            alimentosFav={alimentosFav}
          />
        )}

        {/* Hidratación */}
        <HidraTracker ml={hidra} onAdd={handleAddHidra} />

        {/* Objetivos nutricionales */}
        <MetasNutri goals={goals} onSave={setGoals} />

        {/* Comidas de hoy */}
        <div>
          <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">Comidas de hoy</p>

          {/* Macro totales del día */}
          {comidasHoy.length > 0 && (
            <div className="mb-3">
              <MacrosTotalesCard comidas={comidasHoy} goals={goals} />
            </div>
          )}

          {comidasHoy.length === 0 ? (
            <div className="text-center py-6">
              <Apple size={28} className="text-purple-300 mx-auto mb-2" />
              <p className="text-purple-300 text-sm">Sin registros hoy</p>
              <button onClick={() => setShowForm(true)} className="text-violet-600 text-xs mt-1">Agregar comida</button>
            </div>
          ) : (
            <div className="space-y-2">
              {comidasHoy.map(c => <ComidaCard key={c.id} comida={c} />)}
            </div>
          )}
        </div>

        {/* Indicaciones nutricionista */}
        <div className="bg-violet-50 rounded-2xl border border-violet-100">
          <button onClick={() => setShowIndicaciones(!showIndicaciones)}
            className="flex items-center justify-between w-full p-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-violet-600" />
              <span className="text-purple-700 text-sm font-medium">Indicaciones nutricionista</span>
            </div>
            <div className="flex items-center gap-2">
              {showIndicaciones && (
                <button onClick={e => { e.stopPropagation(); setEditingIndicaciones(true); setTempIndicaciones(indicaciones) }}
                  className="text-purple-300 hover:text-violet-600 transition-colors">
                  <Edit3 size={14} />
                </button>
              )}
              {showIndicaciones ? <ChevronUp size={14} className="text-purple-300" /> : <ChevronDown size={14} className="text-purple-300" />}
            </div>
          </button>
          {showIndicaciones && (
            <div className="px-4 pb-4">
              {editingIndicaciones ? (
                <div>
                  <textarea
                    value={tempIndicaciones}
                    onChange={e => setTempIndicaciones(e.target.value)}
                    rows={10}
                    className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900/80 text-sm focus:outline-none focus:border-violet-500/40 resize-none leading-relaxed"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditingIndicaciones(false)} className="flex-1 py-2 rounded-xl border border-violet-200 text-purple-400 text-xs">Cancelar</button>
                    <button onClick={handleSaveIndicaciones} className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-semibold text-xs">Guardar</button>
                  </div>
                </div>
              ) : (
                <p className="text-purple-700 text-sm whitespace-pre-wrap leading-relaxed">{indicaciones}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
