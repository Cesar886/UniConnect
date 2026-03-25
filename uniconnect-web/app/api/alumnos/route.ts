import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // 1. Autenticación: solo usuarios con sesión válida
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Rate limiting: 30 peticiones / minuto por usuario
  const rl = checkRateLimit(`alumnos:${session.matricula}`, 30, 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    // 3. Tope máximo de resultados por petición para impedir volcado masivo
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10')), 20)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

    const result = await pool.query(
      `SELECT
        matricula,
        nombre,
        paterno,
        materno,
        genero,
        edad,
        pais,
        residencia,
        plan_id,
        tipo_id,
        modalidad_id
      FROM public.alumnos
      ORDER BY RANDOM()
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error querying alumnos:', error)
    return NextResponse.json({ error: 'Error al consultar la base de datos' }, { status: 500 })
  }
}
