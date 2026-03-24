'use server'

import pool from '@/lib/db';

export async function getStudents(currentMatricula?: number) {
  try {
    let query = `
      SELECT 
        matricula, 
        nombre, 
        apellidos, 
        carrera, 
        semestre, 
        edad, 
        bio, 
        intereses, 
        genero, 
        foto_perfil,
        foto2,
        foto3
      FROM alumnos
    `;
    
    let values: any[] = [];

    if (currentMatricula) {
      // Exclude oneself AND anyone they have already swiped on
      query += ` 
        WHERE matricula != $1 
        AND matricula NOT IN (
          SELECT swiped_id FROM swipes WHERE swiper_id = $1
        )
      `;
      values.push(currentMatricula);
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
    const res = await pool.query(`SELECT matricula, nombre, apellidos, carrera, semestre, edad, bio, intereses, genero, foto_perfil, foto2, foto3, is_admin FROM alumnos WHERE matricula = $1`, [matricula]);
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}
