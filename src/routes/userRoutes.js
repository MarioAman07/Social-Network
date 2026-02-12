const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const { getDb } = require('../config/db');
const { requireAdmin } = require('../middleware/roles');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/:id/stats', auth, userController.getUserStats);

router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection('users')
      .find({}, { projection: { password_hash: 0 } })
      .toArray();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
