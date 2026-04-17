import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Dumbbell, ChevronDown, ChevronUp, RotateCcw, Pencil, Check, X, PlusCircle, Trash2, Plus } from 'lucide-react'
import { storage } from '../utils/storage'

export const STRENGTH_PLAN_KEY = 'ella_strength_plan'

const TIPOS_PRESET = ['Core', 'Superior', 'Glúteos', 'Inferior', 'Movilidad', 'Full Body']
const DIAS_SEMANA  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const RUTINAS_DEFAULT = {
  Core: {
    nombre: 'Core',
    tipo: 'Core',
    dia: 'Miércoles',
    ejercicios: [
      { nombre: 'Plancha frontal',  series: '3x45s',         descripcion: 'Core activado, respiración controlada' },
      { nombre: 'Plancha lateral',  series: '3x30s/lado',    descripcion: 'Cadera alineada, no dejar caer' },
      { nombre: 'Dead bug',         series: '3x10 reps',     descripcion: 'Espalda baja pegada al suelo' },
      { nombre: 'Bird dog',         series: '3x12 reps',     descripcion: 'Extensión brazo y pierna opuestos' },
      { nombre: 'Hollow body hold', series: '3x20s',         descripcion: 'Lumbar plana, piernas juntas' },
      { nombre: 'Russian twist',    series: '3x20 reps',     descripcion: 'Con peso si es posible' },
    ],
  },
  Glúteos: {
    nombre: 'Glúteos',
    tipo: 'Glúteos',
    dia: 'Martes',
    ejercicios: [
      { nombre: 'Hip thrust',          series: '4x12 reps',      descripcion: 'Apoyo en banco, peso en cadera' },
      { nombre: 'Sentadilla búlgara',  series: '3x10/pierna',    descripcion: 'Pie trasero elevado, torso erguido' },
      { nombre: 'Romanian deadlift',   series: '3x12 reps',      descripcion: 'Bisagra de cadera, espalda neutra' },
      { nombre: 'Clamshell',           series: '3x20 reps/lado', descripcion: 'Banda de resistencia, core activado' },
      { nombre: 'Donkey kick',         series: '3x15/lado',      descripcion: 'Cuadrupedia, empuje hacia atrás y arriba' },
      { nombre: 'Sentadilla sumo',     series: '3x15 reps',      descripcion: 'Pies más abiertos, punta hacia afuera' },
    ],
  },
  Estabilidad: {
    nombre: 'Estabilidad',
    tipo: 'Inferior',
    dia: 'Jueves',
    ejercicios: [
      { nombre: 'Step up con rodilla',  series: '3x10/pierna',  descripcion: 'Banco bajo, control en bajada' },
      { nombre: 'Zancada lateral',      series: '3x12/lado',    descripcion: 'Pie fijo, empuje lateral' },
      { nombre: 'Single leg deadlift',  series: '3x8/pierna',   descripcion: 'Equilibrio y control lumbar' },
      { nombre: 'Puente de glúteos',    series: '3x15 reps',    descripcion: 'Pies al ancho de caderas, squeeze arriba' },
      { nombre: 'Camina con banda',     series: '3x15 pasos',   descripcion: 'Banda en tobillos, lateral y frontal' },
      { nombre: 'Equilibrio monopodal', series: '3x30s/pierna', descripcion: 'Ojos cerrados si es fácil' },
    ],
  },
}

