import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Sun, Moon, Flame, Plus, X, Sparkles } from 'lucide-react'
import { storage } from '../utils/storage'

const HABITOS_KEY = 'ella_habitos_config'
const STREAKS_KEY = 'ella_habitos_streaks'

const HABITOS_DEFAULT = {
  manana: [
    { id: 'h1', nombre: 'Despertar sin snooze', emoji: '⏰' },
    { id: 'h2', nombre: 'Vaso de agua al despertar', emoji: '💧' },
    { id: 'h3', nombre: 'Movimiento matutino (10 min)', emoji: '🧘' },
    { id: 'h4', nombre: 'Desayuno nutritivo', emoji: '🥣' },
    { id: 'h5', nombre: 'Revisar plan del día', emoji: '📋' },
  ],
  noche: [
    { id: 'n1', nombre: 'Sin pantallas 30 min antes', emoji: '📵' },
    { id: 'n2', nombre: 'Stretching o foam rolling', emoji: '🦵' },
    { id: 'n3', nombre: 'Registrar en el diario', emoji: '📓' },
    { id: 'n4', nombre: 'Preparar ropa y equipo', emoji: '👟' },
    { id: 'n5', nombre: 'Dormir antes de las 23h', emoji: '😴' },
  ],
}

function HabitoRow({ habito, done, onToggle, onDelete }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      done ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-violet-50 border-violet-100'
    }`}>
      <button onClick={onToggle} className="flex-shrink-0">
        {done
          ? <CheckCircle size={22} className="text-emerald-400" />
          : <Circle size={22} className="text-purple-300" />
        }
      </button>
      <span className={`flex-1 text-sm ${done ? 'line-through text-purple-400' : 'text-gray-900/80'}`}>
        {habito.nombre}
      </span>
      <button onClick={onDelete} className="text-slate-300 hover:text-rose-400 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}

function AddHabitoForm({ onSave, onCancel }) {
  const [nombre, setNombre] = useState('')
  const [seccion, setSeccion] = useState('manana')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    onSave({ id: `h${Date.now()}`, nombre: nombre.trim() }, seccion)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Nuevo hábito</h3>
      <div>
        <label className="text-purple-400 text-xs mb-1 block">Nombre del hábito</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Meditar 5 minutos"
          className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
          required
        />
      </div>
      <div>
        <label className="text-purple-400 text-xs mb-1 block">Rutina</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSeccion('manana')}
            className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
              seccion === 'manana' ? 'bg-violet-600/15 border-violet-500/30 text-violet-600' : 'bg-violet-50 border-violet-100 text-purple-400'
            }`}>
            Mañana
          </button>
          <button type="button" onClick={() => setSeccion('noche')}
            className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
              seccion === 'noche' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-violet-50 border-violet-100 text-purple-400'
            }`}>
            Noche
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Agregar</button>
      </div>
    </form>
  )
}

export default function Habitos() {
  const today = new Date().toISOString().split('T')[0]
  const checkKey = `ella_habitos_check_${today}`

  const [habitos, setHabitos] = useState(() => storage.get(HABITOS_KEY, HABITOS_DEFAULT))
  const [checks, setChecks] = useState(() => storage.get(checkKey, {}))
  const [streaks, setStreaks] = useState(() => storage.get(STREAKS_KEY, { dias: 0, ultimaFecha: null }))
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { storage.set(HABITOS_KEY, habitos) }, [habitos])
  useEffect(() => { storage.set(checkKey, checks) }, [checks, checkKey])

  const allHabitos = [...habitos.manana, ...habitos.noche]
  const doneCount = allHabitos.filter(h => checks[h.id]).length
  const totalCount = allHabitos.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = doneCount === totalCount && totalCount > 0

  // Update streak when all done
  useEffect(() => {
    if (!allDone) return
    if (streaks.ultimaFecha === today) return
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const ayer = yesterday.toISOString().split('T')[0]
    const newStreak = streaks.ultimaFecha === ayer ? streaks.dias + 1 : 1
    const updated = { dias: newStreak, ultimaFecha: today }
    setStreaks(updated)
    storage.set(STREAKS_KEY, updated)
    if (newStreak > 1) showToastMsg(`¡Racha de ${newStreak} días! ¡Imparable!`)
    else showToastMsg('¡Día completado! ¡Así se hace!')
  }, [allDone, today, streaks.ultimaFecha, streaks.dias])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleToggle = (id) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }))
    window.dispatchEvent(new Event('ella_update'))
  }

  const handleDelete = (id, seccion) => {
    setHabitos(prev => ({
      ...prev,
      [seccion]: prev[seccion].filter(h => h.id !== id)
    }))
  }

  const handleAdd = (habito, seccion) => {
    setHabitos(prev => ({
      ...prev,
      [seccion]: [...prev[seccion], habito]
    }))
    setShowForm(false)
  }

  return (
    <div className="animate-fade-in pb-4">
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-violet-600 text-white font-semibold text-sm rounded-2xl p-3 text-center shadow-lg">{toast}</div>
        </div>
      )}

      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Hábitos</h2>
            <p className="text-purple-400 text-xs mt-0.5">{doneCount}/{totalCount} completados hoy</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95">
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {showForm && <AddHabitoForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}

        {/* Progress + streak */}
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-900 font-semibold text-base">{pct}% completado</p>
              <p className="text-purple-400 text-xs">{doneCount} de {totalCount} hábitos</p>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
              <Flame size={16} className="text-orange-400" />
              <div className="text-right">
                <p className="text-orange-400 font-bold text-lg leading-none">{streaks.dias}</p>
                <p className="text-purple-300 text-xs">días racha</p>
              </div>
            </div>
          </div>
          <div className="h-3 bg-violet-100/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-pink-500 to-violet-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {allDone && (
            <p className="text-emerald-400 text-xs text-center mt-2 font-semibold">
              <Sparkles size={12} className="inline mr-1" />¡Todos los hábitos completados!
            </p>
          )}
        </div>

        {/* Rutina mañana */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sun size={15} className="text-amber-400" />
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Rutina de mañana</p>
            <span className="text-purple-300 text-xs ml-auto">
              {habitos.manana.filter(h => checks[h.id]).length}/{habitos.manana.length}
            </span>
          </div>
          <div className="space-y-2">
            {habitos.manana.map(h => (
              <HabitoRow key={h.id} habito={h}
                done={!!checks[h.id]}
                onToggle={() => handleToggle(h.id)}
                onDelete={() => handleDelete(h.id, 'manana')}
              />
            ))}
          </div>
        </div>

        {/* Rutina noche */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Moon size={15} className="text-indigo-400" />
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">Rutina de noche</p>
            <span className="text-purple-300 text-xs ml-auto">
              {habitos.noche.filter(h => checks[h.id]).length}/{habitos.noche.length}
            </span>
          </div>
          <div className="space-y-2">
            {habitos.noche.map(h => (
              <HabitoRow key={h.id} habito={h}
                done={!!checks[h.id]}
                onToggle={() => handleToggle(h.id)}
                onDelete={() => handleDelete(h.id, 'noche')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
