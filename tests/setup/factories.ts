import { testPool } from './testDb';

let emailCounter = 0;

function uniqueEmail(base = 'user'): string {
  return `${base}-${Date.now()}-${++emailCounter}@test.com`;
}

export async function createUser(overrides: Record<string, unknown> = {}) {
  const data = {
    name: 'Test User',
    email: uniqueEmail(),
    department: 'Engineering',
    ...overrides,
  };
  const result = await testPool.query(
    `INSERT INTO users (name, email, department) VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.email, data.department]
  );
  return result.rows[0];
}

export async function createProject(ownerId: string, overrides: Record<string, unknown> = {}) {
  const data = {
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    ...overrides,
  };
  const result = await testPool.query(
    `INSERT INTO projects (name, description, status, owner_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.description, data.status, ownerId]
  );
  return result.rows[0];
}

export async function createTask(projectId: string, overrides: Record<string, unknown> = {}) {
  const data = {
    title: 'Test Task',
    description: 'A test task',
    status: 'todo',
    progress_pct: 0,
    department: 'Engineering',
    assigned_to: null,
    ...overrides,
  };
  const result = await testPool.query(
    `INSERT INTO tasks (title, description, status, progress_pct, department, project_id, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.title, data.description, data.status, data.progress_pct, data.department, projectId, data.assigned_to]
  );
  return result.rows[0];
}
