'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { getProfile } from '@/app/actions/students'

interface UserProfile {
  matricula: number | null
  name: string
  age: number
  career: string
  semester: number
  bio: string
  interests: string[]
  photo: string
  photos: string[]
}

interface AppContextType {
  // Auth
  isLoggedIn: boolean
  login: (matricula?: number) => Promise<void>
  logout: () => void

  // User profile
  userProfile: UserProfile
  updateProfile: (profile: Partial<UserProfile>) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    matricula: null,
    name: 'Cargando...',
    age: 18,
    career: '...',
    semester: 1,
    bio: '',
    interests: [],
    photo: '',
    photos: ['', '', ''],
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMatricula = localStorage.getItem('uniconnect_session_id')
      if (savedMatricula) {
        setIsLoggedIn(true)
        const matNum = parseInt(savedMatricula, 10)

        getProfile(matNum).then((data: any) => {
          if (data) {
             setUserProfile(prev => ({
               ...prev,
               matricula: matNum,
               name: data.nombre,
               age: data.edad || 18,
               career: data.carrera || '',
               semester: data.semestre || 1,
               bio: data.bio || '',
               interests: data.intereses ? data.intereses.split(',').map((s:string) => s.trim()) : [],
               photo: data.foto_perfil || '',
               photos: [data.foto_perfil || '', data.foto2 || '', data.foto3 || ''],
             }))
          } else {
             setUserProfile(prev => ({...prev, matricula: matNum}))
          }
        })
      }
    }
  }, [])

  const login = async (matricula?: number) => {
    setIsLoggedIn(true)
    if (matricula) {
      localStorage.setItem('uniconnect_session_id', String(matricula))
      const data: any = await getProfile(matricula)
      if (data) {
         setUserProfile(prev => ({
           ...prev,
           matricula,
           name: data.nombre,
           age: data.edad || 18,
           career: data.carrera || '',
           semester: data.semestre || 1,
           bio: data.bio || '',
           interests: data.intereses ? data.intereses.split(',').map((s:string) => s.trim()) : [],
           photo: data.foto_perfil || '',
           photos: [data.foto_perfil || '', data.foto2 || '', data.foto3 || ''],
         }))
      } else {
         setUserProfile(prev => ({...prev, matricula}))
      }
    }
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUserProfile({
      matricula: null,
      name: '',
      age: 18,
      career: '',
      semester: 1,
      bio: '',
      interests: [],
      photo: '',
      photos: ['', '', ''],
    })
    localStorage.removeItem('uniconnect_session_id')
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }))
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        userProfile,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
