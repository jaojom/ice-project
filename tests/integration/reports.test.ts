import request from 'supertest';
import app from '../../src/app';
import { createUser, createProject, createTask } from '../setup/factories';

describe('Reports API', () => {
  describe('GET /api/reports/progress-by-department', () => {
    it('returns empty array when no tasks', async () => {
      const res = await request(app).get('/api/reports/progress-by-department');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns correct aggregate per department', async () => {
      const user = await createUser();
      const proj = await createProject(user.id);
      await createTask(proj.id, { department: 'Engineering', progress_pct: 60, status: 'in_progress' });
      await createTask(proj.id, { department: 'Engineering', progress_pct: 100, status: 'done' });
      await createTask(proj.id, { department: 'HR', progress_pct: 20, status: 'todo' });

      const res = await request(app).get('/api/reports/progress-by-department');
      expect(res.status).toBe(200);

      const eng = res.body.find((r: { department: string }) => r.department === 'Engineering');
      expect(Number(eng.total_tasks)).toBe(2);
      expect(Number(eng.avg_progress)).toBe(80);
      expect(Number(eng.completed_tasks)).toBe(1);

      const hr = res.body.find((r: { department: string }) => r.department === 'HR');
      expect(Number(hr.total_tasks)).toBe(1);
      expect(Number(hr.completed_tasks)).toBe(0);
    });
  });

  describe('GET /api/reports/export', () => {
    it('returns JSON by default', async () => {
      const user = await createUser();
      const proj = await createProject(user.id);
      await createTask(proj.id, { title: 'Export Task' });

      const res = await request(app).get('/api/reports/export?format=json');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].title).toBe('Export Task');
    });

    it('returns CSV with correct headers', async () => {
      const user = await createUser();
      const proj = await createProject(user.id);
      await createTask(proj.id, { title: 'CSV Task' });

      const res = await request(app).get('/api/reports/export?format=csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/tasks_export\.csv/);
      expect(res.text).toMatch(/id,title,department,status,progress_pct,project_id/);
      expect(res.text).toMatch(/CSV Task/);
    });
  });
});
