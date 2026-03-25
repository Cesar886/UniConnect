'use server'

import pool from '@/lib/db'
import { createSession, deleteSession, getSession } from '@/lib/session'
import { OAuth2Client } from 'google-auth-library'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/ratelimit'

// Obtiene la IP del cliente desde los headers de la petición
async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

function formatRetry(ms: number): string {
  const min = Math.ceil(ms / 60000)
  return min <= 1 ? '1 minuto' : `${min} minutos`
}

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export async function getCurrentSession() {
  return getSession()
}

export async function logoutAction() {
  await deleteSession()
}

// Checa matrícula: primero en "alumnos" (ya registrado), luego en "alumnos_db" (padrón UM)
export async function checkMatricula(matricula: number) {
  try {
    // 1. ¿Ya tiene cuenta en la app?
    const registered = await pool.query(
      `SELECT matricula, nombre, apellidos, carrera, semestre, genero, edad, bio, intereses, password_hash
       FROM alumnos WHERE matricula = $1`,
      [matricula]
    );

    if (registered.rows.length > 0) {
      const row = registered.rows[0];
      return {
        source: 'alumnos' as const,
        exists: true,
        hasPassword: !!row.password_hash,
        alumno: {
          matricula: row.matricula,
          nombre: row.nombre,
          apellidos: row.apellidos,
          carrera: row.carrera,
          semestre: row.semestre,
          genero: row.genero,
          edad: row.edad,
          bio: row.bio,
          intereses: row.intereses,
        }
      };
    }

    // 2. ¿Existe en el padrón de la universidad?
    const padron = await pool.query(
      `SELECT matricula, nombre, paterno, materno, genero, edad
       FROM alumnos_db WHERE matricula = $1`,
      [matricula]
    );

    if (padron.rows.length > 0) {
      const row = padron.rows[0];
      return {
        source: 'alumnos_db' as const,
        exists: true,
        hasPassword: false,
        alumno: {
          matricula: row.matricula,
          nombre: row.nombre,
          apellidos: [row.paterno, row.materno].filter(Boolean).join(' '),
          carrera: null,
          semestre: null,
          genero: row.genero,
          edad: row.edad,
          bio: null,
          intereses: null,
        }
      };
    }

    // 3. No existe en ninguna tabla
    return { source: null, exists: false, hasPassword: false, alumno: null };
  } catch (error) {
    console.error('Error checking matricula:', error);
    return { source: null, exists: false, hasPassword: false, alumno: null };
  }
}

// Registro para alumno encontrado en alumnos_db (padrón UM)
// Ya tenemos nombre, apellidos, genero, edad → solo falta lo demás
export async function registerFromPadron(formData: FormData) {
  const ip = await getClientIp()
  const rl = checkRateLimit(`register:ip:${ip}`, 3, 60 * 60 * 1000) // 3 / hora
  if (!rl.allowed) {
    return { success: false, error: `Demasiados registros desde tu red. Intenta en ${formatRetry(rl.retryAfterMs)}.` }
  }

  const matricula = formData.get('matricula') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nombre = formData.get('nombre') as string;
  const apellidos = formData.get('apellidos') as string;
  const genero = formData.get('genero') as string;
  const edad = formData.get('edad') as string;
  const carrera = formData.get('carrera') as string;
  const semestre = formData.get('semestre') as string;
  const genero_interes = formData.get('genero_interes') as string;
  const bio = formData.get('bio') as string;
  const intereses = formData.get('intereses') as string;

  if (!matricula || !/^\d{7}$/.test(matricula)) {
    return { success: false, error: 'Matrícula inválida.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Contraseña mínimo 6 caracteres.' };
  }

  try {
    const query = `
      INSERT INTO alumnos (
        matricula, email, password_hash, nombre, apellidos,
        genero, edad, carrera, semestre, genero_interes,
        bio, intereses
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING matricula
    `;

    const values = [
      parseInt(matricula, 10), email, password, nombre, apellidos,
      genero, parseInt(edad, 10) || null, carrera, parseInt(semestre, 10) || null, genero_interes,
      bio, intereses
    ];

    const result = await pool.query(query, values);
    const newMatricula = result.rows[0].matricula;
    await createSession(newMatricula);
    return { success: true, matricula: newMatricula };
  } catch (error: any) {
    console.error('Error registering from padron:', error);
    if (error.code === '23505') {
      return { success: false, error: 'Esta matrícula o correo ya tiene una cuenta registrada.' };
    }
    return { success: false, error: 'Error en el servidor.' };
  }
}

