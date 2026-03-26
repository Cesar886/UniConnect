'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getStudents, updatePreferences } from '@/app/actions/students'
import { swipeUser } from '@/app/actions/match'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { safePhotoUrl } from '@/lib/sanitize'

// Tipos
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
  const { userProfile, updateProfile } = useApp()
  const myMatricula = userProfile.matricula
  const router = useRouter()

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [likes, setLikes] = useState<number[]>([])
  const [matchData, setMatchData] = useState<Alumno | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [prefAge, setPrefAge] = useState({ min: 18, max: 99 })
  const [prefGender, setPrefGender] = useState('Ambos')

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
    if (userProfile.pref_edad_min) {
      setPrefAge({ min: userProfile.pref_edad_min, max: userProfile.pref_edad_max || 99 })
      setPrefGender(userProfile.genero_interes || 'Ambos')
    }
  }, [fetchAlumnosFromDB, myMatricula, userProfile])

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

    if (liked) setLikes(prev => [...prev, targetAlumno.matricula])
    
    if (myMatricula) {
      const res = await swipeUser(targetAlumno.matricula, liked)
      if (res.success && res.isMatch) {
         setTimeout(() => setMatchData(targetAlumno), 300)
      }
    }
    
    if (!matchData) {
      setTimeout(() => {
        setDirection(null)
        if (currentIndex < alumnos.length - 1) {
          setCurrentIndex(prev => prev + 1)
          setCurrentPhotoIndex(0)
        } else {
          fetchAlumnosFromDB()
        }
      }, 300)
    }
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

  // CARGANDO
  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f9fa] flex-col font-sans">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-[#e51245]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#ba0034] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">Encontrando perfiles</p>
      </div>
    )
  }

  // PANTALLA DE MATCH (DISEÑO EDITORIAL)
  if (matchData) {
    return (
      <div className="fixed inset-0 z-50 bg-[#191c1d] flex flex-col items-center justify-center font-sans overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#ba0034]/40 via-transparent to-transparent opacity-80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#e51245]/30 via-transparent to-transparent opacity-60"></div>

        <div className="relative z-10 flex flex-col items-center px-6 text-center w-full max-w-lg">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2 animate-in slide-in-from-bottom-5 duration-700">
            ES UN <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e51245] to-[#ffb3b5]">MATCH.</span>
          </h1>
          <p className="text-lg text-gray-300 font-medium mb-16 animate-in fade-in duration-1000 delay-300">
            Tú y {matchData.nombre} se atraen mutuamente.
          </p>

          <div className="flex items-center justify-center mb-16 relative w-full h-40">
            {/* Mi Foto */}
            <div className="absolute left-[15%] w-36 h-36 rounded-full bg-[#2e3132] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-[#191c1d] z-10 transform -rotate-6 animate-in zoom-in-50 duration-500 delay-150">
              {userProfile.photo ? (
                 <img src={userProfile.photo} className="w-full h-full object-cover" alt="Me" />
              ) : (
                <span className="text-gray-500 text-4xl font-black">{userProfile.name?.charAt(0)}</span>
              )}
            </div>
            
            {/* Foto del Match */}
            <div className="absolute right-[15%] w-36 h-36 rounded-full bg-[#2e3132] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-[#191c1d] z-20 transform rotate-6 animate-in zoom-in-50 duration-500 delay-300">
              {matchData.foto_perfil ? (
                <img src={matchData.foto_perfil} alt={matchData.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-4xl font-black">{matchData.nombre.charAt(0)}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-700">
            <button className="w-full py-4 rounded-full font-bold text-[15px] tracking-wide text-white bg-gradient-to-tr from-[#ba0034] to-[#e51245] shadow-[0_8px_20px_rgba(186,0,52,0.4)] hover:brightness-110 transition-all">
              Enviar Mensaje
            </button>
            <button
              onClick={closeMatchModal}
              className="w-full py-4 rounded-full font-semibold text-[15px] bg-[#2e3132] text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Seguir Explorando
            </button>
          </div>
        </div>
      </div>
    )
  }

  // NO HAY NADIE
  if (!alumno) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8f9fa] flex-col font-sans px-6">
        <div className="w-24 h-24 rounded-full bg-[#f0f1f2] flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#191c1d] tracking-tight mb-2">No hay perfiles</h2>
        <p className="text-[#585d7e] text-center max-w-[260px] mb-8 font-medium">Has visto a todos los estudiantes disponibles en el campus. Vuelve más tarde.</p>
        <button onClick={fetchAlumnosFromDB} className="px-8 py-3.5 rounded-full bg-white text-[#ba0034] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-md transition-all border border-[#e1e3e4]">
          Actualizar Feed
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
    <div className="flex min-h-[100dvh] flex-col items-center bg-[#f8f9fa] px-4 pt-4 pb-24 md:pt-6 font-sans overflow-hidden">
      
      {/* TOP NAV "EDITORIAL" */}
      <div className="w-full max-w-[420px] mb-5 flex justify-between items-center px-1 z-10">
        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#e1e3e4] overflow-hidden">
          {userProfile?.photo ? (
            <img src={userProfile.photo} className="w-full h-full object-cover" alt="Me" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#585d7e] font-bold bg-[#f0f1f2]">
              {userProfile?.name?.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-[22px] font-black tracking-tighter text-[#191c1d] leading-none">
            UniConnect<span className="text-[#ba0034]">.</span>
          </h1>
          <span className="text-[9px] font-bold tracking-[0.2em] text-[#916e6f] uppercase mt-1">The Pulse</span>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-white border border-[#e1e3e4] shadow-sm flex items-center justify-center text-[#585d7e] focus:outline-none hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </div>

      {/* MODAL DE PREFERENCIAS */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 transition-all animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#191c1d] tracking-tight">Preferencias</h2>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-10">
              {/* RANGO DE EDAD */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">Rango de Edad</label>
                  <span className="text-lg font-black text-[#ba0034] tracking-tight">{prefAge.min} - {prefAge.max}</span>
                </div>
                <div className="px-2">
                  <input 
                    type="range" 
                    min="18" 
                    max="99" 
                    value={prefAge.max} 
                    onChange={(e) => setPrefAge(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer range-pink focus:outline-none"
                    style={{
                      accentColor: '#ba0034'
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-3 font-medium px-1">Se te mostrarán alumnos entre estas edades.</p>
              </div>

              {/* GÉNERO DE INTERÉS */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Interés en</label>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-[1.2rem]">
                  {['Hombres', 'Mujeres', 'Ambos'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setPrefGender(g)}
                      className={`flex-1 py-3.5 rounded-[1rem] text-sm font-bold transition-all ${prefGender === g ? 'bg-white text-[#ba0034] shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (myMatricula) {
                    await updatePreferences(myMatricula, {
                      pref_edad_min: prefAge.min,
                      pref_edad_max: prefAge.max,
                      genero_interes: prefGender
                    });
                    updateProfile({ 
                      pref_edad_min: prefAge.min, 
                      pref_edad_max: prefAge.max, 
                      genero_interes: prefGender 
                    });
                    fetchAlumnosFromDB();
                    setShowSettings(false);
                  }
                }}
                className="w-full py-4.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
              >
                Guardar y Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWIPE CARD CONTAINER (Ivy Pulse Style) */}
      <div className="relative w-full max-w-[420px] max-h-[750px] flex-1 flex items-center justify-center pointer-events-none z-20">
        <div
          className={`absolute w-full h-full transition-all duration-300 pointer-events-auto ${
            direction === 'left' ? '-translate-x-[120%] -rotate-6 opacity-0' :
            direction === 'right' ? 'translate-x-[120%] rotate-6 opacity-0' : 'translate-x-0 rotate-0 opacity-100 ease-out'
          }`}
        >
          {/* Main Card */}
          <div className="w-full h-full bg-white rounded-[2.5rem] shadow-[0_24px_60px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative border-[0.5px] border-[#e1e3e4]">
            
            {/* HER0 IMAGE SECTION (65%) */}
            <div className="w-full h-[65%] bg-[#f0f1f2] relative flex flex-col justify-end shrink-0">
              
              {/* Photo Navigation (Stories style) */}
              {photos.length > 1 && (
                <div className="absolute top-4 left-0 right-0 gap-1.5 px-4 flex z-30">
                  {photos.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full shadow-sm transition-colors duration-300 ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/30 backdrop-blur-sm'}`} />
                  ))}
                </div>
              )}

              {/* Click Zones */}
              {photos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhotoIndex(p => Math.max(0, p - 1))} className="absolute top-0 bottom-0 left-0 w-1/2 z-20 focus:outline-none" />
                  <button onClick={() => setCurrentPhotoIndex(p => Math.min(photos.length - 1, p + 1))} className="absolute top-0 bottom-0 right-0 w-1/2 z-20 focus:outline-none" />
                </>
              )}

              {/* Image Output */}
              {photos.length > 0 ? (
                <img src={photos[currentPhotoIndex]} alt={alumno.nombre} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#f3f4f5] to-[#e7e8e9]">
                  <span className="text-[#c0c4ea] text-[8rem] font-black tracking-tighter">
                    {alumno.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Gradient overlay for text legibility (Ivy Pulse style) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#191c1d]/90 via-[#191c1d]/20 to-transparent pointer-events-none z-10 mix-blend-multiply"></div>
              
              {/* Name and Basic Info Overlay */}
              <div className="relative z-20 px-6 pb-6 text-white text-left pointer-events-none">
                <h2 className="text-[32px] font-black flex items-baseline gap-2 leading-none drop-shadow-md">
                  {alumno.nombre}, <span className="font-medium opacity-90">{alumno.edad}</span>
                </h2>
                <div className="flex items-center gap-1.5 mt-2 opacity-95 text-[14px] font-medium drop-shadow">
                   <span className="text-[#ffb3b5]">●</span>
                   <span>{alumno.carrera} • Semestre {alumno.semestre}</span>
                </div>
              </div>
            </div>

            {/* INFO SECTION (35%) */}
            <div className="p-6 flex-1 bg-white overflow-y-auto scrollbar-hide flex flex-col gap-6">
              
              {/* Bio Block */}
              <div>
                <h3 className="uppercase tracking-[0.15em] text-[10px] font-bold text-[#585d7e] mb-2 px-1">Sobre Mí</h3>
                <p className="text-[#191c1d] text-[15px] leading-relaxed font-medium px-1">
                  {alumno.bio || "Una persona de pocas palabras pero con mucho misterio. Desliza para descubrir más."}
                </p>
              </div>

              {/* Intereses Block */}
              {interesList.length > 0 && (
                <div>
                  <h3 className="uppercase tracking-[0.15em] text-[10px] font-bold text-[#585d7e] mb-2 px-1">Intereses</h3>
                  <div className="flex flex-wrap gap-2">
                    {interesList.slice(0, 6).map((interest) => (
                      <span key={interest} className="px-4 py-1.5 bg-[#f3f4f5] text-[#191c1d] rounded-full text-[13px] font-medium">
                        {interest}
                      </span>
                    ))}
                    {interesList.length > 6 && (
                      <span className="px-4 py-1.5 text-[#585d7e] text-[13px] font-medium">
                        +{interesList.length - 6} más
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Subtle Gradient Fade at the bottom */}
            <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* SWIPE ACTION BUTTONS */}
      <div className="w-full max-w-[420px] flex justify-center gap-6 mt-6 shrink-0 z-30 pointer-events-auto">
        
        {/* Pass Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="group flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:bg-[#f3f4f5] hover:-translate-y-1 transition-all duration-300 active:scale-95 border border-[#e1e3e4]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8 text-[#585d7e] transition-colors group-hover:text-[#191c1d]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Super Like Button (Center, Smaller) */}
        <button
          className="group flex h-14 w-14 mt-2 items-center justify-center rounded-full bg-white shadow-[0_8px_16px_rgba(0,0,0,0.04)] hover:bg-[#f3f4f5] hover:-translate-y-1 transition-all duration-300 active:scale-95 border border-[#e1e3e4]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#920027]">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="group flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-tr from-[#ba0034] to-[#e51245] shadow-[0_12px_24px_rgba(186,0,52,0.3)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
