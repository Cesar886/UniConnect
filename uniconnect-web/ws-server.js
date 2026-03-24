const { createServer } = require('http')
const { Server } = require('socket.io')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://uniconnect:987654321@64.23.168.72:5432/tinder'
})

// ─── Schema migration ───────────────────────────────────────────────
async function ensureSchema() {
  try {
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='status') THEN
          ALTER TABLE messages ADD COLUMN status VARCHAR(10) DEFAULT 'sent';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='edited_at') THEN
          ALTER TABLE messages ADD COLUMN edited_at TIMESTAMPTZ DEFAULT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='deleted_at') THEN
          ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='last_seen') THEN
          ALTER TABLE alumnos ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NULL;
        END IF;
      END $$;
    `)
    // Index for faster unread queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_status_receiver
      ON messages (receiver_id, status) WHERE deleted_at IS NULL;
    `).catch(() => {})
    console.log('[WS] Schema verified/updated')
  } catch (err) {
    console.error('[WS] Schema migration error:', err)
  }
}

// ─── Constants ───────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 2000
const RATE_LIMIT_WINDOW = 10000 // 10 seconds
const RATE_LIMIT_MAX = 20       // max 20 messages per window
const TYPING_TIMEOUT = 5000     // auto-clear typing after 5s

// ─── Server setup ────────────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', connections: io.engine.clientsCount }))
    return
  }
  res.writeHead(404)
  res.end()
})

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST']
  },
  pingInterval: 15000,
  pingTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB max payload
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
  }
})

// ─── State ───────────────────────────────────────────────────────────
// matricula -> Set<socketId>
const onlineUsers = new Map()
// socketId -> { matricula, rateLimitCount, rateLimitReset, typingTimers: Map<peerId, timeout> }
const socketMeta = new Map()

// ─── Helpers ─────────────────────────────────────────────────────────
function isUserOnline(matricula) {
  return onlineUsers.has(matricula) && onlineUsers.get(matricula).size > 0
}

function getAuthenticatedUser(socket) {
  const meta = socketMeta.get(socket.id)
  return meta ? meta.matricula : null
}

function checkRateLimit(socket) {
  const meta = socketMeta.get(socket.id)
  if (!meta) return false
  const now = Date.now()
  if (now > meta.rateLimitReset) {
    meta.rateLimitCount = 0
    meta.rateLimitReset = now + RATE_LIMIT_WINDOW
  }
  meta.rateLimitCount++
  if (meta.rateLimitCount > RATE_LIMIT_MAX) {
    socket.emit('message:error', { error: 'Demasiados mensajes. Espera unos segundos.' })
    return false
  }
  return true
}

async function getUnreadTotal(matricula) {
  const res = await pool.query(`
    SELECT COUNT(*)::int as total
    FROM messages
    WHERE receiver_id = $1 AND deleted_at IS NULL
      AND status != 'read' AND sender_id != $1
  `, [matricula])
  return res.rows[0]?.total || 0
}

async function updateLastSeen(matricula) {
  try {
    await pool.query(
      `UPDATE alumnos SET last_seen = NOW() WHERE matricula = $1`,
      [matricula]
    )
  } catch (err) {
    // non-critical
  }
}

function clearTypingTimers(socketId) {
  const meta = socketMeta.get(socketId)
  if (!meta) return
  for (const timer of meta.typingTimers.values()) {
    clearTimeout(timer)
  }
  meta.typingTimers.clear()
}

