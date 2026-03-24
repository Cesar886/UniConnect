'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { getUnreadCount } from '@/app/actions/chat'
import { getSocket, registerUser, onConnectionChange } from '@/lib/socket'

export default function Navbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { userProfile } = useApp()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!userProfile.matricula) return

    const socket = getSocket()
    registerUser(userProfile.matricula)

    // Initial load
    getUnreadCount(userProfile.matricula).then(count => setUnread(count))

    // Listen for real-time updates
    const onUnreadUpdate = (count: number) => {
      setUnread(count)
    }

    // Re-fetch on reconnect
    const unsubConnection = onConnectionChange((status) => {
      if (status === 'connected' && userProfile.matricula) {
        getUnreadCount(userProfile.matricula).then(count => setUnread(count))
      }
    })

    socket.on('unread:update', onUnreadUpdate)

    return () => {
      socket.off('unread:update', onUnreadUpdate)
      unsubConnection()
    }
  }, [userProfile.matricula])

  // No mostrar navbar en login/register, o dentro de un chat
  if (
     pathname === '/login' ||
     pathname === '/register' ||
     pathname === '/auth' ||
     (pathname === '/chat' && searchParams.get('id'))
  ) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {/* Inicio */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
            pathname === '/' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <HomeIcon active={pathname === '/'} />
          <span className="text-xs font-medium">Inicio</span>
        </Link>

        {/* Matches con badge en tiempo real */}
        <Link
          href="/matches"
          className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors relative ${
            pathname === '/matches' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <HeartIcon active={pathname === '/matches'} />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white shadow-md shadow-pink-500/40 animate-in zoom-in duration-200">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Matches</span>
        </Link>

        {/* Perfil */}
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
            pathname === '/profile' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <UserIcon active={pathname === '/profile'} />
          <span className="text-xs font-medium">Perfil</span>
        </Link>
      </div>
    </nav>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  )
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
