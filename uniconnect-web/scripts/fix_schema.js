const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:987654321@64.23.168.72:5432/tinder',
  ssl: false
});

async function run() {
  try {
    console.log("Iniciando migración de esquema...");
    
    // 1. Agregar is_admin si no existe
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='is_admin') THEN
          ALTER TABLE alumnos ADD COLUMN is_admin BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);
    console.log("Columna is_admin verificada/agregada.");

    // 2. Agregar is_banned si no existe (aunque parecía estar, aseguramos)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='is_banned') THEN
          ALTER TABLE alumnos ADD COLUMN is_banned BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);
    console.log("Columna is_banned verificada/agregada.");

    // 3. Agregar columnas de preferencias si no existen
    const columns = ['pref_edad_min', 'pref_edad_max', 'pref_mostrar_genero'];
    for (const col of columns) {
        await pool.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='${col}') THEN
              ALTER TABLE alumnos ADD COLUMN ${col} ${col.includes('edad') ? 'INTEGER' : 'BOOLEAN'} 
              ${col === 'pref_edad_min' ? 'DEFAULT 18' : (col === 'pref_edad_max' ? 'DEFAULT 99' : 'DEFAULT true')};
            END IF;
          END $$;
        `);
    }
    console.log("Columnas de preferencias verificadas/agregadas.");

    // 4. Asegurar que fecha_registro existe (algunas tablas usan created_at)
    // Pero el usuario ya tiene fecha_registro, así que dejamos ese.
    
    console.log("Migración completada exitosamente.");
  } catch (err) {
    console.error("Error en la migración:", err);
  } finally {
    await pool.end();
  }
}

run();
