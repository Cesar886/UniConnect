import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matricula: string; slot: string }> }
) {
  const { matricula: mat, slot: sl } = await params

  const matricula = parseInt(mat, 10)
  const slot = parseInt(sl, 10)

  if (!Number.isInteger(matricula) || ![1, 2, 3].includes(slot)) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const result = await pool.query(
      'SELECT data, mime_type FROM fotos WHERE matricula = $1 AND slot = $2',
      [matricula, slot]
    )

    if (result.rows.length === 0) {
      return new NextResponse(null, { status: 404 })
    }

    const { data, mime_type } = result.rows[0]

    return new NextResponse(data, {
      headers: {
        'Content-Type': mime_type,
        // La URL ya incluye ?v=timestamp, así el navegador cachea correctamente
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
