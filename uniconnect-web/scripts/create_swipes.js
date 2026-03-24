const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder' });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS swipes (
      swiper_id INT REFERENCES alumnos(matricula) ON DELETE CASCADE,
      swiped_id INT REFERENCES alumnos(matricula) ON DELETE CASCADE,
      liked BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (swiper_id, swiped_id)
    );
  `);
  console.log("Tabla 'swipes' creada o verificada.");
  process.exit(0);
}
run();