// Registro para alumno que YA EXISTE en "alumnos" (solo falta poner contraseña)
export async function registerExistingUser(formData: FormData) {
  const ip = await getClientIp()
  const rl = checkRateLimit(`register:ip:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: `Demasiados registros desde tu red. Intenta en ${formatRetry(rl.retryAfterMs)}.` }
  }

  const matricula = formData.get('matricula') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const genero_interes = formData.get('genero_interes') as string;

  if (!matricula || !/^\d{7}$/.test(matricula)) {
    return { success: false, error: 'Matrícula inválida.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Contraseña mínimo 6 caracteres.' };
  }

  try {
    const check = await pool.query(
      'SELECT matricula, password_hash FROM alumnos WHERE matricula = $1',
      [parseInt(matricula, 10)]
    );

    if (check.rows.length === 0 || check.rows[0].password_hash) {
      return { success: false, error: 'No es posible completar el registro con estos datos.' };
    }

    const newMatricula = parseInt(matricula, 10);
    await pool.query(
      `UPDATE alumnos SET email = $1, password_hash = $2, genero_interes = COALESCE($3, genero_interes) WHERE matricula = $4`,
      [email, password, genero_interes || null, newMatricula]
    );

    await createSession(newMatricula);
    return { success: true, matricula: newMatricula };
  } catch (error: any) {
    console.error('Error registering existing user:', error);
    if (error.code === '23505') {
      return { success: false, error: 'Ese correo ya está en uso por otra cuenta.' };
    }
    return { success: false, error: 'Error en el servidor.' };
  }
}

// Registro para alumno completamente NUEVO (no existe en ninguna tabla)
export async function registerUser(formData: FormData) {
  const ip = await getClientIp()
  const rl = checkRateLimit(`register:ip:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: `Demasiados registros desde tu red. Intenta en ${formatRetry(rl.retryAfterMs)}.` }
  }

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
    const newMatricula = result.rows[0].matricula;
    await createSession(newMatricula);
    return { success: true, matricula: newMatricula };
  } catch (error: any) {
    console.error('Error inserting user:', error);
    if (error.code === '23505') {
      return { success: false, error: 'Vaya. Alguien ya se registró con esta Matrícula o Correo.' };
    }
    return { success: false, error: 'Ocurrió un error en el servidor.' };
  }
}

export async function loginWithGoogle(credential: string) {
  if (!credential) return { success: false, error: 'No se recibió token de Google.' }

  // Rate limiting: 10 intentos / 5 min por IP
  const ip = await getClientIp()
  const byIp = checkRateLimit(`google:ip:${ip}`, 10, 5 * 60 * 1000)
  if (!byIp.allowed) {
    return { success: false, error: `Demasiados intentos. Intenta en ${formatRetry(byIp.retryAfterMs)}.` }
  }

  try {
    // Verificar la firma del id_token con la librería oficial de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      return { success: false, error: 'Token de Google inválido.' }
    }

    const email = payload.email // email verificado por Google, no proviene del cliente

    const result = await pool.query(
      `SELECT matricula, nombre, foto_perfil FROM alumnos WHERE LOWER(email) = LOWER($1)`,
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return { success: false, error: 'Credenciales incorrectas.' }
    }

    const { matricula, nombre, foto_perfil } = result.rows[0]
    await createSession(matricula)
    return { success: true, user: { matricula, nombre, foto_perfil } }
  } catch (error: any) {
    console.error('Error in loginWithGoogle:', error)
    return { success: false, error: 'Ocurrió un error conectando al servidor.' }
  }
}

export async function loginUser(formData: FormData) {
  const identificador = formData.get('identificador') as string;
  const password = formData.get('password') as string;

  if (!identificador || !password) {
    return { success: false, error: 'No dejes los campos en blanco.' };
  }

  // Rate limiting: 5 intentos / 15 min por IP  +  5 intentos / 15 min por identificador
  const ip = await getClientIp()
  const WINDOW = 15 * 60 * 1000 // 15 minutos
  const LIMIT = 5

  const byIp = checkRateLimit(`login:ip:${ip}`, LIMIT, WINDOW)
  if (!byIp.allowed) {
    return { success: false, error: `Demasiados intentos desde tu red. Intenta en ${formatRetry(byIp.retryAfterMs)}.` }
  }

  const byId = checkRateLimit(`login:id:${identificador.trim().toLowerCase()}`, LIMIT, WINDOW)
  if (!byId.allowed) {
    return { success: false, error: `Demasiados intentos para este identificador. Intenta en ${formatRetry(byId.retryAfterMs)}.` }
  }

  try {
    let query = '';
    let values: any[] = [];

    const cleanId = identificador.trim();

    if (/^\d{7}$/.test(cleanId)) {
      query = `SELECT matricula, nombre, foto_perfil FROM alumnos WHERE matricula = $1 AND password_hash = $2`;
      values = [parseInt(cleanId, 10), password];
    }
    else if (cleanId.includes('@')) {
      query = `SELECT matricula, nombre, foto_perfil FROM alumnos WHERE LOWER(email) = LOWER($1) AND password_hash = $2`;
      values = [cleanId.toLowerCase(), password];
    }
    else {
      return { success: false, error: 'Debes escribir tu matrícula (7 números) o tu correo institucional completo.' };
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return { success: false, error: 'Datos incorrectos. Verifica tu contraseña o identificador.' };
    }

    const { matricula, nombre, foto_perfil } = result.rows[0];
    await createSession(matricula)
    return { success: true, user: { matricula, nombre, foto_perfil } };

  } catch (error: any) {
    console.error('Error in loginUser:', error);
    return { success: false, error: 'Ocurrió un error conectando al servidor.' };
  }
}
