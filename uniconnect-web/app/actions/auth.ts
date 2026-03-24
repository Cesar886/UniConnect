'use server'

import pool from '@/lib/db';

export async function registerUser(formData: FormData) {
  const matricula = formData.get('matricula') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nombre = formData.get('nombre') as string;
  const apellidos = formData.get('apellidos') as string;
  const carrera = formData.get('carrera') as string;
  const semestre = formData.get('semestre') as string;
  const genero = formData.get('genero') as string;
  const genero_interes = formData.get('genero_interes') as string;
  const fecha_nac = formData.get('fecha_nac') as string;
  const bio = formData.get('bio') as string;
  const intereses = formData.get('intereses') as string;

  if (!matricula || !/^\d{7}$/.test(matricula)) {
    return { success: false, error: 'La matrícula debe ser un número exacto de 7 dígitos.' };
  }

  if (!email || !email.endsWith('@alumno.um.edu.mx')) {
    return { success: false, error: 'Solo puedes registrarte con un correo @alumno.um.edu.mx válido.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password inválido (mínimo 6 caracteres).' };
  }

  try {
    const birthDate = new Date(fecha_nac);
    const today = new Date();
    let edad = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      edad--;
    }

    if (edad < 16 || edad > 80) {
      return { success: false, error: 'Edad no válida o fuera de rango.' };
    }

    const query = `
      INSERT INTO alumnos (
        matricula, email, password_hash, nombre, apellidos, 
        carrera, semestre, genero, genero_interes, 
        fecha_nac, edad, bio, intereses
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING matricula
    `;

    const values = [
      matricula, email, password, nombre, apellidos,
      carrera, semestre, genero, genero_interes,
      fecha_nac, edad, bio, intereses
    ];

    const result = await pool.query(query, values);
    return { success: true, matricula: result.rows[0].matricula };
  } catch (error: any) {
    console.error('Error inserting user:', error);
    if (error.code === '23505') { 
      return { success: false, error: 'Vaya. Alguien ya se registró con esta Matrícula o Correo. 🕵️‍♂️' };
    }
    return { success: false, error: 'Ocurrió un error en el servidor.' };
  }
}

export async function loginUser(formData: FormData) {
  const identificador = formData.get('identificador') as string;
  const password = formData.get('password') as string;

  if (!identificador || !password) {
    return { success: false, error: 'No dejes los campos en blanco.' };
  }

  try {
    let query = '';
    let values: any[] = [];

    // Limpiamos los espacios en blanco accidentales
    const cleanId = identificador.trim();

    // Si son exactamente 7 dígitos, lo tratamos como Matrícula
    if (/^\d{7}$/.test(cleanId)) {
      query = `SELECT matricula, nombre, foto_perfil FROM alumnos WHERE matricula = $1 AND password_hash = $2`;
      values = [parseInt(cleanId, 10), password];
    } 
    // De lo contrario, intentamos tratarlo como Correo
    else if (cleanId.includes('@')) {
      query = `SELECT matricula, nombre, foto_perfil FROM alumnos WHERE LOWER(email) = LOWER($1) AND password_hash = $2`;
      values = [cleanId.toLowerCase(), password];
    } 
    // Si no es ni matrícula ni correo válido:
    else {
      return { success: false, error: 'Debes escribir tu matrícula (7 números) o tu correo institucional completo.' };
    }

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Datos incorrectos. Verifica tu contraseña o identificador.' };
    }

    const { matricula, nombre, foto_perfil } = result.rows[0];
    return { success: true, user: { matricula, nombre, foto_perfil } };

  } catch (error: any) {
    console.error('Error in loginUser:', error);
    return { success: false, error: 'Ocurrió un error conectando al servidor.' };
  }
}