// ─── New rutina form ──────────────────────────────────────────────────────────
function NuevaRutinaForm({ onSave, onCancel, initial }) {
  const [nombre,    setNombre]    = useState(initial?.nombre    || '')
  const [tipo,      setTipo]      = useState(initial?.tipo      || 'Core')
  const [tipoCustom,setTipoCustom]= useState('')
  const [dia,       setDia]       = useState(initial?.dia       || 'Lunes')
  const [ejercicios,setEjercicios]= useState(initial?.ejercicios || [{ nombre: '', series: '', descripcion: '' }])

  const tipoFinal = tipo === '__custom__' ? tipoCustom : tipo

  const addEj = () => setEjercicios(p => [...p, { nombre: '', series: '', descripcion: '' }])
  const removeEj = (i) => setEjercicios(p => p.filter((_, idx) => idx !== i))
  const setEj = (i, k, v) => setEjercicios(p => p.map((e, idx) => idx === i ? { ...e, [k]: v } : e))

  const handleSave = () => {
    if (!nombre.trim()) return
    const filled = ejercicios.filter(e => e.nombre.trim())
    onSave({ nombre: nombre.trim(), tipo: tipoFinal, dia, ejercicios: filled })
  }

  return (
    <div className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-4 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">
        {initial ? 'Editar rutina' : 'Nueva rutina'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-purple-400 text-xs mb-1 block">Nombre de la rutina</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Pierna + Core"
            className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none">
            {TIPOS_PRESET.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">+ Agregar tipo nuevo</option>
          </select>
          {tipo === '__custom__' && (
            <input value={tipoCustom} onChange={e => setTipoCustom(e.target.value)}
              placeholder="Nombre del tipo..."
              className="mt-1.5 w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500/40"
            />
          )}
        </div>
        <div>
          <label className="text-purple-400 text-xs mb-1 block">Día asignado</label>
          <select value={dia} onChange={e => setDia(e.target.value)}
            className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none">
            {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Exercises */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-purple-400 text-xs uppercase tracking-wider">Ejercicios</label>
          <button type="button" onClick={addEj}
            className="flex items-center gap-1 text-violet-600 text-xs border border-violet-500/20 rounded-lg px-2 py-1 active:scale-95">
            <Plus size={11} />Añadir
          </button>
        </div>
        <div className="space-y-2">
          {ejercicios.map((ej, i) => (
            <div key={i} className="bg-white border border-violet-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-xs font-mono w-5 flex-shrink-0">{i + 1}.</span>
                <input value={ej.nombre} onChange={e => setEj(i, 'nombre', e.target.value)}
                  placeholder="Nombre del ejercicio"
                  className="flex-1 bg-transparent border-b border-violet-100 pb-0.5 text-gray-900 text-xs focus:outline-none focus:border-violet-400"
                />
                {ejercicios.length > 1 && (
                  <button onClick={() => removeEj(i)} className="text-rose-300 hover:text-rose-500 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pl-7">
                <input value={ej.series} onChange={e => setEj(i, 'series', e.target.value)}
                  placeholder="Series (ej: 3x12)"
                  className="bg-violet-50 border border-violet-100 rounded-lg px-2 py-1 text-gray-900 text-xs focus:outline-none"
                />
                <input value={ej.descripcion} onChange={e => setEj(i, 'descripcion', e.target.value)}
                  placeholder="Notas / cues"
                  className="bg-violet-50 border border-violet-100 rounded-lg px-2 py-1 text-gray-900 text-xs focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button onClick={handleSave} disabled={!nombre.trim()}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95 disabled:opacity-40">
          Guardar
        </button>
      </div>
    </div>
  )
}

// ─── Editable exercise row ────────────────────────────────────────────────────
function EjercicioRow({ ej, done, onToggle, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ nombre: ej.nombre, series: ej.series, descripcion: ej.descripcion })

  const handleSave = () => { onEdit({ ...ej, ...draft }); setEditing(false) }

  if (editing) {
    return (
      <div className="bg-violet-50 border border-violet-300/40 rounded-xl p-3 space-y-2 animate-fade-in">
        <div className="flex gap-1.5 justify-end">
          <button onClick={handleSave}
            className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center active:scale-95">
            <Check size={13} className="text-white" />
          </button>
          <button onClick={() => setEditing(false)}
            className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center active:scale-95">
            <X size={13} className="text-purple-400" />
          </button>
        </div>
        <input value={draft.nombre} onChange={e => setDraft(d => ({ ...d, nombre: e.target.value }))}
          className="w-full bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:outline-none" />
        <input value={draft.series} onChange={e => setDraft(d => ({ ...d, series: e.target.value }))}
          placeholder="Series"
          className="w-full bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:outline-none" />
        <input value={draft.descripcion} onChange={e => setDraft(d => ({ ...d, descripcion: e.target.value }))}
          placeholder="Notas"
          className="w-full bg-white border border-violet-200 rounded-lg px-3 py-1.5 text-gray-900 text-xs focus:outline-none" />
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
      done ? 'bg-emerald-500/5 border-emerald-500/15 opacity-60' : 'bg-violet-50 border-violet-100'
    }`}>
      <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
        {done ? <CheckCircle size={17} className="text-emerald-400" /> : <Circle size={17} className="text-purple-300" />}
      </button>
      <button onClick={onToggle} className="flex-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-medium ${done ? 'line-through text-purple-400' : 'text-gray-900'}`}>{ej.nombre}</span>
          <span className="text-violet-600 text-xs font-semibold flex-shrink-0">{ej.series}</span>
        </div>
        <p className="text-purple-400 text-xs mt-0.5">{ej.descripcion}</p>
      </button>
      <button onClick={() => { setDraft({ nombre: ej.nombre, series: ej.series, descripcion: ej.descripcion }); setEditing(true) }}
        className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-violet-100 flex items-center justify-center transition-colors">
        <Pencil size={12} className="text-purple-300 hover:text-purple-500" />
      </button>
    </div>
  )
}

export default function Fuerza() {
  const today       = new Date().toISOString().split('T')[0]
  const sessionKey  = `ella_fuerza_${today}`
  const historialKey = 'ella_fuerza_historial'

  const [rutinas, setRutinas] = useState(() => storage.get(STRENGTH_PLAN_KEY, RUTINAS_DEFAULT))
  const [rutinaActiva, setRutinaActiva] = useState(() => Object.keys(storage.get(STRENGTH_PLAN_KEY, RUTINAS_DEFAULT))[1] || 'Glúteos')
  const [checklist, setChecklist] = useState(() => storage.get(sessionKey, {}))
  const [historial, setHistorial] = useState(() => storage.get(historialKey, []))
  const [showHistorial, setShowHistorial]   = useState(false)
  const [showNuevaForm, setShowNuevaForm]   = useState(false)
  const [editingRutina, setEditingRutina]   = useState(null) // rutina name being edited
  const [deleteConfirm, setDeleteConfirm]  = useState(null) // rutina name pending delete

  useEffect(() => { storage.set(sessionKey, checklist) }, [checklist, sessionKey])
  useEffect(() => { storage.set(STRENGTH_PLAN_KEY, rutinas) }, [rutinas])

  // Listen for coach updates
  useEffect(() => {
    const h = () => {
      const updated = storage.get(STRENGTH_PLAN_KEY)
      if (updated) {
        setRutinas(updated)
        // Use functional update to access current rutinaActiva without adding it to deps
        setRutinaActiva(prev => {
          const keys = Object.keys(updated)
          return keys.length && !updated[prev] ? keys[0] : prev
        })
      }
    }
    window.addEventListener('ella_update', h)
    return () => window.removeEventListener('ella_update', h)
  }, [])

  const rutinaData  = rutinas[rutinaActiva] || {}
  const ejercicios  = rutinaData.ejercicios || []
  const doneCount   = ejercicios.filter((_, i) => checklist[`${rutinaActiva}-${i}`]).length
  const allDone     = doneCount === ejercicios.length && ejercicios.length > 0

  const handleToggle  = (i) => setChecklist(prev => ({ ...prev, [`${rutinaActiva}-${i}`]: !prev[`${rutinaActiva}-${i}`] }))

  const handleEditEj  = (i, updated) => {
    setRutinas(prev => ({
      ...prev,
      [rutinaActiva]: { ...prev[rutinaActiva], ejercicios: prev[rutinaActiva].ejercicios.map((e, idx) => idx === i ? updated : e) },
    }))
  }

  const handleSaveRutina = (data, isEdit = false, oldName = null) => {
    setRutinas(prev => {
      const next = { ...prev }
      if (isEdit && oldName && oldName !== data.nombre) delete next[oldName]
      next[data.nombre] = data
      return next
    })
    setRutinaActiva(data.nombre)
    setShowNuevaForm(false)
    setEditingRutina(null)
  }

  const handleDeleteRutina = (nombre) => {
    setRutinas(prev => {
      const next = { ...prev }
      delete next[nombre]
      return next
    })
    const keys = Object.keys(rutinas).filter(k => k !== nombre)
    setRutinaActiva(keys[0] || '')
    setDeleteConfirm(null)
  }

  const handleFinish = () => {
    if (doneCount === 0) return
    const registro = { fecha: today, rutina: rutinaActiva, ejercicios: doneCount, total: ejercicios.length }
    const updated  = [registro, ...historial.filter(h => !(h.fecha === today && h.rutina === rutinaActiva))]
    setHistorial(updated)
    storage.set(historialKey, updated)
    window.dispatchEvent(new Event('ella_update'))
  }

  const handleReset = () => {
    const cleared = { ...checklist }
    ejercicios.forEach((_, i) => delete cleared[`${rutinaActiva}-${i}`])
    setChecklist(cleared)
  }

  const rutinaKeys = Object.keys(rutinas)

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Entrenamiento</h2>
            <p className="text-purple-400 text-xs mt-0.5">Fuerza funcional & estabilidad</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowNuevaForm(!showNuevaForm); setEditingRutina(null) }}
              className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center active:scale-95 transition-colors">
              <PlusCircle size={18} className="text-purple-700" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
              <Dumbbell size={18} className="text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Nueva / editar rutina form */}
        {(showNuevaForm && !editingRutina) && (
          <NuevaRutinaForm
            onSave={(data) => handleSaveRutina(data)}
            onCancel={() => setShowNuevaForm(false)}
          />
        )}
        {editingRutina && (
          <NuevaRutinaForm
            initial={rutinas[editingRutina]}
            onSave={(data) => handleSaveRutina(data, true, editingRutina)}
            onCancel={() => setEditingRutina(null)}
          />
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 animate-fade-in">
            <p className="text-rose-700 text-sm font-medium mb-3">¿Eliminar rutina "{deleteConfirm}"?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-400 text-sm">Cancelar</button>
              <button onClick={() => handleDeleteRutina(deleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold active:scale-95">Eliminar</button>
            </div>
          </div>
        )}

        {/* Rutina tabs */}
        {rutinaKeys.length > 0 ? (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {rutinaKeys.map(r => (
                <div key={r} className="flex-shrink-0 flex items-center gap-0.5">
                  <button onClick={() => setRutinaActiva(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      rutinaActiva === r ? 'bg-violet-600 text-white border-violet-600' : 'bg-violet-50 text-purple-400 border-violet-200'
                    }`}>
                    {r}
                  </button>
                  {rutinaActiva === r && (
                    <div className="flex gap-0.5 ml-0.5">
                      <button onClick={() => { setEditingRutina(r); setShowNuevaForm(false) }}
                        className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Pencil size={10} className="text-purple-500" />
                      </button>
                      <button onClick={() => setDeleteConfirm(r)}
                        className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                        <Trash2 size={10} className="text-rose-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rutina metadata */}
            {rutinaData.dia && (
              <p className="text-purple-300 text-xs">
                {rutinaData.tipo && <span className="bg-violet-100 text-violet-600 text-[10px] font-semibold px-2 py-0.5 rounded-full mr-2">{rutinaData.tipo}</span>}
                Día asignado: {rutinaData.dia}
              </p>
            )}

            {/* Progress */}
            <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-700 text-sm">Progreso sesión</p>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} className="text-purple-300 hover:text-purple-400 transition-colors">
                    <RotateCcw size={13} />
                  </button>
                  <span className="text-violet-600 font-bold text-sm">{doneCount}/{ejercicios.length}</span>
                </div>
              </div>
              <div className="h-2 bg-violet-100/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-violet-600 rounded-full transition-all duration-500"
                  style={{ width: `${ejercicios.length ? (doneCount / ejercicios.length) * 100 : 0}%` }} />
              </div>
              {allDone && (
                <div className="mt-3 text-center">
                  <p className="text-emerald-400 text-sm font-semibold">¡Sesión completada!</p>
                  <button onClick={handleFinish}
                    className="mt-2 text-xs text-emerald-400 border border-emerald-500/30 rounded-lg px-3 py-1">
                    Guardar en historial
                  </button>
                </div>
              )}
              {!allDone && doneCount > 0 && (
                <button onClick={handleFinish}
                  className="mt-3 w-full text-xs text-violet-600 border border-violet-500/20 rounded-lg py-1.5">
                  Guardar progreso parcial
                </button>
              )}
            </div>

            {/* Exercise checklist */}
            <div>
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-2">Rutina: {rutinaActiva}</p>
              {ejercicios.length > 0 ? (
                <div className="space-y-2">
                  {ejercicios.map((ej, i) => (
                    <EjercicioRow
                      key={i} ej={ej}
                      done={!!checklist[`${rutinaActiva}-${i}`]}
                      onToggle={() => handleToggle(i)}
                      onEdit={(updated) => handleEditEj(i, updated)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-purple-300 text-sm text-center py-4">Sin ejercicios. Edita la rutina para añadir.</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <Dumbbell size={32} className="text-purple-200 mx-auto mb-2" />
            <p className="text-purple-400 text-sm">Sin rutinas. Crea tu primera con el botón +</p>
          </div>
        )}

        {/* History */}
        {historial.length > 0 && (
          <div>
            <button onClick={() => setShowHistorial(!showHistorial)}
              className="flex items-center justify-between w-full py-2 text-purple-400 text-xs uppercase tracking-wider hover:text-purple-700">
              <span>Historial ({historial.length})</span>
              {showHistorial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistorial && (
              <div className="space-y-2 animate-fade-in">
                {historial.slice(0, 10).map((h, i) => (
                  <div key={i} className="bg-violet-50 rounded-xl border border-violet-100 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{h.rutina}</p>
                      <p className="text-purple-300 text-xs">{h.fecha}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-violet-600 text-sm font-semibold">{h.ejercicios}/{h.total}</p>
                      <p className="text-purple-300 text-xs">ejercicios</p>
                    </div>
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
