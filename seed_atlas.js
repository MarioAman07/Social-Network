require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

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
    await db.collection("users").deleteMany({});
    await db.collection("posts").deleteMany({});
    await db.collection("comments").deleteMany({});
    const user1Id = new ObjectId();
    const user2Id = new ObjectId();
    const post1Id = new ObjectId();

    console.log("Creating users...");
    const users = [
      {
        _id: user1Id,
        username: "aman_dev",
        email: "aman@example.com",
        password_hash: "hashed_secret_password",
        bio: "Fullstack Developer",
        avatar_url: "https://i.pravatar.cc/150?u=aman",
        created_at: new Date(),
        role: "admin"
      },
      {
        _id: user2Id,
        username: "alice_wonder",
        email: "alice@example.com",
        password_hash: "hashed_secret_password",
        bio: "Digital Artist",
        avatar_url: "https://i.pravatar.cc/150?u=alice",
        created_at: new Date(),
        role: "user"
      }
    ];
    await db.collection("users").insertMany(users);

    console.log("Creating posts...");
    const posts = [
      {
        _id: post1Id,
        user_id: user1Id,
        author_info: {
          username: "aman_dev",
          avatar_url: "https://i.pravatar.cc/150?u=aman"
        },
        content: "Hello! This is my first post in MongoDB Atlas.",
        image_url: "https://placehold.co/600x400",
        created_at: new Date(),
        metrics: {
          views: 120,
          likes_count: 5,
          comments_count: 2
        },
        last_likes: []
      }
    ];
    await db.collection("posts").insertMany(posts);

    console.log("Creating comments...");
    const comments = [
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
        created_at: new Date(Date.now() + 60000) // one minute later
      }
    ];
    await db.collection("comments").insertMany(comments);

    console.log("Creating indexes...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("posts").createIndex({ user_id: 1, created_at: -1 });
    await db.collection("comments").createIndex({ post_id: 1, created_at: 1 });

    console.log("Seeding completed (Users, Posts, Comments).");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();