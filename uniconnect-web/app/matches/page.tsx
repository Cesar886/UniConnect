'use client'

import { useApp } from '@/context/AppContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function MatchesPage() {
  const { matches } = useApp()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-center text-gray-800">
          Mis Matches
          {matches.length > 0 && (
            <span className="ml-2 text-sm font-medium text-pink-500">({matches.length})</span>
          )}
        </h1>
      </div>

      {matches.length > 0 ? (
        <div className="max-w-lg mx-auto px-4 pt-6">
          {/* New matches (horizontal scroll) */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Nuevos matches
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => router.push(`/chat?id=${match.id}`)}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-pink-400 ring-offset-2 group-hover:ring-violet-500 transition-all">
                    <img
                      src={match.profile.photos[0]}
                      alt={match.profile.name}
                      className="w-full h-full object-cover"
                    />
                    {match.unread > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center ring-2 ring-white">
                        <span className="text-white text-[10px] font-bold">{match.unread}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-700 font-medium w-20 truncate">
                    {match.profile.name.split(' ')[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Match cards grid */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Todos tus matches
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => router.push(`/chat?id=${match.id}`)}
                className="group"
              >
                <div className="relative rounded-2xl overflow-hidden h-64 shadow-md group-hover:shadow-xl transition-all">
                  <img
                    src={match.profile.photos[0]}
                    alt={match.profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-left">
                    <h3 className="font-bold text-lg">
                      {match.profile.name.split(' ')[0]}, {match.profile.age}
                    </h3>
                    <p className="text-xs text-pink-200">{match.profile.career}</p>
                    {match.messages.length > 0 && (
                      <p className="text-[11px] text-gray-300 mt-1 truncate">
                        {match.messages[match.messages.length - 1].text}
                      </p>
                    )}
                  </div>
                  {match.unread > 0 && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{match.unread}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center px-6 pt-32 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-violet-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700">Aún no tienes matches</h3>
          <p className="text-gray-400 mt-2 max-w-xs">
            Sigue dando like a perfiles que te gusten. Cuando alguien te corresponda, aparecerá aquí.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Explorar perfiles
          </Link>
        </div>
      )}
    </div>
  )
}
