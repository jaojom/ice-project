import pool from '../db/pool';
import { Task } from '../types';

export async function getAllTasks(projectId?: string): Promise<Task[]> {
  if (projectId) {
    const result = await pool.query(
      `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]
    );
    return result.rows;
  }
  const result = await pool.query(`SELECT * FROM tasks ORDER BY created_at DESC`);
  return result.rows;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const result = await pool.query(`SELECT * FROM tasks WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function createTask(data: {
  title: string;
  department: string;
  project_id: string;
  description?: string;
  status?: string;
  progress_pct?: number;
  assigned_to?: string;
}): Promise<Task> {
  const { title, department, project_id, description, status = 'todo', progress_pct = 0, assigned_to } = data;
  const result = await pool.query(
    `INSERT INTO tasks (title, description, status, progress_pct, department, project_id, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [title, description || null, status, progress_pct, department, project_id, assigned_to || null]
  );
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['CREATE', 'task', result.rows[0].id]
  );
  return result.rows[0];
}

export async function updateTask(id: string, fields: Partial<Task>): Promise<Task | null> {
  const allowed: (keyof Task)[] = ['title', 'description', 'status', 'progress_pct', 'department', 'assigned_to'];
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(fields[key]);
    }
  }

  if (setClauses.length === 0) return getTaskById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!result.rows[0]) return null;
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['UPDATE', 'task', id]
  );
  return result.rows[0];
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM tasks WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows[0]) return false;
  await pool.query(
    `INSERT INTO system_logs (action, entity_type, entity_id) VALUES ($1, $2, $3)`,
    ['DELETE', 'task', id]
  );
  return true;
}
