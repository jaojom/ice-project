import request from 'supertest';
import app from '../../src/app';
import { testPool } from '../setup/testDb';
import { createUser, createProject, createTask } from '../setup/factories';

describe('Projects API', () => {
  describe('GET /api/projects', () => {
    it('returns empty array when no projects', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all projects', async () => {
      const user = await createUser();
      await createProject(user.id, { name: 'Project A' });
      await createProject(user.id, { name: 'Project B' });
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns project by id', async () => {
      const user = await createUser();
      const project = await createProject(user.id, { name: 'My Project' });
      const res = await request(app).get(`/api/projects/${project.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('My Project');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).get('/api/projects/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/projects', () => {
    it('creates project with valid data', async () => {
      const user = await createUser();
      const res = await request(app).post('/api/projects').send({
        name: 'New Project', description: 'desc', status: 'active', owner_id: user.id,
      });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Project');
      expect(res.body.owner_id).toBe(user.id);
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app).post('/api/projects').send({ name: 'No owner' });
      expect(res.status).toBe(400);
    });

    it('logs action in system_logs after create', async () => {
      const user = await createUser();
      await request(app).post('/api/projects').send({
        name: 'Logged Project', status: 'active', owner_id: user.id,
      });
      const logs = await testPool.query(
        `SELECT * FROM system_logs WHERE entity_type = 'project' AND action = 'CREATE'`
      );
      expect(logs.rows).toHaveLength(1);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('updates project status', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      const res = await request(app).put(`/api/projects/${project.id}`).send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).put('/api/projects/00000000-0000-0000-0000-000000000000').send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes project and cascades tasks', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      await createTask(project.id);
      const res = await request(app).delete(`/api/projects/${project.id}`);
      expect(res.status).toBe(200);
      const tasks = await testPool.query(`SELECT * FROM tasks WHERE project_id = $1`, [project.id]);
      expect(tasks.rows).toHaveLength(0);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/api/projects/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
