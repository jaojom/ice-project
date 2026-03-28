import request from 'supertest';
import app from '../../src/app';
import { testPool } from '../setup/testDb';
import { createUser } from '../setup/factories';

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('returns empty array when no users', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all users', async () => {
      await createUser({ name: 'Alice' });
      await createUser({ name: 'Bob' });
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by id', async () => {
      const user = await createUser({ name: 'Alice' });
      const res = await request(app).get(`/api/users/${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Alice');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).get('/api/users/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const res = await request(app).get('/api/users/invalid-id');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/users', () => {
    it('creates user with valid data', async () => {
      const res = await request(app).post('/api/users').send({
        name: 'Alice', email: 'alice@test.com', department: 'HR',
      });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Alice', email: 'alice@test.com', department: 'HR' });
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/users').send({ name: 'Alice', department: 'HR' });
      expect(res.status).toBe(400);
    });

    it('returns 400 on duplicate email', async () => {
      await createUser({ email: 'dup@test.com' });
      const res = await request(app).post('/api/users').send({
        name: 'Bob', email: 'dup@test.com', department: 'HR',
      });
      expect(res.status).toBe(400);
    });

    it('logs action in system_logs after create', async () => {
      await request(app).post('/api/users').send({
        name: 'Alice', email: 'alice@test.com', department: 'HR',
      });
      const logs = await testPool.query(
        `SELECT * FROM system_logs WHERE entity_type = 'user' AND action = 'CREATE'`
      );
      expect(logs.rows).toHaveLength(1);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates user', async () => {
      const user = await createUser({ name: 'Old Name' });
      const res = await request(app).put(`/api/users/${user.id}`).send({ name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).put('/api/users/00000000-0000-0000-0000-000000000000').send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes user', async () => {
      const user = await createUser();
      const res = await request(app).delete(`/api/users/${user.id}`);
      expect(res.status).toBe(200);
    });

    it('returns 409 when user owns a project (FK RESTRICT)', async () => {
      const user = await createUser();
      await testPool.query(
        `INSERT INTO projects (name, status, owner_id) VALUES ($1, $2, $3)`,
        ['proj', 'active', user.id]
      );
      const res = await request(app).delete(`/api/users/${user.id}`);
      expect(res.status).toBe(409);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/api/users/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
