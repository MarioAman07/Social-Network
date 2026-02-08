// src/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');


// публичные чтения
router.get('/top', postController.getTopPosts);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.get('/:id/comments', postController.getPostComments);

// дальше — только с токеном
router.post('/', auth, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/like', auth, postController.likePost);


module.exports = router;