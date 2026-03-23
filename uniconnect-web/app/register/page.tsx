'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login, updateProfile } = useApp()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.endsWith('@alumno.um.edu.mx') && !email.endsWith('@um.edu.mx')) {
      setError('Solo se permiten correos institucionales')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    // Simular registro
    setTimeout(() => {
      updateProfile({ name: fullName })
      login()
      setLoading(false)
      router.push('/')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-pink-500 to-rose-500 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white">UniConnect</h1>
          <p className="text-white/60 mt-1">Crea tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Registro</h2>
          <p className="text-gray-400 text-sm mb-6">Solo para alumnos de la universidad</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre completo</label>
              <input
                type="text"
                placeholder="Tu nombre"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Correo institucional</label>
              <input
                type="email"
                placeholder="tu@alumno.um.edu.mx"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-pink-500 font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
