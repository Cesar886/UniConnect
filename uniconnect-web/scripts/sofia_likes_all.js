const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder' });

async function run() {
  await pool.query(`
    INSERT INTO swipes (swiper_id, swiped_id, liked)
    SELECT 9999999, matricula, TRUE FROM alumnos WHERE matricula != 9999999
    ON CONFLICT DO NOTHING;
  `);
  console.log("Sofía liked everyone!");
  process.exit(0);
}
run();
