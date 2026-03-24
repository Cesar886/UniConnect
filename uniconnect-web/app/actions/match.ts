'use server'

import pool from '@/lib/db';

export async function swipeUser(swiperId: number, swipedId: number, liked: boolean) {
  try {
    // Insert the swipe record
    await pool.query(
      `INSERT INTO swipes (swiper_id, swiped_id, liked) VALUES ($1, $2, $3)
       ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET liked = EXCLUDED.liked, created_at = CURRENT_TIMESTAMP`,
      [swiperId, swipedId, liked]
    );

    // If it's a LIKE, check if the other person also liked the swiper
    if (liked) {
      const matchCheck = await pool.query(
        `SELECT 1 FROM swipes WHERE swiper_id = $1 AND swiped_id = $2 AND liked = TRUE`,
        [swipedId, swiperId] // Reverse relation
      );

      if (matchCheck.rowCount && matchCheck.rowCount > 0) {
        // IT'S A MATCH!
        return { success: true, isMatch: true };
      }
    }

    return { success: true, isMatch: false };
  } catch (error) {
    console.error('Error saving swipe:', error);
    return { success: false, error: 'Failed to record swipe in database' };
  }
}

export async function getMatches(matricula: number) {
  try {
    const query = `
      SELECT 
        a.matricula as match_id, 
        a.nombre as name, 
        a.foto_perfil as photo, 
        a.edad as age, 
        a.carrera as career
      FROM swipes s1
      JOIN swipes s2 ON s1.swiper_id = s2.swiped_id AND s1.swiped_id = s2.swiper_id
      JOIN alumnos a ON a.matricula = s1.swiped_id
      WHERE s1.swiper_id = $1 AND s1.liked = TRUE AND s2.liked = TRUE
    `;
    const res = await pool.query(query, [matricula]);
    return res.rows;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}
