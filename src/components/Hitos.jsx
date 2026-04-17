import { useState, useEffect } from 'react'
import { Trophy, Plus, CheckCircle, Circle, Target, Calendar, Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { storage, KEYS, INITIAL_DATA } from '../utils/storage'

const CATEGORIAS = ['Running', 'Entrenamiento', 'Bienestar', 'Personal', 'Salud']

const CAT_COLORS = {
  Running: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Entrenamiento: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Bienestar: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Personal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Salud: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

function HitoBadge({ categoria }) {
  const cls = CAT_COLORS[categoria] || 'bg-violet-100/60 text-purple-700 border-violet-200'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{categoria}</span>
  )
}

function HitoCard({ hito, onComplete, onUpdateProgress }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [prog, setProg] = useState(hito.progreso)
  const [celebrating, setCelebrating] = useState(false)

  const handleComplete = () => {
    setCelebrating(true)
    setTimeout(() => {
      onComplete(hito.id)
      setCelebrating(false)
    }, 700)
  }

  const handleSaveProg = () => {
    onUpdateProgress(hito.id, parseInt(prog, 10))
    setEditing(false)
  }

  const daysLeft = hito.fecha
    ? Math.ceil((new Date(hito.fecha + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className={`bg-violet-50 rounded-2xl border border-violet-500/20 overflow-hidden transition-all ${celebrating ? 'animate-celebrate border-violet-600' : ''}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <HitoBadge categoria={hito.categoria} />
            <h3 className="text-gray-900 font-semibold text-base mt-2 leading-snug">{hito.nombre}</h3>
            {hito.descripcion && (
              <p className="text-purple-400 text-xs mt-1 leading-relaxed">{hito.descripcion}</p>
            )}
          </div>
          {!hito.completado && (
            <button
              onClick={handleComplete}
              className="flex-shrink-0 bg-violet-600/10 border border-violet-500/30 rounded-xl p-2 hover:bg-violet-600/20 transition-all active:scale-95"
            >
              <CheckCircle size={16} className="text-violet-600" />
            </button>
          )}
        </div>

        {/* Progress */}
        {!hito.completado && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-purple-400">Progreso</span>
              <span className="text-violet-600 font-semibold">{hito.progreso}%</span>
            </div>
            <div className="h-2 bg-violet-100/60 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${hito.progreso}%` }}
              />
            </div>

            {editing ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="range" min="0" max="100" value={prog}
                  onChange={e => setProg(e.target.value)}
                  className="flex-1 accent-violet-600 h-1"
                />
                <span className="text-violet-600 text-xs w-8 text-center">{prog}%</span>
                <button onClick={handleSaveProg} className="text-xs text-white bg-violet-600 rounded-lg px-2 py-1 font-semibold">
                  OK
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="text-purple-300 text-xs hover:text-violet-600 transition-colors">
                + Actualizar
              </button>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-violet-100">
          {hito.fecha && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-purple-300" />
              <span className="text-purple-400 text-xs">
                {hito.completado
                  ? new Date(hito.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                  : daysLeft > 0 ? `${daysLeft} días` : daysLeft === 0 ? 'Hoy!' : 'Pasado'}
              </span>
            </div>
          )}
          {hito.completado && (
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-violet-600" />
              <span className="text-violet-600 text-xs">Completado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NuevoHitoForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Running',
    fecha: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    onSave({
      id: `h${Date.now()}`,
      ...form,
      progreso: 0,
      completado: false,
      creado: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3">
        <h3 className="text-violet-600 font-semibold text-sm uppercase tracking-wide mb-4">Nuevo Hito</h3>

        <div>
          <label className="text-purple-400 text-xs mb-1 block">Nombre del hito *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Completar 5K sin parar"
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/50 transition-colors"
            required
          />
        </div>

        <div>
          <label className="text-purple-400 text-xs mb-1 block">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="¿Qué significa este hito para ti?"
            rows={2}
            className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-purple-400 text-xs mb-1 block">Categoría</label>
            <select
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            >
              {CATEGORIAS.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-purple-400 text-xs mb-1 block">Fecha objetivo</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-700 text-sm hover:border-violet-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-600-light transition-colors active:scale-95"
          >
            Crear Hito
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Hitos() {
  const [hitos, setHitos] = useState(() =>
    storage.get(KEYS.HITOS, [INITIAL_DATA.hito_activo])
  )
  const [showForm, setShowForm] = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    storage.set(KEYS.HITOS, hitos)
  }, [hitos])

  const activos = hitos.filter(h => !h.completado)
  const completados = hitos.filter(h => h.completado)

  const handleComplete = (id) => {
    setHitos(prev => prev.map(h =>
      h.id === id
        ? { ...h, completado: true, progreso: 100, fechaCompletado: new Date().toISOString().split('T')[0] }
        : h
    ))
    window.dispatchEvent(new Event('ella_update'))
    showToast('¡Hito completado! ¡Felicidades, Ella!')
  }

  const handleUpdateProgress = (id, val) => {
    setHitos(prev => prev.map(h => h.id === id ? { ...h, progreso: val } : h))
    window.dispatchEvent(new Event('ella_update'))
  }

  const handleAddHito = (hito) => {
    setHitos(prev => [hito, ...prev])
    setShowForm(false)
    showToast('Nuevo hito creado')
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="animate-fade-in pb-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-violet-600 text-white font-semibold text-sm rounded-2xl p-3 text-center shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Hitos & Metas</h2>
            <p className="text-purple-400 text-xs mt-0.5">{activos.length} activos · {completados.length} completados</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95 transition-all"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* New hito form */}
        {showForm && (
          <NuevoHitoForm
            onSave={handleAddHito}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Active hitos */}
        {activos.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Target size={40} className="text-purple-300 mx-auto mb-3" />
            <p className="text-purple-400 text-sm">No tienes hitos activos</p>
            <button onClick={() => setShowForm(true)} className="text-violet-600 text-sm mt-2">
              Crear tu primer hito
            </button>
          </div>
        )}

        {activos.map(h => (
          <HitoCard
            key={h.id}
            hito={h}
            onComplete={handleComplete}
            onUpdateProgress={handleUpdateProgress}
          />
        ))}

        {/* Historial */}
        {completados.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowHistorial(!showHistorial)}
              className="flex items-center justify-between w-full py-3 text-purple-400 text-xs uppercase tracking-wider hover:text-purple-700 transition-colors"
            >
              <span>Historial ({completados.length})</span>
              {showHistorial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showHistorial && (
              <div className="space-y-3 animate-fade-in">
                {completados.map(h => (
                  <div key={h.id} className="bg-violet-50 rounded-2xl border border-violet-100 p-4 opacity-75">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <HitoBadge categoria={h.categoria} />
                        <p className="text-purple-700 font-medium text-sm mt-2">{h.nombre}</p>
                      </div>
                      <Sparkles size={16} className="text-violet-600 flex-shrink-0 mt-1" />
                    </div>
                    {h.fechaCompletado && (
                      <p className="text-purple-300 text-xs mt-2">
                        Completado: {new Date(h.fechaCompletado + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
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
