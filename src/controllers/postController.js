const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

module.exports = {
  // Получить ленту (с сортировкой через индекс)
  getAllPosts: async (req, res) => {
    try {
      const db = getDb();
      //{ created_at: -1 } (Optimization)
      const posts = await db.collection('posts').find().sort({ created_at: -1 }).limit(20).toArray();
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Создать пост
  createPost: async (req, res) => {
    try {
      const db = getDb();
      const { user_id, username, content, image_url } = req.body;

      const newPost = {
        user_id: new ObjectId(user_id),
        author_info: { username, avatar_url: "https://placehold.co/150" }, // Денормализация
        content,
        image_url: image_url || null,
        created_at: new Date(),
        metrics: { views: 0, likes_count: 0, comments_count: 0 },
        last_likes: []
      };

      await db.collection('posts').insertOne(newPost);
      res.status(201).json(newPost);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Advanced Update
  likePost: async (req, res) => {
    try {
      const db = getDb();
      const postId = new ObjectId(req.params.id);
      const userId = new ObjectId(req.body.userId);


      await db.collection('posts').updateOne(
        { _id: postId },
        {
          $inc: { "metrics.likes_count": 1 },
          $push: { 
            "last_likes": { 
              $each: [{ user_id: userId, date: new Date() }],
              $position: 0,
              $slice: 5 
            }
          }
        }
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};