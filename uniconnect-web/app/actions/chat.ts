'use server'

import pool from '@/lib/db';

const MAX_MESSAGE_LENGTH = 2000
const EDIT_WINDOW_MS = 20 * 60 * 1000 // 20 minutes

// Helper: check if two users are mutual matches
async function areMutualMatches(user1: number, user2: number): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM swipes s1
     JOIN swipes s2 ON s1.swiper_id = s2.swiped_id AND s1.swiped_id = s2.swiper_id
     WHERE s1.swiper_id = $1 AND s1.swiped_id = $2
       AND s1.liked = TRUE AND s2.liked = TRUE
     LIMIT 1`,
    [user1, user2]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function getMessages(user1: number, user2: number) {
  try {
    if (!user1 || !user2 || user1 === user2) return [];

    const matched = await areMutualMatches(user1, user2);
    if (!matched) return [];

    const query = `
      SELECT id, sender_id, receiver_id, text, status,
             TO_CHAR(created_at, 'HH24:MI') as time,
             created_at,
             edited_at,
             deleted_at
      FROM messages
      WHERE ((sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1))
        AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;
    const res = await pool.query(query, [user1, user2]);
    return res.rows;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Total de mensajes no leídos de todos los matches
export async function getUnreadCount(matricula: number) {
  try {
    if (!matricula) return 0;

    const query = `
      SELECT COUNT(*)::int as total
      FROM messages m
      WHERE m.receiver_id = $1 AND m.deleted_at IS NULL
        AND COALESCE(m.status, 'sent') != 'read'
        AND m.sender_id != $1
        AND EXISTS (
          SELECT 1 FROM swipes s1
          JOIN swipes s2 ON s1.swiper_id = s2.swiped_id AND s1.swiped_id = s2.swiper_id
          WHERE s1.swiper_id = $1 AND s1.swiped_id = m.sender_id
            AND s1.liked = TRUE AND s2.liked = TRUE
        )
    `;
    const res = await pool.query(query, [matricula]);
    return res.rows[0]?.total || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

export async function sendMessage(senderId: number, receiverId: number, text: string) {
  try {
    if (!senderId || !receiverId || senderId === receiverId) {
      return { success: false, error: 'Usuarios inválidos' };
    }

    const trimmed = text?.trim();
    if (!trimmed || trimmed.length === 0) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { success: false, error: `El mensaje excede el límite de ${MAX_MESSAGE_LENGTH} caracteres` };
    }

    const matched = await areMutualMatches(senderId, receiverId);
    if (!matched) {
      return { success: false, error: 'Solo puedes enviar mensajes a tus matches' };
    }

    const query = `
      INSERT INTO messages (sender_id, receiver_id, text, status)
      VALUES ($1, $2, $3, 'sent')
      RETURNING id, sender_id, receiver_id, text, status, TO_CHAR(created_at, 'HH24:MI') as time, created_at
    `;
    const res = await pool.query(query, [senderId, receiverId, trimmed]);
    return { success: true, message: res.rows[0] };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Error al enviar mensaje' };
  }
}

export async function editMessage(userId: number, messageId: number, newText: string) {
  try {
    if (!userId || !messageId) {
      return { success: false, error: 'Parámetros inválidos' };
    }

    const trimmed = newText?.trim();
    if (!trimmed || trimmed.length === 0) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { success: false, error: `El mensaje excede el límite de ${MAX_MESSAGE_LENGTH} caracteres` };
    }

    // Verify ownership + within edit window + not deleted
    const msg = await pool.query(
      `SELECT id, sender_id, created_at FROM messages
       WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL`,
      [messageId, userId]
    );
    if ((msg.rowCount ?? 0) === 0) {
      return { success: false, error: 'Mensaje no encontrado' };
    }

    const created = new Date(msg.rows[0].created_at).getTime();
    if (Date.now() - created > EDIT_WINDOW_MS) {
      return { success: false, error: 'El tiempo para editar este mensaje ha expirado' };
    }

    const res = await pool.query(
      `UPDATE messages SET text = $1, edited_at = NOW()
       WHERE id = $2 AND sender_id = $3 AND deleted_at IS NULL
       RETURNING id, text, edited_at, TO_CHAR(created_at, 'HH24:MI') as time`,
      [trimmed, messageId, userId]
    );
    return { success: true, message: res.rows[0] };
  } catch (error) {
    console.error('Error editing message:', error);
    return { success: false, error: 'Error al editar mensaje' };
  }
}

export async function deleteMessage(userId: number, messageId: number) {
  try {
    if (!userId || !messageId) {
      return { success: false, error: 'Parámetros inválidos' };
    }

    // Verify ownership + within edit window + not already deleted
    const msg = await pool.query(
      `SELECT id, sender_id, created_at FROM messages
       WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL`,
      [messageId, userId]
    );
    if ((msg.rowCount ?? 0) === 0) {
      return { success: false, error: 'Mensaje no encontrado' };
    }

    const created = new Date(msg.rows[0].created_at).getTime();
    if (Date.now() - created > EDIT_WINDOW_MS) {
      return { success: false, error: 'El tiempo para eliminar este mensaje ha expirado' };
    }

    await pool.query(
      `UPDATE messages SET deleted_at = NOW() WHERE id = $1 AND sender_id = $2`,
      [messageId, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: 'Error al eliminar mensaje' };
  }
}

// Check if a specific user is a mutual match (for chat page guard)
export async function isMatch(user1: number, user2: number): Promise<boolean> {
  try {
    if (!user1 || !user2 || user1 === user2) return false;
    return await areMutualMatches(user1, user2);
  } catch {
    return false;
  }
}
