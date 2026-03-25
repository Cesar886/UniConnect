const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function run() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log("TABLES:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
