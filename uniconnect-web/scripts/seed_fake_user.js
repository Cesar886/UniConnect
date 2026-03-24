const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
});

async function run() {
  try {
    await pool.query(`
      INSERT INTO alumnos (matricula, email, password_hash, nombre, apellidos, carrera, semestre, genero, genero_interes, fecha_nac, edad, bio, intereses) 
      VALUES (9999999, 'sofia@alumno.um.edu.mx', '123456', 'Sofía', 'Martínez', 'Licenciatura en Nutrición', 5, 'Mujer', 'Hombres', '2003-08-12', 20, '¡Hola! Me la paso entre clases y el gym 💪. Me encanta probar cafeterías nuevas, leer y ver Netflix el fin de semana. Buscando nuevas amistades o algo cool.', 'Ir por Café, Gimnasio, Netflix / Series, Lectura')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log("Fake user Sofía created in the Database!");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
