const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgres://postgres:987654321@64.23.168.72:5432/tinder';

async function bulkUpdate() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const newPassword = '123456';
    console.log(`[PASS] Generando hash para "${newPassword}"...`);
    const hash = await bcrypt.hash(newPassword, 10);
    
    console.log('[PASS] Actualizando todos los usuarios en la tabla "alumnos"...');
    const res = await pool.query(
      'UPDATE alumnos SET password_hash = $1',
      [hash]
    );
    
    console.log(`[PASS] Éxito: ${res.rowCount} filas actualizadas.`);
  } catch (err) {
    console.error('[FAIL] Error en la actualización:', err);
  } finally {
    await pool.end();
  }
}

bulkUpdate();
