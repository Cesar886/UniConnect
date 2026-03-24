'use server'

import pool from '@/lib/db';

export async function getMessages(user1: number, user2: number) {
  try {
    const query = `
      SELECT id, sender_id, receiver_id, text, 
             TO_CHAR(created_at, 'HH24:MI') as time 
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;
    const res = await pool.query(query, [user1, user2]);
    return res.rows;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function sendMessage(senderId: number, receiverId: number, text: string) {
  try {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, text)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, text, TO_CHAR(created_at, 'HH24:MI') as time
    `;
    const res = await pool.query(query, [senderId, receiverId, text]);
    return { success: true, message: res.rows[0] };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Database fail' };
  }
}
