'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMatches } from '@/app/actions/match'

interface RealMatch {
  match_id: number
  name: string
  photo: string
  age: number
  career: string
  lastMessage?: string
  lastMessageTime?: string
  lastSenderId?: number
  unread: number
}

export default function MatchesPage() {
  const { userProfile } = useApp()
  const myMatricula = userProfile.matricula
  const router = useRouter()

  const [matches, setMatches] = useState<RealMatch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMatches = async () => {
    if (!myMatricula) return
    const data = await getMatches(myMatricula)
    setMatches(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()
    // Refresh matches every 10 seconds
    const interval = setInterval(fetchMatches, 10000)
    return () => clearInterval(interval)
  }, [myMatricula])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] flex-col font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="inline-block h-14 w-14 animate-spin rounded-full border-[4px] border-pink-100 border-t-pink-500 mb-6 drop-shadow-lg z-10"></div>
      </div>
    )
  }

  // Separar: matches nuevos (sin mensajes) y con conversación
  const newMatches = matches.filter(m => !m.lastMessage)
  const conversations = matches.filter(m => m.lastMessage)

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24 font-sans relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-100/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 -translate-x-1/2 translate-y-1/4 pointer-events-none"></div>

      {/* Header Fijo */}
      <div className="sticky top-0 bg-white/70 backdrop-blur-2xl z-40 px-6 py-5 flex justify-between items-center border-b border-gray-100/50">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-pink-500 transition-colors p-2 -ml-2 rounded-full hover:bg-pink-50">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
           </svg>
        </button>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 tracking-tight drop-shadow-sm">
          Matches
        </h1>
        <div className="w-10 flex justify-end">
          {matches.length > 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-xs font-black text-pink-600 shadow-sm border border-pink-200/50">
              {matches.length}
            </span>
          )}
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="max-w-lg mx-auto px-4 pt-6 relative z-10">

          {/* Círculos de Matches Nuevos (sin conversación aún) */}
          {newMatches.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between ml-1 mb-4">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Nuevos Matches
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-4 px-4 snap-x">
                {newMatches.map((match) => (
                  <button
                    key={`circle-${match.match_id}`}
                    onClick={() => router.push(`/chat?id=${match.match_id}`)}
                    className="flex-shrink-0 group flex flex-col items-center snap-start"
                  >
                    <div className="relative w-[85px] h-[85px] rounded-full p-[3px] bg-gradient-to-tr from-amber-300 via-pink-500 to-violet-600 group-hover:scale-105 transition-all duration-300 ease-spring shadow-lg shadow-pink-200/50">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white">
                        {match.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={match.photo} alt={match.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
                            <span className="text-2xl font-black text-gray-400">{match.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-center mt-2.5 text-gray-700 font-bold w-20 truncate">
                      {match.name.split(' ')[0]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversaciones */}
          {conversations.length > 0 && (
            <>
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">
                Mensajes
              </h2>
              <div className="flex flex-col gap-3">
                {conversations.map((match) => (
                  <button
                    key={`msg-${match.match_id}`}
                    onClick={() => router.push(`/chat?id=${match.match_id}`)}
                    className="group relative flex items-center bg-white/60 backdrop-blur-lg p-4 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-white hover:bg-white transition-all duration-300 active:scale-[0.98] w-full text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-50/0 via-pink-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-md mr-4 border-2 border-white bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white">
                      {match.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={match.photo} alt={match.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-black">{match.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden z-10">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`font-extrabold text-[17px] truncate tracking-tight ${match.unread > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                          {match.name}
                        </h3>
                        {match.lastMessageTime && (
                          <span className={`text-[11px] font-bold ml-2 shrink-0 ${match.unread > 0 ? 'text-pink-500' : 'text-gray-400'}`}>
                            {match.lastMessageTime}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold tracking-widest text-violet-500 mb-1 truncate uppercase">{match.career}</p>
                      <p className={`text-[14px] truncate ${match.unread > 0 ? 'font-bold text-gray-800' : 'font-medium text-gray-500'}`}>
                        {match.lastSenderId === myMatricula ? 'Tú: ' : ''}{match.lastMessage}
                      </p>
                    </div>

                    <div className="pl-3 flex flex-col items-end justify-center shrink-0 z-10 gap-2">
                      {match.unread > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-[11px] font-black text-white shadow-md">
                          {match.unread}
                        </span>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-pink-400 transition-colors group-hover:translate-x-1 duration-300">
                        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Si solo tiene matches nuevos sin conversación, mostrar hint */}
          {conversations.length === 0 && newMatches.length > 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm font-medium">Toca un match para empezar a platicar</p>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center px-6 pt-32 text-center relative z-10">
          <div className="relative w-32 h-32 mb-8 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="absolute inset-0 bg-pink-200 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-2 bg-pink-100 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
            <div className="relative w-full h-full bg-gradient-to-tr from-rose-100 to-violet-100 border-2 border-white rounded-full flex items-center justify-center shadow-xl shadow-pink-100/50 group-hover:scale-105 transition-transform duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                 <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
               </svg>
            </div>
            <svg className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.6H22l-6.4 4.8 2.4 7.6-6.4-4.8-6.4 4.8 2.4-7.6-6.4-4.8h7.6z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight mb-3">La magia toma tiempo</h3>
          <p className="text-gray-500 mt-2 max-w-[280px] text-[15px] font-medium leading-relaxed">
            Sigue explorando y enviando likes. Cuando la atracción sea mutua, aparecerán aquí.
          </p>
          <Link
            href="/"
            className="mt-10 px-10 py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold shadow-xl shadow-gray-200 hover:-translate-y-1 transition-all active:scale-95 duration-300 flex items-center gap-2"
          >
            <span>Buscar Estudiantes</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}
