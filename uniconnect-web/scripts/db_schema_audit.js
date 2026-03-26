const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder', ssl: false });

async function constraintsAudit() {
  try {
    console.log('--- Constraints & Indices Audit ---');

    const tables = ['alumnos', 'messages', 'swipes', 'reportes', 'fotos'];

    for (const table of tables) {
      console.log(`\n[Table: ${table}]`);
      
      // Foreign Keys
      const fks = await pool.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE contype = 'f' AND conrelid = '${table}'::regclass;
      `);
      console.log(`  - Claves foráneas: ${fks.rows.length}`);
      fks.rows.forEach(r => console.log(`    * ${r.conname}: ${r.def}`));

      // Indices
      const indices = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = '${table}';
      `);
      console.log(`  - Índices: ${indices.rows.length}`);
      indices.rows.forEach(r => console.log(`    * ${r.indexname}`));
    }
  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    pool.end();
  }
}

constraintsAudit();
