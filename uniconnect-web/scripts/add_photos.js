const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder' });

async function run() {
  try {
    await pool.query('ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS foto2 VARCHAR(255), ADD COLUMN IF NOT EXISTS foto3 VARCHAR(255);');
    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
