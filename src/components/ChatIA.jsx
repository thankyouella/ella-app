import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Sparkles, AlertCircle, Settings, X, Zap, Brain, Trash2, Plus } from 'lucide-react'
import { storage, KEYS } from '../utils/storage'
import { RUNNING_PLAN_KEY } from './RunningCoach'
import { STRENGTH_PLAN_KEY } from './Fuerza'
import { ELLA_MEMORIA } from '../utils/ellaMemoria'
import { calcFaseCiclo } from './Ciclo'

const MEMORIA_KEY = 'ella_memoria_coach'

// ─── Categorías de memoria ────────────────────────────────────────────────────
const MEMORIA_CATS = {
  fisica:        { label: 'Física',        color: 'bg-rose-500/15 text-rose-600 border-rose-500/20'       },
  emocional:     { label: 'Emocional',     color: 'bg-violet-500/15 text-violet-600 border-violet-500/20' },
  nutricional:   { label: 'Nutricional',   color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
  entrenamiento: { label: 'Entrena',       color: 'bg-blue-500/15 text-blue-600 border-blue-500/20'       },
  general:       { label: 'General',       color: 'bg-amber-500/15 text-amber-600 border-amber-500/20'    },
}

// ─── Dynamic system prompt ────────────────────────────────────────────────────
function buildSystemPrompt() {
  const runningPlan  = localStorage.getItem(RUNNING_PLAN_KEY)
  const strengthPlan = localStorage.getItem(STRENGTH_PLAN_KEY)
  const inbody       = localStorage.getItem('ella_inbody')
  const hitos        = localStorage.getItem(KEYS.HITOS)
  const indice       = localStorage.getItem('ella_indice_historial')
  const whoop        = localStorage.getItem('ella_whoop')
  const memoriaRaw   = localStorage.getItem(MEMORIA_KEY)

  // Ciclo: prefer auto-calc from config
  const cicloConfig   = JSON.parse(localStorage.getItem('ella_ciclo_config') || 'null')
  const faseCicloData = cicloConfig
    ? calcFaseCiclo(cicloConfig.fechaInicio, cicloConfig.duracionCiclo, cicloConfig.duracionPeriodo)
    : null
  const cicloManual = localStorage.getItem('ella_ciclo')
  const cicloInfo   = faseCicloData
    ? `Fase: ${faseCicloData.fase}, Día del ciclo: ${faseCicloData.diaCiclo}`
    : cicloManual
      ? JSON.stringify(JSON.parse(cicloManual).slice(-2))
      : 'No disponible'

  // Formato memoria aprendida
  const memoriaEntradas = memoriaRaw ? JSON.parse(memoriaRaw) : []
  const memoriaFmt = memoriaEntradas.length
    ? memoriaEntradas.map(m => `[${m.fecha}] (${m.categoria}) ${m.nota}`).join('\n')
    : 'Aún no hay notas guardadas.'

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return `Eres la coach personal de Ella. La conoces profundamente — tienes su perfil completo a continuación.
Siempre en español. Cálida, directa, experta, sin juicio. Como una amiga experta, no un robot.

${ELLA_MEMORIA}

════════════════════════════════════════
📓 MEMORIA APRENDIDA (lo que has ido conociendo de Ella)
════════════════════════════════════════
${memoriaFmt}

════════════════════════════════════════
📅 DATOS EN TIEMPO REAL — HOY: ${today}
════════════════════════════════════════

PLAN DE RUNNING ACTUAL:
${runningPlan || 'No configurado'}

PLAN DE FUERZA ACTUAL:
${strengthPlan || 'No configurado'}

ÚLTIMAS MÉTRICAS INBODY:
${inbody || 'Sin datos'}

MÉTRICAS WHOOP:
${whoop ? JSON.stringify(JSON.parse(whoop).slice(-3)) : 'Sin datos — WHOOP no conectado'}

HITOS:
${hitos || 'Sin hitos'}

ÍNDICE ELLA (últimos 7 días):
${indice ? JSON.stringify(JSON.parse(indice).slice(-7)) : 'Sin registros'}

CICLO MENSTRUAL:
${cicloInfo}

════════════════════════════════════════
⚡ PROTOCOL ELLA_ACTION
════════════════════════════════════════
Usa <ella_action> para actualizar datos de la app. Sin backticks ni markdown extra.

ACTUALIZAR PLANES:
<ella_action>{"action":"update_running_plan","data":[{"dia":"Lunes","tipo":"...","descripcion":"...","completado":false,"color":"bg-emerald-500/20 text-emerald-400"},...]}</ella_action>
<ella_action>{"action":"update_strength_plan","data":{"NombreRutina":{"nombre":"...","tipo":"...","dia":"...","ejercicios":[{"nombre":"...","series":"...","descripcion":"..."}]}}}</ella_action>

HITOS:
<ella_action>{"action":"update_milestone_progress","data":{"id":"h1","progreso":90}}</ella_action>
<ella_action>{"action":"add_milestone","data":{"nombre":"...","progreso":0}}</ella_action>

GUARDAR MEMORIA (úsalo cuando Ella comparta algo nuevo e importante sobre ella):
<ella_action>{"action":"save_coach_memory","data":{"nota":"texto conciso en tercera persona","categoria":"fisica|emocional|nutricional|entrenamiento|general"}}</ella_action>

CUÁNDO guardar memoria:
- Cuando mencione algo nuevo sobre su cuerpo (lesión, dolor, energía inusual)
- Cuando comparta un patrón emocional o comportamiento nuevo no documentado
- Cuando revele una preferencia, aversión o reacción importante
- Cuando ocurra algo significativo (logro, recaída, decisión clave)
- Máximo 1-2 notas por conversación — solo lo verdaderamente relevante

CUÁNDO NO guardar memoria:
- Preguntas informativas normales
- Cosas ya documentadas en el perfil base
- Detalles del día a día sin relevancia duradera

NUTRICIÓN — registrar en el log del día:
<ella_action>{"action":"add_meal","data":{"nombre":"Pollo con arroz","hora":"13:00","descripcion":"con brócoli","energia":"⚡ Alta","digestion":"😊 Perfecta","notas":"post-entreno"}}</ella_action>
<ella_action>{"action":"add_water","data":{"ml":500}}</ella_action>
Valores energia: "⚡ Alta" | "🙂 Normal" | "😴 Baja"
Valores digestion: "😊 Perfecta" | "😐 Ok" | "😣 Pesada"

HÁBITOS — añadir nuevo o marcar como hecho:
<ella_action>{"action":"add_habito","data":{"nombre":"Tomar magnesio antes de dormir","seccion":"noche","emoji":"💊"}}</ella_action>
<ella_action>{"action":"check_habito","data":{"nombre":"vaso de agua"}}</ella_action>
Secciones: "manana" | "noche". check_habito busca por nombre parcial.

DIARIO — crear entrada:
<ella_action>{"action":"add_diario","data":{"titulo":"Reflexión post-entreno","texto":"Hoy fue un día difícil pero lo hice...","mood":"💪"}}</ella_action>
Moods: "🌟" | "😊" | "😐" | "😔" | "💪"

Colores running: bg-emerald-500/20 text-emerald-400 | bg-blue-500/20 text-blue-400 | bg-orange-500/20 text-orange-400 | bg-purple-500/20 text-purple-400 | bg-violet-100/60 text-purple-400 | bg-violet-600/20 text-violet-600 | bg-rose-500/20 text-rose-400`
}

// ─── Message ─────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
        isUser ? 'bg-violet-600/20' : 'bg-indigo-500/20'
      }`}>
        {isUser ? <User size={14} className="text-violet-600" /> : <Bot size={14} className="text-indigo-400" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-violet-600/15 border border-violet-500/20 rounded-tr-sm'
          : 'bg-violet-50 border border-violet-100 rounded-tl-sm'
      }`}>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-violet-600/90' : 'text-gray-900'}`}>
          {msg.content}
        </p>
        {msg.timestamp && (
          <p className="text-purple-300 text-xs mt-1">
            {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Thinking ────────────────────────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-indigo-500/20">
        <Bot size={14} className="text-indigo-400" />
      </div>
      <div className="bg-violet-50 border border-violet-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400/60"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── API Key Modal ────────────────────────────────────────────────────────────
function ApiKeyModal({ onSave, onClose }) {
  const [key, setKey] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white border border-violet-200 rounded-2xl p-5 w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-semibold">Configurar API Key</h3>
          <button onClick={onClose} className="text-purple-400 hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-purple-400 text-xs mb-3 leading-relaxed">
          Ingresa tu Anthropic API key. Se guarda solo en tu dispositivo, nunca sale de aquí.
        </p>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/50 mb-3 font-mono"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-700 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => { if (key.trim()) { onSave(key.trim()); onClose() } }}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Memoria Panel ────────────────────────────────────────────────────────────
function MemoriaPanel({ onClose }) {
  const [entradas, setEntradas] = useState(() => storage.get(MEMORIA_KEY, []))
  const [nuevaNota, setNuevaNota]   = useState('')
  const [nuevaCat,  setNuevaCat]    = useState('general')
  const [adding, setAdding]         = useState(false)

  const deleteEntrada = (id) => {
    const updated = entradas.filter(e => e.id !== id)
    storage.set(MEMORIA_KEY, updated)
    setEntradas(updated)
  }

  const addManual = () => {
    if (!nuevaNota.trim()) return
    const entry = {
      id:        `m${Date.now()}`,
      fecha:     new Date().toISOString().split('T')[0],
      categoria: nuevaCat,
      nota:      nuevaNota.trim(),
      manual:    true,
    }
    const updated = [...entradas, entry]
    storage.set(MEMORIA_KEY, updated)
    setEntradas(updated)
    setNuevaNota('')
    setAdding(false)
  }

  const clearAll = () => {
    if (window.confirm('¿Borrar toda la memoria aprendida?')) {
      storage.set(MEMORIA_KEY, [])
      setEntradas([])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-lg animate-fade-in" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-violet-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-violet-600" />
            <div>
              <h3 className="text-gray-900 font-semibold">Memoria aprendida</h3>
              <p className="text-purple-300 text-xs">{entradas.length} nota{entradas.length !== 1 ? 's' : ''} guardada{entradas.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {entradas.length > 0 && (
              <button onClick={clearAll} className="text-rose-400 text-xs hover:text-rose-600 transition-colors">
                Borrar todo
              </button>
            )}
            <button onClick={onClose} className="text-purple-400 hover:text-gray-900 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {entradas.length === 0 && (
            <div className="text-center py-10">
              <Brain size={32} className="text-violet-200 mx-auto mb-3" />
              <p className="text-purple-300 text-sm">La coach irá guardando aquí<br/>lo que va aprendiendo de ti.</p>
            </div>
          )}
          {entradas.map(e => {
            const cat = MEMORIA_CATS[e.categoria] || MEMORIA_CATS.general
            return (
              <div key={e.id} className="flex items-start gap-3 bg-violet-50 rounded-2xl p-3 border border-violet-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-purple-300 text-[10px]">{e.fecha}</span>
                    {e.manual && <span className="text-purple-300 text-[10px]">· manual</span>}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{e.nota}</p>
                </div>
                <button
                  onClick={() => deleteEntrada(e.id)}
                  className="text-purple-200 hover:text-rose-400 transition-colors flex-shrink-0 mt-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add manual */}
        <div className="px-5 pb-6 pt-3 border-t border-violet-100 flex-shrink-0">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-violet-300 rounded-xl text-violet-600 text-sm hover:bg-violet-50 transition-colors"
            >
              <Plus size={14} />
              Añadir nota manualmente
            </button>
          ) : (
            <div className="space-y-2">
              <select
                value={nuevaCat}
                onChange={e => setNuevaCat(e.target.value)}
                className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-400"
              >
                {Object.entries(MEMORIA_CATS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <textarea
                value={nuevaNota}
                onChange={e => setNuevaNota(e.target.value)}
                placeholder="Escribe una nota sobre Ella..."
                rows={2}
                className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setAdding(false); setNuevaNota('') }}
                  className="flex-1 py-2 rounded-xl border border-violet-200 text-purple-700 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={addManual}
                  disabled={!nuevaNota.trim()}
                  className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-semibold text-sm disabled:opacity-40 active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Suggestions ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "¿Qué debo comer antes del 10K?",
  "Dame un plan de tapering para la semana previa",
  "¿Cómo hidratarme bien corriendo en Dubai?",
  "Ayúdame a calmar los nervios pre-carrera",
]

// ─── Main ChatIA ──────────────────────────────────────────────────────────────
export default function ChatIA() {
  const [messages,      setMessages]      = useState(() => storage.get(KEYS.CHAT, []))
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [apiKey,        setApiKey]        = useState(() =>
    import.meta.env.VITE_CLAUDE_API_KEY || localStorage.getItem('ella_api_key') || ''
  )
  const [showApiModal,  setShowApiModal]  = useState(false)
  const [showMemoria,   setShowMemoria]   = useState(false)
  const [error,         setError]         = useState(null)
  const [actionToast,   setActionToast]   = useState(null)
  const [memoriaCount,  setMemoriaCount]  = useState(() => storage.get(MEMORIA_KEY, []).length)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    storage.set(KEYS.CHAT, messages)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveKey = (key) => {
    localStorage.setItem('ella_api_key', key)
    setApiKey(key)
  }

  // ─── Apply ella_action blocks ───────────────────────────────────────────────
  const applyActions = (text) => {
    const regex = /<ella_action>([\s\S]*?)<\/ella_action>/g
    let match
    const applied = []

    while ((match = regex.exec(text)) !== null) {
      try {
        const { action, data } = JSON.parse(match[1])

        if (action === 'update_running_plan' && Array.isArray(data)) {
          storage.set(RUNNING_PLAN_KEY, data)
          applied.push('Plan de running actualizado')

        } else if (action === 'update_strength_plan' && typeof data === 'object') {
          storage.set(STRENGTH_PLAN_KEY, data)
          applied.push('Plan de fuerza actualizado')

        } else if (action === 'update_milestone_progress' && data?.id) {
          const hitos = storage.get(KEYS.HITOS, [])
          storage.set(KEYS.HITOS, hitos.map(h => h.id === data.id ? { ...h, ...data } : h))
          applied.push('Hito actualizado')

        } else if (action === 'add_milestone' && data) {
          const hitos = storage.get(KEYS.HITOS, [])
          storage.set(KEYS.HITOS, [...hitos, { id: `h${Date.now()}`, completado: false, ...data }])
          applied.push('Nuevo hito creado')

        } else if (action === 'save_coach_memory' && data?.nota) {
          const memoria = storage.get(MEMORIA_KEY, [])
          const entry = {
            id:        `m${Date.now()}`,
            fecha:     new Date().toISOString().split('T')[0],
            categoria: data.categoria || 'general',
            nota:      data.nota,
          }
          const updated = [...memoria, entry]
          storage.set(MEMORIA_KEY, updated)
          setMemoriaCount(updated.length)
          applied.push('📓 Guardado en memoria')

        } else if (action === 'add_meal' && data?.nombre) {
          const today   = new Date().toISOString().split('T')[0]
          const hora    = data.hora || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          const comidas = storage.get('ella_comidas', [])
          comidas.push({
            id:          `c${Date.now()}`,
            fecha:       today,
            nombre:      data.nombre,
            hora,
            descripcion: data.descripcion || '',
            energia:     data.energia     || '🙂 Normal',
            digestion:   data.digestion   || '😊 Perfecta',
            notas:       data.notas       || '',
          })
          storage.set('ella_comidas', comidas)
          applied.push(`🍽️ "${data.nombre}" añadido a nutrición`)

        } else if (action === 'add_water' && data?.ml) {
          const today   = new Date().toISOString().split('T')[0]
          const hidraKey = `ella_hidra_${today}`
          const actual   = storage.get(hidraKey, 0)
          storage.set(hidraKey, actual + Number(data.ml))
          applied.push(`💧 +${data.ml}ml de agua registrados`)

        } else if (action === 'add_habito' && data?.nombre) {
          const config  = storage.get('ella_habitos_config', { manana: [], noche: [] })
          const seccion = data.seccion === 'noche' ? 'noche' : 'manana'
          const nuevo   = { id: `h${Date.now()}`, nombre: data.nombre, emoji: data.emoji || '✅' }
          config[seccion] = [...(config[seccion] || []), nuevo]
          storage.set('ella_habitos_config', config)
          applied.push(`✅ Hábito "${data.nombre}" añadido a ${seccion}`)

        } else if (action === 'check_habito' && data?.nombre) {
          const today    = new Date().toISOString().split('T')[0]
          const config   = storage.get('ella_habitos_config', { manana: [], noche: [] })
          const todos    = [...(config.manana || []), ...(config.noche || [])]
          const buscar   = data.nombre.toLowerCase()
          const habito   = todos.find(h => h.nombre.toLowerCase().includes(buscar))
          if (habito) {
            const checksKey = `ella_habitos_check_${today}`
            const checks    = storage.get(checksKey, {})
            checks[habito.id] = true
            storage.set(checksKey, checks)
            applied.push(`✅ Hábito "${habito.nombre}" marcado como hecho`)
          }

        } else if (action === 'add_diario' && data?.texto) {
          const entradas = storage.get('ella_diario', [])
          entradas.unshift({
            id:     `d${Date.now()}`,
            titulo: data.titulo || '',
            texto:  data.texto,
            mood:   data.mood   || null,
            fecha:  new Date().toISOString(),
            editado: null,
            from_coach: true,
          })
          storage.set('ella_diario', entradas)
          applied.push('📓 Entrada añadida al diario')
        }
      } catch {
        // malformed JSON — ignore
      }
    }

    if (applied.length) {
      window.dispatchEvent(new Event('ella_update'))
      setActionToast(applied.join(' · '))
      setTimeout(() => setActionToast(null), 3500)
    }

    return text.replace(/<ella_action>[\s\S]*?<\/ella_action>/g, '').trim()
  }

  // ─── Send message ───────────────────────────────────────────────────────────
  const handleSend = async (text = input) => {
    const msg = text.trim()
    if (!msg || loading) return
    if (!apiKey) { setShowApiModal(true); return }

    setError(null)
    const userMsg    = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: buildSystemPrompt(),
          messages: newMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || `Error ${response.status}`)
      }

      const data       = await response.json()
      const rawText    = data.content[0].text
      const displayText = applyActions(rawText)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: displayText,
        timestamp: new Date().toISOString(),
      }])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    if (window.confirm('¿Borrar historial del chat? La memoria aprendida se conserva.')) {
      setMessages([])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {showApiModal && (
        <ApiKeyModal onSave={handleSaveKey} onClose={() => setShowApiModal(false)} />
      )}
      {showMemoria && (
        <MemoriaPanel onClose={() => { setShowMemoria(false); setMemoriaCount(storage.get(MEMORIA_KEY, []).length) }} />
      )}

      {/* Action toast */}
      {actionToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-violet-600 text-white text-xs font-semibold rounded-2xl px-4 py-2.5 shadow-lg">
            <Zap size={13} className="text-violet-200" />
            {actionToast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-violet-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/20">
              <Sparkles size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold">Coach IA</h2>
              <p className="text-purple-300 text-xs">{apiKey ? 'Conectada' : 'Sin API key'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Memoria button */}
            <button
              onClick={() => setShowMemoria(true)}
              className="relative flex items-center gap-1.5 text-purple-400 hover:text-violet-600 transition-colors"
            >
              <Brain size={16} />
              {memoriaCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {memoriaCount > 9 ? '9+' : memoriaCount}
                </span>
              )}
            </button>
            {messages.length > 0 && (
              <button onClick={handleClearChat} className="text-purple-300 hover:text-purple-400 text-xs transition-colors">
                Borrar
              </button>
            )}
            <button onClick={() => setShowApiModal(true)} className="text-purple-300 hover:text-purple-700 transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="animate-fade-in">
            <div className="text-center py-8 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={28} className="text-indigo-600" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">Tu Coach Personal</p>
              <p className="text-purple-400 text-sm leading-relaxed max-w-xs mx-auto">
                Estoy aquí para ayudarte con tu entrenamiento, nutrición y bienestar. ¡Pregúntame lo que quieras!
              </p>
              {!apiKey && (
                <button
                  onClick={() => setShowApiModal(true)}
                  className="mt-4 text-violet-600 text-sm border border-violet-500/30 rounded-xl px-4 py-2 hover:bg-violet-600/10 transition-colors"
                >
                  Configurar API Key
                </button>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-purple-300 text-xs uppercase tracking-wider mb-2">Sugerencias</p>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-purple-700 text-sm hover:border-violet-200 hover:text-gray-900 transition-all active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={msg.timestamp ? `${msg.role}-${msg.timestamp}` : i} msg={msg} />)}
        {loading && <ThinkingBubble />}

        {error && (
          <div className="flex gap-2 items-start bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 animate-fade-in">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-300 text-xs leading-relaxed">{error}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 border-t border-violet-100 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escríbeme algo..."
            rows={1}
            className="flex-1 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40 transition-colors resize-none leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-95 transition-all self-end"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
        <p className="text-slate-300 text-xs text-center mt-2">Enter para enviar · Shift+Enter para nueva línea</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
