'use server'

import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import pool from '@/lib/db'

export async function uploadProfilePhoto(matricula: number, slot: 1 | 2 | 3, formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'No file provided' }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Ignorar si ya existe
    }

    const ext = file.name.split('.').pop() || 'webp'
    const fileName = `${matricula}-slot${slot}-${Date.now()}.${ext}`
    const path = join(uploadDir, fileName)

    const columnName = slot === 1 ? 'foto_perfil' : slot === 2 ? 'foto2' : 'foto3'

    // 1. Buscar si el usuario ya tenía una foto local antes de guardar la nueva
    const currentRes = await pool.query(`SELECT ${columnName} FROM alumnos WHERE matricula = $1`, [matricula])
    if (currentRes.rows.length > 0) {
      const oldUrl = currentRes.rows[0][columnName]
      if (oldUrl && oldUrl.startsWith('/uploads/')) {
        const oldFileName = oldUrl.replace('/uploads/', '')
        const oldPath = join(uploadDir, oldFileName)
        try {
          await unlink(oldPath) // Eliminar archivo físico
        } catch (e) {
          console.log(`No se pudo borrar la foto vieja: ${oldPath}`)
        }
      }
    }

    // 2. Escribir el nuevo archivo
    await writeFile(path, buffer)
    const photoUrl = `/uploads/${fileName}`

    // 3. Actualizar la base de datos
    const text = `UPDATE alumnos SET ${columnName} = $1 WHERE matricula = $2 RETURNING *;`
    const values = [photoUrl, matricula]
    await pool.query(text, values)

    return { success: true, photoUrl }
  } catch (error) {
    console.error('Upload Error:', error)
    return { success: false, error: 'Failed to upload photo' }
  }
}

export async function removeProfilePhoto(matricula: number, slot: 1 | 2 | 3) {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const columnName = slot === 1 ? 'foto_perfil' : slot === 2 ? 'foto2' : 'foto3'

    const currentRes = await pool.query(`SELECT ${columnName} FROM alumnos WHERE matricula = $1`, [matricula])
    if (currentRes.rows.length > 0) {
      const oldUrl = currentRes.rows[0][columnName]
      if (oldUrl && oldUrl.startsWith('/uploads/')) {
        const oldFileName = oldUrl.replace('/uploads/', '')
        const oldPath = join(uploadDir, oldFileName)
        try { await unlink(oldPath) } catch (e) { }
      }
    }

    const text = `UPDATE alumnos SET ${columnName} = NULL WHERE matricula = $1;`
    await pool.query(text, [matricula])
    return { success: true }
  } catch (err) {
    return { success: false }
  }
}
