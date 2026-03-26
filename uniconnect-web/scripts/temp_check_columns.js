const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function run() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'alumnos';");
    console.log(res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
