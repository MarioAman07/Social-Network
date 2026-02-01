const API_URL = '/api';

/* AUTH HELPERS */

function checkAuth() {
  const userId = localStorage.getItem('userId');
  if (!userId) window.location.href = '/index.html';
  return userId;
}

function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

/* HELPERS*/

// Handles ObjectId formats: string | { $oid: "..." } | ObjectId-like
function getId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.$oid) return value.$oid;
  if (typeof value === 'object' && value.toString) return value.toString();
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/*AUTH*/

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

/*FEED*/

async function loadFeed() {
  const currentUserId = checkAuth();
  const feed = document.getElementById('feed');
  if (!feed) return;

  feed.innerHTML = `<p class="empty">Loading posts...</p>`;

  const res = await fetch(`${API_URL}/posts`);
  const posts = await res.json();

  feed.innerHTML = ''; //no duplicates

  if (!posts.length) {
    feed.innerHTML = `<p class="empty">No posts found</p>`;
    return;
  }

  posts.forEach(post => feed.appendChild(renderPost(post, currentUserId)));
}

function renderPost(post, currentUserId) {
  const postEl = document.createElement('div');
  postEl.className = 'post';

  const postId = getId(post._id);
  const authorId = getId(post.user_id);

  const isOwner = authorId && authorId === currentUserId;

  // like state (works if backend returns likes array)
  const liked = Array.isArray(post.likes)
    ? post.likes.some(id => getId(id) === currentUserId)
    : false;

  const authorName = post.author_details?.username || 'Unknown';
  const authorAvatar = post.author_details?.avatar_url || 'https://placehold.co/50';

  // content: show safely (no HTML injection)
  const safeContent = escapeHtml(post.content || '');

  postEl.innerHTML = `
    <div class="post-header">
      <img class="avatar" src="${authorAvatar}" alt="avatar" />
      <div>
        <strong>${escapeHtml(authorName)}</strong>
        <div class="post-date">${new Date(post.created_at).toLocaleString()}</div>
      </div>
    </div>

    <div class="post-content js-post-content">${safeContent}</div>

    <div class="post-actions">
      <button class="like-btn ${liked ? 'liked' : ''} js-like-btn">
        ❤️ ${post.likesCount || 0}
      </button>

      <span class="comment-count">💬 ${post.commentsCount || 0}</span>

      ${isOwner ? `
        <div class="post-owner-actions">
          <button class="post-action-btn js-edit-btn" type="button">Edit</button>
          <button class="post-action-btn danger js-delete-btn" type="button">Delete</button>
        </div>
      ` : ''}
    </div>

    <div class="comments">
      ${renderComments(post.post_comments)}
      <form class="comment-form js-comment-form">
        <input type="text" class="comment-input" placeholder="Write a comment..." />
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  // LIKE / UNLIKE
  postEl.querySelector('.js-like-btn').addEventListener('click', async () => {
    await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    });
    loadFeed();
  });

  // ADD COMMENT
  postEl.querySelector('.js-comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('.comment-input');
    const text = input.value.trim();
    if (!text) return;

    await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        user_id: currentUserId,
        username: localStorage.getItem('username'),
        text
      })
    });

    input.value = '';
    loadFeed();
  });

  // OWNER: DELETE
  if (isOwner) {
    const deleteBtn = postEl.querySelector('.js-delete-btn');
    deleteBtn.addEventListener('click', async () => {
      const ok = confirm('Delete this post? This will also delete its comments.');
      if (!ok) return;

      await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });

      loadFeed();
    });

    // OWNER: EDIT (toggle edit mode)
    const editBtn = postEl.querySelector('.js-edit-btn');
    editBtn.addEventListener('click', () => enterEditMode(postEl, postId, currentUserId, safeContent));
  }

  return postEl;
}

function enterEditMode(postEl, postId, currentUserId, currentContent) {
  // if already in edit mode - do nothing
  if (postEl.querySelector('.edit-box')) return;

  const contentEl = postEl.querySelector('.js-post-content');
  const original = currentContent;

  // Build edit UI (no inline styles, only classes)
  const box = document.createElement('div');
  box.className = 'edit-box';

  box.innerHTML = `
    <textarea class="textarea edit-text" rows="3"></textarea>
    <div class="edit-actions">
      <button class="btn edit-save" type="button">Save</button>
      <button class="btn edit-cancel" type="button">Cancel</button>
    </div>
  `;

  const textarea = box.querySelector('.edit-text');
  textarea.value = original;

  // replace content with editor
  contentEl.replaceWith(box);

  box.querySelector('.edit-cancel').addEventListener('click', () => {
    // restore original content node
    const restored = document.createElement('div');
    restored.className = 'post-content js-post-content';
    restored.innerHTML = original;
    box.replaceWith(restored);
  });

  box.querySelector('.edit-save').addEventListener('click', async () => {
    const newText = textarea.value.trim();
    if (!newText) {
      alert('Content cannot be empty');
      return;
    }

    await fetch(`${API_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, content: newText })
    });

    loadFeed();
  });
}

function renderComments(comments = []) {
  if (!comments.length) return `<div class="no-comments">No comments yet</div>`;

  return comments.map(c => `
    <div class="comment">
      <strong>${escapeHtml(c.author_name || 'User')}:</strong> ${escapeHtml(c.text || '')}
    </div>
  `).join('');
}

/*CREATE POST*/

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

/*PROFILE STATS*/

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
      <img class="avatar profile-avatar" src="${user.avatar_url || 'https://placehold.co/100'}" alt="avatar" />
      <h2>${escapeHtml(user.username || 'User')}</h2>
      <p class="muted">${escapeHtml(user.bio || 'No bio available')}</p>
      <p class="muted">Role: ${escapeHtml(user.role || 'user')}</p>
    </div>

    <div class="card center">
      <p><strong>Total posts:</strong> ${stats.totalPosts || 0}</p>
      <p><strong>Total likes:</strong> ${stats.totalLikesReceived || 0}</p>
    </div>
  `;
}

/*INIT*/

if (document.getElementById('feed')) loadFeed();
