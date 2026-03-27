'use server'

import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'
import { getSession } from '@/lib/session'

const origFileName = (matricula: number, slot: number) => `${matricula}-slot${slot}-orig.webp`

// Guarda el archivo original sin tocar la DB (para poder re-editar sin perder calidad)
export async function saveOriginalPhoto(slot: 1 | 2 | 3, formData: FormData) {
  try {
    const session = await getSession()
    if (!session) return { success: false }
    const matricula = session.matricula

    const file = formData.get('file') as File
    if (!file) return { success: false }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true }).catch(() => {})

    const bytes = await file.arrayBuffer()
    await writeFile(join(uploadDir, origFileName(matricula, slot)), Buffer.from(bytes))
    return { success: true, origUrl: `/uploads/${origFileName(matricula, slot)}` }
  } catch {
    return { success: false }
  }
}

export async function uploadProfilePhoto(slot: 1 | 2 | 3, formData: FormData) {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'No autenticado' }
    const matricula = session.matricula

    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'No file provided' }

    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_MIME.includes(file.type)) {
      return { success: false, error: 'Solo se permiten imágenes (jpg, png, webp, gif).' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'La imagen no puede superar 5 MB.' }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true }).catch(() => {})

    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const ext = MIME_TO_EXT[file.type] ?? 'jpg'
    const fileName = `${matricula}-slot${slot}-${Date.now()}.${ext}`
    const path = join(uploadDir, fileName)

    const columnName = slot === 1 ? 'foto_perfil' : slot === 2 ? 'foto2' : 'foto3'

    // Borrar foto anterior (pero NO el original _orig)
    const currentRes = await pool.query(`SELECT ${columnName} FROM alumnos WHERE matricula = $1`, [matricula])
    if (currentRes.rows.length > 0) {
      const oldUrl = currentRes.rows[0][columnName]
      if (oldUrl && oldUrl.startsWith('/uploads/')) {
        const oldFileName = oldUrl.replace('/uploads/', '')
        if (!oldFileName.includes('-orig.')) {
          try { await unlink(join(uploadDir, oldFileName)) } catch {}
        }
      }
    }

    await writeFile(path, buffer)
    const photoUrl = `/uploads/${fileName}`

    const text = `UPDATE alumnos SET ${columnName} = $1 WHERE matricula = $2 RETURNING *;`
    await pool.query(text, [photoUrl, matricula])

    return { success: true, photoUrl }
  } catch (error) {
    console.error('Upload Error:', error)
    return { success: false, error: 'Failed to upload photo' }
  }
}

export async function removeProfilePhoto(slot: 1 | 2 | 3) {
  try {
    const session = await getSession()
    if (!session) return { success: false }
    const matricula = session.matricula

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const columnName = slot === 1 ? 'foto_perfil' : slot === 2 ? 'foto2' : 'foto3'

    const currentRes = await pool.query(`SELECT ${columnName} FROM alumnos WHERE matricula = $1`, [matricula])
    if (currentRes.rows.length > 0) {
      const oldUrl = currentRes.rows[0][columnName]
      if (oldUrl && oldUrl.startsWith('/uploads/')) {
        try { await unlink(join(uploadDir, oldUrl.replace('/uploads/', ''))) } catch {}
      }
    }
    // Borrar también el original guardado
    try { await unlink(join(uploadDir, origFileName(matricula, slot))) } catch {}

    const text = `UPDATE alumnos SET ${columnName} = NULL WHERE matricula = $1;`
    await pool.query(text, [matricula])
    return { success: true }
  } catch (err) {
    return { success: false }
  }
}
