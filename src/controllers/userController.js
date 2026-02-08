const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


module.exports = {
  // 1. Register User (Create)
  registerUser: async (req, res) => {
    try {
      const db = getDb();
      const { username, email, password } = req.body;

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username,
        email,
        password_hash: hashedPassword,
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

  // 2. Login User (Authentication) -> returns JWT
loginUser: async (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role || 'user', username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user._id,       // можно оставить для UI, но не использовать для авторизации
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

  // 3. Get User Stats (Aggregation) - FIXED FOR likes:[]
  getUserStats: async (req, res) => {
    try {
      const db = getDb();
      const userId = new ObjectId(req.params.id);

      const pipeline = [
        { $match: { user_id: userId } },

        // add likesCount per post safely
        {
          $addFields: {
            likesCount: {
              $cond: [{ $isArray: "$likes" }, { $size: "$likes" }, 0]
            }
          }
        },

        // group to stats
        {
          $group: {
            _id: "$user_id",
            totalPosts: { $sum: 1 },
            totalLikesReceived: { $sum: "$likesCount" }
          }
        }
      ];

      const statsArr = await db.collection('posts').aggregate(pipeline).toArray();
      const user = await db.collection('users').findOne(
        { _id: userId },
        { projection: { password_hash: 0 } }
      );

      res.json({
        user,
        stats: statsArr[0] || { totalPosts: 0, totalLikesReceived: 0 }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
