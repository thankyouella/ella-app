import { useState, useEffect } from 'react'
import { Plus, Trash2, Flag, Clock, Zap, Star, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { storage } from '../utils/storage'

const STORAGE_KEY = 'ella_carreras'

const CLIMAS = ['Soleado', 'Nublado', 'Caluroso', 'Lluvioso', 'Viento']

const CLIMA_EMOJI = {
  Soleado: '☀️',
  Nublado: '☁️',
  Caluroso: '🔥',
  Lluvioso: '🌧️',
  Viento: '💨',
}

// Parsea "HH:MM:SS" o "MM:SS" → total en segundos
function parseTime(str) {
  if (!str || !str.trim()) return null
  const parts = str.trim().split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

// Retorna ritmo como "M:SS"
function calcRitmo(tiempoStr, km) {
  const totalSec = parseTime(tiempoStr)
  if (!totalSec || !km || km <= 0) return ''
  const ritmoSec = totalSec / km
  const m = Math.floor(ritmoSec / 60)
  const s = Math.round(ritmoSec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

function formatFecha(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            size={22}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 14 }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </span>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full border border-violet-200">
      {Icon && <Icon size={12} className="text-violet-500" />}
      <span className="text-violet-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  )
}

// ─── Formulario ───────────────────────────────────────────────────────────────
const FORM_EMPTY = {
  fecha: hoy(),
  nombre: '',
  distancia_km: '',
  tiempo: '',
  posicion: '',
  clima: '',
  sensacion: 3,
  notas: '',
}

function FormCarrera({ onSave, onCancel }) {
  const [form, setForm] = useState(FORM_EMPTY)

  const ritmoPreview = calcRitmo(form.tiempo, parseFloat(form.distancia_km))

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.fecha || !form.nombre.trim() || !form.distancia_km || !form.tiempo.trim()) return
    const ritmo = calcRitmo(form.tiempo, parseFloat(form.distancia_km))
    onSave({
      id: `r${Date.now()}`,
      fecha: form.fecha,
      nombre: form.nombre.trim(),
      distancia_km: parseFloat(form.distancia_km),
      tiempo: form.tiempo.trim(),
      ritmo,
      posicion: form.posicion.trim(),
      clima: form.clima,
      sensacion: form.sensacion,
      notas: form.notas.trim(),
    })
  }

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-4">
      <h3 className="text-violet-700 font-semibold text-base mb-4">Nueva carrera</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Fila fecha + nombre */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-purple-500 font-medium mb-1 block">Fecha *</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            />
          </div>
          <div>
            <label className="text-xs text-purple-500 font-medium mb-1 block">Nombre *</label>
            <input
              type="text"
              placeholder="Dubai 10K Race"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            />
          </div>
        </div>

        {/* Fila distancia + tiempo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-purple-500 font-medium mb-1 block">Distancia (km) *</label>
            <input
              type="number"
              placeholder="10"
              min="0.1"
              step="0.1"
              value={form.distancia_km}
              onChange={(e) => set('distancia_km', e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            />
          </div>
          <div>
            <label className="text-xs text-purple-500 font-medium mb-1 block">Tiempo *</label>
            <input
              type="text"
              placeholder="HH:MM:SS"
              value={form.tiempo}
              onChange={(e) => set('tiempo', e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            />
          </div>
        </div>

        {/* Ritmo preview */}
        {ritmoPreview && (
          <div className="flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-xl px-3 py-2">
            <Zap size={14} className="text-violet-500" />
            <span className="text-xs text-purple-600 font-medium">Ritmo calculado:</span>
            <span className="text-sm font-bold text-violet-700">{ritmoPreview} min/km</span>
          </div>
        )}

        {/* Posicion + clima */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-purple-500 font-medium mb-1 block">Posición (opcional)</label>
            <input
              type="text"
              placeholder="Ej: 42/300"
              value={form.posicion}
              onChange={(e) => set('posicion', e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="text-xs text-purple-500 font-medium mb-1 block">Clima (opcional)</label>
            <select
              value={form.clima}
              onChange={(e) => set('clima', e.target.value)}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">—</option>
              {CLIMAS.map((c) => (
                <option key={c} value={c}>{CLIMA_EMOJI[c]} {c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sensación */}
        <div>
          <label className="text-xs text-purple-500 font-medium mb-1 block">Sensación</label>
          <StarPicker value={form.sensacion} onChange={(v) => set('sensacion', v)} />
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs text-purple-500 font-medium mb-1 block">Notas (opcional)</label>
          <textarea
            rows={2}
            placeholder="Cómo fue la carrera..."
            value={form.notas}
            onChange={(e) => set('notas', e.target.value)}
            className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors active:scale-95"
          >
            Guardar carrera
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-white border border-violet-200 text-purple-600 font-medium text-sm rounded-xl py-2.5 hover:bg-violet-50 transition-colors active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Card de carrera ──────────────────────────────────────────────────────────
function CarreraCard({ carrera, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const tieneExtra = carrera.posicion || carrera.clima || carrera.notas

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar "${carrera.nombre}"?`)) {
      onDelete(carrera.id)
    }
  }

  return (
    <div className="bg-violet-50 border border-violet-100 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm">
      <div className="p-4">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Flag size={13} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs text-purple-400 font-medium">{formatFecha(carrera.fecha)}</span>
            </div>
            <h3 className="text-gray-900 font-semibold text-base leading-snug">{carrera.nombre}</h3>
          </div>
          <div className="flex items-center gap-1">
            {tieneExtra && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-purple-400 hover:text-violet-600 transition-colors p-1"
                title={expanded ? 'Colapsar' : 'Expandir'}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-red-300 hover:text-red-500 transition-colors p-1"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Pills métricas */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Pill icon={Flag} label="Dist" value={`${carrera.distancia_km} km`} />
          <Pill icon={Clock} label="Tiempo" value={carrera.tiempo} />
          {carrera.ritmo && <Pill icon={Zap} label="Ritmo" value={`${carrera.ritmo}/km`} />}
        </div>

        {/* Sensación */}
        <StarDisplay value={carrera.sensacion} />
      </div>

      {/* Panel expandido */}
      {expanded && tieneExtra && (
        <div className="border-t border-violet-100 bg-violet-50/50 px-4 py-3 space-y-1.5">
          {carrera.posicion && (
            <div className="flex items-center gap-2">
              <Trophy size={13} className="text-violet-400" />
              <span className="text-xs text-purple-500 font-medium">Posición:</span>
              <span className="text-xs text-gray-700 font-semibold">{carrera.posicion}</span>
            </div>
          )}
          {carrera.clima && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{CLIMA_EMOJI[carrera.clima]}</span>
              <span className="text-xs text-purple-500 font-medium">Clima:</span>
              <span className="text-xs text-gray-700">{carrera.clima}</span>
            </div>
          )}
          {carrera.notas && (
            <p className="text-xs text-gray-500 leading-relaxed pt-0.5">{carrera.notas}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Stats resumen ────────────────────────────────────────────────────────────
function StatsBar({ carreras }) {
  if (carreras.length === 0) return null

  const kmTotales = carreras.reduce((acc, c) => acc + (parseFloat(c.distancia_km) || 0), 0)

  // Mejor tiempo: la carrera con menor ritmo (min/km) o si no hay ritmo, la que tardó menos segundos
  const conRitmo = carreras.filter((c) => c.ritmo)
  let mejorCarrera = null
  if (conRitmo.length > 0) {
    mejorCarrera = conRitmo.reduce((best, c) => {
      const toSec = (r) => {
        const [m, s] = r.split(':').map(Number)
        return m * 60 + (s || 0)
      }
      return toSec(c.ritmo) < toSec(best.ritmo) ? c : best
    })
  }

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {/* Total */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-violet-700">{carreras.length}</p>
        <p className="text-xs text-purple-400 font-medium mt-0.5">Carreras</p>
      </div>
      {/* Mejor ritmo */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 text-center">
        <p className="text-lg font-bold text-violet-700 leading-tight">
          {mejorCarrera ? `${mejorCarrera.ritmo}/km` : '—'}
        </p>
        <p className="text-xs text-purple-400 font-medium mt-0.5">Mejor ritmo</p>
      </div>
      {/* Km totales */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-violet-700">{kmTotales.toFixed(1)}</p>
        <p className="text-xs text-purple-400 font-medium mt-0.5">Km totales</p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Carreras() {
  const [carreras, setCarreras] = useState(() => storage.get(STORAGE_KEY, []))
  const [showForm, setShowForm] = useState(false)

  // Persistir cuando cambia el array
  useEffect(() => {
    storage.set(STORAGE_KEY, carreras)
    window.dispatchEvent(new Event('ella_update'))
  }, [carreras])

  const handleSave = (nueva) => {
    setCarreras((prev) => [nueva, ...prev])
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setCarreras((prev) => prev.filter((c) => c.id !== id))
  }

  // Ordenar por fecha DESC
  const sorted = [...carreras].sort((a, b) => {
    if (a.fecha < b.fecha) return 1
    if (a.fecha > b.fecha) return -1
    return 0
  })

  return (
    <div className="animate-fade-in pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 text-2xl font-bold">Mis Carreras</h2>
          <p className="text-sm text-purple-400 mt-0.5">
            {carreras.length === 0
              ? 'Registra tu primera carrera'
              : `${carreras.length} carrera${carreras.length !== 1 ? 's' : ''} registrada${carreras.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      <div className="px-4 space-y-4">
      {/* Formulario */}
      {showForm && (
        <FormCarrera onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {/* Stats */}
      <StatsBar carreras={carreras} />

      {/* Lista */}
      {sorted.length === 0 ? (
        <div className="bg-violet-50 border border-violet-100 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-gray-800 font-semibold text-base mb-1">¡Aún no hay carreras!</p>
          <p className="text-purple-400 text-sm leading-relaxed">
            Cada kilómetro cuenta. Registra tu primera carrera<br />y empieza a construir tu historial.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <CarreraCard key={c.id} carrera={c} onDelete={handleDelete} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
