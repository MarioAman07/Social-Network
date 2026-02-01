require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("ОШИБКА: Не найдена строка MONGO_URI в файле .env");
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    console.log("⏳ Подключаюсь к Atlas...");
    await client.connect();
    const db = client.db("social_network_final");
    console.log("🧹 Очистка коллекций...");
    await db.collection("users").deleteMany({});
    await db.collection("posts").deleteMany({});
    await db.collection("comments").deleteMany({});
    const user1Id = new ObjectId();
    const user2Id = new ObjectId();
    const post1Id = new ObjectId();

    console.log("👤 Создаю пользователей...");
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

    console.log("📝 Создаю посты...");
    const posts = [
      {
        _id: post1Id,
        user_id: user1Id,
        author_info: { 
            username: "aman_dev", 
            avatar_url: "https://i.pravatar.cc/150?u=aman" 
        },
        content: "Привет! Это мой первый пост в MongoDB Atlas 🚀",
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

    console.log("💬 Создаю комментарии...");
    const comments = [
      {
        post_id: post1Id,
        user_id: user2Id,
        author_name: "alice_wonder",
        text: "Вау, крутая архитектура базы данных! 🔥",
        created_at: new Date()
      },
      {
        post_id: post1Id,
        user_id: user1Id,
        author_name: "aman_dev",
        text: "Спасибо! Старался использовать Native Driver.",
        created_at: new Date(Date.now() + 60000) // Через минуту
      }
    ];
    await db.collection("comments").insertMany(comments);

    console.log("⚡ Создаю индексы...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("posts").createIndex({ user_id: 1, created_at: -1 });
    await db.collection("comments").createIndex({ post_id: 1, created_at: 1 });

    console.log("(Users + Posts + Comments)!");

  } catch (err) {
    console.error(" Ошибка:", err);
  } finally {
    await client.close();
  }
}

run();