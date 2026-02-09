# Social Network Web Application

**Course:** Advanced Databases (NoSQL)  
**Project Type:** Final Project  
**Technology Stack:** MongoDB, Node.js, Express.js, HTML, CSS, JavaScript  
**Group:** SE-2422  
**Student** Aman Baku


## 1. Project Overview
This project is a full-stack web application developed as a final project for the **Advanced Databases (NoSQL)** course.  
The application represents a simplified social network where users can create posts, like them, and leave comments.

The primary goal of the project is to demonstrate practical skills in:
- NoSQL data modeling using MongoDB
- Aggregation pipelines with real business meaning
- Backend logic built around MongoDB
- RESTful API design
- Authentication and authorization
- Database indexing and optimization


## 2. System Architecture

The system follows a **client–server architecture**.

### Frontend
- Implemented using HTML, CSS, and vanilla JavaScript
- Responsible for user interaction (login, feed, profile, comments)
- Communicates with the backend via REST API using HTTP requests

### Backend
- Built with Node.js and Express.js
- Implements business logic and API endpoints
- Uses JWT for authentication and role-based authorization

### Database
- MongoDB Atlas
- Native MongoDB Driver
- Stores users, posts, comments, and likes

### Data Flow
1. The user interacts with the frontend interface.
2. The frontend sends HTTP requests to the backend API.
3. The backend authenticates the user using JWT.
4. Authorization rules are applied based on user roles.
5. MongoDB executes CRUD operations or aggregation pipelines.
6. The backend returns JSON responses.
7. The frontend renders updated data.


## 3. Database Documentation

### Collections Overview

#### 1. Users Collection (`users`)
Stores registered user accounts.

```json
{
  "_id": ObjectId,
  "username": "string",
  "email": "string",
  "password_hash": "string",
  "bio": "string",
  "avatar_url": "string",
  "role": "user | admin",
  "created_at": "Date"
}
```

#### 2. Posts Collection (posts)
Stores user-generated posts.

```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "content": "string",
  "created_at": "Date",
  "likes": [ObjectId]
}
```

#### 3. Comments Collection (comments)
Stores comments related to posts.

```json
{
  "_id": ObjectId,
  "post_id": ObjectId,
  "user_id": ObjectId,
  "author_name": "string",
  "text": "string",
  "created_at": "Date"
}
```

## Relationships

- `posts.user_id` → references `users._id`
- `comments.user_id` → references `users._id`
- `comments.post_id` → references `posts._id`
- `posts.likes` → array of references to `users._id`

The project uses a combination of **referenced data** and **embedded data**:

- References are used for users, posts, and comments
- Likes are stored as embedded references inside posts


## 4. MongoDB Queries and Aggregations

### Aggregation Examples

#### Feed Aggregation
- Sort posts by creation date
- Join comments and author details
- Calculate likes and comments count

**Stages used:**
- `$sort`
- `$lookup`
- `$unwind`
- `$addFields`

#### User Statistics Aggregation
- Count total posts per user
- Calculate total likes received

**Stages used:**
- `$match`
- `$addFields`
- `$group`

#### Top Posts Aggregation
- Sort posts by number of likes
- Return most popular posts


## 5. API Documentation

### Authentication

| Method | Endpoint | Description |
|------|---------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login and receive JWT |

### Users

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | `/api/users/:id/stats` | Get user statistics (aggregation) |

### Posts

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | `/api/posts` | Get all posts (aggregation feed) |
| GET | `/api/posts/top` | Get top posts |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like or unlike post |

### Comments

| Method | Endpoint | Description |
|------|---------|-------------|
| POST | `/api/comments` | Add comment |
| PUT | `/api/comments/:id` | Update comment |
| DELETE | `/api/comments/:id` | Delete comment |


## 6. Indexing and Optimization Strategy

To improve performance, the following indexes are used:

- **`users.email` (unique index)**  
  Used for fast login and registration checks.

- **`users.username`**  
  Optimizes user lookups.

- **`posts.user_id + created_at` (compound index)**  
  Optimizes feed queries and user post retrieval.

- **`comments.post_id + created_at` (compound index)**  
  Optimizes comment retrieval for posts.

These indexes reduce query execution time and improve scalability.


## 7. Security and Authorization

- JWT-based authentication
- Passwords stored as hashed values using `bcrypt`
- Role-based access control:
  - **User**: can manage only own posts and comments
  - **Admin**: can moderate and delete any post or comment
- Authorization is enforced strictly on the backend


## 8. Contribution

This project was completed by 1 student.

**Author:** Aman Baku

All design, implementation, and documentation tasks were performed by the author.


## 9. Conclusion

This project demonstrates the practical use of MongoDB in a real-world web application.  
It covers advanced NoSQL concepts such as aggregation pipelines, data modeling, indexing, authentication, and authorization, fulfilling all requirements of the **Advanced Databases (NoSQL)** course.
