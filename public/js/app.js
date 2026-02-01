const API_URL = '/api';

/* =======================
   AUTH HELPERS
======================= */

function checkAuth() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/index.html';
  }
  return userId;
}

function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

/* =======================
   AUTH
======================= */

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'Login failed');
    return;
  }

  localStorage.setItem('userId', data.userId);
  localStorage.setItem('username', data.username);
  window.location.href = '/feed.html';
}

async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('username')?.value;
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  const res = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'Registration failed');
    return;
  }

  alert('Account created! Please log in.');
  window.location.href = '/index.html';
}

/* =======================
   FEED
======================= */

async function loadFeed() {
  const currentUserId = checkAuth();
  const feed = document.getElementById('feed');
  if (!feed) return;

  feed.innerHTML = `<p class="empty">Loading posts...</p>`;

  const res = await fetch(`${API_URL}/posts`);
  const posts = await res.json();

  feed.innerHTML = '';

  if (!posts.length) {
    feed.innerHTML = `<p class="empty">No posts found</p>`;
    return;
  }

  posts.forEach(post => {
    feed.appendChild(renderPost(post, currentUserId));
  });
}

function renderPost(post, currentUserId) {
  const postEl = document.createElement('div');
  postEl.className = 'post';

  const liked = Array.isArray(post.likes)
    ? post.likes.some(id => id === currentUserId || id?.toString() === currentUserId)
    : false;

  postEl.innerHTML = `
    <div class="post-header">
      <img class="avatar" src="${post.author_details?.avatar_url || 'https://placehold.co/50'}" />
      <div>
        <strong>${post.author_details?.username || 'Unknown'}</strong>
        <div class="post-date">${new Date(post.created_at).toLocaleString()}</div>
      </div>
    </div>

    <div class="post-content">${post.content}</div>

    <div class="post-actions">
      <button class="like-btn ${liked ? 'liked' : ''}">
        ❤️ ${post.likesCount || 0}
      </button>
      <span class="comment-count">💬 ${post.commentsCount || 0}</span>
    </div>

    <div class="comments">
      ${renderComments(post.post_comments)}
      <form class="comment-form">
        <input type="text" placeholder="Write a comment..." />
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  /* LIKE / UNLIKE */
  postEl.querySelector('.like-btn').addEventListener('click', async () => {
    await fetch(`${API_URL}/posts/${post._id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    });
    loadFeed();
  });

  /* ADD COMMENT */
  postEl.querySelector('.comment-form').addEventListener('submit', async e => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const text = input.value.trim();
    if (!text) return;

    await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: post._id,
        user_id: currentUserId,
        username: localStorage.getItem('username'),
        text
      })
    });

    input.value = '';
    loadFeed();
  });

  return postEl;
}

function renderComments(comments = []) {
  if (!comments.length) {
    return `<div class="no-comments">No comments yet</div>`;
  }

  return comments.map(c => `
    <div class="comment">
      <strong>${c.author_name || 'User'}:</strong> ${c.text}
    </div>
  `).join('');
}

/* =======================
   CREATE POST
======================= */

async function createPost(e) {
  e.preventDefault();

  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  const content = contentEl.value.trim();
  if (!content) return;

  await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: localStorage.getItem('userId'),
      content
    })
  });

  contentEl.value = '';
  loadFeed();
}

/* =======================
   PROFILE STATS
======================= */

async function loadStats() {
  const userId = checkAuth();
  const container = document.getElementById('stats-view');
  if (!container) return;

  container.innerHTML = `<p class="empty">Loading...</p>`;

  const res = await fetch(`${API_URL}/users/${userId}/stats`);
  const data = await res.json();

  const user = data.user || {};
  const stats = data.stats || {};

  container.innerHTML = `
    <div class="card center">
      <img class="avatar" src="${user.avatar_url || 'https://placehold.co/100'}" />
      <h2>${user.username}</h2>
      <p class="muted">${user.bio || 'No bio available'}</p>
      <p class="muted">Role: ${user.role || 'user'}</p>
    </div>

    <div class="card center">
      <p><strong>Total posts:</strong> ${stats.totalPosts || 0}</p>
      <p><strong>Total likes:</strong> ${stats.totalLikesReceived || 0}</p>
    </div>
  `;
}

/* =======================
   INIT
======================= */

if (document.getElementById('feed')) {
  loadFeed();
}
