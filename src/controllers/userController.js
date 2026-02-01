const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

module.exports = {
  // 1. Register User (Create)
  registerUser: async (req, res) => {
    try {
      const db = getDb();
      const { username, email, password } = req.body;

      // Check for duplicate email
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password (Security requirement)
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username,
        email,
        password_hash: hashedPassword, // Store only the hash
        bio: "",
        avatar_url: "https://placehold.co/150",
        created_at: new Date(),
        role: "user"
      };

      await db.collection('users').insertOne(newUser);
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Login User (Authentication)
  loginUser: async (req, res) => {
    try {
      const db = getDb();
      const { email, password } = req.body;

      // Find user by email
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // Compare provided password with stored hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid password" });
      }

      // Return user info (excluding password)
      res.json({ 
        message: "Login successful", 
        userId: user._id, 
        username: user.username 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Get User Stats (Aggregation)
  getUserStats: async (req, res) => {
    try {
      const db = getDb();
      const userId = new ObjectId(req.params.id);

      const pipeline = [
        { $match: { user_id: userId } }, // Find all posts by this user
        { 
          $group: { 
            _id: "$user_id", 
            totalPosts: { $sum: 1 }, 
            totalLikesReceived: { $sum: "$metrics.likes_count" },
            avgViews: { $avg: "$metrics.views" }
          } 
        }
      ];

      const stats = await db.collection('posts').aggregate(pipeline).toArray();
      const user = await db.collection('users').findOne({ _id: userId }, { projection: { password_hash: 0 } });

      res.json({ 
        user, 
        stats: stats[0] || { totalPosts: 0, totalLikesReceived: 0 } 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};