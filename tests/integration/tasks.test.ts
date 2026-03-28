import request from 'supertest';
import app from '../../src/app';
import { testPool } from '../setup/testDb';
import { createUser, createProject, createTask } from '../setup/factories';

describe('Tasks API', () => {
  describe('GET /api/tasks', () => {
    it('returns empty array when no tasks', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all tasks', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      await createTask(project.id, { title: 'Task A' });
      await createTask(project.id, { title: 'Task B' });
      const res = await request(app).get('/api/tasks');
      expect(res.body).toHaveLength(2);
    });

    it('filters tasks by project_id', async () => {
      const user = await createUser();
      const proj1 = await createProject(user.id);
      const proj2 = await createProject(user.id);
      await createTask(proj1.id, { department: 'Eng' });
      await createTask(proj2.id, { department: 'HR' });
      const res = await request(app).get(`/api/tasks?project_id=${proj1.id}`);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].project_id).toBe(proj1.id);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns task by id', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      const task = await createTask(project.id, { title: 'My Task' });
      const res = await request(app).get(`/api/tasks/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('My Task');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).get('/api/tasks/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates task with valid data', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      const res = await request(app).post('/api/tasks').send({
        title: 'New Task',
        department: 'Engineering',
        project_id: project.id,
        status: 'todo',
        progress_pct: 0,
      });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Task');
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'No project' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when progress_pct out of range', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      const res = await request(app).post('/api/tasks').send({
        title: 'Bad Task', department: 'Eng', project_id: project.id, progress_pct: 150,
      });
      expect(res.status).toBe(400);
    });

    it('logs action in system_logs after create', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      await request(app).post('/api/tasks').send({
        title: 'Logged Task', department: 'Eng', project_id: project.id,
      });
      const logs = await testPool.query(
        `SELECT * FROM system_logs WHERE entity_type = 'task' AND action = 'CREATE'`
      );
      expect(logs.rows).toHaveLength(1);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('updates task progress', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      const task = await createTask(project.id);
      const res = await request(app).put(`/api/tasks/${task.id}`).send({ progress_pct: 75, status: 'in_progress' });
      expect(res.status).toBe(200);
      expect(res.body.progress_pct).toBe(75);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).put('/api/tasks/00000000-0000-0000-0000-000000000000').send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes task', async () => {
      const user = await createUser();
      const project = await createProject(user.id);
      const task = await createTask(project.id);
      const res = await request(app).delete(`/api/tasks/${task.id}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/api/tasks/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
