'use server'
import pool from '@/lib/db';

export async function createReport(reporterId: number, reportedId: number, reason: string) {
  try {
    await pool.query(
      `INSERT INTO reportes (reporter_id, reported_id, reason) VALUES ($1, $2, $3)`,
      [reporterId, reportedId, reason]
    );
    return { success: true };
  } catch (err: any) {
    console.error('Error reporting user:', err);
    return { success: false, error: err.message };
  }
}

export async function getReports(adminId: number) {
  try {
    // Verificamos si es admin
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) {
      return { success: false, error: 'Acceso Denegado' };
    }
    const res = await pool.query(`
      SELECT r.id, r.reason, r.status, r.created_at,
             rep.nombre as reporter_name, rep.matricula as reporter_id,
             target.nombre as reported_name, target.matricula as reported_id
      FROM reportes r
      JOIN alumnos rep ON r.reporter_id = rep.matricula
      JOIN alumnos target ON r.reported_id = target.matricula
      ORDER BY r.created_at DESC
    `);
    return { success: true, reports: res.rows };
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    return { success: false, error: err.message };
  }
}

export async function banUser(adminId: number, targetId: number) {
  try {
    const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
    if (check.rows.length === 0 || !check.rows[0].is_admin) return { success: false, error: 'Acceso Denegado' };
    
    // Expulsar al usuario borrando su registro (esto borrará también sus mensajes y reportes gracias a ON DELETE CASCADE)
    await pool.query('DELETE FROM alumnos WHERE matricula = $1', [targetId]);
    return { success: true };
  } catch (err: any) {
    console.error('Error banning user:', err);
    return { success: false, error: err.message };
  }
}

export async function dismissReport(adminId: number, reportId: number) {
  try {
      const check = await pool.query('SELECT is_admin FROM alumnos WHERE matricula = $1', [adminId]);
      if (check.rows.length === 0 || !check.rows[0].is_admin) return { success: false, error: 'Acceso Denegado' };
      
      await pool.query("UPDATE reportes SET status = 'Ignorado' WHERE id = $1", [reportId]);
      return { success: true };
  } catch (err) {
      return { success: false, error: String(err) };
  }
}
