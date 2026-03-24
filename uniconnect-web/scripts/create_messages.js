const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder' });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INT REFERENCES alumnos(matricula) ON DELETE CASCADE,
      receiver_id INT REFERENCES alumnos(matricula) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Tabla 'messages' creada correctamente.");
  process.exit(0);
}
run();
