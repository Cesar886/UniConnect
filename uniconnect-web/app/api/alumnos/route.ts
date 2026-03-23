import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await pool.query(
      `SELECT
        a.matricula,
        a.nombre,
        a.paterno,
        a.materno,
        a.genero,
        a.edad,
        a.pais,
        a.residencia,
        p.codigo AS plan,
        m.nombre AS modalidad,
        t.nombre AS tipo_alumno
      FROM alumnos a
      LEFT JOIN planes p ON a.plan_id = p.id
      LEFT JOIN modalidades m ON a.modalidad_id = m.id
      LEFT JOIN tipos_alumno t ON a.tipo_id = t.id
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
