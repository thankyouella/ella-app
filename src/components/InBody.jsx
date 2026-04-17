import { useState, useEffect, useRef } from 'react'
import { Plus, TrendingUp, TrendingDown, Minus, Upload, Loader, FileText, AlertCircle, Trash2, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { storage } from '../utils/storage'

const INBODY_KEY = 'ella_inbody'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs shadow-md">
      <p className="text-purple-700 mb-1 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function DeltaBadge({ val }) {
  if (val === 0 || val === undefined) return null
  if (val > 0) return <span className="text-emerald-400 text-xs flex items-center gap-0.5"><TrendingUp size={10} />+{val.toFixed(1)}</span>
  return <span className="text-rose-400 text-xs flex items-center gap-0.5"><TrendingDown size={10} />{val.toFixed(1)}</span>
}

function MetricCard({ label, value, unit, delta, highlight }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className={`bg-violet-50 rounded-2xl border p-4 ${highlight ? 'border-violet-500/20' : 'border-violet-100'}`}>
      <p className="text-purple-400 text-xs mb-1">{label}</p>
      <p className="text-gray-900 font-bold text-xl">
        {value} <span className="text-purple-400 text-sm font-normal">{unit}</span>
      </p>
      {delta !== undefined && <div className="mt-1"><DeltaBadge val={delta} /></div>}
    </div>
  )
}

function NuevaMedicionForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso: '', grasa_pct: '', musculo_kg: '',
    agua_pct: '', imc: '', metabolismo_basal: '', visceral: '', notas: ''
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.peso) return
    onSave({
      id: `ib${Date.now()}`,
      ...Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : (isNaN(+v) ? v : +v)])
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Nueva medición InBody</h3>

      <div className="grid grid-cols-2 gap-3">
        {[
          { k: 'fecha',            label: 'Fecha',                type: 'date',   req: true },
          { k: 'peso',             label: 'Peso (kg)',            type: 'number', step: '0.1', req: true },
          { k: 'grasa_pct',        label: 'Grasa corporal (%)',   type: 'number', step: '0.1' },
          { k: 'musculo_kg',       label: 'Masa muscular (kg)',   type: 'number', step: '0.1' },
          { k: 'agua_pct',         label: 'Agua corporal (%)',    type: 'number', step: '0.1' },
          { k: 'imc',              label: 'IMC',                  type: 'number', step: '0.1' },
          { k: 'metabolismo_basal',label: 'Metab. basal (kcal)',  type: 'number' },
          { k: 'visceral',         label: 'Grasa visceral',       type: 'number' },
        ].map(({ k, label, type, step, req }) => (
          <div key={k} className={k === 'fecha' ? 'col-span-2' : ''}>
            <label className="text-purple-400 text-xs mb-1 block">{label}</label>
            <input type={type} step={step} value={form[k]} onChange={f(k)} required={req}
              className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-purple-400 text-xs mb-1 block">Notas</label>
        <textarea value={form.notas} onChange={f('notas')} rows={2} placeholder="Observaciones de la medición..."
          className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-200 text-purple-400 text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm active:scale-95">Guardar</button>
      </div>
    </form>
  )
}

function PdfUpload({ onParsed }) {
  const fileRef = useRef(null)
  const [parsing, setParsing] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      setPdfError('Selecciona un archivo PDF válido.')
      return
    }
    setFileName(file.name)
    setPdfError(null)
    setParsing(true)

    try {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || localStorage.getItem('ella_api_key')
      if (!apiKey) throw new Error('Configura tu API key de Claude antes de subir un PDF.')

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

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
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              {
                type: 'text',
                text: `Extrae las métricas de composición corporal de este reporte InBody y devuelve ÚNICAMENTE un objeto JSON válido con estas claves (usa null si no está disponible):
{"peso": number, "grasa_pct": number, "musculo_kg": number, "agua_pct": number, "imc": number, "metabolismo_basal": number, "visceral": number}
No incluyas explicaciones, solo el JSON.`,
              },
            ],
          }],
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || `Error ${response.status}`)
      }

      const data = await response.json()
      const raw = data.content[0].text.trim()
      const jsonStart = raw.indexOf('{')
      const jsonEnd = raw.lastIndexOf('}')
      if (jsonStart === -1) throw new Error('No se pudo extraer el JSON del reporte.')
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
      onParsed(parsed)
    } catch (err) {
      setPdfError(err.message)
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Subir reporte InBody (PDF)</h3>
      <p className="text-purple-400 text-xs leading-relaxed">
        Claude leerá tu PDF y extraerá los datos automáticamente.
      </p>
      {pdfError && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          <AlertCircle size={13} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-rose-700 text-xs">{pdfError}</p>
        </div>
      )}
      <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
        parsing ? 'border-violet-300 bg-violet-100/50' : 'border-violet-300 hover:border-violet-500/50 hover:bg-violet-100/30'
      }`}>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} disabled={parsing} />
        {parsing ? (
          <><Loader size={16} className="text-violet-500 animate-spin" /><span className="text-violet-600 text-sm font-medium">Analizando PDF...</span></>
        ) : (
          <><Upload size={16} className="text-purple-400" /><span className="text-purple-400 text-sm">{fileName || 'Seleccionar PDF'}</span></>
        )}
      </label>
    </div>
  )
}

// ─── Historial card ───────────────────────────────────────────────────────────
function HistorialCard({ m, onDelete, isLatest }) {
  const [confirm, setConfirm] = useState(false)
  const fecha = new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className={`bg-violet-50 rounded-2xl border p-4 animate-fade-in ${isLatest ? 'border-violet-500/30' : 'border-violet-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-purple-400 text-[10px] uppercase tracking-wider">{isLatest ? '📍 Última medición' : 'Medición anterior'}</p>
          <p className="text-gray-900 text-sm font-semibold mt-0.5">{fecha}</p>
        </div>
        {confirm ? (
          <div className="flex gap-1.5">
            <button onClick={() => setConfirm(false)} className="text-[11px] px-2.5 py-1 rounded-lg border border-violet-200 text-purple-400">No</button>
            <button onClick={() => onDelete(m.id)} className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-500 text-white font-medium">Sí, borrar</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="text-purple-300 hover:text-rose-400 transition-colors p-1">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center bg-white rounded-xl py-2 border border-violet-100">
          <p className="text-violet-600 font-bold text-base">{m.peso ?? '—'}</p>
          <p className="text-purple-400 text-[10px]">kg peso</p>
        </div>
        <div className="text-center bg-white rounded-xl py-2 border border-violet-100">
          <p className="text-violet-600 font-bold text-base">{m.grasa_pct ?? '—'}</p>
          <p className="text-purple-400 text-[10px]">% grasa</p>
        </div>
        <div className="text-center bg-white rounded-xl py-2 border border-violet-100">
          <p className="text-violet-600 font-bold text-base">{m.musculo_kg ?? '—'}</p>
          <p className="text-purple-400 text-[10px]">kg músculo</p>
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className="flex flex-wrap gap-2">
        {m.agua_pct != null && (
          <span className="text-[11px] bg-white border border-violet-100 rounded-lg px-2 py-1 text-purple-400">
            💧 Agua: <span className="text-gray-900 font-medium">{m.agua_pct}%</span>
          </span>
        )}
        {m.imc != null && (
          <span className="text-[11px] bg-white border border-violet-100 rounded-lg px-2 py-1 text-purple-400">
            IMC: <span className="text-gray-900 font-medium">{m.imc}</span>
          </span>
        )}
        {m.metabolismo_basal != null && (
          <span className="text-[11px] bg-white border border-violet-100 rounded-lg px-2 py-1 text-purple-400">
            Metab: <span className="text-gray-900 font-medium">{m.metabolismo_basal} kcal</span>
          </span>
        )}
        {m.visceral != null && (
          <span className="text-[11px] bg-white border border-violet-100 rounded-lg px-2 py-1 text-purple-400">
            Visceral: <span className="text-gray-900 font-medium">{m.visceral}</span>
          </span>
        )}
      </div>

      {m.notas && (
        <p className="text-purple-400 text-xs italic mt-2 border-t border-violet-100 pt-2">{m.notas}</p>
      )}
    </div>
  )
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd, onPdf }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mb-4">
        <TrendingUp size={28} className="text-violet-400" />
      </div>
      <h3 className="text-gray-900 font-bold text-base mb-1">Sin mediciones aún</h3>
      <p className="text-purple-400 text-sm leading-relaxed mb-6">
        Añade tu primera medición InBody manualmente o sube el PDF de tu reporte y Claude extraerá los datos automáticamente.
      </p>
      <div className="flex gap-3 w-full">
        <button onClick={onPdf}
          className="flex-1 flex items-center justify-center gap-2 bg-violet-50 border border-violet-200 text-purple-700 font-medium text-sm py-3 rounded-2xl active:scale-95 transition-all">
          <FileText size={16} /> Subir PDF
        </button>
        <button onClick={onAdd}
          className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold text-sm py-3 rounded-2xl active:scale-95 transition-all">
          <Plus size={16} /> Añadir datos
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InBody() {
  const [mediciones, setMediciones] = useState(() => storage.get(INBODY_KEY, []))
  const [showForm,   setShowForm]   = useState(false)
  const [showPdf,    setShowPdf]    = useState(false)
  const [grafico,    setGrafico]    = useState('peso')

  useEffect(() => {
    storage.set(INBODY_KEY, mediciones)
    window.dispatchEvent(new Event('ella_update'))
  }, [mediciones])

  const sorted  = [...mediciones].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const latest  = sorted[sorted.length - 1]
  const prev    = sorted[sorted.length - 2]
  const delta   = (key) => latest && prev && latest[key] != null && prev[key] != null
    ? +(latest[key] - prev[key]).toFixed(2)
    : undefined

  const chartData = sorted.map(m => ({
    fecha: m.fecha.slice(5),
    Peso: m.peso,
    'Grasa %': m.grasa_pct,
    'Músculo kg': m.musculo_kg,
  }))

  const GRAFICOS = [
    { key: 'peso',    label: 'Peso',    dataKey: 'Peso',        color: '#9333EA', unit: 'kg' },
    { key: 'grasa',   label: 'Grasa',   dataKey: 'Grasa %',     color: '#f87171', unit: '%'  },
    { key: 'musculo', label: 'Músculo', dataKey: 'Músculo kg',  color: '#34d399', unit: 'kg' },
  ]
  const activeChart = GRAFICOS.find(g => g.key === grafico)

  const handleDelete = (id) => {
    setMediciones(prev => prev.filter(m => m.id !== id))
  }

  const hasData = mediciones.length > 0

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Composición</h2>
            <p className="text-purple-400 text-xs mt-0.5">
              {hasData ? `${mediciones.length} medición${mediciones.length > 1 ? 'es' : ''} registrada${mediciones.length > 1 ? 's' : ''}` : 'Sin mediciones aún'}
            </p>
          </div>
          {hasData && (
            <div className="flex gap-2">
              <button onClick={() => { setShowPdf(!showPdf); setShowForm(false) }}
                className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center active:scale-95 transition-colors">
                <FileText size={18} className="text-purple-700" />
              </button>
              <button onClick={() => { setShowForm(!showForm); setShowPdf(false) }}
                className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center active:scale-95">
                <Plus size={20} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Formularios */}
        {showPdf && (
          <PdfUpload onParsed={(parsed) => {
            const m = { id: `ib${Date.now()}`, fecha: new Date().toISOString().split('T')[0], notas: 'Importado desde PDF', ...parsed }
            setMediciones(prev => [...prev, m])
            setShowPdf(false)
          }} />
        )}
        {showForm && (
          <NuevaMedicionForm
            onSave={(m) => { setMediciones(prev => [...prev, m]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Estado vacío */}
        {!hasData && !showForm && !showPdf && (
          <EmptyState
            onAdd={() => { setShowForm(true); setShowPdf(false) }}
            onPdf={() => { setShowPdf(true); setShowForm(false) }}
          />
        )}

        {/* Métricas de la última medición */}
        {latest && (
          <>
            <p className="text-purple-400 text-xs uppercase tracking-wider">
              Última medición · {new Date(latest.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Peso"           value={latest.peso}             unit="kg"   delta={delta('peso')}       highlight />
              <MetricCard label="Grasa corporal" value={latest.grasa_pct}        unit="%"    delta={delta('grasa_pct')}  />
              <MetricCard label="Masa muscular"  value={latest.musculo_kg}       unit="kg"   delta={delta('musculo_kg')} />
              <MetricCard label="Agua corporal"  value={latest.agua_pct}         unit="%"    delta={delta('agua_pct')}   />
              <MetricCard label="Metab. basal"   value={latest.metabolismo_basal} unit="kcal" />
              <MetricCard label="Grasa visceral" value={latest.visceral}         unit=""     />
            </div>
            {latest.notas && <p className="text-purple-400 text-xs italic px-1">{latest.notas}</p>}
          </>
        )}

        {/* Gráfico evolución */}
        {sorted.length > 1 && (
          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-purple-700 text-sm font-medium">Evolución</p>
              <div className="flex gap-1">
                {GRAFICOS.map(g => (
                  <button key={g.key} onClick={() => setGrafico(g.key)}
                    className={`text-xs px-2 py-0.5 rounded-lg transition-all ${
                      grafico === g.key ? 'bg-violet-600/20 text-violet-600 border border-violet-500/30' : 'text-purple-300 hover:text-purple-400'
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE9F7" />
                <XAxis dataKey="fecha" tick={{ fill: '#a78bfa', fontSize: 10 }} />
                <YAxis tick={{ fill: '#a78bfa', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={activeChart.dataKey} stroke={activeChart.color}
                  strokeWidth={2} dot={{ fill: activeChart.color, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Historial completo — siempre visible */}
        {sorted.length > 0 && (
          <div className="space-y-3">
            <p className="text-purple-400 text-xs uppercase tracking-wider pt-1">
              Historial de mediciones
            </p>
            {[...mediciones]
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .map((m, i) => (
                <HistorialCard
                  key={m.id}
                  m={m}
                  isLatest={i === 0}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
