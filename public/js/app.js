const API_URL = '/api';

/* auth helpers */

function checkAuth() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  if (!token || !userId) window.location.href = '/index.html';
  return userId;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function handleAuthError(res) {
  if (res && res.status === 401) {
    // token invalid/expired
    localStorage.clear();
    window.location.href = '/index.html';
    return true;
  }
  return false;
}

function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

/* helpers */

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

function getRole() {
  return localStorage.getItem('role') || 'user';
}

/* auth */

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  // admin mode controls (index.html)
  const adminLogin = !!document.getElementById('adminLogin')?.checked;
  const adminSecret = document.getElementById('adminSecret')?.value || '';

  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, adminLogin, adminSecret })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'Login failed');
    return;
  }

  // JWT token
  localStorage.setItem('token', data.token);

  localStorage.setItem('userId', getId(data.userId) || data.userId);
  localStorage.setItem('username', data.username);

  // role for UI
  localStorage.setItem('role', data.role || 'user');

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

/* feed */

async function loadFeed() {
  const currentUserId = checkAuth();
  const feed = document.getElementById('feed');
  if (!feed) return;

  feed.innerHTML = `<p class="empty">Loading posts...</p>`;

  const res = await fetch(`${API_URL}/posts`, {
    headers: { ...authHeaders() }
  });

  if (handleAuthError(res)) return;

  const posts = await res.json();
  feed.innerHTML = '';

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
  const isAdmin = getRole() === 'admin';

  // admin can moderate any post
  const canModeratePost = isOwner || isAdmin;

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

      ${canModeratePost ? `
        <div class="post-owner-actions">
          <button class="post-action-btn js-edit-btn" type="button">${isOwner ? 'Edit' : 'Edit (admin)'}</button>
          <button class="post-action-btn danger js-delete-btn" type="button">${isOwner ? 'Delete' : 'Delete (admin)'}</button>
        </div>
      ` : ''}
    </div>

    <div class="comments">
      ${renderComments(post.post_comments, currentUserId, isAdmin)}
      <form class="comment-form js-comment-form">
        <input type="text" class="comment-input" placeholder="Write a comment..." />
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  // like/unlike token, without body userId
  postEl.querySelector('.js-like-btn').addEventListener('click', async () => {
    const res = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });

    if (handleAuthError(res)) return;
    loadFeed();
  });

  // add comment token, without user_id/username
  postEl.querySelector('.js-comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('.comment-input');
    const text = input.value.trim();
    if (!text) return;

    const res = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        post_id: postId,
        text
      })
    });

    if (handleAuthError(res)) return;

    input.value = '';
    loadFeed();
  });

  // delete/edit (Owner OR Admin)
  if (canModeratePost) {
    const deleteBtn = postEl.querySelector('.js-delete-btn');
    deleteBtn.addEventListener('click', async () => {
      const ok = confirm('Delete this post? This will also delete its comments.');
      if (!ok) return;

      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }
      });

      if (handleAuthError(res)) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Delete failed');
        return;
      }

      loadFeed();
    });

    const editBtn = postEl.querySelector('.js-edit-btn');
    editBtn.addEventListener('click', () => enterEditMode(postEl, postId, safeContent));
  }

  return postEl;
}

function enterEditMode(postEl, postId, currentContent) {
  if (postEl.querySelector('.edit-box')) return;

  const contentEl = postEl.querySelector('.js-post-content');
  const original = currentContent;

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

  contentEl.replaceWith(box);

  box.querySelector('.edit-cancel').addEventListener('click', () => {
    const restored = document.createElement('div');
    restored.className = 'post-content js-post-content';
    restored.innerHTML = original;
    box.replaceWith(restored);
  });

  // save edit token, without body userId
  box.querySelector('.edit-save').addEventListener('click', async () => {
    const newText = textarea.value.trim();
    if (!newText) {
      alert('Content cannot be empty');
      return;
    }

    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ content: newText })
    });

    if (handleAuthError(res)) return;

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Update failed');
      return;
    }

    loadFeed();
  });
}

function renderComments(comments = [], currentUserId, isAdmin) {
  if (!comments.length) return `<div class="no-comments">No comments yet</div>`;

  return comments.map(c => {
    const commentId = getId(c._id);
    const commentOwnerId = getId(c.user_id);
    const canModerateComment = (commentOwnerId && commentOwnerId === currentUserId) || isAdmin;

    return `
      <div class="comment" style="display:flex;gap:10px;align-items:center;justify-content:space-between;">
        <div>
          <strong>${escapeHtml(c.author_name || 'User')}:</strong> ${escapeHtml(c.text || '')}
        </div>
        ${canModerateComment ? `
          <button class="post-action-btn danger js-del-comment" data-id="${commentId}" type="button" style="padding:6px 10px;border-radius:10px;">
            Delete
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

/* create post */

async function createPost(e) {
  e.preventDefault();

  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  const content = contentEl.value.trim();
  if (!content) return;

  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content })
  });

  if (handleAuthError(res)) return;

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Create post failed');
    return;
  }

  contentEl.value = '';
  loadFeed();
}

/* profile stats */

async function loadStats() {
  const userId = checkAuth();
  const container = document.getElementById('stats-view');
  if (!container) return;

  container.innerHTML = `<p class="empty">Loading...</p>`;

  const res = await fetch(`${API_URL}/users/${userId}/stats`, {
    headers: { ...authHeaders() }
  });

  if (handleAuthError(res)) return;

  const data = await res.json();

  const user = data.user || {};
  const stats = data.stats || {};

  if (user.role) localStorage.setItem('role', user.role);

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

/* comment delete click(delegation) */

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.js-del-comment');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  if (!id) return;

  const ok = confirm('Delete this comment?');
  if (!ok) return;

  const res = await fetch(`${API_URL}/comments/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });

  if (handleAuthError(res)) return;

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Delete comment failed');
    return;
  }

  loadFeed();
});

/* init */

if (document.getElementById('feed')) loadFeed();