// ─── Connection handler ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Nueva conexión: ${socket.id}`)

  // ── Register ──
  socket.on('register', async (matricula, ack) => {
    if (!matricula || typeof matricula !== 'number') {
      if (typeof ack === 'function') ack({ error: 'Matrícula inválida' })
      return
    }

    // Verify user exists in database
    try {
      const userCheck = await pool.query(
        `SELECT matricula FROM alumnos WHERE matricula = $1`, [matricula]
      )
      if (userCheck.rows.length === 0) {
        if (typeof ack === 'function') ack({ error: 'Usuario no encontrado' })
        return
      }
    } catch (err) {
      console.error('[WS] Error verifying user:', err)
      if (typeof ack === 'function') ack({ error: 'Error de servidor' })
      return
    }

    // Setup socket metadata
    socketMeta.set(socket.id, {
      matricula,
      rateLimitCount: 0,
      rateLimitReset: Date.now() + RATE_LIMIT_WINDOW,
      typingTimers: new Map(),
    })

    if (!onlineUsers.has(matricula)) {
      onlineUsers.set(matricula, new Set())
    }
    onlineUsers.get(matricula).add(socket.id)

    socket.join(`user:${matricula}`)

    // Notify everyone this user is online
    io.emit('user:online', { matricula, online: true })

    // Mark pending messages as delivered & notify senders
    try {
      const res = await pool.query(`
        UPDATE messages SET status = 'delivered'
        WHERE receiver_id = $1 AND status = 'sent' AND deleted_at IS NULL
        RETURNING id, sender_id
      `, [matricula])

      const bySender = {}
      for (const row of res.rows) {
        if (!bySender[row.sender_id]) bySender[row.sender_id] = []
        bySender[row.sender_id].push(row.id)
      }
      for (const [senderId, msgIds] of Object.entries(bySender)) {
        io.to(`user:${senderId}`).emit('message:status', { messageIds: msgIds, status: 'delivered' })
      }
    } catch (err) {
      console.error('[WS] Error marking delivered on connect:', err)
    }

    const sessions = onlineUsers.get(matricula).size
    console.log(`[WS] Usuario ${matricula} registrado (${sessions} sesiones)`)

    // Acknowledge registration with server timestamp
    if (typeof ack === 'function') ack({ ok: true, serverTime: Date.now() })
  })

  // ── Send message ──
  socket.on('message:send', async ({ receiverId, text, tempId }, ack) => {
    const senderId = getAuthenticatedUser(socket)
    if (!senderId) {
      socket.emit('message:error', { error: 'No autenticado. Reconectando...', tempId })
      return
    }

    if (!text || typeof text !== 'string' || !text.trim() || !receiverId) {
      if (typeof ack === 'function') ack({ error: 'Datos inválidos' })
      return
    }

    const cleanText = text.trim()
    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      socket.emit('message:error', { error: `Mensaje muy largo (máx ${MAX_MESSAGE_LENGTH} caracteres).`, tempId })
      return
    }

    if (!checkRateLimit(socket)) return

    try {
      const receiverOnline = isUserOnline(receiverId)
      const initialStatus = receiverOnline ? 'delivered' : 'sent'

      const res = await pool.query(`
        INSERT INTO messages (sender_id, receiver_id, text, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, sender_id, receiver_id, text, status,
                  TO_CHAR(created_at, 'HH24:MI') as time,
                  created_at
      `, [senderId, receiverId, cleanText, initialStatus])

      const msg = { ...res.rows[0], tempId }

      // Send to receiver
      io.to(`user:${receiverId}`).emit('message:new', msg)
      // Confirm to sender (all tabs)
      io.to(`user:${senderId}`).emit('message:new', msg)

      // Update unread count for receiver
      const unread = await getUnreadTotal(receiverId)
      io.to(`user:${receiverId}`).emit('unread:update', unread)

      // Notify both about match list update
      io.to(`user:${receiverId}`).emit('matches:update')
      io.to(`user:${senderId}`).emit('matches:update')

      // Ack with the real message
      if (typeof ack === 'function') ack({ ok: true, message: msg })
    } catch (err) {
      console.error('[WS] Error sending message:', err)
      socket.emit('message:error', { error: 'No se pudo enviar el mensaje', tempId })
      if (typeof ack === 'function') ack({ error: 'Error de servidor' })
    }
  })

  // ── Mark as read ──
  socket.on('chat:read', async ({ peerId }) => {
    const myId = getAuthenticatedUser(socket)
    if (!myId || !peerId) return

    try {
      const res = await pool.query(`
        UPDATE messages SET status = 'read'
        WHERE sender_id = $1 AND receiver_id = $2 AND status != 'read' AND deleted_at IS NULL
        RETURNING id
      `, [peerId, myId])

      if (res.rows.length > 0) {
        const msgIds = res.rows.map(r => r.id)
        io.to(`user:${peerId}`).emit('message:status', { messageIds: msgIds, status: 'read' })
      }

      const unread = await getUnreadTotal(myId)
      io.to(`user:${myId}`).emit('unread:update', unread)
    } catch (err) {
      console.error('[WS] Error in chat:read:', err)
    }
  })

  // ── Edit message (20 min window) ──
  socket.on('message:edit', async ({ messageId, newText }, ack) => {
    const senderId = getAuthenticatedUser(socket)
    if (!senderId) return

    if (!messageId || !newText || typeof newText !== 'string' || !newText.trim()) {
      if (typeof ack === 'function') ack({ error: 'Datos inválidos' })
      return
    }

    const cleanText = newText.trim()
    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      socket.emit('message:error', { error: `Mensaje muy largo (máx ${MAX_MESSAGE_LENGTH} caracteres).` })
      return
    }

    try {
      const res = await pool.query(`
        UPDATE messages
        SET text = $1, edited_at = NOW()
        WHERE id = $2 AND sender_id = $3 AND deleted_at IS NULL
          AND created_at > NOW() - INTERVAL '20 minutes'
        RETURNING id, sender_id, receiver_id, text, status,
                  TO_CHAR(created_at, 'HH24:MI') as time, edited_at
      `, [cleanText, messageId, senderId])

      if (res.rows.length === 0) {
        socket.emit('message:error', { error: 'No se puede editar. Límite de 20 minutos.' })
        if (typeof ack === 'function') ack({ error: 'Tiempo expirado' })
        return
      }

      const msg = res.rows[0]
      io.to(`user:${msg.sender_id}`).emit('message:edited', msg)
      io.to(`user:${msg.receiver_id}`).emit('message:edited', msg)
      if (typeof ack === 'function') ack({ ok: true, message: msg })
    } catch (err) {
      console.error('[WS] Error editing message:', err)
      socket.emit('message:error', { error: 'Error al editar' })
    }
  })

  // ── Delete message (20 min window, soft delete) ──
  socket.on('message:delete', async ({ messageId }, ack) => {
    const senderId = getAuthenticatedUser(socket)
    if (!senderId || !messageId) return

    try {
      const res = await pool.query(`
        UPDATE messages SET deleted_at = NOW()
        WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
          AND created_at > NOW() - INTERVAL '20 minutes'
        RETURNING id, sender_id, receiver_id
      `, [messageId, senderId])

      if (res.rows.length === 0) {
        socket.emit('message:error', { error: 'No se puede eliminar. Límite de 20 minutos.' })
        if (typeof ack === 'function') ack({ error: 'Tiempo expirado' })
        return
      }

      const msg = res.rows[0]
      io.to(`user:${msg.sender_id}`).emit('message:deleted', { messageId: msg.id })
      io.to(`user:${msg.receiver_id}`).emit('message:deleted', { messageId: msg.id })

      // Update unread for receiver
      const unread = await getUnreadTotal(msg.receiver_id)
      io.to(`user:${msg.receiver_id}`).emit('unread:update', unread)

      io.to(`user:${msg.receiver_id}`).emit('matches:update')
      io.to(`user:${msg.sender_id}`).emit('matches:update')

      if (typeof ack === 'function') ack({ ok: true })
    } catch (err) {
      console.error('[WS] Error deleting message:', err)
      socket.emit('message:error', { error: 'Error al eliminar' })
    }
  })

  // ── Typing indicators ──
  socket.on('typing:start', ({ receiverId }) => {
    const senderId = getAuthenticatedUser(socket)
    if (!senderId || !receiverId) return

    io.to(`user:${receiverId}`).emit('typing:show', { senderId })

    // Auto-clear typing after timeout (server-side safety)
    const meta = socketMeta.get(socket.id)
    if (meta) {
      if (meta.typingTimers.has(receiverId)) {
        clearTimeout(meta.typingTimers.get(receiverId))
      }
      meta.typingTimers.set(receiverId, setTimeout(() => {
        io.to(`user:${receiverId}`).emit('typing:hide', { senderId })
        meta.typingTimers.delete(receiverId)
      }, TYPING_TIMEOUT))
    }
  })

  socket.on('typing:stop', ({ receiverId }) => {
    const senderId = getAuthenticatedUser(socket)
    if (!senderId || !receiverId) return

    io.to(`user:${receiverId}`).emit('typing:hide', { senderId })

    const meta = socketMeta.get(socket.id)
    if (meta && meta.typingTimers.has(receiverId)) {
      clearTimeout(meta.typingTimers.get(receiverId))
      meta.typingTimers.delete(receiverId)
    }
  })

  // ── Check user online ──
  socket.on('user:check', (matricula, ack) => {
    const online = isUserOnline(matricula)
    socket.emit('user:online', { matricula, online })
    if (typeof ack === 'function') ack({ matricula, online })
  })

  // ── Get last seen ──
  socket.on('user:lastSeen', async (matricula, ack) => {
    try {
      const res = await pool.query(
        `SELECT last_seen FROM alumnos WHERE matricula = $1`, [matricula]
      )
      const lastSeen = res.rows[0]?.last_seen || null
      socket.emit('user:lastSeen', { matricula, lastSeen })
      if (typeof ack === 'function') ack({ matricula, lastSeen })
    } catch (err) {
      if (typeof ack === 'function') ack({ matricula, lastSeen: null })
    }
  })

  // ── Disconnect ──
  socket.on('disconnect', async () => {
    const matricula = getAuthenticatedUser(socket)

    clearTypingTimers(socket.id)
    socketMeta.delete(socket.id)

    if (matricula && onlineUsers.has(matricula)) {
      onlineUsers.get(matricula).delete(socket.id)
      if (onlineUsers.get(matricula).size === 0) {
        onlineUsers.delete(matricula)
        io.emit('user:online', { matricula, online: false })
        await updateLastSeen(matricula)
        console.log(`[WS] Usuario ${matricula} desconectado`)
      }
    }
  })
})

// ─── Graceful shutdown ───────────────────────────────────────────────
async function gracefulShutdown(signal) {
  console.log(`[WS] ${signal} received. Shutting down gracefully...`)

  // Notify all connected users
  io.emit('server:shutdown', { message: 'Servidor reiniciándose...' })

  // Close socket server (stop accepting new connections)
  io.close()

  // Update last_seen for all online users
  const updates = []
  for (const matricula of onlineUsers.keys()) {
    updates.push(updateLastSeen(matricula))
  }
  await Promise.allSettled(updates)

  // Close DB pool
  await pool.end()

  console.log('[WS] Shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors so server doesn't crash silently
process.on('uncaughtException', (err) => {
  console.error('[WS] Uncaught exception:', err)
})
process.on('unhandledRejection', (err) => {
  console.error('[WS] Unhandled rejection:', err)
})

// ─── Start ───────────────────────────────────────────────────────────
const PORT = process.env.WS_PORT || 3001
ensureSchema().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[WS] Servidor WebSocket corriendo en puerto ${PORT}`)
  })
})
