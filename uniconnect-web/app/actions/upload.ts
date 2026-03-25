'use server'

import pool from '@/lib/db'
import { getSession } from '@/lib/session'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const COLUMN: Record<1 | 2 | 3, string> = {
  1: 'foto_perfil',
  2: 'foto2',
  3: 'foto3',
}

async function ensureFotosTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fotos (
      matricula INTEGER NOT NULL,
      slot      INTEGER NOT NULL,
      data      BYTEA   NOT NULL,
      mime_type VARCHAR(50) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (matricula, slot)
    )
  `)
}

export async function uploadProfilePhoto(slot: 1 | 2 | 3, formData: FormData) {
  const session = await getSession()
  if (!session) return { success: false, error: 'No autenticado' }
  const matricula = session.matricula

  const file = formData.get('file') as File
  if (!file) return { success: false, error: 'No file provided' }

  if (!ALLOWED_MIME.includes(file.type)) {
    return { success: false, error: 'Solo se permiten imágenes (jpg, png, webp, gif).' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'La imagen no puede superar 5 MB.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  await ensureFotosTable()

  await pool.query(
    `INSERT INTO fotos (matricula, slot, data, mime_type, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (matricula, slot) DO UPDATE
       SET data = EXCLUDED.data,
           mime_type = EXCLUDED.mime_type,
           updated_at = NOW()`,
    [matricula, slot, buffer, file.type]
  )

  // Incluimos ?v= para que el navegador no use la foto anterior en caché
  const photoUrl = `/api/fotos/${matricula}/${slot}?v=${Date.now()}`

  await pool.query(
    `UPDATE alumnos SET ${COLUMN[slot]} = $1 WHERE matricula = $2`,
    [photoUrl, matricula]
  )

  return { success: true, photoUrl }
}

export async function removeProfilePhoto(slot: 1 | 2 | 3) {
  const session = await getSession()
  if (!session) return { success: false }
  const matricula = session.matricula

  await ensureFotosTable()

  await pool.query(
    'DELETE FROM fotos WHERE matricula = $1 AND slot = $2',
    [matricula, slot]
  )

  await pool.query(
    `UPDATE alumnos SET ${COLUMN[slot]} = NULL WHERE matricula = $1`,
    [matricula]
  )

  return { success: true }
}
