'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { Profile } from '@/data/mockData'

export default function Home() {
  const { profiles, currentIndex, swipeRight, swipeLeft, isLoggedIn } = useApp()
  const router = useRouter()
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null)
  const startX = useRef(0)

  const currentProfile = profiles[currentIndex]
  const noMoreProfiles = currentIndex >= profiles.length

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile) return
    setSwipeDirection(direction)

    setTimeout(() => {
      if (direction === 'right') {
        const isMatch = swipeRight(currentProfile)
        if (isMatch) {
          setTimeout(() => setMatchPopup(currentProfile), 100)
        }
      } else {
        swipeLeft()
      }
      setSwipeDirection(null)
      setDragX(0)
    }, 300)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setDragX(e.clientX - startX.current)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > 120) {
      handleSwipe('right')
    } else if (dragX < -120) {
      handleSwipe('left')
    } else {
      setDragX(0)
    }
  }

  const rotation = dragX * 0.08
  const likeOpacity = Math.min(Math.max(dragX / 150, 0), 1)
  const nopeOpacity = Math.min(Math.max(-dragX / 150, 0), 1)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-center">
          <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            UniConnect
          </span>
        </h1>
      </div>

      {noMoreProfiles ? (
        /* No more profiles */
        <div className="flex flex-col items-center justify-center px-6 pt-32 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-violet-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Por ahora es todo!</h2>
          <p className="text-gray-500 max-w-xs">Ya viste todos los perfiles disponibles. Vuelve más tarde para ver gente nueva.</p>
          {/* Check matches */}
          <button
            onClick={() => router.push('/matches')}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            Ver mis matches
          </button>
        </div>
      ) : (
        <>
          {/* Card Stack */}
          <div className="flex justify-center items-center px-4 pt-4">
            <div className="relative w-full max-w-sm h-[540px]">
              {/* Next card preview */}
              {currentIndex < profiles.length - 1 && (
                <div className="absolute inset-2 rounded-3xl overflow-hidden scale-[0.95] opacity-40 bg-gray-200">
                  <img
                    src={profiles[currentIndex + 1].photos[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              )}

              {/* Current card */}
              {currentProfile && (
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl touch-none select-none"
                  style={{
                    transform: swipeDirection === 'right'
                      ? 'translateX(150%) rotate(20deg)'
                      : swipeDirection === 'left'
                      ? 'translateX(-150%) rotate(-20deg)'
                      : `translateX(${dragX}px) rotate(${rotation}deg)`,
                    transition: swipeDirection ? 'transform 0.4s ease-out, opacity 0.4s' : isDragging ? 'none' : 'transform 0.3s ease-out',
                    opacity: swipeDirection ? 0 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* Photo */}
                  <img
                    src={currentProfile.photos[0]}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />

                  {/* LIKE stamp */}
                  <div
                    className="absolute top-10 left-6 border-[3px] border-green-400 text-green-400 px-5 py-2 rounded-lg text-3xl font-black -rotate-12"
                    style={{ opacity: likeOpacity }}
                  >
                    LIKE
                  </div>

                  {/* NOPE stamp */}
                  <div
                    className="absolute top-10 right-6 border-[3px] border-red-400 text-red-400 px-5 py-2 rounded-lg text-3xl font-black rotate-12"
                    style={{ opacity: nopeOpacity }}
                  >
                    NOPE
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* Profile info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-end gap-2">
                      <h2 className="text-3xl font-bold">{currentProfile.name.split(' ')[0]}</h2>
                      <span className="text-2xl font-light mb-0.5">{currentProfile.age}</span>
                    </div>
                    <p className="text-pink-300 font-medium mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                        <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286a48.4 48.4 0 0 1 6.862 2.856l.775.413.602-.319c.53-.281 1.065-.554 1.547-.82Z" />
                      </svg>
                      {currentProfile.career} · {currentProfile.semester}° sem
                    </p>
                    <p className="text-gray-200 mt-2 text-sm leading-relaxed">{currentProfile.bio}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentProfile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center items-center gap-5 mt-6">
            <button
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-red-400 hover:scale-110 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={() => handleSwipe('right')}
              className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
          </div>

          {/* Counter */}
          <p className="text-center text-gray-400 text-xs mt-4">
            {currentIndex + 1} / {profiles.length}
          </p>
        </>
      )}

      {/* Match popup */}
      {matchPopup && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setMatchPopup(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
            style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Match photos */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 p-[3px]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-2xl font-bold">
                  T
                </div>
              </div>
              <div className="text-3xl">❤️</div>
              <div className="w-20 h-20 rounded-full overflow-hidden ring-[3px] ring-pink-400">
                <img
                  src={matchPopup.photos[0]}
                  alt={matchPopup.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h2 className="text-3xl font-black bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              ¡Es un Match!
            </h2>
            <p className="text-gray-500 mt-2">
              Tú y <span className="font-semibold text-gray-700">{matchPopup.name.split(' ')[0]}</span> se gustaron
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMatchPopup(null)}
                className="flex-1 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Seguir viendo
              </button>
              <button
                onClick={() => {
                  setMatchPopup(null)
                  router.push('/chat')
                }}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Enviar mensaje
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
