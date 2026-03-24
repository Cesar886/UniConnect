'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { loginUser, loginWithGoogle } from '@/app/actions/auth'
import { useGoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const router = useRouter()
  const { login, updateProfile } = useApp()

  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      setError('')
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo = await userInfoRes.json()
        const res = await loginWithGoogle(userInfo.email)
        if (res.success && res.user?.matricula) {
          updateProfile({ name: res.user?.nombre || 'Usuario' })
          await login(res.user.matricula)
          router.push('/')
        } else {
          setError(res.error || 'No se encontró una cuenta con ese correo de Google.')
          setLoading(false)
        }
      } catch {
        setError('Error al conectar con Google.')
        setLoading(false)
      }
    },
    onError: () => {
      setError('No se pudo iniciar sesión con Google.')
    },
  })

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

          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

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
