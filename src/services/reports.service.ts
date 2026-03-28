import pool from '../db/pool';
import { DepartmentProgress, Task } from '../types';

export async function getProgressByDepartment(): Promise<DepartmentProgress[]> {
  const result = await pool.query(`
    SELECT
      department,
      COUNT(*)                                    AS total_tasks,
      ROUND(AVG(progress_pct), 2)                 AS avg_progress,
      COUNT(*) FILTER (WHERE status = 'done')     AS completed_tasks
    FROM tasks
    GROUP BY department
    ORDER BY department
  `);
  return result.rows;
}

export async function exportTasks(): Promise<Task[]> {
  const result = await pool.query(`SELECT * FROM tasks ORDER BY created_at DESC`);
  return result.rows;
}

export function tasksToCSV(tasks: Task[]): string {
  const header = 'id,title,department,status,progress_pct,project_id,assigned_to,created_at';
  const rows = tasks.map((t) =>
    [t.id, `"${t.title}"`, t.department, t.status, t.progress_pct, t.project_id, t.assigned_to ?? '', t.created_at].join(',')
  );
  return [header, ...rows].join('\n');
}
