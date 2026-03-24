'use client'

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'
import { Profile, Match, Message, mockProfiles } from '@/data/mockData'
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
  login: (matricula?: number) => void
  logout: () => void

  // User profile
  userProfile: UserProfile
  updateProfile: (profile: Partial<UserProfile>) => void

  // Swipe
  profiles: Profile[]
  currentIndex: number
  swipeRight: (profile: Profile) => boolean // returns true if match
  swipeLeft: () => void

  // Matches
  matches: Match[]

  // Chat
  sendMessage: (matchId: string, text: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matches, setMatches] = useState<Match[]>([])
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
    // Basic client-side hidration
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
    setMatches([])
    setCurrentIndex(0)
    setUserProfile(prev => ({...prev, matricula: null}))
    localStorage.removeItem('uniconnect_session_id')
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }))
  }

  const swipeRight = useCallback((profile: Profile): boolean => {
    // 60% chance of match
    const isMatch = Math.random() < 0.6
    if (isMatch) {
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        profile,
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderId: profile.id,
            text: getRandomGreeting(profile.name.split(' ')[0]),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        timestamp: 'Ahora',
        unread: 1,
      }
      setMatches((prev) => [newMatch, ...prev])
    }
    setCurrentIndex((prev) => prev + 1)
    return isMatch
  }, [])

  const swipeLeft = useCallback(() => {
    setCurrentIndex((prev) => prev + 1)
  }, [])

  const sendMessage = (matchId: string, text: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m
        const updated = {
          ...m,
          messages: [...m.messages, newMsg],
          timestamp: 'Ahora',
          unread: 0,
        }
        // Auto-reply after a short delay
        setTimeout(() => {
          const reply: Message = {
            id: `msg-${Date.now()}-reply`,
            senderId: m.profile.id,
            text: getRandomReply(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setMatches((prev2) =>
            prev2.map((m2) =>
              m2.id === matchId
                ? { ...m2, messages: [...m2.messages, newMsg, reply], timestamp: 'Ahora', unread: 1 }
                : m2
            )
          )
        }, 1500 + Math.random() * 2000)
        return updated
      })
    )
  }

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        userProfile,
        updateProfile,
        profiles: mockProfiles,
        currentIndex,
        swipeRight,
        swipeLeft,
        matches,
        sendMessage,
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

function getRandomGreeting(name: string): string {
  const greetings = [
    `¡Hola! Vi que también te gustan las mismas cosas 😊`,
    `Hey! ¿Qué onda? Me gustó tu perfil ✨`,
    `¡Hola! ¿De qué semestre eres? 👋`,
    `Holaa, ¿qué tal tu día? 😄`,
    `¡Match! ¿Nos conocemos de alguna clase? 🤔`,
    `Hola! ¿Qué estudias? Me dio curiosidad tu perfil 📚`,
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

function getRandomReply(): string {
  const replies = [
    '¡Jaja sí! ¿En qué salón estás? 😄',
    '¡Qué cool! ¿Te gustaría ir por un café? ☕',
    'Jajaja me caes bien 😂',
    '¿Neta? Yo también pensé lo mismo 🤯',
    'Siii, ¿nos vemos en la cafetería? 🍕',
    '¡Qué buena onda! Cuéntame más 👀',
    'Jaja ¿y tú qué haces ahorita? 😊',
    '¡Me encanta eso! Deberíamos salir algún día 🎉',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}
