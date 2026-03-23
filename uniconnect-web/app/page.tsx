'use client'

import { useState, useEffect, useCallback } from 'react'

interface Alumno {
  matricula: number
  nombre: string
  paterno: string
  materno: string
  genero: string
  edad: number
  pais: string
  residencia: string
  plan: string
  modalidad: string
  tipo_alumno: string
}

export default function Home() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [loading, setLoading] = useState(true)
  const [likes, setLikes] = useState<number[]>([])

  const fetchAlumnos = useCallback(async () => {
    try {
      const res = await fetch('/api/alumnos?limit=20')
      const data = await res.json()
      setAlumnos(data)
      setCurrentIndex(0)
    } catch (error) {
      console.error('Error fetching alumnos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlumnos()
  }, [fetchAlumnos])

  const handleSwipe = (dir: 'left' | 'right') => {
    setDirection(dir)
    if (dir === 'right') {
      setLikes(prev => [...prev, alumnos[currentIndex].matricula])
    }
    setTimeout(() => {
      setDirection(null)
      if (currentIndex < alumnos.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setLoading(true)
        fetchAlumnos()
      }
    }, 300)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || !alumnos[currentIndex]) return
      if (e.key === 'ArrowLeft') handleSwipe('left')
      if (e.key === 'ArrowRight') handleSwipe('right')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const alumno = alumnos[currentIndex]

  const getInitials = (a: Alumno) => {
    return `${a.nombre.charAt(0)}${a.paterno.charAt(0)}`
  }

  const getColor = (a: Alumno) => {
    const colors = [
      'from-pink-500 to-rose-500',
      'from-violet-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-red-500 to-pink-500',
    ]
    return colors[a.matricula % colors.length]
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">Buscando alumnos...</p>
        </div>
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <p className="text-2xl text-gray-500">No hay más alumnos por ahora</p>
          <button
            onClick={() => { setLoading(true); fetchAlumnos() }}
            className="mt-4 rounded-full bg-pink-500 px-8 py-3 text-white font-semibold hover:bg-pink-600 transition"
          >
            Cargar más
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Tinder UM
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {likes.length} likes &middot; {currentIndex + 1}/{alumnos.length}
        </p>
      </div>

      {/* Card */}
      <div
        className={`relative w-full max-w-sm transition-all duration-300 ease-out ${
          direction === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' :
          direction === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' : ''
        }`}
      >
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Avatar / Color Header */}
          <div className={`flex h-64 items-center justify-center bg-gradient-to-br ${getColor(alumno)}`}>
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-5xl font-bold text-white">{getInitials(alumno)}</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-6">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {alumno.nombre}
              </h2>
              <span className="text-xl text-gray-500">{alumno.edad}</span>
            </div>
            <p className="text-gray-600">
              {alumno.paterno} {alumno.materno}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-700">
                {alumno.plan}
              </span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                {alumno.modalidad}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {alumno.tipo_alumno}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <span>{alumno.pais}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <span>{alumno.residencia}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <span>{alumno.genero}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <span>{alumno.matricula}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-6">
        <button
          onClick={() => handleSwipe('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg text-3xl hover:bg-red-50 hover:shadow-xl transition active:scale-90"
        >
          ✕
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg text-3xl hover:bg-green-50 hover:shadow-xl transition active:scale-90"
        >
          ♥
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Usa ← → del teclado o los botones
      </p>
    </div>
  )
}
