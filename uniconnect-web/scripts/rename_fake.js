const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder' });

async function run() {
  try {
    const res = await pool.query(`
      UPDATE alumnos 
      SET nombre = 'Danielita' 
      WHERE matricula = 9999999;
    `);
    console.log("Profile renamed to Danielita. Rows affected:", res.rowCount);
  } catch (err) {
    console.error("Error renaming:", err);
  } finally {
    process.exit(0);
  }
}
run();
