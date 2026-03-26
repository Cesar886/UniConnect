'use server'

import pool from '@/lib/db'

export async function getWaitlistStats() {
  try {
    const alumnosCount = await pool.query('SELECT COUNT(*)::int as count FROM alumnos')
    const waitlistCount = await pool.query('SELECT COUNT(*)::int as count FROM waitlist')
    
    return {
      success: true,
      total: alumnosCount.rows[0].count + waitlistCount.rows[0].count,
      goal: 200
    }
  } catch (error) {
    console.error('Error getting waitlist stats:', error)
    return { success: false, total: 47, goal: 200 } // Fallback
  }
}

export async function joinWaitlist(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Email inválido' }
  }
  
  try {
    // Check if already in alumnos
    const inAlumnos = await pool.query('SELECT 1 FROM alumnos WHERE email = $1', [email])
    if (inAlumnos.rows.length > 0) {
      return { success: true, message: '¡Ya eres parte de UniConnect!' }
    }
    
    // Insert into waitlist
    await pool.query(
      'INSERT INTO waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    )
    
    return { success: true }
  } catch (error) {
    console.error('Error joining waitlist:', error)
    return { success: false, error: 'Error del servidor' }
  }
}
