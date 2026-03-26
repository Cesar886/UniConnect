'use client'

import { useApp } from '@/context/AppContext'
import { usePathname } from 'next/navigation'

const PUBLIC_PATHS = ['/login', '/register', '/auth', '/waitlist']

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const { sessionLoading } = useApp()
  const pathname = usePathname()

  const isPublicPage = PUBLIC_PATHS.includes(pathname)

  if (isPublicPage || !sessionLoading) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD] flex-col font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-[4px] border-pink-100 border-t-pink-500 mb-4 z-10"></div>
    </div>
  )
}
