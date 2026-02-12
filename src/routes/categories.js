const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/categories - List all categories with post count
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        posts: true,
      },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        posts: {
          include: { author: true },
        },
      },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories - Create category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = await prisma.category.create({
      data: { name },
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
