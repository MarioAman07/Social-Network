# Social Network Web Application (NoSQL Final Project)
**Student:** Aman Baku  
**Group:** SE-2422

## Project Overview
This project is a web-based social network application developed as the endterm project for the course **Advanced Databases (NoSQL)**.

The goal of the project is to demonstrate practical skills in:
- designing NoSQL data models,
- implementing MongoDB CRUD operations,
- using advanced update and delete operators,
- building aggregation pipelines with real business meaning,
- developing a RESTful backend and integrating it with a frontend.

The application allows users to:
- register and log in,
- create, view, update, and delete posts,
- like and unlike posts,
- write comments,
- view profile statistics,
- view top posts based on popularity.

---

## System Architecture
The system follows a classic **three-layer architecture**:

Frontend (HTML, CSS, JavaScript)  
↓ REST API (HTTP/JSON)  
Backend (Node.js, Express)  
↓ MongoDB Native Driver  
MongoDB Atlas (NoSQL Database)  


- The **frontend** is implemented using vanilla HTML, CSS, and JavaScript.
- The **backend** exposes a RESTful API built with Express.js.
- **MongoDB Atlas** is used as the primary database.
- Database operations are implemented using the **MongoDB Native Driver**.

---

## Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Driver:** MongoDB Native Driver
- **Authentication:** bcryptjs
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Environment Configuration:** dotenv

---

## Setup and Run Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Environment configuration
Create a .env file in the project root:
```bash
MONGO_URI=your_mongodb_atlas_connection_string
PORT=3000
```

### 3. Seed the database (optional)
```bash
node seed_atlas.js
```

### 4. Start the Project
```bash
npm start
```
The application will be available at:
```bash
http://localhost:3000
```

## Database Schema Description
### Users Collection
```bash
{
  "_id": ObjectId,
  "username": "string",
  "email": "string",
  "password_hash": "string",
  "bio": "string",
  "avatar_url": "string",
  "created_at": "date",
  "role": "string"
}
```
### Posts Collection
```bash
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "content": "string",
  "created_at": "date",
  "likes": [ObjectId]
}
```

### Comments Collection
```bash
{
  "_id": ObjectId,
  "post_id": ObjectId,
  "user_id": ObjectId,
  "author_name": "string",
  "text": "string",
  "created_at": "date"
}
```

### Data Modeling Approach
- **Referenced documents:** users ↔ posts ↔ comments
- **Embedded data:** likes array inside posts
- This hybrid approach balances flexibility and performance.

## REST API Endpoints

### Authentication
| Method | Endpoint | Description |
|------|--------|------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Authenticate user |

---

### Posts
| Method | Endpoint | Description |
|------|--------|------------|
| GET | `/api/posts` | Get all posts |
| GET | `/api/posts/:id` | Get post by ID |
| POST | `/api/posts` | Create new post |
| PUT | `/api/posts/:id` | Update post (author only) |
| DELETE | `/api/posts/:id` | Delete post with cascade delete |

---

### Comments
| Method | Endpoint | Description |
|------|--------|------------|
| POST | `/api/comments` | Add comment |
| GET | `/api/posts/:id/comments` | Get post comments |
| DELETE | `/api/comments/:id` | Delete comment (author only) |

---

### Likes & Aggregation
| Method | Endpoint | Description |
|------|--------|------------|
| POST | `/api/posts/:id/like` | Like / Unlike post |
| GET | `/api/users/:id/stats` | Get user statistics |

---

## MongoDB Queries and Aggregations

### Example: Like Toggle (Advanced Update)
```js
$addToSet: { likes: userId }
$pull: { likes: userId }
```

### Example: Cascade Delete
```js
db.posts.deleteOne({ _id: postId });
```

### Example: Aggregation Pipeline (Top Posts)
```js
[
  { $addFields: { likesCount: { $size: "$likes" } } },
  { $sort: { likesCount: -1 } },
  { $limit: 5 }
]
```

## Indexing and Optimization Strategy

### Indexes Used
- `users.email` (**unique**) – fast authentication
- `posts.user_id, posts.created_at` – optimized feed queries
- `comments.post_id, comments.created_at` – fast comment loading

### Optimization Rationale
- Compound indexes reduce query execution time for common access patterns.
- Aggregation pipelines use indexed fields where possible.
- Data modeling minimizes expensive joins.

---

## Security Considerations
- Passwords are stored using **bcrypt hashing**
- Authorization checks ensure:
  - only post authors can edit or delete posts
  - only comment authors can delete comments
- Environment variables are managed using `.env`

---

## Contribution
- **Single student project**
- All backend, database design, frontend, and documentation were implemented by the author.

---

## Conclusion
This project demonstrates a complete NoSQL-based web application with real-world business logic.  
It satisfies all course requirements, including CRUD operations, advanced MongoDB features, aggregation pipelines, indexing strategies, and REST API design.
