import { useState, useEffect, useRef, useCallback } from 'react'
import { BookOpen, Search, Plus, Calendar, Download, ChevronLeft, Trash2 } from 'lucide-react'
import { storage, KEYS } from '../utils/storage'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const MOODS = [
  { emoji: '🌟', label: 'Excelente' },
  { emoji: '😊', label: 'Bien' },
  { emoji: '😐', label: 'Neutro' },
  { emoji: '😔', label: 'Bajo' },
  { emoji: '💪', label: 'Motivada' },
]

export default function Diario() {
  const [entradas, setEntradas] = useState(() => storage.get(KEYS.DIARIO, []))
  const [view, setView] = useState('list') // 'list' | 'editor' | 'read'
  const [texto, setTexto] = useState('')
  const [mood, setMood] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [readingId, setReadingId] = useState(null)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    storage.set(KEYS.DIARIO, entradas)
  }, [entradas])

  // Clear pending auto-save timer on unmount
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const autoSave = useCallback((text, t, m) => {
    clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(() => {
      if (editingId) {
        setEntradas(prev => prev.map(e =>
          e.id === editingId ? { ...e, texto: text, titulo: t, mood: m, editado: new Date().toISOString() } : e
        ))
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 1500)
  }, [editingId])

  useEffect(() => {
    if (view === 'editor' && editingId) {
      autoSave(texto, titulo, mood)
    }
  }, [texto, titulo, mood, view, editingId, autoSave])

  const handleNew = () => {
    const id = `d${Date.now()}`
    const nueva = {
      id,
      titulo: '',
      texto: '',
      mood: null,
      fecha: new Date().toISOString(),
      editado: null,
    }
    setEntradas(prev => [nueva, ...prev])
    setEditingId(id)
    setTexto('')
    setTitulo('')
    setMood(null)
    setView('editor')
  }

  const handleRead = (entrada) => {
    setReadingId(entrada.id)
    setView('read')
  }

  const handleEdit = (entrada) => {
    setEditingId(entrada.id)
    setTexto(entrada.texto)
    setTitulo(entrada.titulo || '')
    setMood(entrada.mood)
    setView('editor')
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar esta entrada?')) {
      setEntradas(prev => prev.filter(e => e.id !== id))
      setView('list')
    }
  }

  const handleBack = () => {
    // Final save on back; remove entry if completely empty
    if (view === 'editor' && editingId) {
      if (!texto.trim() && !titulo.trim() && !mood) {
        setEntradas(prev => prev.filter(e => e.id !== editingId))
      } else {
        setEntradas(prev => prev.map(e =>
          e.id === editingId ? { ...e, texto, titulo, mood, editado: new Date().toISOString() } : e
        ))
      }
    }
    setView('list')
    setEditingId(null)
  }

  const handleExport = (entrada) => {
    const content = `${entrada.titulo || 'Sin título'}\n${formatDate(entrada.fecha)}\n\n${entrada.texto}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diario-${entrada.fecha.split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtradas = entradas.filter(e => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      e.texto?.toLowerCase().includes(q) ||
      e.titulo?.toLowerCase().includes(q) ||
      e.fecha.includes(q)
    )
  })

  // --- LIST VIEW ---
  if (view === 'list') {
    return (
      <div className="animate-fade-in pb-4">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-900 text-2xl font-bold">Diario</h2>
              <p className="text-purple-400 text-xs mt-0.5">{entradas.length} entradas</p>
            </div>
            <button
              onClick={handleNew}
              className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar en el diario..."
              className="w-full bg-violet-50 border border-violet-200 rounded-xl pl-9 pr-4 py-2.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>
        </div>

        <div className="px-4 space-y-3">
          {filtradas.length === 0 && (
            <div className="text-center py-16">
              <BookOpen size={40} className="text-purple-300 mx-auto mb-3" />
              {busqueda ? (
                <p className="text-purple-400 text-sm">Sin resultados para "{busqueda}"</p>
              ) : (
                <>
                  <p className="text-purple-400 text-sm mb-1">Tu diario está vacío</p>
                  <button onClick={handleNew} className="text-violet-600 text-sm">Escribir primera entrada</button>
                </>
              )}
            </div>
          )}

          {filtradas.map(e => (
            <button
              key={e.id}
              onClick={() => handleRead(e)}
              className="w-full bg-violet-50 rounded-2xl border border-violet-100 p-4 text-left hover:border-violet-200 transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {e.mood && <span className="text-base">{e.mood}</span>}
                  <p className="text-gray-900 font-medium text-sm leading-snug">
                    {e.titulo || formatDate(e.fecha).split(',')[0]}
                  </p>
                </div>
              </div>
              <p className="text-purple-400 text-xs line-clamp-2 leading-relaxed">
                {e.texto || 'Sin contenido'}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar size={11} className="text-purple-300" />
                <p className="text-purple-300 text-xs">{formatDate(e.fecha)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // --- EDITOR VIEW ---
  if (view === 'editor') {
    return (
      <div className="animate-fade-in flex flex-col h-full">
        {/* Top bar */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-violet-100">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-purple-700 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18} />
            <span className="text-sm">Diario</span>
          </button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-violet-600/60 text-xs">Guardado ✓</span>}
            <button
              onClick={() => {
                const entrada = entradas.find(e => e.id === editingId)
                if (entrada) handleExport({ ...entrada, texto, titulo, mood })
              }}
              className="text-purple-300 hover:text-purple-700 transition-colors"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => handleDelete(editingId)}
              className="text-purple-300 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Date */}
          <p className="text-purple-300 text-xs">
            {formatDate(entradas.find(e => e.id === editingId)?.fecha || new Date().toISOString())}
          </p>

          {/* Title */}
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Título (opcional)"
            className="w-full bg-transparent text-gray-900 text-xl font-semibold placeholder-violet-300 focus:outline-none border-none"
          />

          {/* Mood */}
          <div>
            <p className="text-purple-300 text-xs mb-2">¿Cómo te sientes?</p>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button
                  key={m.label}
                  onClick={() => setMood(mood === m.emoji ? null : m.emoji)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all ${
                    mood === m.emoji
                      ? 'border-violet-500/50 bg-violet-600/10'
                      : 'border-violet-100 bg-violet-50 hover:border-violet-200'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-purple-300 text-[10px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="¿Qué tienes en mente hoy? Escribe libremente..."
            className="w-full bg-transparent text-gray-900 text-sm leading-relaxed placeholder-violet-300 focus:outline-none border-none resize-none min-h-64"
            autoFocus
            rows={14}
          />
        </div>
      </div>
    )
  }

  // --- READ VIEW ---
  if (view === 'read') {
    const entrada = entradas.find(e => e.id === readingId)
    if (!entrada) return null

    return (
      <div className="animate-fade-in pb-4">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-violet-100">
          <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-purple-700 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18} />
            <span className="text-sm">Diario</span>
          </button>
          <div className="flex gap-3">
            <button onClick={() => handleExport(entrada)} className="text-purple-300 hover:text-purple-700 transition-colors">
              <Download size={16} />
            </button>
            <button onClick={() => handleEdit(entrada)} className="text-violet-600 text-xs border border-violet-500/30 rounded-lg px-3 py-1">
              Editar
            </button>
          </div>
        </div>

        <div className="px-4 py-5">
          <p className="text-purple-300 text-xs mb-2">{formatDate(entrada.fecha)} · {formatTime(entrada.fecha)}</p>
          {entrada.mood && <span className="text-2xl block mb-3">{entrada.mood}</span>}
          {entrada.titulo && (
            <h2 className="text-gray-900 text-xl font-bold mb-4 leading-snug">{entrada.titulo}</h2>
          )}
          <p className="text-gray-900/80 text-sm leading-relaxed whitespace-pre-wrap">{entrada.texto || 'Sin contenido'}</p>
          {entrada.editado && (
            <p className="text-purple-300 text-xs mt-6">Editado: {formatDate(entrada.editado)}</p>
          )}
        </div>
      </div>
    )
  }
}
