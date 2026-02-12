require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("ERROR: MONGO_URI was not found in the .env file");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();

    const db = client.db("social_network_final");

    console.log("Clearing collections...");
    await db.collection("comments").deleteMany({});
    await db.collection("posts").deleteMany({});
    await db.collection("users").deleteMany({});

    // users
    const user1Id = new ObjectId();
    const user2Id = new ObjectId();
    const user3Id = new ObjectId();

    const passwordHash = await bcrypt.hash("password123", 10);

    console.log("Creating users...");
    const users = [
      {
        _id: user1Id,
        username: "aman_dev",
        email: "aman@example.com",
        password_hash: passwordHash,
        bio: "Fullstack Developer",
        avatar_url: "https://i.pravatar.cc/150?u=aman",
        created_at: new Date(),
        role: "admin",
      },
      {
        _id: user2Id,
        username: "alice_wonder",
        email: "alice@example.com",
        password_hash: passwordHash,
        bio: "Digital Artist",
        avatar_url: "https://i.pravatar.cc/150?u=alice",
        created_at: new Date(),
        role: "user",
      },
      {
        _id: user3Id,
        username: "john_reader",
        email: "john@example.com",
        password_hash: passwordHash,
        bio: "Reader and blogger",
        avatar_url: "https://i.pravatar.cc/150?u=john",
        created_at: new Date(),
        role: "user",
      }
    ];
    await db.collection("users").insertMany(users);

    // posts
    const post1Id = new ObjectId();

    console.log("Creating posts...");
    await db.collection("posts").insertOne({
      _id: post1Id,
      user_id: user1Id,
      content: "Hello! This is my first post in MongoDB Atlas.",
      image_url: null,
      created_at: new Date(),
      likes: []
    });

    // comments
    console.log("Creating comments...");
    await db.collection("comments").insertMany([
      {
        post_id: post1Id,
        user_id: user2Id,
        author_name: "alice_wonder",
        text: "Wow, great database architecture!",
        created_at: new Date()
      },
      {
        post_id: post1Id,
        user_id: user1Id,
        author_name: "aman_dev",
        text: "Thanks! I tried to use the Native MongoDB Driver.",
        created_at: new Date(Date.now() + 60000)
      }
    ]);

    

    // indexes
    console.log("Creating indexes...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 });

    await db.collection("posts").createIndex({ user_id: 1, created_at: -1 });
    await db.collection("comments").createIndex({ post_id: 1, created_at: 1 });

    console.log("Seeding completed (Users, Posts, Comments).");

    console.log("Seeding completed successfully.");
    console.log("Login with password: password123");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();