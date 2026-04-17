import { useState, useEffect, useRef } from 'react'
import { Plus, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Upload, Loader, FileText, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { storage } from '../utils/storage'

const INBODY_KEY = 'ella_inbody'

const MEDICIONES_INICIALES = [
  {
    id: 'ib1', fecha: '2026-01-15', peso: 62.5, grasa_pct: 24.2, musculo_kg: 44.1,
    agua_pct: 57.3, imc: 22.8, metabolismo_basal: 1380, visceral: 3, notas: 'Medición inicial de referencia'
  },
  {
    id: 'ib2', fecha: '2026-02-20', peso: 61.8, grasa_pct: 23.6, musculo_kg: 44.5,
    agua_pct: 58.1, imc: 22.5, metabolismo_basal: 1392, visceral: 3, notas: 'Progreso visible, más musculo'
  },
  {
    id: 'ib3', fecha: '2026-03-25', peso: 61.2, grasa_pct: 22.9, musculo_kg: 45.0,
    agua_pct: 58.8, imc: 22.3, metabolismo_basal: 1405, visceral: 2, notas: 'Muy buena respuesta al entrenamiento'
  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs">
      <p className="text-purple-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function DeltaBadge({ val }) {
  if (val === 0) return <span className="text-purple-300 text-xs flex items-center gap-0.5"><Minus size={10} />0</span>
  if (val > 0) return <span className="text-emerald-400 text-xs flex items-center gap-0.5"><TrendingUp size={10} />+{val.toFixed(1)}</span>
  return <span className="text-rose-400 text-xs flex items-center gap-0.5"><TrendingDown size={10} />{val.toFixed(1)}</span>
}

function MetricCard({ label, value, unit, delta, highlight }) {
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
    onSave({ id: `ib${Date.now()}`, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, isNaN(+v) || v === '' ? v : +v])) })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50 rounded-2xl border border-violet-500/20 p-4 space-y-3 animate-fade-in">
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Nueva medición InBody</h3>

      <div className="grid grid-cols-2 gap-3">
        {[
          { k: 'fecha', label: 'Fecha', type: 'date', req: true },
          { k: 'peso', label: 'Peso (kg)', type: 'number', step: '0.1', req: true },
          { k: 'grasa_pct', label: 'Grasa corporal (%)', type: 'number', step: '0.1' },
          { k: 'musculo_kg', label: 'Masa muscular (kg)', type: 'number', step: '0.1' },
          { k: 'agua_pct', label: 'Agua corporal (%)', type: 'number', step: '0.1' },
          { k: 'imc', label: 'IMC', type: 'number', step: '0.1' },
          { k: 'metabolismo_basal', label: 'Metab. basal (kcal)', type: 'number' },
          { k: 'visceral', label: 'Grasa visceral', type: 'number' },
        ].map(({ k, label, type, step, req }) => (
          <div key={k} className={k === 'fecha' ? 'col-span-2' : ''}>
            <label className="text-purple-400 text-xs mb-1 block">{label}</label>
            <input type={type} step={step} value={form[k]} onChange={f(k)} required={req}
              className="w-full bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-500/40"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-purple-400 text-xs mb-1 block">Notas</label>
        <textarea value={form.notas} onChange={f('notas')} rows={2} placeholder="Observaciones de la medición..."
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
      if (!apiKey) throw new Error('Configura tu API key de Claude en el chat antes de subir un PDF.')

      // Read as base64
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
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 },
              },
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
      <h3 className="text-violet-600 text-sm font-semibold uppercase tracking-wide">Subir reporte InBody</h3>
      <p className="text-purple-400 text-xs leading-relaxed">
        Claude analizará tu PDF y extraerá los datos automáticamente.
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
          <>
            <Loader size={16} className="text-violet-500 animate-spin" />
            <span className="text-violet-600 text-sm font-medium">Analizando PDF...</span>
          </>
        ) : (
          <>
            <Upload size={16} className="text-purple-400" />
            <span className="text-purple-400 text-sm">{fileName || 'Seleccionar PDF'}</span>
          </>
        )}
      </label>
    </div>
  )
}

