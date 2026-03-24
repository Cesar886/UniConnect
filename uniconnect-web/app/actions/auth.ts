'use server'

import pool from '@/lib/db';

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
    return { success: true, matricula: result.rows[0].matricula };
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

    if (check.rows.length === 0) {
      return { success: false, error: 'Matrícula no encontrada.' };
    }

    if (check.rows[0].password_hash) {
      return { success: false, error: 'Esta matrícula ya tiene cuenta. Intenta iniciar sesión.' };
    }

    await pool.query(
      `UPDATE alumnos SET email = $1, password_hash = $2, genero_interes = COALESCE($3, genero_interes) WHERE matricula = $4`,
      [email, password, genero_interes || null, parseInt(matricula, 10)]
    );

    return { success: true, matricula: parseInt(matricula, 10) };
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
      return { success: false, error: 'Vaya. Alguien ya se registró con esta Matrícula o Correo.' };
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
    return { success: true, user: { matricula, nombre, foto_perfil } };

  } catch (error: any) {
    console.error('Error in loginUser:', error);
    return { success: false, error: 'Ocurrió un error conectando al servidor.' };
  }
}
