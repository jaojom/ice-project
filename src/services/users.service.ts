import pool from '../db/pool';
import { User } from '../types';

export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
  return result.rows;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function createUser(name: string, email: string, department: string): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (name, email, department) VALUES ($1, $2, $3) RETURNING *`,
    [name, email, department]
  );
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['CREATE', 'user', result.rows[0].id]
  );
  return result.rows[0];
}

export async function updateUser(id: string, fields: Partial<Pick<User, 'name' | 'email' | 'department'>>): Promise<User | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(fields.name); }
  if (fields.email !== undefined) { setClauses.push(`email = $${idx++}`); values.push(fields.email); }
  if (fields.department !== undefined) { setClauses.push(`department = $${idx++}`); values.push(fields.department); }

  if (setClauses.length === 0) return getUserById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!result.rows[0]) return null;
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['UPDATE', 'user', id]
  );
  return result.rows[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows[0]) return false;
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['DELETE', 'user', id]
  );
  return true;
}
