// Community page — paginated posts with tags, edit (author-only), comments,
// likes.
import { navbarHtml, footerHtml, backLink, mainHeader, setupNavbarToggle } from '../components/layout.js';
import { api } from '../api.js';
import { escapeHtml, timeAgo, showToast, qs } from '../utils.js';

let currentPage = 1;
const PAGE_SIZE = 10;
let editingPostId = null;

export async function renderCommunity(app) {
  currentPage = 1;
  editingPostId = null;
  app.innerHTML = `
  <div class="page-shell">
    ${navbarHtml('#/community')}
    ${mainHeader('Farmer Community', 'Share your farming experiences and connect with others')}
    <main class="page-main">
      <div class="page-container">
        ${backLink()}
        <details class="card mb-4">
          <summary style="cursor:pointer;font-weight:700;color:var(--color-brand-700);">Create New Post</summary>
          <div class="mt-4">
            <div class="form-group"><label class="form-label" for="post-author">Your Name</label><input type="text" id="post-author" placeholder="Enter your name"/></div>
            <div class="form-group"><label class="form-label" for="post-title">Post Title</label><input type="text" id="post-title" placeholder="What would you like to share?"/></div>
            <div class="form-group"><label class="form-label" for="post-content">Content</label><textarea id="post-content" rows="4" placeholder="Write your experience or question here..."></textarea></div>
            <div class="form-group"><label class="form-label" for="post-tags">Tags (comma-separated, optional)</label><input type="text" id="post-tags" placeholder="tomato, early blight"/></div>
            <button class="btn btn-primary" id="create-post-btn"><i class="fas fa-paper-plane" aria-hidden="true"></i> Post to Community</button>
          </div>
        </details>
        <div id="posts-list"><div class="skeleton" style="height:120px;"></div></div>
        <div class="pagination" id="posts-pagination"></div>
      </div>
    </main>
    ${footerHtml()}
  </div>`;

  setupNavbarToggle();
  qs('create-post-btn').addEventListener('click', createPost);
  await loadPosts();
}

