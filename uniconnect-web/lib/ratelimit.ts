/**
 * Rate limiter en memoria con ventana deslizante.
 * Adecuado para despliegues en un único proceso (VPS con Node.js).
 * Si en el futuro se escala a múltiples instancias, migrar a Redis.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Limpiar entradas expiradas cada 10 minutos para evitar fuga de memoria
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store) {
    if (win.resetAt <= now) store.delete(key)
  }
}, 10 * 60 * 1000)

/**
 * Comprueba si la clave supera el límite.
 * @param key     Identificador único (ej. "login:127.0.0.1")
 * @param limit   Número máximo de intentos permitidos
 * @param windowMs Duración de la ventana en milisegundos
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 }
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    }
  }

  existing.count++
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 }
}
