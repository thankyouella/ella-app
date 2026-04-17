import { useState, useEffect } from 'react'
import { Play, CheckCircle, Circle, Plus, Clock, Zap, ChevronDown, ChevronUp, Flag, Pencil, Check, X } from 'lucide-react'
import { storage, KEYS, INITIAL_DATA } from '../utils/storage'

export const RUNNING_PLAN_KEY = 'ella_running_plan'

const PLAN_SEMANAL_DEFAULT = [
  { dia: 'Lunes',    tipo: 'Descanso activo',   descripcion: 'Caminata suave o yoga',                completado: false, color: 'bg-emerald-500/20 text-emerald-400' },
  { dia: 'Martes',   tipo: 'Rodaje fácil',       descripcion: '5-6 km a ritmo conversacional',        completado: false, color: 'bg-blue-500/20 text-blue-400' },
  { dia: 'Miércoles',tipo: 'Fuerza + Core',      descripcion: 'Entrenamiento complementario',         completado: false, color: 'bg-orange-500/20 text-orange-400' },
  { dia: 'Jueves',   tipo: 'Rodaje con tempo',   descripcion: '6-7 km con secciones a ritmo carrera', completado: false, color: 'bg-purple-500/20 text-purple-400' },
  { dia: 'Viernes',  tipo: 'Descanso',           descripcion: 'Recuperación total',                   completado: false, color: 'bg-violet-100/60 text-purple-400' },
  { dia: 'Sábado',   tipo: 'Tirada larga',       descripcion: '8-10 km a ritmo suave',                completado: false, color: 'bg-violet-600/20 text-violet-600' },
  { dia: 'Domingo',  tipo: 'Recuperación',       descripcion: 'Caminata, movilidad, stretching',      completado: false, color: 'bg-indigo-500/20 text-indigo-400' },
]

const CARRERAS_OFICIALES = [
  { nombre: '10K Dubai',            fecha: '2026-04-19', distancia: '10K', estado: 'próxima',  inscrita: true },
  { nombre: 'Half Marathon Dubai',  fecha: '2027-01-15', distancia: '21K', estado: 'objetivo', inscrita: false },
]

const SENSACIONES = ['Muy duro', 'Duro', 'Moderado', 'Bien', 'Volando']

// ─── Inline editor for a plan session ────────────────────────────────────────
function PlanCard({ sesion, onToggle, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ tipo: sesion.tipo, descripcion: sesion.descripcion })

  const handleSave = () => {
    onEdit({ ...sesion, tipo: draft.tipo, descripcion: draft.descripcion })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-violet-50 border border-violet-300/40 rounded-xl p-3 space-y-2 animate-fade-in">
        <div className="flex items-center justify-between">
          <span className="text-purple-400 text-xs font-medium">{sesion.dia}</span>
          <div className="flex gap-1.5">
            <button onClick={handleSave}
              className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center active:scale-95">
              <Check size={13} className="text-white" />
            </button>
            <button onClick={() => setEditing(false)}
              className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center active:scale-95">
              <X size={13} className="text-purple-400" />
            </button>
          </div>
        </div>
        <input
          value={draft.tipo}
          onChange={e => setDraft(d => ({ ...d, tipo: e.target.value }))}
          placeholder="Tipo de sesión"
          className="w-full bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:outline-none focus:border-violet-500/40"
        />
        <input
          value={draft.descripcion}
          onChange={e => setDraft(d => ({ ...d, descripcion: e.target.value }))}
          placeholder="Descripción"
          className="w-full bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:outline-none focus:border-violet-500/40"
        />
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
      sesion.completado ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-violet-50 border-violet-100'
    }`}>
      <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
        {sesion.completado
          ? <CheckCircle size={18} className="text-emerald-400" />
          : <Circle size={18} className="text-purple-300" />}
      </button>
      <button onClick={onToggle} className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-purple-400 text-xs font-medium">{sesion.dia}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${sesion.color}`}>{sesion.tipo}</span>
        </div>
        <p className="text-purple-700 text-xs mt-0.5">{sesion.descripcion}</p>
      </button>
      <button onClick={() => { setDraft({ tipo: sesion.tipo, descripcion: sesion.descripcion }); setEditing(true) }}
        className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-violet-100 flex items-center justify-center transition-colors">
        <Pencil size={12} className="text-purple-300 hover:text-purple-500" />
      </button>
    </div>
  )
}

function RegistroForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    distancia: '', tiempo: '', ritmo: '', sensacion: 'Bien', notas: '',
  })

  const calcRitmo = (dist, tiempo) => {
    if (!dist || !tiempo) return ''
    const [h = 0, m = 0, s = 0] = tiempo.split(':').map(Number)
    const totalMin = h * 60 + m + s / 60
    const km = parseFloat(dist)
    if (km <= 0) return ''
    const ritmoMin = totalMin / km
    const rMin = Math.floor(ritmoMin)
    const rSec = Math.round((ritmoMin - rMin) * 60)
    return `${rMin}:${String(rSec).padStart(2, '0')} min/km`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.distancia || !form.tiempo) return
    onSave({ id: `r${Date.now()}`, ...form })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Registrar carrera</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Distancia (km)</label>
          <input type="number" step="0.1" value={form.distancia}
            onChange={e => setForm(f => ({ ...f, distancia: e.target.value, ritmo: calcRitmo(e.target.value, f.tiempo) }))}
            placeholder="8.5" required
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Tiempo (hh:mm:ss)</label>
          <input type="text" value={form.tiempo}
            onChange={e => setForm(f => ({ ...f, tiempo: e.target.value, ritmo: calcRitmo(f.distancia, e.target.value) }))}
            placeholder="0:52:30" required
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
      </div>
      {form.ritmo && (
        <div className="bg-violet-600/10 rounded-xl p-2 text-center">
          <span className="text-violet-600 text-sm font-semibold">Ritmo: {form.ritmo}</span>
        </div>
      )}
      <div>
        <label className="text-purple-400 text-xs mb-1 block">Sensación</label>
        <div className="flex gap-1.5 flex-wrap">
          {SENSACIONES.map(s => (
            <button key={s} type="button" onClick={() => setForm(f => ({ ...f, sensacion: s }))}
              className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                form.sensacion === s ? 'border-violet-500/50 bg-violet-600/10 text-violet-600' : 'border-violet-200 text-purple-400'
              }`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-purple-400 text-xs mb-1 block">Notas</label>
        <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
          placeholder="¿Cómo te sentiste?" rows={2}
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

export default function RunningCoach() {
  const [plan, setPlan] = useState(() => storage.get(RUNNING_PLAN_KEY, PLAN_SEMANAL_DEFAULT))
  const [registros, setRegistros] = useState(() => storage.get('ella_runs', []))
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => { storage.set(RUNNING_PLAN_KEY, plan) }, [plan])
  useEffect(() => { storage.set('ella_runs', registros) }, [registros])

  // Listen for coach updates from ChatIA
  useEffect(() => {
    const h = () => {
      const updated = storage.get(RUNNING_PLAN_KEY)
      if (updated) setPlan(updated)
    }
    window.addEventListener('ella_update', h)
    return () => window.removeEventListener('ella_update', h)
  }, [])

  const completadas = plan.filter(s => s.completado).length
  const progSemana = Math.round((completadas / plan.length) * 100)
  const totalKm = registros.reduce((a, r) => a + parseFloat(r.distancia || 0), 0)
  const user = storage.get(KEYS.USER, INITIAL_DATA.user)
  const raceDateStr = user.fecha_carrera || '2026-04-19'
  const raceDate = new Date(raceDateStr + 'T07:00:00')
  const daysToRace = Math.max(0, Math.ceil((raceDate - new Date()) / 86400000))

  const handleToggle = (i) => {
    setPlan(prev => prev.map((s, idx) => idx === i ? { ...s, completado: !s.completado } : s))
  }

  const handleEdit = (i, updated) => {
    setPlan(prev => prev.map((s, idx) => idx === i ? updated : s))
  }

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Running Coach</h2>
            <p className="text-purple-400 text-xs mt-0.5">{totalKm.toFixed(1)} km totales registrados</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95">
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {showForm && <RegistroForm onSave={(run) => { setRegistros(prev => [run, ...prev]); setShowForm(false) }} onCancel={() => setShowForm(false)} />}

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
            <p className="text-violet-600 font-bold text-lg">{registros.length}</p>
            <p className="text-purple-400 text-xs">Carreras</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
            <p className="text-violet-600 font-bold text-lg">{totalKm.toFixed(0)}</p>
            <p className="text-purple-400 text-xs">Km totales</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
            <p className="text-violet-600 font-bold text-lg">{daysToRace}</p>
            <p className="text-purple-400 text-xs">Días al 10K</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-purple-400 text-xs uppercase tracking-wider">Plan esta semana</p>
            <span className="text-violet-600 text-xs font-semibold">{completadas}/{plan.length} sesiones</span>
          </div>
          <div className="h-1.5 bg-violet-100/60 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-violet-600 rounded-full transition-all duration-700"
              style={{ width: `${progSemana}%` }} />
          </div>
          <div className="space-y-2">
            {plan.map((s, i) => (
              <PlanCard key={s.dia} sesion={s}
                onToggle={() => handleToggle(i)}
                onEdit={(updated) => handleEdit(i, updated)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">Calendario de carreras</p>
          <div className="space-y-2">
            {CARRERAS_OFICIALES.map(c => (
              <div key={c.nombre} className={`bg-violet-50 rounded-2xl border p-4 ${c.estado === 'próxima' ? 'border-violet-500/30' : 'border-violet-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flag size={14} className={c.estado === 'próxima' ? 'text-violet-600' : 'text-purple-300'} />
                      <span className={`text-xs font-semibold ${c.estado === 'próxima' ? 'text-violet-600' : 'text-purple-300'}`}>
                        {c.estado === 'próxima' ? 'PRÓXIMA' : 'OBJETIVO'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm">{c.nombre}</p>
                    <p className="text-purple-400 text-xs mt-0.5">
                      {new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 font-bold text-lg">{c.distancia}</span>
                    {c.inscrita && <p className="text-emerald-400 text-xs mt-0.5">Inscrita ✓</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {registros.length === 0 && !showForm && (
          <div className="text-center py-8">
            <Flag size={32} className="text-purple-300 mx-auto mb-2" />
            <p className="text-purple-400 text-sm font-medium">Sin carreras registradas</p>
            <p className="text-purple-300 text-xs mt-1">Registra tu primera salida con el botón +</p>
          </div>
        )}

        {registros.length > 0 && (
          <div>
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full py-2 text-purple-400 text-xs uppercase tracking-wider hover:text-purple-700">
              <span>Historial ({registros.length})</span>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistory && (
              <div className="space-y-2 animate-fade-in">
                {registros.map(r => (
                  <div key={r.id} className="bg-violet-50 rounded-xl border border-violet-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-900 font-semibold text-sm">{r.distancia} km</span>
                      <span className="text-purple-400 text-xs">{r.fecha}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-purple-400">
                      <span><Clock size={10} className="inline mr-1" />{r.tiempo}</span>
                      {r.ritmo && <span><Zap size={10} className="inline mr-1" />{r.ritmo}</span>}
                      <span>{r.sensacion}</span>
                    </div>
                    {r.notas && <p className="text-purple-300 text-xs mt-1">{r.notas}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
