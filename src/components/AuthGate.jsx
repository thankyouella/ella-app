import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { Mail, ArrowRight, CheckCircle, Loader } from 'lucide-react'

export default function AuthGate() {
  const [email, setEmail]   = useState('')
  const [step, setStep]     = useState('input')  // 'input' | 'sending' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStep('sending')
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setStep('sent')
    } catch (err) {
      setErrorMsg(err.message || 'Error al enviar el enlace. Intenta de nuevo.')
      setStep('error')
    }
  }

  return (
    <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 max-w-md mx-auto">

      {/* Logo */}
      <div className="mb-8 text-center">
        <img
          src="/logo-dark.png"
          alt="Ella APP"
          className="w-20 h-20 rounded-3xl mx-auto mb-4 shadow-lg shadow-violet-200"
        />
        <h1 className="text-violet-600 font-black text-3xl tracking-[0.25em]">ELLA</h1>
        <p className="text-purple-400 text-sm mt-1">Tu app de coaching personal</p>
      </div>

      {step === 'sent' ? (
        /* ── Success state ── */
        <div className="w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Revisa tu correo</h2>
            <p className="text-purple-400 text-sm mt-1 leading-relaxed">
              Enviamos un enlace de acceso a<br />
              <span className="text-violet-600 font-medium">{email}</span>
            </p>
          </div>
          <p className="text-purple-300 text-xs leading-relaxed">
            Haz click en el enlace del correo para entrar a la app.<br />
            Puedes cerrar esta pantalla.
          </p>
          <button
            onClick={() => setStep('input')}
            className="text-purple-400 text-xs underline underline-offset-2"
          >
            Usar otro correo
          </button>
        </div>
      ) : (
        /* ── Input state ── */
        <form onSubmit={handleSend} className="w-full space-y-4">
          <div>
            <h2 className="text-gray-900 font-bold text-xl text-center mb-1">Accede a tu app</h2>
            <p className="text-purple-400 text-sm text-center leading-relaxed">
              Introduce tu correo y te enviamos<br />un enlace de acceso instantáneo
            </p>
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoFocus
              className="w-full bg-violet-50 border border-violet-200 rounded-2xl pl-10 pr-4 py-3.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
            />
          </div>

          {step === 'error' && (
            <p className="text-rose-500 text-xs text-center bg-rose-50 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={step === 'sending' || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {step === 'sending' ? (
              <>
                <Loader size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar enlace de acceso
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="text-purple-300 text-[11px] text-center leading-relaxed">
            Sin contraseñas. Solo tú tienes acceso.
          </p>
        </form>
      )}
    </div>
  )
}
