// src/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.post('/', auth, commentController.addComment);
router.delete('/:id', auth, commentController.deleteComment);
router.put('/:id', auth, commentController.updateComment);

module.exports = router;
