// src/controllers/postController.js
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

function safeObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

module.exports = {
  // GET ALL POSTS (aggregation)
  getAllPosts: async (req, res) => {
    try {
      const db = getDb();

      const posts = await db.collection('posts').aggregate([
        { $sort: { created_at: -1 } },

        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post_id',
            as: 'post_comments'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'author_details'
          }
        },
        {
          $unwind: {
            path: '$author_details',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            commentsCount: { $size: '$post_comments' },
            likesCount: {
              $cond: [{ $isArray: '$likes' }, { $size: '$likes' }, 0]
            }
          }
        }
      ]).toArray();

      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // bonus: top posts (aggregation)
  // get /api/posts/top
  getTopPosts: async (req, res) => {
    try {
      const db = getDb();

      const top = await db.collection('posts').aggregate([
        {
          $addFields: {
            likesCount: {
              $cond: [{ $isArray: '$likes' }, { $size: '$likes' }, 0]
            }
          }
        },
        { $sort: { likesCount: -1, created_at: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'author_details'
          }
        },
        {
          $unwind: {
            path: '$author_details',
            preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray();

      res.json(top);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // get one post
  // get /api/posts/:id
  getPostById: async (req, res) => {
    try {
      const db = getDb();
      const postId = safeObjectId(req.params.id);
      if (!postId) return res.status(400).json({ error: 'Invalid post id' });

      const post = await db.collection('posts').aggregate([
        { $match: { _id: postId } },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post_id',
            as: 'post_comments'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'author_details'
          }
        },
        {
          $unwind: {
            path: '$author_details',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            commentsCount: { $size: '$post_comments' },
            likesCount: {
              $cond: [{ $isArray: '$likes' }, { $size: '$likes' }, 0]
            }
          }
        }
      ]).toArray();

      if (!post.length) return res.status(404).json({ error: 'Post not found' });
      res.json(post[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // get comments or post
  // get /api/posts/:id/comments
  getPostComments: async (req, res) => {
    try {
      const db = getDb();
      const postId = safeObjectId(req.params.id);
      if (!postId) return res.status(400).json({ error: 'Invalid post id' });

      const comments = await db.collection('comments')
        .find({ post_id: postId })
        .sort({ created_at: 1 })
        .toArray();

      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // create post
  // post /api/posts
  // Body: { content }
  // Auth: Bearer token
  createPost: async (req, res) => {
    try {
      const db = getDb();

      // userId taken only from token
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const content = (req.body.content || '').trim();
      if (!content) return res.status(400).json({ error: 'Content is required' });

      const newPost = {
        user_id: userId,
        content,
        created_at: new Date(),
        likes: []
      };

      const result = await db.collection('posts').insertOne(newPost);
      res.status(201).json({ ...newPost, _id: result.insertedId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // update post (Advanced update: $set)
  // put /api/posts/:id
  // Body: { content }
  // Auth: Bearer token
  updatePost: async (req, res) => {
    try {
      const db = getDb();
      const postId = safeObjectId(req.params.id);
      if (!postId) return res.status(400).json({ error: 'Invalid post id' });

      // userId only from token
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const content = (req.body.content || '').trim();
      if (!content) return res.status(400).json({ error: 'Content is required' });

      // authorization: author OR admin can update
      const post = await db.collection('posts').findOne(
        { _id: postId },
        { projection: { user_id: 1 } }
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });

      // admin override
      const isOwner = post.user_id.equals(userId);
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

      await db.collection('posts').updateOne(
        { _id: postId },
        { $set: { content } }
      );

      res.json({ message: 'Post updated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // delete post (Advanced delete + cascade)
  // delete /api/posts/:id
  // Auth: Bearer token
  deletePost: async (req, res) => {
    try {
      const db = getDb();
      const postId = safeObjectId(req.params.id);
      if (!postId) return res.status(400).json({ error: 'Invalid post id' });

      // userId теперь ТОЛЬКО из токена
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // authorization: author OR admin can delete
      const post = await db.collection('posts').findOne(
        { _id: postId },
        { projection: { user_id: 1 } }
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });

      // admin override
      const isOwner = post.user_id.equals(userId);
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

      // cascade delete comments
      await db.collection('comments').deleteMany({ post_id: postId });
      await db.collection('posts').deleteOne({ _id: postId });

      res.json({ message: 'Post and its comments deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // like/unlike (toggle)
  // post /api/posts/:id/like
  // Auth: Bearer token
  likePost: async (req, res) => {
    try {
      const db = getDb();
      const postId = safeObjectId(req.params.id);
      if (!postId) return res.status(400).json({ error: 'Invalid post id' });

      // userId taken from token
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const post = await db.collection('posts').findOne(
        { _id: postId },
        { projection: { likes: 1 } }
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const likes = Array.isArray(post.likes) ? post.likes : [];
      const alreadyLiked = likes.some(id => id.equals(userId));

      if (alreadyLiked) {
        await db.collection('posts').updateOne(
          { _id: postId },
          { $pull: { likes: userId } }
        );
        return res.json({ success: true, liked: false });
      }

      await db.collection('posts').updateOne(
        { _id: postId },
        { $addToSet: { likes: userId } }
      );

      res.json({ success: true, liked: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
