import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

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
