import request from 'supertest';
import express from 'express';
import AuthRoutes from '../routes/authRoutes';

// simple express app for test
const app = express();
app.use(express.json());
app.use('/api/auth', AuthRoutes);

describe('Auth Routes (simple)', () => {
  it('rejects login without body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
