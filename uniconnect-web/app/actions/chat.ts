'use server'

import pool from '@/lib/db';

export async function getMessages(user1: number, user2: number) {
  try {
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
    const query = `
      SELECT COUNT(*)::int as total
      FROM messages m
      WHERE m.receiver_id = $1 AND m.deleted_at IS NULL
        AND m.status != 'read'
        AND m.sender_id != $1
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
    const query = `
      INSERT INTO messages (sender_id, receiver_id, text, status)
      VALUES ($1, $2, $3, 'sent')
      RETURNING id, sender_id, text, status, TO_CHAR(created_at, 'HH24:MI') as time
    `;
    const res = await pool.query(query, [senderId, receiverId, text]);
    return { success: true, message: res.rows[0] };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Database fail' };
  }
}
