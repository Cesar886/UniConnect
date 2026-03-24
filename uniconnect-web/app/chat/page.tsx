'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProfile } from '@/app/actions/students'
import { getMessages } from '@/app/actions/chat'
import { getSocket } from '@/lib/socket'

interface ChatMessage {
  id: number
  sender_id: number
  receiver_id: number
  text: string
  time: string
  status: 'sent' | 'delivered' | 'read'
  created_at?: string
  edited_at?: string | null
}

// Status check icons
function StatusIcon({ status }: { status: string }) {
  if (status === 'sent') {
    // Single check
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5 inline-block ml-1 text-white/50">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'delivered') {
    // Double check gray
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-3.5 inline-block ml-1 text-white/50">
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 13l4 4L15 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l4 4L21 7" />
      </svg>
    )
  }
  if (status === 'read') {
    // Double check blue
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-4 h-3.5 inline-block ml-1 text-blue-200">
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 13l4 4L15 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l4 4L21 7" />
      </svg>
    )
  }
  return null
}

function ChatContent() {
  const { userProfile } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const myMatricula = userProfile.matricula

  const [peerProfile, setPeerProfile] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [peerOnline, setPeerOnline] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ msgId: number; x: number; y: number } | null>(null)
  const [editingMsg, setEditingMsg] = useState<{ id: number; text: string } | null>(null)
  const [editText, setEditText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const peerIdParam = searchParams.get('id')
  const peerId = peerIdParam ? parseInt(peerIdParam, 10) : null

  const peerPhotos = peerProfile ? [peerProfile.foto_perfil, peerProfile.foto2, peerProfile.foto3].filter(Boolean) : []
  const interesList = peerProfile && peerProfile.intereses ? peerProfile.intereses.split(',').map((i: string) => i.trim()).filter(Boolean) : []

  // Check if message is within 20 min edit/delete window
  const isWithinEditWindow = (msg: ChatMessage) => {
    if (!msg.created_at) return false
    const created = new Date(msg.created_at).getTime()
    const now = Date.now()
    return (now - created) < 20 * 60 * 1000
  }

  // 1. Cargar perfil e historial
  useEffect(() => {
    if (!myMatricula || !peerId) return
    getProfile(peerId).then(data => { if (data) setPeerProfile(data) })
    getMessages(myMatricula, peerId).then(data => { setMessages(data || []); setLoading(false) })
  }, [myMatricula, peerId])

  // 2. WebSocket: escuchar mensajes, typing, online, status, edit, delete
  useEffect(() => {
    if (!myMatricula || !peerId) return

    const socket = getSocket()

    // Registrar usuario
    socket.emit('register', myMatricula)

    // Marcar como leído
    socket.emit('chat:read', { myId: myMatricula, peerId })

    // Verificar si el peer está online
    socket.emit('user:check', peerId)

    // Nuevo mensaje en tiempo real
    const onNewMessage = (msg: ChatMessage) => {
      if (
        (msg.sender_id === myMatricula && msg.receiver_id === peerId) ||
        (msg.sender_id === peerId && msg.receiver_id === myMatricula)
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Si recibí un mensaje, marcar como leído
        if (msg.sender_id === peerId) {
          socket.emit('chat:read', { myId: myMatricula, peerId })
        }
        setIsTyping(false)
      }
    }

    // Status updates (sent -> delivered -> read)
    const onStatusUpdate = ({ messageIds, status }: { messageIds: number[]; status: string }) => {
      setMessages(prev =>
        prev.map(m =>
          messageIds.includes(m.id) ? { ...m, status: status as ChatMessage['status'] } : m
        )
      )
    }

    // Message edited
    const onMessageEdited = (msg: ChatMessage) => {
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, text: msg.text, edited_at: msg.edited_at } : m)
      )
    }

    // Message deleted
    const onMessageDeleted = ({ messageId }: { messageId: number }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }

    // Typing
    const onTypingShow = ({ senderId }: { senderId: number }) => {
      if (senderId === peerId) setIsTyping(true)
    }
    const onTypingHide = ({ senderId }: { senderId: number }) => {
      if (senderId === peerId) setIsTyping(false)
    }

    // Online status
    const onUserOnline = ({ matricula, online }: { matricula: number; online: boolean }) => {
      if (matricula === peerId) setPeerOnline(online)
    }

    // Error
    const onError = ({ error }: { error: string }) => {
      alert(error)
    }

    socket.on('message:new', onNewMessage)
    socket.on('message:status', onStatusUpdate)
    socket.on('message:edited', onMessageEdited)
    socket.on('message:deleted', onMessageDeleted)
    socket.on('typing:show', onTypingShow)
    socket.on('typing:hide', onTypingHide)
    socket.on('user:online', onUserOnline)
    socket.on('message:error', onError)

    return () => {
      socket.off('message:new', onNewMessage)
      socket.off('message:status', onStatusUpdate)
      socket.off('message:edited', onMessageEdited)
      socket.off('message:deleted', onMessageDeleted)
      socket.off('typing:show', onTypingShow)
      socket.off('typing:hide', onTypingHide)
      socket.off('user:online', onUserOnline)
      socket.off('message:error', onError)
    }
  }, [myMatricula, peerId])

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener('click', handler)
      return () => window.removeEventListener('click', handler)
    }
  }, [contextMenu])

  // 3. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Enviar mensaje via WebSocket
  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !myMatricula || !peerId) return
    const textToSend = newMessage.trim()

    const socket = getSocket()
    socket.emit('message:send', { senderId: myMatricula, receiverId: peerId, text: textToSend })
    socket.emit('typing:stop', { senderId: myMatricula, receiverId: peerId })

    setNewMessage('')
    setShowEmojis(false)
  }, [newMessage, myMatricula, peerId])

  // Edit message
  const handleEdit = useCallback(() => {
    if (!editingMsg || !editText.trim()) return
    const socket = getSocket()
    socket.emit('message:edit', { messageId: editingMsg.id, senderId: myMatricula, newText: editText.trim() })
    setEditingMsg(null)
    setEditText('')
  }, [editingMsg, editText, myMatricula])

  // Delete message
  const handleDelete = useCallback((msgId: number) => {
    const socket = getSocket()
    socket.emit('message:delete', { messageId: msgId, senderId: myMatricula })
    setContextMenu(null)
  }, [myMatricula])

  // Manejar typing indicator
  const handleInputChange = (text: string) => {
    setNewMessage(text)
    if (!myMatricula || !peerId) return

    const socket = getSocket()

    if (text.trim()) {
      socket.emit('typing:start', { senderId: myMatricula, receiverId: peerId })

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { senderId: myMatricula, receiverId: peerId })
      }, 2000)
    } else {
      socket.emit('typing:stop', { senderId: myMatricula, receiverId: peerId })
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }

  // Long press / right click for context menu
  const handleMessageContext = (e: React.MouseEvent | React.TouchEvent, msg: ChatMessage) => {
    if (msg.sender_id !== myMatricula) return
    if (!isWithinEditWindow(msg)) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setContextMenu({ msgId: msg.id, x: clientX, y: clientY })
  }

  if (!myMatricula || !peerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD] flex-col font-sans">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-[4px] border-pink-100 border-t-pink-500"></div>
      </div>
    )
  }

  if (loading || !peerProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD] flex-col font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-72 h-72 -translate-x-1/2 -translate-y-1/2 bg-pink-200/40 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-[4px] border-white border-t-pink-500 shadow-xl z-10"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#FDFDFD] flex flex-col font-sans relative">
      {/* PERFIL MODAL */}
      {showProfile && peerProfile && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end md:items-center md:justify-center font-sans animate-in fade-in duration-300">
          <div className="bg-white w-full md:w-[400px] h-[85vh] md:h-[700px] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 duration-300">
            <button
              onClick={() => { setShowProfile(false); setCurrentPhotoIndex(0); }}
              className="absolute top-4 right-4 z-50 bg-black/40 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/60 active:scale-90 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-full h-[55%] relative shrink-0 bg-gray-100 flex items-center justify-center">
              {peerPhotos.length > 1 && (
                <div className="absolute top-3 left-0 right-0 gap-1.5 px-3 flex z-20">
                  {peerPhotos.map((_: string, i: number) => (
                    <div key={i} className={`h-1 flex-1 rounded-full shadow-sm transition-colors duration-300 ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              )}
              {peerPhotos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhotoIndex(p => Math.max(0, p - 1))} className="absolute top-0 bottom-0 left-0 w-1/2 z-10 focus:outline-none" />
                  <button onClick={() => setCurrentPhotoIndex(p => Math.min(peerPhotos.length - 1, p + 1))} className="absolute top-0 bottom-0 right-0 w-1/2 z-10 focus:outline-none" />
                </>
              )}
              {peerPhotos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={peerPhotos[currentPhotoIndex]} className="w-full h-full object-cover" alt="Perfil" />
              ) : (
                <span className="text-[6rem] font-black text-gray-300">{peerProfile.nombre.charAt(0)}</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/10 to-transparent pointer-events-none"></div>

              <div className="absolute bottom-4 left-5 right-5 text-white pointer-events-none">
                <h2 className="text-3xl font-extrabold drop-shadow-md">{peerProfile.nombre} <span className="text-xl font-normal opacity-90">{peerProfile.edad}</span></h2>
                <div className="flex items-center gap-1.5 mt-1 opacity-90 text-sm font-semibold drop-shadow-md">
                   <span>💎</span> <span>{peerProfile.carrera} ({peerProfile.semestre}º)</span>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide bg-white">
              <div className="mb-5">
                <h3 className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-2 ml-1">Sobre Mí</h3>
                <p className="text-gray-800 text-[15px] leading-relaxed font-medium">{peerProfile.bio || 'Este usuario es un misterio...'}</p>
              </div>
              {interesList.length > 0 && (
                <div>
                  <h3 className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-3 ml-1">Intereses</h3>
                  <div className="flex flex-wrap gap-2">
                    {interesList.map((interest: string) => (
                      <span key={interest} className="px-3 py-1.5 bg-pink-50 border border-pink-100 text-pink-600 rounded-full text-[13px] font-bold">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Background Soft Orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-pink-100/50 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/4"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-violet-100/40 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3"></div>

      {/* Header */}
      <div className="sticky top-0 bg-white/60 backdrop-blur-2xl z-40 px-4 py-3 border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.02)] flex items-center gap-4">
        <button
          onClick={() => router.push('/matches')}
          className="p-2 -ml-2 hover:bg-white/50 rounded-full transition-colors active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div onClick={() => setShowProfile(true)} className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-white bg-gradient-to-tr from-pink-300 to-violet-400 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          {peerProfile.foto_perfil ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={peerProfile.foto_perfil} alt={peerProfile.nombre} className="w-full h-full object-cover" />
          ) : (
             <span className="text-xl font-black text-white">{peerProfile.nombre.charAt(0)}</span>
          )}
          {peerOnline && (
            <div className="absolute border-2 border-white bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
          )}
        </div>
        <div className="flex-1 overflow-hidden flex flex-col justify-center">
          <h2 onClick={() => setShowProfile(true)} className="font-extrabold text-gray-800 text-[17px] truncate leading-tight tracking-tight cursor-pointer">{peerProfile.nombre.split(' ')[0]}</h2>
          {isTyping ? (
            <p className="text-[12px] text-pink-500 font-bold tracking-widest uppercase flex items-center gap-1">
              Escribiendo
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </p>
          ) : peerOnline ? (
            <p className="text-[12px] text-green-500 font-bold tracking-widest uppercase">En línea</p>
          ) : (
            <p className="text-[12px] text-gray-400 font-bold tracking-widest uppercase">Desconectado</p>
          )}
        </div>
        <button onClick={() => setShowProfile(true)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4 pb-32 scrollbar-hide z-10">

        {/* Match header Intro */}
        <div className="text-center py-10 mb-8 mt-4 relative">
          <div onClick={() => setShowProfile(true)} className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 shadow-2xl shadow-pink-200/50 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-400 via-pink-500 to-purple-500 animate-spin-slow"></div>
            <div className="absolute inset-[3px] bg-white rounded-full overflow-hidden flex items-center justify-center">
              {peerProfile.foto_perfil ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={peerProfile.foto_perfil} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-black text-gray-300">{peerProfile.nombre.charAt(0)}</span>
              )}
            </div>
            <div className="absolute top-1 right-2 text-white animate-bounce">✨</div>
            <div className="absolute bottom-4 left-2 text-white animate-pulse">💖</div>
          </div>
          <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-1">Nuevo Match</p>
          <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 tracking-tight">
            {peerProfile.nombre}
          </h3>
          <p className="text-[13px] font-bold text-violet-400 mt-2 uppercase tracking-widest bg-violet-50 inline-block px-3 py-1 rounded-full border border-violet-100">
            {peerProfile.carrera} · Semestre {peerProfile.semestre}
          </p>
        </div>

        {messages.length === 0 && (
           <div className="bg-white/60 backdrop-blur-md max-w-xs mx-auto text-center p-6 rounded-3xl border border-white shadow-sm">
             <span className="text-4xl mb-3 block">👋</span>
             <p className="text-sm font-bold text-gray-600">¡No seas tímid@!</p>
             <p className="text-[13px] text-gray-400 mt-1">Dile hola o envíale un cumplido para iniciar la charla.</p>
           </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === myMatricula
          const canModify = isMe && isWithinEditWindow(msg)
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300 group`}
              onContextMenu={(e) => handleMessageContext(e, msg)}
            >
              {/* Action buttons on hover (desktop) */}
              {canModify && (
                <div className={`hidden group-hover:flex items-center gap-1 mx-2 ${isMe ? 'order-first' : 'order-last'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingMsg({ id: msg.id, text: msg.text })
                      setEditText(msg.text)
                    }}
                    className="p-1.5 rounded-full bg-white/80 border border-gray-100 shadow-sm hover:bg-gray-50 transition-all text-gray-400 hover:text-blue-500"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(msg.id)
                    }}
                    className="p-1.5 rounded-full bg-white/80 border border-gray-100 shadow-sm hover:bg-red-50 transition-all text-gray-400 hover:text-red-500"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.798l-.2 4.5a.75.75 0 0 1-1.496-.066l.2-4.5a.75.75 0 0 1 .796-.731ZM11.42 7.72a.75.75 0 0 1 .796.731l.2 4.5a.75.75 0 1 1-1.496.066l-.2-4.5a.75.75 0 0 1 .7-.798Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              <div
                className={`max-w-[80%] md:max-w-[70%] px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
                  isMe
                    ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 text-white rounded-3xl rounded-br-[4px]'
                    : 'bg-white/80 backdrop-blur-xl text-gray-800 border border-white rounded-[24px] rounded-bl-[4px]'
                }`}
              >
                <p className={`text-[15.5px] leading-relaxed break-words ${isMe ? 'font-medium' : 'font-semibold'}`}>
                  {msg.text}
                </p>
                <div className={`flex items-center justify-end gap-0.5 mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                  {msg.edited_at && (
                    <span className="text-[9px] font-bold tracking-wider mr-1">editado</span>
                  )}
                  <span className="text-[10px] font-bold tracking-widest">
                    {msg.time}
                  </span>
                  {isMe && <StatusIcon status={msg.status || 'sent'} />}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] rounded-bl-[4px] px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex gap-1.5 items-center">
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-6" />
      </div>

      {/* Context menu (mobile long-press / right-click) */}
      {contextMenu && (
        <div
          className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in duration-150"
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 180) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const msg = messages.find(m => m.id === contextMenu.msgId)
              if (msg) {
                setEditingMsg({ id: msg.id, text: msg.text })
                setEditText(msg.text)
              }
              setContextMenu(null)
            }}
            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500">
              <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            </svg>
            Editar
          </button>
          <div className="h-px bg-gray-100"></div>
          <button
            onClick={() => {
              handleDelete(contextMenu.msgId)
            }}
            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 w-full text-left transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.798l-.2 4.5a.75.75 0 0 1-1.496-.066l.2-4.5a.75.75 0 0 1 .796-.731ZM11.42 7.72a.75.75 0 0 1 .796.731l.2 4.5a.75.75 0 1 1-1.496.066l-.2-4.5a.75.75 0 0 1 .7-.798Z" clipRule="evenodd" />
            </svg>
            Eliminar
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editingMsg && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-gray-800 mb-4">Editar mensaje</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 resize-none transition-all"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setEditingMsg(null); setEditText('') }}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={!editText.trim() || editText.trim() === editingMsg.text}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-violet-500 shadow-lg shadow-pink-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe z-50">
        {showEmojis && (
          <div className="absolute bottom-[80px] left-4 bg-white/95 backdrop-blur-3xl border border-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.3)] p-3 rounded-3xl flex flex-wrap gap-1.5 w-[256px] z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="w-full flex justify-between items-center px-2 mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reacciones Rápidas</span>
              <button onClick={() => setShowEmojis(false)} className="text-gray-300 hover:text-pink-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {['😂','😍','😭','🔥','🙏','💀','🤔','🥺','🤭','✨','💯','💖', '🍕', '🍻', '🎉', '☕'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  handleInputChange(newMessage + emoji)
                  setShowEmojis(false)
                }}
                className="w-10 h-10 text-2xl flex items-center justify-center hover:bg-pink-50 rounded-full transition-transform hover:scale-125 active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="max-w-lg mx-auto flex items-end gap-2 bg-white/80 backdrop-blur-3xl p-2 rounded-[2rem] border border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              showEmojis ? 'bg-pink-100 text-pink-500 rotate-45' : 'bg-gray-50 text-gray-400 hover:text-pink-500 hover:bg-pink-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Mensaje..."
            rows={1}
            className="flex-1 bg-transparent px-2 py-3 max-h-32 text-gray-800 outline-none resize-none text-[15px] font-medium placeholder-gray-400 scrollbar-hide"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-11 h-11 shrink-0 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 hover:-translate-y-0.5 transition-all active:scale-90 disabled:opacity-0 disabled:scale-50 disabled:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFDFD]" />}>
      <ChatContent />
    </Suspense>
  )
}
