import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, Loader, ArrowLeft } from 'lucide-react'

// ─── Shared input ─────────────────────────────────────────────────────────────
function Field({ icon: Icon, type, value, onChange, placeholder, required, autoFocus, rightEl }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full bg-violet-50 border border-violet-200 rounded-2xl pl-10 pr-10 py-3.5 text-gray-900 text-sm placeholder-violet-300 focus:outline-none focus:border-violet-400 transition-colors"
      />
      {rightEl && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
    </div>
  )
}

function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <p className="text-rose-500 text-xs text-center bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
      {msg}
    </p>
  )
}

// ─── Logo header ──────────────────────────────────────────────────────────────
function LogoHeader() {
  return (
    <div className="mb-8 text-center">
      <img
        src="/logo-dark.png"
        alt="Ella APP"
        className="w-20 h-20 rounded-3xl mx-auto mb-4 shadow-lg shadow-violet-200"
      />
      <h1 className="text-violet-600 font-black text-3xl tracking-[0.25em]">ELLA</h1>
      <p className="text-purple-400 text-sm mt-1">Tu coach personal de running</p>
    </div>
  )
}

// ─── Main AuthGate ────────────────────────────────────────────────────────────
export default function AuthGate() {
  // 'login' | 'signup' | 'recovery' | 'recovery_sent'
  const [screen,  setScreen]  = useState('login')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Fields
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)

  const reset = (s) => {
    setError('')
    setPassword('')
    setConfirm('')
    setShowPass(false)
    setShowConf(false)
    setScreen(s)
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      // onAuthStateChange in App.jsx handles the rest
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirma tu correo antes de iniciar sesión.')
      } else {
        setError(msg || 'Error al iniciar sesión. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      // Supabase auto-confirms or sends email depending on settings
      // If email confirmation disabled, user is logged in immediately
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Este correo ya tiene una cuenta. Inicia sesión.')
      } else {
        setError(msg || 'Error al crear la cuenta.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Password recovery ──────────────────────────────────────────────────────
  const handleRecovery = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      if (error) throw error
      setScreen('recovery_sent')
    } catch (err) {
      setError(err.message || 'Error al enviar el correo de recuperación.')
    } finally {
      setLoading(false)
    }
  }

  const PasswordToggle = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} className="text-purple-300 hover:text-purple-500 transition-colors">
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  )

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <LogoHeader />

      {/* ── Recovery sent ── */}
      {screen === 'recovery_sent' && (
        <div className="w-full text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Revisa tu correo</h2>
            <p className="text-purple-400 text-sm mt-1 leading-relaxed">
              Enviamos un link para restablecer tu contraseña a<br />
              <span className="text-violet-600 font-medium">{email}</span>
            </p>
          </div>
          <p className="text-purple-300 text-xs leading-relaxed">
            Haz click en el enlace del correo para crear una nueva contraseña.
          </p>
          <button
            onClick={() => reset('login')}
            className="text-violet-600 text-sm font-medium underline underline-offset-2"
          >
            Volver al inicio de sesión
          </button>
        </div>
      )}

      {/* ── Recovery form ── */}
      {screen === 'recovery' && (
        <form onSubmit={handleRecovery} className="w-full space-y-4 animate-fade-in">
          <div>
            <h2 className="text-gray-900 font-bold text-xl text-center mb-1">Recuperar contraseña</h2>
            <p className="text-purple-400 text-sm text-center leading-relaxed">
              Te enviamos un link para crear<br />una nueva contraseña
            </p>
          </div>

          <Field
            icon={Mail} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com" required autoFocus
          />

          <ErrorBox msg={error} />

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? <><Loader size={16} className="animate-spin" /> Enviando...</> : <>Enviar link de recuperación <ArrowRight size={16} /></>}
          </button>

          <button type="button" onClick={() => reset('login')}
            className="w-full flex items-center justify-center gap-1.5 text-purple-400 text-sm hover:text-violet-600 transition-colors"
          >
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </button>
        </form>
      )}

      {/* ── Signup form ── */}
      {screen === 'signup' && (
        <form onSubmit={handleSignup} className="w-full space-y-4 animate-fade-in">
          <div>
            <h2 className="text-gray-900 font-bold text-xl text-center mb-1">Crear cuenta</h2>
            <p className="text-purple-400 text-sm text-center">Completa tus datos para registrarte</p>
          </div>

          <Field icon={Mail} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com" required autoFocus
          />
          <Field icon={Lock} type={showPass ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña (mín. 6 caracteres)" required
            rightEl={<PasswordToggle show={showPass} onToggle={() => setShowPass(v => !v)} />}
          />
          <Field icon={Lock} type={showConf ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmar contraseña" required
            rightEl={<PasswordToggle show={showConf} onToggle={() => setShowConf(v => !v)} />}
          />

          <ErrorBox msg={error} />

          <button
            type="submit"
            disabled={loading || !email.trim() || !password || !confirm}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? <><Loader size={16} className="animate-spin" /> Creando cuenta...</> : <>Crear cuenta <ArrowRight size={16} /></>}
          </button>

          <p className="text-center text-sm text-purple-400">
            ¿Ya tienes cuenta?{' '}
            <button type="button" onClick={() => reset('login')} className="text-violet-600 font-semibold hover:underline">
              Iniciar sesión
            </button>
          </p>
        </form>
      )}

      {/* ── Login form ── */}
      {screen === 'login' && (
        <form onSubmit={handleLogin} className="w-full space-y-4 animate-fade-in">
          <div>
            <h2 className="text-gray-900 font-bold text-xl text-center mb-1">Iniciar sesión</h2>
            <p className="text-purple-400 text-sm text-center">Bienvenida de vuelta 👋</p>
          </div>

          <Field icon={Mail} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com" required autoFocus
          />
          <Field icon={Lock} type={showPass ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña" required
            rightEl={<PasswordToggle show={showPass} onToggle={() => setShowPass(v => !v)} />}
          />

          <div className="flex justify-end -mt-1">
            <button type="button" onClick={() => { setError(''); setScreen('recovery') }}
              className="text-purple-400 text-xs hover:text-violet-600 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <ErrorBox msg={error} />

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? <><Loader size={16} className="animate-spin" /> Entrando...</> : <>Entrar <ArrowRight size={16} /></>}
          </button>

          <p className="text-center text-sm text-purple-400">
            ¿No tienes cuenta?{' '}
            <button type="button" onClick={() => reset('signup')} className="text-violet-600 font-semibold hover:underline">
              Registrarse
            </button>
          </p>
        </form>
      )}
    </div>
  )
}
