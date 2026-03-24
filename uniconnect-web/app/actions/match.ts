'use server'

import pool from '@/lib/db';

export async function swipeUser(swiperId: number, swipedId: number, liked: boolean) {
  try {
    await pool.query(
      `INSERT INTO swipes (swiper_id, swiped_id, liked) VALUES ($1, $2, $3)
       ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET liked = EXCLUDED.liked, created_at = CURRENT_TIMESTAMP`,
      [swiperId, swipedId, liked]
    );

    if (liked) {
      const matchCheck = await pool.query(
        `SELECT 1 FROM swipes WHERE swiper_id = $1 AND swiped_id = $2 AND liked = TRUE`,
        [swipedId, swiperId]
      );

      if (matchCheck.rowCount && matchCheck.rowCount > 0) {
        return { success: true, isMatch: true };
      }
    }

    return { success: true, isMatch: false };
  } catch (error) {
    console.error('Error saving swipe:', error);
    return { success: false, isMatch: false };
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
        a.carrera as career,
        lm.text as "lastMessage",
        lm.time as "lastMessageTime",
        lm.sender_id as "lastSenderId",
        COALESCE(unread.count, 0)::int as unread
      FROM swipes s1
      JOIN swipes s2
        ON s1.swiper_id = s2.swiped_id
        AND s1.swiped_id = s2.swiper_id
      JOIN alumnos a ON a.matricula = s1.swiped_id
      -- Último mensaje entre ambos
      LEFT JOIN LATERAL (
        SELECT text, TO_CHAR(created_at, 'HH24:MI') as time, sender_id, created_at
        FROM messages
        WHERE (sender_id = $1 AND receiver_id = s1.swiped_id)
           OR (sender_id = s1.swiped_id AND receiver_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON TRUE
      -- Mensajes no leídos (del otro hacia mí)
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as count
        FROM messages
        WHERE sender_id = s1.swiped_id AND receiver_id = $1
          AND created_at > COALESCE(
            (SELECT MAX(created_at) FROM messages WHERE sender_id = $1 AND receiver_id = s1.swiped_id),
            '1970-01-01'
          )
      ) unread ON TRUE
      WHERE s1.swiper_id = $1 AND s1.liked = TRUE AND s2.liked = TRUE
      ORDER BY lm.created_at DESC NULLS LAST
    `;
    const res = await pool.query(query, [matricula]);
    return res.rows;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}
