const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');

beforeAll(async () => {
  // Clean database before tests
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.$disconnect();
});

describe('GET /health', () => {
  test('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/users', () => {
  test('creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice Johnson', email: 'alice@example.com' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Alice Johnson');
    expect(res.body.email).toBe('alice@example.com');
  });

  test('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice Clone', email: 'alice@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already exists');
  });

  test('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'NoEmail' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Name and email are required');
  });
});

describe('GET /api/users', () => {
  test('lists all users with posts', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('posts');
  });
});

describe('GET /api/users/:id', () => {
  test('returns a specific user', async () => {
    // First create a user to fetch
    const created = await request(app)
      .post('/api/users')
      .send({ name: 'Bob Smith', email: 'bob@example.com' });
    const res = await request(app).get(`/api/users/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Bob Smith');
    expect(res.body).toHaveProperty('posts');
  });

  test('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/users/99999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('User not found');
  });
});

describe('PUT /api/users/:id', () => {
  test('updates user name', async () => {
    const created = await request(app)
      .post('/api/users')
      .send({ name: 'Charlie', email: 'charlie@example.com' });
    const res = await request(app)
      .put(`/api/users/${created.body.id}`)
      .send({ name: 'Charlie Updated', email: 'charlie@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Charlie Updated');
  });
});

describe('DELETE /api/users/:id', () => {
  test('deletes a user', async () => {
    const created = await request(app)
      .post('/api/users')
      .send({ name: 'DeleteMe', email: 'delete@example.com' });
    const res = await request(app).delete(`/api/users/${created.body.id}`);
    expect(res.status).toBe(204);

    // Verify deleted
    const check = await request(app).get(`/api/users/${created.body.id}`);
    expect(check.status).toBe(404);
  });
});
