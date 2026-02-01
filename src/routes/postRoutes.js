// src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// BONUS aggregation
router.get('/top', postController.getTopPosts);

// READ
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// COMMENTS for post (Read comments of post)
router.get('/:id/comments', postController.getPostComments);

// CREATE
router.post('/', postController.createPost);

// UPDATE
router.put('/:id', postController.updatePost);

// ADVANCED DELETE (cascade)
router.delete('/:id', postController.deletePost);

// LIKE/UNLIKE
router.post('/:id/like', postController.likePost);

module.exports = router;
