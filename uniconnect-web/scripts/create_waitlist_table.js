const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder', ssl: false });
async function create() {
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS waitlist (email VARCHAR(255) PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());");
    console.log('Table waitlist created');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
create();
