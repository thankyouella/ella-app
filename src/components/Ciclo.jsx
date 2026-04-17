import { useState, useEffect } from 'react'
import { Moon, Sun, Waves, Leaf, Plus, ChevronDown, ChevronUp, Calendar, RefreshCw } from 'lucide-react'
import { storage } from '../utils/storage'

const CICLO_KEY        = 'ella_ciclo'
const CICLO_CONFIG_KEY = 'ella_ciclo_config'

// ─── Phase calculation ────────────────────────────────────────────────────────
export function calcFaseCiclo(fechaInicio, duracionCiclo = 28, duracionPeriodo = 5) {
  if (!fechaInicio) return null
  const inicio = new Date(fechaInicio + 'T12:00:00')
  const hoy    = new Date()
  const dias   = Math.floor((hoy - inicio) / 86400000)
  if (dias < 0) return null
  const diaCiclo = (dias % duracionCiclo) + 1
  let fase
  if (diaCiclo <= duracionPeriodo) fase = 'menstruacion'
  else if (diaCiclo <= 13)         fase = 'folicular'
  else if (diaCiclo <= 16)         fase = 'ovulacion'
  else                             fase = 'lutea'
  return { fase, diaCiclo }
}

const FASES = {
  menstruacion: {
    nombre: 'Menstruación',
    dias: '1-5',
    icon: Moon,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/25',
    entrenamiento: 'Movimiento suave: yoga, caminata, natación a baja intensidad. Escucha a tu cuerpo — si hay dolor intenso, prioriza el descanso.',
    nutricion: 'Aumenta hierro (espinacas, lentejas), magnesio (chocolate negro, frutos secos) y omega-3 para reducir inflamación.',
    energia: 'Baja-media. Es normal sentirse más introvertida y con menos energía. No te fuerces.',
    tips: ['Calor local para calambres', 'Hidratación extra', 'Evitar cafeína en exceso', 'Prioriza el sueño'],
  },
  folicular: {
    nombre: 'Fase Folicular',
    dias: '6-13',
    icon: Sun,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/25',
    entrenamiento: '¡Tu momento para brillar! Estrógeno en alza = más fuerza y resistencia. Ideal para rodajes de calidad, fartlek y HIIT.',
    nutricion: 'Más carbohidratos complejos para aprovechar la energía. Proteínas para construir músculo en esta fase anabólica.',
    energia: 'Alta y creciente. Aprovecha para entrenamientos más exigentes y retos nuevos.',
    tips: ['Prueba rutas nuevas', 'Aumenta volumen de entrenamiento', 'Experimenta con ritmos más rápidos'],
  },
  ovulacion: {
    nombre: 'Ovulación',
    dias: '14-16',
    icon: Waves,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/25',
    entrenamiento: 'Pico de energía y fuerza máxima. Ideal para PR (récords personales), carreras de competición o sesiones de máxima intensidad.',
    nutricion: 'Alimentos antiinflamatorios: cúrcuma, jengibre, frutos del bosque. Mantén hidratación óptima.',
    energia: 'Máxima energía del ciclo. Confianza y motivación elevadas.',
    tips: ['Día ideal para 10K de práctica', 'Máxima coordinación neuromuscular', 'Socializa y disfruta'],
  },
  lutea: {
    nombre: 'Fase Lútea',
    dias: '17-28',
    icon: Leaf,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/25',
    entrenamiento: 'Reduce intensidad progresivamente. Buenos los entrenamientos de fuerza y rodajes largos a ritmo suave. Evita HIIT en la segunda semana lútea.',
    nutricion: 'Aumenta calcio y magnesio para síntomas premenstruales. Reduce azúcar refinada. Más proteína.',
    energia: 'Disminuye hacia el final. Escucha señales de fatiga — no son excusas, son datos.',
    tips: ['Prioriza calidad de sueño', 'Reducir cafeína en últimos días', 'Masaje y foam rolling', 'Planifica descansos'],
  },
}

const ENERGIAS_SUBJ = ['Muy baja', 'Baja', 'Normal', 'Buena', 'Excelente']
const SUENO_OPS     = ['Malo', 'Regular', 'Bueno', 'Muy bueno']

