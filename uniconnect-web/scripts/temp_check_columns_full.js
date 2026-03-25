const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM alumnos LIMIT 1;");
    console.log("COLUMNS:", Object.keys(res.rows[0]));
  } catch (err) {
    if (err.message.includes("does not exist")) {
        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'alumnos';");
        console.log("COLUMNS FROM SCHEMA:", res2.rows.map(r => r.column_name));
    } else {
        console.error(err);
    }
  } finally {
    await pool.end();
  }
}

run();
