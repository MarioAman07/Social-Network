// src/controllers/postController.js
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

module.exports = {
  // ===============================
  // GET ALL POSTS (SYNCED DATA)
  // ===============================
  getAllPosts: async (req, res) => {
    try {
      const db = getDb();

      const posts = await db.collection('posts').aggregate([
        { $sort: { created_at: -1 } },

        // comments
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post_id',
            as: 'post_comments'
          }
        },

        // author
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

        // computed counters (single source of truth)
        {
          $addFields: {
            commentsCount: { $size: '$post_comments' },
            likesCount: {
              $cond: [
                { $isArray: '$likes' },
                { $size: '$likes' },
                0
              ]
            }
          }
        }
      ]).toArray();

      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===============================
  // CREATE POST
  // ===============================
  createPost: async (req, res) => {
    try {
      const db = getDb();
      const { user_id, content } = req.body;

      const newPost = {
        user_id: new ObjectId(user_id),
        content,
        created_at: new Date(),

        // ✅ likes as array of userIds (for like/unlike)
        likes: []
      };

      const result = await db.collection('posts').insertOne(newPost);
      res.status(201).json({ ...newPost, _id: result.insertedId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===============================
  // LIKE / UNLIKE (TOGGLE)
  // ===============================
  likePost: async (req, res) => {
    try {
      const db = getDb();
      const postId = new ObjectId(req.params.id);
      const userId = new ObjectId(req.body.userId);

      // 1) Find post first
      const post = await db.collection('posts').findOne(
        { _id: postId },
        { projection: { likes: 1 } }
      );

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // 2) Check if already liked
      const likes = Array.isArray(post.likes) ? post.likes : [];
      const alreadyLiked = likes.some(id => id.equals(userId));

      // 3) Toggle
      if (alreadyLiked) {
        await db.collection('posts').updateOne(
          { _id: postId },
          { $pull: { likes: userId } }
        );
        return res.json({ success: true, liked: false });
      } else {
        await db.collection('posts').updateOne(
          { _id: postId },
          { $addToSet: { likes: userId } }
        );
        return res.json({ success: true, liked: true });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
