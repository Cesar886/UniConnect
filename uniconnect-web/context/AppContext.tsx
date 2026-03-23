'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Profile, Match, Message, mockProfiles } from '@/data/mockData'

interface UserProfile {
  name: string
  age: number
  career: string
  semester: number
  bio: string
  interests: string[]
  photo: string
}

interface AppContextType {
  // Auth
  isLoggedIn: boolean
  login: () => void
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
    name: 'Daniel',
    age: 21,
    career: 'Ingeniería en Sistemas',
    semester: 6,
    bio: '',
    interests: [],
    photo: '',
  })

  const login = () => setIsLoggedIn(true)
  const logout = () => {
    setIsLoggedIn(false)
    setMatches([])
    setCurrentIndex(0)
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