export default function InBody() {
  const [mediciones, setMediciones] = useState(() => storage.get(INBODY_KEY, MEDICIONES_INICIALES))
  const [showForm, setShowForm] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [grafico, setGrafico] = useState('peso')

  useEffect(() => { storage.set(INBODY_KEY, mediciones) }, [mediciones])

  const sorted = [...mediciones].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const latest = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]

  const delta = (key) => latest && prev && latest[key] && prev[key] ? +(latest[key] - prev[key]).toFixed(2) : undefined

  const chartData = sorted.map(m => ({
    fecha: m.fecha.slice(5),
    Peso: m.peso,
    'Grasa %': m.grasa_pct,
    'Músculo kg': m.musculo_kg,
  }))

  const GRAFICOS = [
    { key: 'peso', label: 'Peso', dataKey: 'Peso', color: '#9333EA', unit: 'kg' },
    { key: 'grasa', label: 'Grasa', dataKey: 'Grasa %', color: '#f87171', unit: '%' },
    { key: 'musculo', label: 'Músculo', dataKey: 'Músculo kg', color: '#34d399', unit: 'kg' },
  ]

  const activeChart = GRAFICOS.find(g => g.key === grafico)

  return (
    <div className="animate-fade-in pb-4">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 text-2xl font-bold">Composición</h2>
            <p className="text-purple-400 text-xs mt-0.5">{mediciones.length} mediciones registradas</p>
          </div>
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
        </div>
      </div>

      <div className="px-4 space-y-4">
        {showPdf && (
          <PdfUpload onParsed={(parsed) => {
            const now = new Date().toISOString().split('T')[0]
            const m = { id: `ib${Date.now()}`, fecha: now, notas: 'Importado desde PDF', ...parsed }
            setMediciones(prev => [...prev, m])
            setShowPdf(false)
          }} />
        )}
        {showForm && <NuevaMedicionForm onSave={(m) => { setMediciones(prev => [...prev, m]); setShowForm(false) }} onCancel={() => setShowForm(false)} />}

        {/* Última medición */}
        {latest && (
          <>
            <p className="text-purple-400 text-xs uppercase tracking-wider">
              Última medición · {new Date(latest.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Peso" value={latest.peso} unit="kg" delta={delta('peso')} highlight />
              <MetricCard label="Grasa corporal" value={latest.grasa_pct} unit="%" delta={delta('grasa_pct')} />
              <MetricCard label="Masa muscular" value={latest.musculo_kg} unit="kg" delta={delta('musculo_kg')} />
              <MetricCard label="Agua corporal" value={latest.agua_pct} unit="%" delta={delta('agua_pct')} />
              {latest.metabolismo_basal && (
                <MetricCard label="Metab. basal" value={latest.metabolismo_basal} unit="kcal" />
              )}
              {latest.visceral !== '' && latest.visceral !== undefined && (
                <MetricCard label="Grasa visceral" value={latest.visceral} unit="" />
              )}
            </div>
            {latest.notas && (
              <p className="text-purple-400 text-xs italic px-1">{latest.notas}</p>
            )}
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
                <Line
                  type="monotone"
                  dataKey={activeChart.dataKey}
                  stroke={activeChart.color}
                  strokeWidth={2}
                  dot={{ fill: activeChart.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Historial */}
        {mediciones.length > 1 && (
          <div>
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full py-2 text-purple-400 text-xs uppercase tracking-wider hover:text-purple-700">
              <span>Todas las mediciones ({mediciones.length})</span>
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHistory && (
              <div className="space-y-2 animate-fade-in">
                {[...mediciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(m => (
                  <div key={m.id} className="bg-violet-50 rounded-xl border border-violet-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-purple-700 text-xs font-medium">
                        {new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-violet-600 font-bold">{m.peso} kg</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {m.grasa_pct && <span className="text-purple-400">Grasa: <span className="text-purple-700">{m.grasa_pct}%</span></span>}
                      {m.musculo_kg && <span className="text-purple-400">Músc: <span className="text-purple-700">{m.musculo_kg}kg</span></span>}
                      {m.imc && <span className="text-purple-400">IMC: <span className="text-purple-700">{m.imc}</span></span>}
                    </div>
                    {m.notas && <p className="text-purple-300 text-xs mt-1 italic">{m.notas}</p>}
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
