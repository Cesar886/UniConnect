const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder', ssl: false });

async function fullAudit() {
  try {
    console.log('--- Full Database Consistency Audit ---');

    // 1. Orphaned Messages
    const orphanedMessages = await pool.query(`
      SELECT COUNT(*) FROM messages m
      LEFT JOIN alumnos a1 ON m.sender_id = a1.matricula
      LEFT JOIN alumnos a2 ON m.receiver_id = a2.matricula
      WHERE a1.matricula IS NULL OR a2.matricula IS NULL;
    `);
    console.log(`Mensajes huérfanos: ${orphanedMessages.rows[0].count}`);

    // 2. Orphaned Swipes
    const orphanedSwipes = await pool.query(`
      SELECT COUNT(*) FROM swipes s
      LEFT JOIN alumnos a1 ON s.swiper_id = a1.matricula
      LEFT JOIN alumnos a2 ON s.swiped_id = a2.matricula
      WHERE a1.matricula IS NULL OR a2.matricula IS NULL;
    `);
    console.log(`Swipes huérfanos: ${orphanedSwipes.rows[0].count}`);

    // 3. Profiles incomplete
    const incompleteProfiles = await pool.query(`
      SELECT matricula, nombre FROM alumnos
      WHERE email IS NULL OR password_hash IS NULL OR nombre IS NULL;
    `);
    console.log(`Perfiles con datos esenciales faltantes: ${incompleteProfiles.rows.length}`);
    if (incompleteProfiles.rows.length > 0) {
      console.log('Faltan datos en:', incompleteProfiles.rows);
    }

    // 4. Missing Foreign Keys (Design Check)
    console.log('\n[Estructura] Buscando claves foráneas faltantes...');
    const fks = await pool.query(`
      SELECT conname, confrelid::regclass as target_table
      FROM pg_constraint
      WHERE contype = 'f' AND conrelid = 'messages'::regclass;
    `);
    if (fks.rows.length === 0) {
      console.log('ALERTA: La tabla "messages" no tiene claves foráneas (riesgo de integridad).');
    }

    // 5. Duplicated Emails
    const dupEmails = await pool.query(`
      SELECT email, COUNT(*) FROM alumnos
      WHERE email IS NOT NULL
      GROUP BY email HAVING COUNT(*) > 1;
    `);
    console.log(`Emails duplicados: ${dupEmails.rows.length}`);

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    pool.end();
  }
}

fullAudit();
