'use server'

import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function getStudents(currentMatricula?: number, limit: number = 20) {
  try {
    const session = currentMatricula ? { matricula: currentMatricula } : await getSession();
    const myMatricula = session?.matricula;
    if (!myMatricula) return [];

    // 1. Obtener datos del usuario actual para segmentación
    const userRes = await pool.query(
      `SELECT genero_interes, es_menor, edad, pref_edad_min, pref_edad_max FROM alumnos WHERE matricula = $1`,
      [myMatricula]
    );
    
    if (userRes.rows.length === 0) return [];
    
    const { genero_interes, es_menor, pref_edad_min, pref_edad_max } = userRes.rows[0];

    // 2. Construir query con segmentación y filtros
    let query = `
      SELECT 
        matricula, nombre, apellidos, carrera, semestre, 
        edad, bio, intereses, genero,
        foto_perfil, foto2, foto3, es_menor
      FROM alumnos 
      WHERE matricula != $1 
        AND password_hash IS NOT NULL
        AND is_banned = false
        AND matricula NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = $1)
    `;

    const values: any[] = [myMatricula];

    // Regla de Oro: Menores solo ven menores, Adultos solo ven adultos 
    // Excepto si es_menor es null (tratar como adulto por seguridad)
    if (es_menor) {
      query += ` AND es_menor = true`;
    } else {
      query += ` AND (es_menor = false OR es_menor IS NULL)`;
    }

    // Filtro de Género de Interés
    if (genero_interes && genero_interes !== 'Ambos') {
      const dbGenero = genero_interes === 'Hombres' ? 'Hombre' : (genero_interes === 'Mujeres' ? 'Mujer' : genero_interes);
      query += ` AND genero = $${values.length + 1}`;
      values.push(dbGenero);
    }

    // Filtro de Edad (Preferencias)
    if (pref_edad_min) {
      query += ` AND edad >= $${values.length + 1}`;
      values.push(pref_edad_min);
    }
    if (pref_edad_max) {
      query += ` AND edad <= $${values.length + 1}`;
      values.push(pref_edad_max);
    }

    query += ` ORDER BY RANDOM() LIMIT $${values.length + 1}`;
    values.push(limit);

    const res = await pool.query(query, values);
    return res.rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function getAllUsers(adminId: number, search?: string) {
  try {
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) {
      throw new Error('No autorizado');
    }

    let query = `
      SELECT matricula, email, nombre, apellidos, carrera, semestre, edad, genero, is_admin, is_banned, es_menor, fecha_registro
      FROM alumnos
    `;
    const values: any[] = [];

    if (search) {
      query += ` WHERE CAST(matricula AS TEXT) LIKE $1 OR LOWER(nombre) LIKE $1 OR LOWER(apellidos) LIKE $1 OR LOWER(email) LIKE $1`;
      values.push(`%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY fecha_registro DESC LIMIT 100`;
    
    const res = await pool.query(query, values);
    return res.rows;
  } catch (err) {
    console.error('Error fetching all users:', err);
    throw err;
  }
}

export async function toggleBanStatus(adminId: number, targetId: number, status: boolean) {
  try {
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) throw new Error('No autorizado');

    await pool.query('UPDATE alumnos SET is_banned = $1 WHERE matricula = $2', [status, targetId]);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function toggleAdminStatus(adminId: number, targetId: number, status: boolean) {
  try {
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) throw new Error('No autorizado');

    await pool.query('UPDATE alumnos SET is_admin = $1 WHERE matricula = $2', [status, targetId]);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function toggleMinorStatus(adminId: number, targetId: number, status: boolean) {
  try {
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) throw new Error('No autorizado');

    await pool.query('UPDATE alumnos SET es_menor = $1 WHERE matricula = $2', [status, targetId]);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function saveProfileData(data: {
  nombre: string
  edad: number
  carrera: string
  semestre: number
  bio: string
  intereses: string
}) {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'No autenticado' }
    await pool.query(
      `UPDATE alumnos SET nombre = $1, edad = $2, carrera = $3, semestre = $4, bio = $5, intereses = $6 WHERE matricula = $7`,
      [data.nombre, data.edad, data.carrera, data.semestre, data.bio, data.intereses, session.matricula]
    )
    return { success: true }
  } catch (err) {
    console.error('Error saving profile:', err)
    return { success: false, error: String(err) }
  }
}

export async function updatePreferences(matricula: number, prefs: { pref_edad_min?: number, pref_edad_max?: number, genero_interes?: string }) {
  try {
    const { pref_edad_min, pref_edad_max, genero_interes } = prefs;
    await pool.query(
      `UPDATE alumnos SET 
        pref_edad_min = COALESCE($1, pref_edad_min),
        pref_edad_max = COALESCE($2, pref_edad_max),
        genero_interes = COALESCE($3, genero_interes)
       WHERE matricula = $4`,
      [pref_edad_min, pref_edad_max, genero_interes, matricula]
    );
    return { success: true };
  } catch (err) {
    console.error('Error updating preferences:', err);
    return { success: false, error: String(err) };
  }
}

export async function resetUserFeed(matricula: number) {
  try {
    // Borrar swipes del usuario que NO son matches mutuos
    await pool.query(`
      DELETE FROM swipes 
      WHERE swiper_id = $1 
      AND swiped_id NOT IN (
        SELECT swiper_id FROM swipes 
        WHERE swiped_id = $1 AND liked = true
      )
    `, [matricula]);
    return { success: true };
  } catch (err) {
    console.error('Error resetting user feed:', err);
    return { success: false, error: String(err) };
  }
}

export async function resetAllFeeds(adminId: number) {
  try {
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) throw new Error('No autorizado');

    // Borrar TODOS los swipes que no son matches mutuos
    await pool.query(`
      DELETE FROM swipes 
      WHERE (swiper_id, swiped_id) NOT IN (
        SELECT s1.swiper_id, s1.swiped_id 
        FROM swipes s1 
        JOIN swipes s2 ON s1.swiper_id = s2.swiped_id AND s1.swiped_id = s2.swiper_id 
        WHERE s1.liked = true AND s2.liked = true
      )
    `);
    return { success: true };
  } catch (err) {
    console.error('Error resetting all feeds:', err);
    return { success: false, error: String(err) };
  }
}

export async function getProfile(matricula: number) {
  try {
    const res = await pool.query(
      `SELECT matricula, nombre, apellidos, carrera, semestre, edad, bio, intereses, genero, foto_perfil, foto2, foto3, is_admin, es_menor, is_banned, pref_edad_min, pref_edad_max, genero_interes 
       FROM alumnos WHERE matricula = $1`, 
      [matricula]
    );
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}
