// src/controllers/commentController.js
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

function safeObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

module.exports = {
  // CREATE COMMENT
  addComment: async (req, res) => {
    try {
      const db = getDb();
      const { post_id, user_id, username, text } = req.body;

      const postId = safeObjectId(post_id);
      const userId = safeObjectId(user_id);
      if (!postId) return res.status(400).json({ error: 'Invalid post_id' });
      if (!userId) return res.status(400).json({ error: 'Invalid user_id' });
      if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

      await db.collection('comments').insertOne({
        post_id: postId,
        user_id: userId,
        author_name: username || 'User',
        text: text.trim(),
        created_at: new Date()
      });

      res.status(201).json({ message: 'Comment added' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE COMMENT (Advanced delete + authorization)
  // DELETE /api/comments/:id
  // Body: { userId }
  deleteComment: async (req, res) => {
    try {
      const db = getDb();
      const commentId = safeObjectId(req.params.id);
      const userId = safeObjectId(req.body.userId);

      if (!commentId) return res.status(400).json({ error: 'Invalid comment id' });
      if (!userId) return res.status(400).json({ error: 'Invalid userId' });

      const comment = await db.collection('comments').findOne(
        { _id: commentId },
        { projection: { user_id: 1 } }
      );
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      if (!comment.user_id.equals(userId)) return res.status(403).json({ error: 'Forbidden' });

      await db.collection('comments').deleteOne({ _id: commentId });
      res.json({ message: 'Comment deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // OPTIONAL UPDATE COMMENT ($set)
  // PUT /api/comments/:id
  // Body: { userId, text }
  updateComment: async (req, res) => {
    try {
      const db = getDb();
      const commentId = safeObjectId(req.params.id);
      const userId = safeObjectId(req.body.userId);
      const text = (req.body.text || '').trim();

      if (!commentId) return res.status(400).json({ error: 'Invalid comment id' });
      if (!userId) return res.status(400).json({ error: 'Invalid userId' });
      if (!text) return res.status(400).json({ error: 'Text is required' });

      const comment = await db.collection('comments').findOne(
        { _id: commentId },
        { projection: { user_id: 1 } }
      );
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      if (!comment.user_id.equals(userId)) return res.status(403).json({ error: 'Forbidden' });

      await db.collection('comments').updateOne(
        { _id: commentId },
        { $set: { text } }
      );

      res.json({ message: 'Comment updated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
