'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Match } from '@/data/mockData'
import { Suspense } from 'react'

function ChatContent() {
  const { matches, sendMessage } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedChat, setSelectedChat] = useState<Match | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Open chat from URL param
  useEffect(() => {
    const chatId = searchParams.get('id')
    if (chatId) {
      const match = matches.find((m) => m.id === chatId)
      if (match) setSelectedChat(match)
    }
  }, [searchParams, matches])

  // Keep selected chat in sync with global matches state
  useEffect(() => {
    if (selectedChat) {
      const updated = matches.find((m) => m.id === selectedChat.id)
      if (updated) setSelectedChat(updated)
    }
  }, [matches])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedChat?.messages])

  const handleSend = () => {
    if (!newMessage.trim() || !selectedChat) return
    sendMessage(selectedChat.id, newMessage.trim())
    setNewMessage('')
  }

  // Chat conversation view
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Chat header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-40 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedChat(null)
              router.replace('/chat')
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-pink-200">
            <img
              src={selectedChat.profile.photos[0]}
              alt={selectedChat.profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800">{selectedChat.profile.name.split(' ')[0]}</h2>
            <p className="text-xs text-green-500 font-medium">En línea</p>
          </div>
          <button
            onClick={() => router.push('/matches')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-20">
          {/* Match header */}
          <div className="text-center py-6 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-pink-200">
              <img
                src={selectedChat.profile.photos[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-gray-500">
              Hiciste match con <span className="font-semibold text-gray-700">{selectedChat.profile.name.split(' ')[0]}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{selectedChat.profile.career} · {selectedChat.profile.semester}° semestre</p>
          </div>

          {selectedChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] px-4 py-2.5 ${
                  msg.senderId === 'me'
                    ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm'
                }`}
              >
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 text-right ${
                    msg.senderId === 'me' ? 'text-white/50' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-3 z-30">
          <div className="max-w-lg mx-auto flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-5 py-3 bg-gray-100 rounded-full text-gray-800 outline-none focus:ring-2 focus:ring-pink-300 transition-all text-[15px]"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Chat list view
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-center text-gray-800">Mensajes</h1>
      </div>

      {matches.length > 0 ? (
        <div className="max-w-lg mx-auto">
          {matches.map((match) => {
            const lastMsg = match.messages[match.messages.length - 1]
            return (
              <button
                key={match.id}
                onClick={() => {
                  setSelectedChat(match)
                  router.replace(`/chat?id=${match.id}`)
                }}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white transition-colors border-b border-gray-100"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden">
                    <img
                      src={match.profile.photos[0]}
                      alt={match.profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full ring-2 ring-gray-50" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold text-gray-800 ${match.unread > 0 ? 'text-black' : ''}`}>
                      {match.profile.name.split(' ')[0]}
                    </h3>
                    <span className={`text-xs ${match.unread > 0 ? 'text-pink-500 font-medium' : 'text-gray-400'}`}>
                      {match.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${match.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {lastMsg?.senderId === 'me' && <span className="text-gray-400">Tú: </span>}
                      {lastMsg?.text || 'Envía el primer mensaje'}
                    </p>
                    {match.unread > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{match.unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 pt-32 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-violet-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700">Sin mensajes aún</h3>
          <p className="text-gray-400 mt-2 max-w-xs">
            Cuando hagas match con alguien podrás chatear aquí
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Explorar perfiles
          </button>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  )
}
