import pool from '../db/pool';
import { Project } from '../types';

export async function getAllProjects(): Promise<Project[]> {
  const result = await pool.query(`SELECT * FROM projects ORDER BY created_at DESC`);
  return result.rows;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const result = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function createProject(
  name: string,
  owner_id: string,
  description?: string,
  status: string = 'active'
): Promise<Project> {
  const result = await pool.query(
    `INSERT INTO projects (name, description, status, owner_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description || null, status, owner_id]
  );
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['CREATE', 'project', result.rows[0].id]
  );
  return result.rows[0];
}

export async function updateProject(
  id: string,
  fields: Partial<Pick<Project, 'name' | 'description' | 'status'>>
): Promise<Project | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(fields.name); }
  if (fields.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(fields.description); }
  if (fields.status !== undefined) { setClauses.push(`status = $${idx++}`); values.push(fields.status); }

  if (setClauses.length === 0) return getProjectById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!result.rows[0]) return null;
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['UPDATE', 'project', id]
  );
  return result.rows[0];
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM projects WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows[0]) return false;
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['DELETE', 'project', id]
  );
  return true;
}
