const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function setup() {
  try {
    console.log("==> Adding is_admin column to alumnos...");
    await pool.query(`
      ALTER TABLE alumnos 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);

    console.log("==> Creating reportes table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reportes (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER REFERENCES alumnos(matricula) ON DELETE CASCADE,
        reported_id INTEGER REFERENCES alumnos(matricula) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'Pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("==> Elevating 1220234 and 1220326 to admins...");
    await pool.query(`
      UPDATE alumnos 
      SET is_admin = true 
      WHERE matricula IN (1220234, 1220326);
    `);

    console.log("==> Creating fake Super Admin profile (9999999)...");
    await pool.query(`
      INSERT INTO alumnos (
        matricula, email, password_hash, nombre, apellidos, carrera, semestre, edad, is_admin
      ) VALUES (
        9999999, 'admin_supremo@alumno.um.edu.mx', 'admin123', 'Admin', 'Supremo', 'Sistemas', 9, 99, true
      )
      ON CONFLICT (matricula) 
      DO UPDATE SET is_admin = true;
    `);

    console.log("==> Setup completed successfully!");

  } catch (err) {
    console.error("Error setting up DB:", err);
  } finally {
    pool.end();
  }
}

setup();
