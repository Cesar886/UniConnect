const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function checkMessages() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'");
    console.log('MESSAGES COLUMNS:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkMessages();
