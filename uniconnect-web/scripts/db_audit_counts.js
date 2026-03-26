const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder', ssl: false });

async function audit() {
  try {
    console.log('--- Database Audit: Table Counts ---');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    for (const row of tables.rows) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`${row.table_name.padEnd(20)}: ${countRes.rows[0].count} rows`);
    }
  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    pool.end();
  }
}

audit();
