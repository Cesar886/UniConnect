'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getStudents } from '@/app/actions/students'
import { swipeUser } from '@/app/actions/match'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { safePhotoUrl } from '@/lib/sanitize'

export interface Alumno {
  matricula: number
  nombre: string
  apellidos: string
  carrera: string
  semestre: number
  edad: number
  bio: string
  intereses: string
  genero: string
  foto_perfil: string
  foto2: string
  foto3: string
}

export default function Home() {
  const { userProfile } = useApp()
  const myMatricula = userProfile.matricula
  const router = useRouter()

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)

  // Match Modal State
  const [matchData, setMatchData] = useState<Alumno | null>(null)

  // Touch swipe
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const fetchAlumnosFromDB = useCallback(async () => {
    setLoading(true)
    const data = await getStudents()
    setAlumnos(data || [])
    setCurrentIndex(0)
    setCurrentPhotoIndex(0)
    setLoading(false)
  }, [myMatricula])

  useEffect(() => {
    if (myMatricula) {
      fetchAlumnosFromDB()
    }
  }, [fetchAlumnosFromDB, myMatricula])

  const advanceCard = useCallback(() => {
    setDirection(null)
    setDragX(0)
    if (currentIndex < alumnos.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setCurrentPhotoIndex(0)
    } else {
      fetchAlumnosFromDB()
    }
  }, [currentIndex, alumnos.length, fetchAlumnosFromDB])

  const handleSwipe = async (dir: 'left' | 'right') => {
    if (swiping || loading || !alumnos[currentIndex] || matchData) return
    setSwiping(true)
    setDirection(dir)

    const targetAlumno = alumnos[currentIndex]
    const liked = dir === 'right'

    if (myMatricula) {
      const res = await swipeUser(targetAlumno.matricula, liked)
      if (res.success && res.isMatch) {
        setTimeout(() => {
          setMatchData(targetAlumno)
          setDirection(null)
          setDragX(0)
          setSwiping(false)
        }, 350)
        return
      }
    }

    setTimeout(() => {
      advanceCard()
      setSwiping(false)
    }, 300)
  }

  const closeMatchModal = () => {
    setMatchData(null)
    advanceCard()
  }

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (swiping || loading || !alumnos[currentIndex] || matchData) return
      if (e.key === 'ArrowLeft') handleSwipe('left')
      if (e.key === 'ArrowRight') handleSwipe('right')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [swiping, loading, currentIndex, alumnos, matchData, myMatricula])

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (swiping || matchData) return
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || swiping) return
    const delta = e.touches[0].clientX - touchStartX.current
    touchDeltaX.current = delta
    setDragX(delta)
  }

  const onTouchEnd = () => {
    if (!isDragging || swiping) return
    setIsDragging(false)
    const threshold = 100

    if (touchDeltaX.current > threshold) {
      handleSwipe('right')
    } else if (touchDeltaX.current < -threshold) {
      handleSwipe('left')
    } else {
      setDragX(0)
    }
  }

  // Auto-reload cuando se acaban las cards
  useEffect(() => {
    if (!loading && !matchData && myMatricula && currentIndex >= alumnos.length && alumnos.length > 0) {
      fetchAlumnosFromDB()
    }
  }, [currentIndex, alumnos.length, loading, matchData, myMatricula, fetchAlumnosFromDB])

  // Retry automático si no hay perfiles al cargar
  useEffect(() => {
    if (!loading && myMatricula && alumnos.length === 0) {
      const timer = setTimeout(() => fetchAlumnosFromDB(), 3000)
      return () => clearTimeout(timer)
    }
  }, [loading, myMatricula, alumnos.length, fetchAlumnosFromDB])

  const alumno = alumnos[currentIndex]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col font-sans">
        <div className="inline-block h-14 w-14 animate-spin rounded-full border-[5px] border-pink-100 border-t-pink-500 mb-6 drop-shadow-md"></div>
        <p className="text-xl text-gray-400 font-bold tracking-widest uppercase animate-pulse">Buscando en el campus...</p>
      </div>
    )
  }

  // PANTALLA DE MATCH
  if (matchData) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center font-sans animate-in fade-in duration-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 via-purple-600/40 to-indigo-600/40 backdrop-blur-md"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/50 via-transparent to-transparent blur-3xl saturate-200 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center p-6 text-center">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-pink-400 to-rose-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] tracking-tighter mb-4 animate-in zoom-in slide-in-from-bottom-10 duration-700">
            ¡MATCH!
          </h1>
          <p className="text-xl md:text-2xl font-bold text-white/90 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300">
            Tú y {matchData.nombre} se gustaron
          </p>

          <div className="flex items-center gap-6 md:gap-10 mb-12 animate-in zoom-in-50 duration-700 delay-150">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-[6px] border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transform -rotate-6 relative z-10">
              {userProfile.photo ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={safePhotoUrl(userProfile.photo)} className="w-full h-full object-cover" alt="Me" />
              ) : (
                <span className="text-white/40 text-6xl font-black">{userProfile.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="text-rose-500 animate-pulse drop-shadow-[0_0_30px_rgba(244,63,94,1)] relative z-0 -mx-6 md:-mx-10 mt-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 md:w-20 md:h-20">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            </div>

            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border-[6px] border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transform rotate-6 relative z-10">
              {matchData.foto_perfil ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={safePhotoUrl(matchData.foto_perfil)} alt={matchData.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/40 text-6xl font-black">{matchData.nombre.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-500">
            <button
              onClick={() => {
                setMatchData(null)
                router.push(`/chat?id=${matchData.matricula}`)
              }}
              className="w-full py-5 rounded-full font-black text-lg bg-white text-pink-600 hover:bg-gray-100 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all active:scale-95"
            >
              Enviar Mensaje
            </button>
            <button
              onClick={closeMatchModal}
              className="w-full py-4 rounded-full font-bold text-lg border-2 border-white/30 text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              Seguir Deslizando
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col font-sans gap-4">
        <div className="inline-block h-14 w-14 animate-spin rounded-full border-[5px] border-pink-100 border-t-pink-500 mb-2 drop-shadow-md"></div>
        <p className="text-xl text-gray-400 font-bold tracking-widest uppercase animate-pulse">Cargando más perfiles...</p>
        <button
          onClick={fetchAlumnosFromDB}
          className="mt-2 px-6 py-3 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const interesList = alumno.intereses ? alumno.intereses.split(',').map(i => i.trim()).filter(i => i) : []
  const photos = [alumno.foto_perfil, alumno.foto2, alumno.foto3].map(safePhotoUrl).filter(Boolean)

  // Calcular rotación y opacidad de overlays basado en drag
  const dragRotation = isDragging ? dragX * 0.05 : 0
  const showLikeOverlay = dragX > 50
  const showNopeOverlay = dragX < -50

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-gray-50 px-4 pt-4 pb-4 md:pt-8 md:pb-20 font-sans overflow-hidden">

      <div className="w-full max-w-sm mb-4 md:mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent tracking-tighter">
          UniConnect
        </h1>
      </div>

      {/* TINDER CARD */}
      <div className="relative w-full max-w-sm flex-1 max-h-[700px] flex items-center justify-center pointer-events-none mb-4">
        <div
          ref={cardRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={
            isDragging
              ? { transform: `translateX(${dragX}px) rotate(${dragRotation}deg)`, transition: 'none' }
              : undefined
          }
          className={`absolute w-full h-full pointer-events-auto ${
            !isDragging ? 'transition-all duration-300' : ''
          } ${
            direction === 'left' ? '-translate-x-[150%] -rotate-12 opacity-0' :
            direction === 'right' ? 'translate-x-[150%] rotate-12 opacity-0' : ''
          } ${!direction && !isDragging ? 'translate-x-0 rotate-0 opacity-100' : ''}`}
        >
          <div className="w-full h-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col relative">

            {/* LIKE / NOPE overlays */}
            {showLikeOverlay && (
              <div className="absolute top-8 left-6 z-30 border-4 border-green-500 rounded-xl px-4 py-2 rotate-[-20deg] animate-in zoom-in duration-150">
                <span className="text-green-500 text-4xl font-black tracking-wider">LIKE</span>
              </div>
            )}
            {showNopeOverlay && (
              <div className="absolute top-8 right-6 z-30 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[20deg] animate-in zoom-in duration-150">
                <span className="text-red-500 text-4xl font-black tracking-wider">NOPE</span>
              </div>
            )}

            {/* Foto Principal / Carrusel */}
            <div className="w-full h-[55%] md:h-[60%] bg-gradient-to-br from-pink-400 via-rose-400 to-violet-500 relative flex items-center justify-center shrink-0">

              {/* Instagram Story Progress Bars */}
              {photos.length > 1 && (
                <div className="absolute top-3 left-0 right-0 gap-1.5 px-3 flex z-20">
                  {photos.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full shadow-sm transition-colors duration-300 ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              )}

              {/* Invisible Click Zones for Next/Prev Photo */}
              {photos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhotoIndex(p => Math.max(0, p - 1))} className="absolute top-0 bottom-0 left-0 w-1/2 z-10 focus:outline-none" />
                  <button onClick={() => setCurrentPhotoIndex(p => Math.min(photos.length - 1, p + 1))} className="absolute top-0 bottom-0 right-0 w-1/2 z-10 focus:outline-none" />
                </>
              )}

              {/* Image Output */}
              {photos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[currentPhotoIndex]}
                  alt={alumno.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : null}
              <span className={`text-white/40 text-[8rem] font-black tracking-tighter absolute inset-0 flex items-center justify-center ${photos.length > 0 ? 'z-[-1]' : ''}`}>
                {alumno.nombre.charAt(0).toUpperCase()}
              </span>

              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent pointer-events-none"></div>

              {/* Info Principal sobre la foto */}
              <div className="absolute bottom-6 left-6 right-6 text-white text-left pointer-events-none">
                <h2 className="text-4xl font-extrabold flex items-baseline gap-2 drop-shadow-lg leading-tight">
                  {alumno.nombre} <span className="text-2xl font-normal opacity-90">{alumno.edad}</span>
                </h2>
                <div className="flex items-center gap-1.5 mt-2 opacity-95 font-semibold text-sm drop-shadow-md">
                   <span>💎</span>
                   <span>{alumno.carrera}{alumno.semestre ? ` (${alumno.semestre}º)` : ''}</span>
                </div>
              </div>
            </div>

            {/* Detalles Interiores */}
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
              <div className="mb-6">
                <h3 className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-2 ml-1">Sobre mí</h3>
                <p className="text-gray-700 text-[15px] leading-relaxed font-medium">
                  {alumno.bio || "Este alumno prefiere mantener el misterio..."}
                </p>
              </div>

              {interesList.length > 0 && (
                <div>
                  <h3 className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-3 ml-1">Intereses</h3>
                  <div className="flex flex-wrap gap-2">
                    {interesList.slice(0, 5).map((interest) => (
                      <span key={interest} className="px-3 py-1.5 bg-gray-100/80 text-gray-700 border border-gray-200/60 rounded-full text-xs font-bold">
                        {interest}
                      </span>
                    ))}
                    {interesList.length > 5 && (
                      <span className="px-3 py-1.5 bg-gray-50 text-gray-400 border border-transparent rounded-full text-xs font-bold">
                        +{interesList.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[2rem]"></div>
          </div>
        </div>
      </div>

      {/* CONTROLES TINDER */}
      <div className="w-full max-w-sm flex justify-center gap-8 mt-auto md:mt-6 shrink-0 z-30">
        <button
          onClick={() => handleSwipe('left')}
          disabled={swiping}
          className="group flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:bg-gray-50 transition-all active:scale-90 border border-gray-100 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8 text-rose-500 group-hover:scale-110 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={() => handleSwipe('right')}
          disabled={swiping}
          className="group flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-pink-400/50 transition-all active:scale-90 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white group-hover:scale-110 transition-transform">
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
