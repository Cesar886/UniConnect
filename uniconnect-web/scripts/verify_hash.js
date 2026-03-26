const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder', ssl: false });
async function check() {
  try {
    const res = await pool.query("SELECT matricula, password_hash FROM alumnos WHERE matricula = 1220234;");
    if (res.rows.length > 0) {
      const isMatch = await bcrypt.compare('123456', res.rows[0].password_hash);
      console.log(`Matricula 1220234 - Password '123456' match: ${isMatch}`);
    } else {
      console.log('User not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();
