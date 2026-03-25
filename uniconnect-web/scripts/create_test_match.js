const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function run() {
  try {
    console.log("Creando usuario de prueba 9999998...");
    
    // 1. Asegurar que el usuario de prueba existe
    await pool.query(`
      INSERT INTO alumnos (
        matricula, nombre, apellidos, carrera, semestre, edad, email, password_hash, genero, genero_interes, es_menor
      ) VALUES (
        9999998, 'Prueba', 'Match', 'Ingeniería', 5, 22, 'prueba@alumno.um.edu.mx', '123456', 'Mujer', 'Ambos', false
      ) ON CONFLICT (matricula) DO NOTHING;
    `);

    // 2. Crear swipe de LIKE hacia el usuario 1220234
    console.log("Insertando swipe de LIKE hacia 1220234...");
    await pool.query(`
      DELETE FROM swipes WHERE swiper_id = 9999998 AND swiped_id = 1220234;
      INSERT INTO swipes (swiper_id, swiped_id, liked) VALUES (9999998, 1220234, true);
    `);

    console.log("¡Hecho! Ahora, si el usuario 1220234 le da LIKE al usuario 9999998, se activará el Match.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