async function loadPosts() {
  const listEl = qs('posts-list');
  const res = await api.getPosts({ page: currentPage, page_size: PAGE_SIZE });
  if (!res.ok) {
    listEl.innerHTML = `<div class="empty-state"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i>Failed to load posts. <button class="btn btn-sm btn-secondary" onclick="reloadPosts()">Retry</button></div>`;
    qs('posts-pagination').innerHTML = '';
    return;
  }
  const { posts, total_pages, page } = res.data;
  if (!posts || posts.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><i class="fas fa-comments" aria-hidden="true"></i>No posts yet. Be the first to share!</div>`;
    qs('posts-pagination').innerHTML = '';
    return;
  }
  listEl.innerHTML = posts.map(postHtml).join('');
  renderPagination(page, total_pages);
}

function renderPagination(page, totalPages) {
  const el = qs('posts-pagination');
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <button class="btn btn-sm btn-ghost" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
    <span class="page-info">Page ${page} of ${totalPages}</span>
    <button class="btn btn-sm btn-ghost" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>`;
}

function goToPage(page) {
  currentPage = page;
  loadPosts();
}

function postHtml(p) {
  const isEditing = editingPostId === p.id;
  const tagsHtml = (p.tags || []).map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('');
  const commentsHtml = (p.comments || [])
    .map(
      (c) => `<div class="comment-box"><div class="comment-author">${escapeHtml(c.author)}</div><div class="comment-text">${escapeHtml(c.content)}</div></div>`
    )
    .join('');

  if (isEditing) {
    return `
    <div class="card post-card mb-4" id="post-${p.id}">
      <div class="form-group"><label class="form-label">Title</label><input type="text" id="edit-title-${p.id}" value="${escapeHtml(p.title)}"/></div>
      <div class="form-group"><label class="form-label">Content</label><textarea id="edit-content-${p.id}" rows="4">${escapeHtml(p.content)}</textarea></div>
      <div class="form-group"><label class="form-label">Tags</label><input type="text" id="edit-tags-${p.id}" value="${(p.tags || []).join(', ')}"/></div>
      <div class="row gap-2">
        <button class="btn btn-primary btn-sm" onclick="saveEditPost(${p.id})">Save</button>
        <button class="btn btn-ghost btn-sm" onclick="cancelEditPost()">Cancel</button>
      </div>
    </div>`;
  }

  return `
  <div class="card post-card mb-4" id="post-${p.id}">
    <div class="post-header">
      <div>
        <div class="post-author">${escapeHtml(p.author)}</div>
        <div class="post-time">${timeAgo(p.created_at)}</div>
      </div>
      ${p.editable_by_me ? `<button class="btn btn-sm btn-ghost" onclick="startEditPost(${p.id})" aria-label="Edit post"><i class="fas fa-pen" aria-hidden="true"></i></button>` : ''}
    </div>
    ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
    <h4 class="mt-2">${escapeHtml(p.title)}</h4>
    <p>${escapeHtml(p.content)}</p>
    <div class="post-actions">
      <button class="btn btn-ghost ${p.liked_by_me ? 'active' : ''}" onclick="toggleLike(${p.id})"><i class="fas fa-thumbs-up" aria-hidden="true"></i> ${p.likes}</button>
      <button class="btn btn-ghost" onclick="toggleCommentBox(${p.id})"><i class="fas fa-comment" aria-hidden="true"></i> ${p.comments.length}</button>
      ${p.editable_by_me ? `<button class="btn btn-ghost" onclick="deletePost(${p.id})"><i class="fas fa-trash" aria-hidden="true"></i> Delete</button>` : ''}
    </div>
    <div id="comment-box-${p.id}" class="hidden mt-3">
      <div class="form-group"><input type="text" id="comment-author-${p.id}" placeholder="Your name"/></div>
      <div class="form-group"><textarea id="comment-content-${p.id}" placeholder="Write a comment..." rows="2"></textarea></div>
      <button class="btn btn-primary btn-sm" onclick="submitComment(${p.id})">Post Comment</button>
      <div class="comment-list">${commentsHtml}</div>
    </div>
  </div>`;
}

async function createPost() {
  const author = qs('post-author').value.trim();
  const title = qs('post-title').value.trim();
  const content = qs('post-content').value.trim();
  const tagsRaw = qs('post-tags').value.trim();
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
  if (!author || !title || !content) return showToast('Please fill in all fields', true);

  const res = await api.createPost({ author, title, content, tags });
  if (!res.ok) return showToast(res.data.error || 'Failed to post', true);
  showToast('Post published!');
  currentPage = 1;
  document.querySelector('details')?.removeAttribute('open');
  qs('post-author').value = '';
  qs('post-title').value = '';
  qs('post-content').value = '';
  qs('post-tags').value = '';
  await loadPosts();
}

function startEditPost(id) {
  editingPostId = id;
  loadPosts();
}
function cancelEditPost() {
  editingPostId = null;
  loadPosts();
}
async function saveEditPost(id) {
  const title = qs(`edit-title-${id}`).value.trim();
  const content = qs(`edit-content-${id}`).value.trim();
  const tagsRaw = qs(`edit-tags-${id}`).value.trim();
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
  if (!title || !content) return showToast('Title and content are required', true);
  const res = await api.updatePost(id, { title, content, tags });
  if (!res.ok) return showToast(res.data.error || 'Failed to update post', true);
  editingPostId = null;
  showToast('Post updated');
  await loadPosts();
}

async function toggleLike(id) {
  const res = await api.toggleLike(id);
  if (!res.ok) return showToast('Failed to like post', true);
  await loadPosts();
}

function toggleCommentBox(id) {
  qs(`comment-box-${id}`).classList.toggle('hidden');
}

async function submitComment(id) {
  const author = qs(`comment-author-${id}`).value.trim();
  const content = qs(`comment-content-${id}`).value.trim();
  if (!author || !content) return showToast('Please enter your name and comment', true);
  const res = await api.submitComment(id, { author, content });
  if (!res.ok) return showToast(res.data.error || 'Failed to post comment', true);
  showToast('Comment posted!');
  await loadPosts();
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  const res = await api.deletePost(id);
  if (!res.ok) return showToast(res.data.error || 'Failed to delete', true);
  showToast('Post deleted');
  await loadPosts();
}

function reloadPosts() {
  loadPosts();
}

Object.assign(window, {
  goToPage, startEditPost, cancelEditPost, saveEditPost,
  toggleLike, toggleCommentBox, submitComment, deletePost, reloadPosts
});
