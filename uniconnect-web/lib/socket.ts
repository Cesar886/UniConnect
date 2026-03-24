'use client'

import { io, Socket } from 'socket.io-client'

// ─── Connection state ───────────────────────────────────────────────
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'
type ConnectionListener = (status: ConnectionStatus) => void

let socket: Socket | null = null
let registeredMatricula: number | null = null
let connectionStatus: ConnectionStatus = 'disconnected'
const connectionListeners = new Set<ConnectionListener>()
const offlineQueue: Array<{ event: string; data: any; ack?: (res: any) => void }> = []

function setConnectionStatus(status: ConnectionStatus) {
  connectionStatus = status
  connectionListeners.forEach(fn => fn(status))
}

export function onConnectionChange(listener: ConnectionListener): () => void {
  connectionListeners.add(listener)
  // Immediately notify current status
  listener(connectionStatus)
  return () => { connectionListeners.delete(listener) }
}

export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus
}

// ─── Offline queue ──────────────────────────────────────────────────
function flushOfflineQueue() {
  if (!socket?.connected) return
  while (offlineQueue.length > 0) {
    const item = offlineQueue.shift()!
    if (item.ack) {
      socket.emit(item.event, item.data, item.ack)
    } else {
      socket.emit(item.event, item.data)
    }
  }
}

export function emitOrQueue(event: string, data: any, ack?: (res: any) => void) {
  const s = getSocket()
  if (s.connected) {
    if (ack) {
      s.emit(event, data, ack)
    } else {
      s.emit(event, data)
    }
  } else {
    offlineQueue.push({ event, data, ack })
  }
}

// ─── Socket singleton ───────────────────────────────────────────────
export function getSocket(): Socket {
  if (!socket) {
    const wsUrl = typeof window !== 'undefined'
      ? `${window.location.hostname}:3001`
      : 'localhost:3001'

    socket = io(`http://${wsUrl}`, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('[Socket] Conectado:', socket?.id)
      setConnectionStatus('connected')

      // Re-register on reconnect
      if (registeredMatricula) {
        socket?.emit('register', registeredMatricula, () => {
          console.log('[Socket] Re-registrado tras reconexión')
          flushOfflineQueue()
        })
      } else {
        flushOfflineQueue()
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason)
      setConnectionStatus('disconnected')
    })

    socket.on('reconnecting', () => {
      setConnectionStatus('connecting')
    })

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('connecting')
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Error de conexión:', err.message)
      setConnectionStatus('connecting')
    })

    socket.on('server:shutdown', () => {
      console.log('[Socket] Servidor reiniciándose...')
      setConnectionStatus('connecting')
    })
  }
  return socket
}

// ─── Register user (called from components) ─────────────────────────
export function registerUser(matricula: number, ack?: (res: any) => void) {
  registeredMatricula = matricula
  const s = getSocket()
  if (s.connected) {
    s.emit('register', matricula, ack)
  }
  // If not connected, will auto-register on connect
}

export function getRegisteredMatricula(): number | null {
  return registeredMatricula
}

export function disconnectSocket() {
  if (socket) {
    registeredMatricula = null
    offlineQueue.length = 0
    socket.disconnect()
    socket = null
    setConnectionStatus('disconnected')
  }
}
