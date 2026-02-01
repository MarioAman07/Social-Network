// src/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.post('/', commentController.addComment);

// delete comment (with authorization)
router.delete('/:id', commentController.deleteComment);

// optional update comment
router.put('/:id', commentController.updateComment);

module.exports = router;
