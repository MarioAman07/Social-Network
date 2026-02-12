// src/controllers/commentController.js
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

function safeObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

module.exports = {
  // CREATE COMMENT
  // POST /api/comments
  // Body: { post_id, text }
  // Auth: Bearer token
  addComment: async (req, res) => {
    try {
      const db = getDb();
      const { post_id, text } = req.body;

      const postId = safeObjectId(post_id);
      if (!postId) return res.status(400).json({ error: 'Invalid post_id' });

      // userId only from token
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const cleanText = (text || '').trim();
      if (!cleanText) return res.status(400).json({ error: 'Text is required' });

      // username now only from token too
      const authorName = req.user?.username || 'User';

      await db.collection('comments').insertOne({
        post_id: postId,
        user_id: userId,
        author_name: authorName,
        text: cleanText,
        created_at: new Date()
      });

      res.status(201).json({ message: 'Comment added' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // delete comment (Advanced delete + authorization)
  // delete /api/comments/:id
  // Auth: Bearer token
  deleteComment: async (req, res) => {
    try {
      const db = getDb();
      const commentId = safeObjectId(req.params.id);
      if (!commentId) return res.status(400).json({ error: 'Invalid comment id' });

      // userId now only from token
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const comment = await db.collection('comments').findOne(
        { _id: commentId },
        { projection: { user_id: 1 } }
      );
      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      // owner OR admin
      const isOwner = comment.user_id.equals(userId);
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

      await db.collection('comments').deleteOne({ _id: commentId });
      res.json({ message: 'Comment deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // update comment ($set + authorization)
  // PUT /api/comments/:id
  // Body: { text }
  // Auth: Bearer token
  updateComment: async (req, res) => {
    try {
      const db = getDb();
      const commentId = safeObjectId(req.params.id);
      if (!commentId) return res.status(400).json({ error: 'Invalid comment id' });

      // ✅ userId теперь ТОЛЬКО из токена
      const userId = safeObjectId(req.userId);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const text = (req.body.text || '').trim();
      if (!text) return res.status(400).json({ error: 'Text is required' });

      const comment = await db.collection('comments').findOne(
        { _id: commentId },
        { projection: { user_id: 1 } }
      );
      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      // owner or admin
      const isOwner = comment.user_id.equals(userId);
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

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
