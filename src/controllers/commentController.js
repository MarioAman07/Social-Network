// src/controllers/commentController.js
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

module.exports = {
  addComment: async (req, res) => {
    try {
      const db = getDb();
      const { post_id, user_id, username, text } = req.body;

      await db.collection('comments').insertOne({
        post_id: new ObjectId(post_id),
        user_id: new ObjectId(user_id),
        author_name: username,
        text,
        created_at: new Date()
      });

      res.status(201).json({ message: "Comment added" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
