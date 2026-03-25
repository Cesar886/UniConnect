'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { loginUser, loginWithGoogle } from '@/app/actions/auth'
import { GoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const router = useRouter()
  const { login, updateProfile } = useApp()

  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('No se recibió token de Google.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Enviamos el id_token al servidor; el backend verifica su firma con Google
      const res = await loginWithGoogle(credentialResponse.credential)
      if (res.success && res.user?.matricula) {
        updateProfile({ name: res.user?.nombre || 'Usuario' })
        await login(res.user.matricula)
        router.push('/')
      } else {
        setError(res.error || 'No se encontró una cuenta con ese correo de Google.')
      }
    } catch {
      setError('Error al conectar con Google.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('identificador', identificador)
    formData.append('password', password)

    const res = await loginUser(formData)

    if (res.success && res.user?.matricula) {
      updateProfile({ name: res.user?.nombre || 'Usuario' })
      await login(res.user.matricula)
      router.push('/')
    } else {
      setError(res.error || 'Ocurrió un error al iniciar sesión.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* Logo Superior */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-violet-500 rounded-2xl mb-4 shadow-xl shadow-pink-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">UniConnect</h1>
          <p className="text-gray-500 mt-2 font-medium">Buscando a tu 100 en la vida real.</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-[2rem] p-8 lg:shadow-[0_20px_50px_rgba(0,0,0,0.06)] ring-1 ring-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Bienvenido de vuelta</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-semibold animate-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">Matrícula o Correo Institucional</label>
              <input
                type="text"
                placeholder="Ej. 1190000 ó estudiante@alumno.um.edu.mx"
                className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="text-gray-900 w-full px-5 py-4 text-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-pink-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !identificador || !password}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-extrabold text-lg rounded-2xl shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(236,72,153,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Conectando...
                  </span>
                ) : (
                  'Entrar al Campus'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">o</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('No se pudo iniciar sesión con Google.')}
              useOneTap={false}
              text="continue_with"
              shape="rectangular"
              width="368"
            />
          </div>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-gray-500 text-sm font-medium">
              ¿Eres nuevo en Tinder UM?{' '}
              <Link href="/register" className="text-pink-500 font-bold hover:text-pink-600 transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