// ─── Period config card ───────────────────────────────────────────────────────
function ConfigCiclo({ config, onSave }) {
  const [form, setForm] = useState({
    fechaInicio:      config?.fechaInicio      || '',
    duracionCiclo:    config?.duracionCiclo    || 28,
    duracionPeriodo:  config?.duracionPeriodo  || 5,
  })
  const [editing, setEditing] = useState(!config?.fechaInicio)

  const calc = calcFaseCiclo(form.fechaInicio, form.duracionCiclo, form.duracionPeriodo)

  const handleSave = () => {
    onSave(form)
    setEditing(false)
    window.dispatchEvent(new Event('ella_update'))
  }

  if (editing) {
    return (
      <div className="bg-rose-500/8 rounded-2xl border border-rose-500/15 p-4 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-rose-400" />
          <p className="text-rose-600 text-xs font-semibold uppercase tracking-wide">Configurar ciclo</p>
        </div>

        <div>
          <label className="text-purple-400 text-xs mb-1 block">¿Cuándo llegó tu último período?</label>
          <input type="date" value={form.fechaInicio}
            onChange={e => setForm(p => ({ ...p, fechaInicio: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-purple-400 text-xs mb-1 block">Duración del ciclo (días)</label>
            <input type="number" min="21" max="40" value={form.duracionCiclo}
              onChange={e => setForm(p => ({ ...p, duracionCiclo: +e.target.value }))}
              className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
            />
          </div>
          <div>
            <label className="text-purple-400 text-xs mb-1 block">Duración del período (días)</label>
            <input type="number" min="2" max="10" value={form.duracionPeriodo}
              onChange={e => setForm(p => ({ ...p, duracionPeriodo: +e.target.value }))}
              className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
            />
          </div>
        </div>

        {calc && (
          <div className={`flex items-center justify-between ${FASES[calc.fase].bg} ${FASES[calc.fase].border} border rounded-xl px-3 py-2`}>
            <span className="text-xs text-purple-400">Fase calculada</span>
            <span className={`text-xs font-semibold ${FASES[calc.fase].color}`}>
              {FASES[calc.fase].nombre} · Día {calc.diaCiclo}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {config?.fechaInicio && (
            <button type="button" onClick={() => setEditing(false)}
              className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">
              Cancelar
            </button>
          )}
          <button type="button" onClick={handleSave} disabled={!form.fechaInicio}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm active:scale-95 disabled:opacity-40">
            Guardar
          </button>
        </div>
      </div>
    )
  }

  // Compact view showing current phase
  if (!calc) return null
  const fase = FASES[calc.fase]
  const Icon = fase.icon

  return (
    <div className={`${fase.bg} ${fase.border} border rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon size={16} className={fase.color} />
          <span className={`text-sm font-bold ${fase.color}`}>{fase.nombre}</span>
          <span className="text-purple-400 text-xs">· Día {calc.diaCiclo} del ciclo</span>
        </div>
        <button onClick={() => setEditing(true)}
          className="text-purple-300 hover:text-purple-500 transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>
      <p className="text-purple-400 text-xs">
        Inicio período: {new Date(form.fechaInicio + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} · Ciclo de {form.duracionCiclo} días
      </p>
    </div>
  )
}

function FaseCard({ fase, activa, onSelect }) {
  const cfg  = FASES[fase]
  const Icon = cfg.icon
  return (
    <button onClick={onSelect}
      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
        activa ? `${cfg.bg} ${cfg.border}` : 'bg-violet-50 border-violet-100 hover:border-violet-200'
      }`}>
      <Icon size={18} className={activa ? cfg.color : 'text-purple-300'} />
      <span className={`text-xs font-medium leading-tight text-center ${activa ? cfg.color : 'text-purple-400'}`}>
        {cfg.nombre.split(' ')[0]}
      </span>
    </button>
  )
}

function RegistroDiario({ onSave, onCancel, faseSugerida }) {
  const [form, setForm] = useState({
    fecha:      new Date().toISOString().split('T')[0],
    fase:       faseSugerida || 'folicular',
    diaDelCiclo: '',
    energia:    'Buena',
    sueno:      'Bueno',
    notas:      '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ id: `cl${Date.now()}`, ...form })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Registro diario</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-purple-400 text-xs mb-1 block">Fase del ciclo</label>
          <div className="flex gap-1.5">
            {Object.keys(FASES).map(f => (
              <button key={f} type="button"
                onClick={() => setForm(p => ({ ...p, fase: f }))}
                className={`flex-1 py-2 rounded-lg text-xs border transition-all ${
                  form.fase === f
                    ? `${FASES[f].bg} ${FASES[f].border} ${FASES[f].color}`
                    : 'bg-violet-50 border-violet-100 text-purple-400'
                }`}>
                {FASES[f].nombre.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Día del ciclo</label>
          <input type="number" min="1" max="35" value={form.diaDelCiclo}
            onChange={e => setForm(p => ({ ...p, diaDelCiclo: e.target.value }))}
            placeholder="Día 1-35"
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Sueño</label>
          <select value={form.sueno} onChange={e => setForm(p => ({ ...p, sueno: e.target.value }))}
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none">
            {SUENO_OPS.map(s => <option key={s} value={s} className="bg-white">{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-purple-400 text-xs mb-1 block">Energía subjetiva</label>
          <div className="flex gap-1.5">
            {ENERGIAS_SUBJ.map(e => (
              <button key={e} type="button"
                onClick={() => setForm(p => ({ ...p, energia: e }))}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${
                  form.energia === e ? 'border-violet-500/40 bg-violet-600/10 text-violet-600' : 'border-violet-100 text-purple-300 hover:border-violet-200'
                }`}>
                {e.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-purple-400 text-xs mb-1 block">Notas del día</label>
        <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
          placeholder="¿Cómo te sentiste hoy? ¿Síntomas, emociones, observaciones?"
          rows={2}
          className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Guardar</button>
      </div>
    </form>
  )
}

export default function Ciclo() {
  const [registros, setRegistros] = useState(() => storage.get(CICLO_KEY, []))
  const [cicloConfig, setCicloConfig] = useState(() => storage.get(CICLO_CONFIG_KEY, null))
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Derive active phase: prefer auto-calc, fallback to latest manual entry
  const autoCalc    = cicloConfig ? calcFaseCiclo(cicloConfig.fechaInicio, cicloConfig.duracionCiclo, cicloConfig.duracionPeriodo) : null
  const faseActiva  = autoCalc?.fase || registros[0]?.fase || 'folicular'

  useEffect(() => { storage.set(CICLO_KEY, registros) }, [registros])

  const handleSaveConfig = (cfg) => {
    storage.set(CICLO_CONFIG_KEY, cfg)
    setCicloConfig(cfg)
  }

  const handleSave = (r) => {
    setRegistros(prev => [r, ...prev])
    setShowForm(false)
  }

  const cfg  = FASES[faseActiva]
  const Icon = cfg.icon

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Ciclo</h2>
            <p className="text-purple-400 text-xs mt-0.5">Entrenamiento por fase hormonal</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95">
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Auto-calc period tracker */}
        <ConfigCiclo config={cicloConfig} onSave={handleSaveConfig} />

        {showForm && (
          <RegistroDiario
            faseSugerida={faseActiva}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Phase selector (manual override) */}
        <div>
          <p className="text-purple-400 text-xs uppercase tracking-wider mb-2">
            {autoCalc ? 'Fase calculada automáticamente' : 'Fase actual'}
          </p>
          <div className="flex gap-2">
            {Object.keys(FASES).map(f => (
              <FaseCard key={f} fase={f} activa={faseActiva === f} onSelect={() => {}} />
            ))}
          </div>
        </div>

        {/* Phase card */}
        <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
              <Icon size={20} className={cfg.color} />
            </div>
            <div>
              <p className={`font-bold text-base ${cfg.color}`}>{cfg.nombre}</p>
              <p className="text-purple-400 text-xs">
                Días {cfg.dias} del ciclo
                {autoCalc && ` · Hoy: día ${autoCalc.diaCiclo}`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-1">Entrenamiento</p>
              <p className="text-gray-900/80 text-sm leading-relaxed">{cfg.entrenamiento}</p>
            </div>
            <div className="h-px bg-violet-100" />
            <div>
              <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-1">Nutrición</p>
              <p className="text-gray-900/80 text-sm leading-relaxed">{cfg.nutricion}</p>
            </div>
            <div className="h-px bg-violet-100" />
            <div>
              <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-1">Energía esperada</p>
              <p className="text-gray-900/80 text-sm leading-relaxed">{cfg.energia}</p>
            </div>
            <div className="h-px bg-violet-100" />
            <div>
              <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide mb-2">Tips</p>
              <div className="flex flex-wrap gap-2">
                {cfg.tips.map(t => (
                  <span key={t} className={`text-xs px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual log history */}
        {registros.length > 0 && (
          <div>
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full py-2 text-purple-400 text-xs uppercase tracking-wider hover:text-purple-700">
              <span>Registros manuales ({registros.length})</span>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistory && (
              <div className="space-y-2 animate-fade-in">
                {registros.slice(0, 10).map(r => {
                  const c = FASES[r.fase]
                  return (
                    <div key={r.id} className="bg-violet-50 rounded-xl border border-violet-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${c?.color || 'text-purple-700'}`}>{c?.nombre || r.fase}</span>
                        <span className="text-purple-300 text-xs">{r.fecha} {r.diaDelCiclo && `· Día ${r.diaDelCiclo}`}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-purple-400">
                        <span>{r.energia}</span>
                        <span>Sueño: {r.sueno}</span>
                      </div>
                      {r.notas && <p className="text-purple-300 text-xs mt-1 italic">{r.notas}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
