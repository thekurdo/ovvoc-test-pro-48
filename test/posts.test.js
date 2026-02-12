const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');

let testUser;
let testCategory;

beforeAll(async () => {
  // Clean database
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Create test user and category
  testUser = await prisma.user.create({
    data: { name: 'Test Author', email: 'author@example.com' },
  });
  testCategory = await prisma.category.create({
    data: { name: 'Technology' },
  });
});

afterAll(async () => {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/posts', () => {
  test('creates a post with author', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'First Post', content: 'Hello world', authorId: testUser.id });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('First Post');
    expect(res.body.content).toBe('Hello world');
    expect(res.body.author).toBeDefined();
    expect(res.body.author.name).toBe('Test Author');
  });

  test('creates a post with category', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({
        title: 'Tech Post',
        content: 'About tech',
        authorId: testUser.id,
        categoryId: testCategory.id,
      });
    expect(res.status).toBe(201);
    expect(res.body.category).toBeDefined();
    expect(res.body.category.name).toBe('Technology');
  });

  test('creates a post without content', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'No Content Post', authorId: testUser.id });
    expect(res.status).toBe(201);
    expect(res.body.content).toBeNull();
  });

  test('rejects post without title', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ content: 'No title', authorId: testUser.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title and authorId are required');
  });
});

describe('GET /api/posts', () => {
  test('lists all posts with relations', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    // Check that relations are included
    const postWithAuthor = res.body.find((p) => p.author);
    expect(postWithAuthor).toBeDefined();
    expect(postWithAuthor.author).toHaveProperty('name');
  });
});

describe('PUT /api/posts/:id', () => {
  test('updates post title and category', async () => {
    const created = await request(app)
      .post('/api/posts')
      .send({ title: 'Old Title', authorId: testUser.id });
    const res = await request(app)
      .put(`/api/posts/${created.body.id}`)
      .send({ title: 'New Title', categoryId: testCategory.id });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
    expect(res.body.category).toBeDefined();
    expect(res.body.category.name).toBe('Technology');
  });
});

describe('DELETE /api/posts/:id', () => {
  test('deletes a post', async () => {
    const created = await request(app)
      .post('/api/posts')
      .send({ title: 'Temp Post', authorId: testUser.id });
    const res = await request(app).delete(`/api/posts/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  test('returns 404 for non-existent post', async () => {
    const res = await request(app).delete('/api/posts/99999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/categories', () => {
  test('lists all categories with posts', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('posts');
  });
});

describe('POST /api/categories', () => {
  test('creates a new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Science' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Science');
  });

  test('rejects duplicate category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Technology' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Category name already exists');
  });
});
