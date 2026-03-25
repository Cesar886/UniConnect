'use server'

import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function getStudents() {
  try {
    const session = await getSession();
    const currentMatricula = session?.matricula;
    if (!currentMatricula) {
      // Sin sesión, devolver vacío
      return [];
    }

    // Primero obtener el genero_interes del usuario actual
    const userRes = await pool.query(
      `SELECT genero_interes FROM alumnos WHERE matricula = $1`,
      [currentMatricula]
    );

    const generoInteres = userRes.rows[0]?.genero_interes || null;

    let query = `
      SELECT
        matricula, nombre, apellidos, carrera, semestre,
        edad, bio, intereses, genero,
        foto_perfil, foto2, foto3
      FROM alumnos
      WHERE matricula != $1
        AND password_hash IS NOT NULL
        AND matricula NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = $1)
    `;

    const values: any[] = [currentMatricula];

    // Filtrar por género de interés
    if (generoInteres && generoInteres !== 'Ambos') {
      query += ` AND genero = $2`;
      values.push(generoInteres === 'Hombres' ? 'Hombre' : generoInteres === 'Mujeres' ? 'Mujer' : generoInteres);
    }

    query += ` ORDER BY RANDOM() LIMIT 20`;

    const res = await pool.query(query, values);
    return res.rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function getProfile(matricula: number) {
  try {
    const res = await pool.query(
      `SELECT matricula, nombre, apellidos, carrera, semestre, edad, bio, intereses, genero, genero_interes, foto_perfil, foto2, foto3
       FROM alumnos WHERE matricula = $1`,
      [matricula]
    );
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}
