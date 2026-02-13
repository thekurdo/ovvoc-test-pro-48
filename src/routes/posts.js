const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/posts - List all posts with relations
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        category: true,
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/:id - Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        author: true,
        category: true,
      },
    });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - Create post
router.post('/', async (req, res) => {
  try {
    const { title, content, authorId, categoryId } = req.body;
    if (!title || !authorId) {
      return res.status(400).json({ error: 'Title and authorId are required' });
    }
    const post = await prisma.post.create({
      data: {
        title,
        content: content || null,
        authorId: parseInt(authorId),
        categoryId: categoryId ? parseInt(categoryId) : null,
      },
      include: {
        author: true,
        category: true,
      },
    });
    res.status(201).json(post);
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid authorId or categoryId' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;

    const post = await prisma.post.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: {
        author: true,
        category: true,
      },
    });
    res.json(post);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res) => {
  try {
    await prisma.post.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
