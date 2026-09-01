// PlantGuard - Client-side SPA router + page renderers
// Vanilla JS (no framework) talking to the Hono API backend.

const app = document.getElementById('app');
axios.defaults.withCredentials = true;

const routes = {
  '': renderLanding,
  '#/': renderLanding,
  '#/home': renderHome,
  '#/diagnosis': renderDiagnosis,
  '#/chatbot': renderChatbot,
  '#/community': renderCommunity,
  '#/library': renderLibrary,
  '#/tips': renderTips,
  '#/history': renderHistory,
  '#/weather': renderWeather
};

function navigate(hash) {
  window.location.hash = hash;
}

function currentRoute() {
  return window.location.hash || '';
}

async function router() {
  const hash = currentRoute();
  const renderer = routes[hash] || renderLanding;
  window.scrollTo(0, 0);
  await renderer();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ============== UTILITIES ==============

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function listHtml(arr) {
  if (!arr || arr.length === 0) return '<li>—</li>';
  return arr.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
}

function severityClass(sev) {
  const s = (sev || 'none').toLowerCase();
  return 'severity-' + (['low', 'moderate', 'high', 'critical'].includes(s) ? s : 'none');
}

function navbarHtml(activePage) {
  const links = [
    ['#/home', 'Home'],
    ['#/diagnosis', 'Diagnosis'],
    ['#/chatbot', 'AI Chat'],
    ['#/community', 'Community'],
    ['#/library', 'Disease Library'],
    ['#/tips', 'Cultivation Tips'],
    ['#/history', 'History'],
    ['#/weather', 'Weather']
  ];
  return `
  <nav class="navbar">
    <div class="navbar-brand" onclick="navigate('#/home')">🌿 PlantGuard</div>
    <div class="navbar-nav">
      ${links
        .map(
          ([href, label]) =>
            `<a class="nav-link ${href === activePage ? 'active' : ''}" onclick="navigate('${href}')">${label}</a>`
        )
        .join('')}
    </div>
  </nav>`;
}

function footerHtml() {
  return `
  <footer class="footer-container">
    <div class="footer-title">🌿 PlantGuard — AI Plant Disease Detection System</div>
    <div class="footer-links">
      <a onclick="navigate('#/home')">Home</a>
      <a onclick="navigate('#/diagnosis')">Diagnosis</a>
      <a onclick="navigate('#/community')">Community</a>
      <a onclick="navigate('#/chatbot')">AI Assistant</a>
    </div>
    <div class="footer-credit">Powered by AI Vision &amp; Real-Time Weather Data — Built with Hono + Cloudflare</div>
  </footer>`;
}

function backLink(label) {
  return `<div class="page-back" onclick="navigate('#/home')"><i class="fas fa-arrow-left"></i> ${label || 'Back to Home'}</div>`;
}

function mainHeader(title, subtitle) {
  return `
  <div class="main-header">
    <h1 class="main-header-title">${title}</h1>
    <p class="main-header-subtitle">${subtitle}</p>
  </div>`;
}

// ============== LANDING PAGE ==============

function renderLanding() {
  app.innerHTML = `
  <div class="landing-container">
    <div class="landing-content">
      <div class="landing-text">
        <h1 class="landing-title">Your AI-Powered<br/>Plant Guardian</h1>
        <p class="landing-subtitle">
          Detect plant diseases instantly using advanced AI vision technology. Get real
          cultivation guidance, live weather forecasts, chat with an AI plant expert, and
          connect with farmers worldwide.
        </p>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <button class="btn-primary" onclick="navigate('#/home')">🚀 Get Started</button>
          <button class="btn-secondary" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">Learn More</button>
        </div>
      </div>
      <div class="landing-image">
        <div class="landing-image-emoji">🌿</div>
      </div>
    </div>
  </div>

  <div class="features-section" id="features">
    <h2 class="section-title">Powerful Features</h2>
    <p class="section-subtitle">Everything you need to care for your plants, powered by real AI</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-card-image">🔬</div>
        <div class="feature-card-content">
          <div class="feature-card-title">AI Vision Diagnosis</div>
          <div class="feature-card-description">Upload any leaf photo — our AI identifies the plant, detects diseases, and explains symptoms, treatment &amp; prevention.</div>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">🤖</div>
        <div class="feature-card-content">
          <div class="feature-card-title">AI Plant Care Chatbot</div>
          <div class="feature-card-description">Chat live with an AI agronomist about any plant, pest, or farming question — anytime.</div>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">🌡️</div>
        <div class="feature-card-content">
          <div class="feature-card-title">Real Weather Forecasts</div>
          <div class="feature-card-description">Live 7-day forecasts from real weather data, auto-detected from your location.</div>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">👥</div>
        <div class="feature-card-content">
          <div class="feature-card-title">Farmer Community</div>
          <div class="feature-card-description">Share experiences, ask questions, and connect with other growers.</div>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">📚</div>
        <div class="feature-card-content">
          <div class="feature-card-title">Disease &amp; Cultivation Library</div>
          <div class="feature-card-description">AI-generated, always up-to-date guides for any crop or disease you search.</div>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-card-image">📋</div>
        <div class="feature-card-content">
          <div class="feature-card-title">Diagnosis History</div>
          <div class="feature-card-description">Every scan is saved so you can track your plants' health over time.</div>
        </div>
      </div>
    </div>
  </div>
  ${footerHtml()}
  `;
}

// ============== HOME / DASHBOARD ==============

function renderHome() {
  app.innerHTML = `
  ${navbarHtml('#/home')}
  ${mainHeader('🌿 PlantGuard', 'AI-Powered Plant Disease Detection &amp; Cultivation Guide')}
  <div class="page-container">
    <h2 style="color:#1e7145;">Welcome to PlantGuard</h2>
    <p style="color:#666;">Detect plant diseases with real AI, chat with a plant expert, get cultivation tips, connect with farmers, and track weather conditions.</p>
    <div class="dash-grid">
      ${dashCard('🔬', 'Plant Diagnosis', 'Analyze leaf photos with AI vision', "navigate('#/diagnosis')")}
      ${dashCard('🤖', 'AI Chat Assistant', 'Ask any plant care question', "navigate('#/chatbot')")}
      ${dashCard('👥', 'Community', 'Share experiences with farmers', "navigate('#/community')")}
      ${dashCard('📚', 'Disease Library', 'Browse AI-generated disease info', "navigate('#/library')")}
      ${dashCard('🌾', 'Cultivation Tips', 'Best practices for any crop', "navigate('#/tips')")}
      ${dashCard('📋', 'My History', 'Your past diagnosis records', "navigate('#/history')")}
      ${dashCard('🌡️', 'Weather', '7-day real forecast', "navigate('#/weather')")}
    </div>
  </div>
  ${footerHtml()}
  `;
}

function dashCard(icon, title, desc, onclick) {
  return `
  <div class="card" onclick="${onclick}">
    <div class="icon">${icon}</div>
    <h4>${title}</h4>
    <p>${desc}</p>
  </div>`;
}

// ============== DIAGNOSIS ==============

let selectedFile = null;

function renderDiagnosis() {
  selectedFile = null;
  app.innerHTML = `
  ${navbarHtml('#/diagnosis')}
  ${mainHeader('🔬 AI Plant Diagnosis', 'Upload a leaf photo for instant AI-powered disease detection')}
  <div class="page-container">
    ${backLink()}
    <div style="display:grid; grid-template-columns: 1fr 1.4fr; gap:30px;" id="diag-grid">
      <div>
        <div class="upload-box" id="upload-box" onclick="document.getElementById('file-input').click()">
          <i class="fas fa-cloud-upload-alt" style="font-size:40px;color:#2ecc71;"></i>
          <p style="margin:10px 0 0;color:#555;font-weight:600;">Click to upload a leaf photo</p>
          <p style="margin:4px 0 0;color:#999;font-size:12px;">PNG, JPG, JPEG — up to 8MB</p>
          <div id="preview-area"></div>
        </div>
        <input type="file" id="file-input" accept="image/png,image/jpeg,image/jpg" class="hidden" onchange="onFileSelected(event)" />
        <button class="btn-primary" style="width:100%;margin-top:16px;" id="analyze-btn" disabled onclick="analyzeLeaf()">
          <i class="fas fa-microscope"></i> Analyze Leaf
        </button>
      </div>
      <div id="diag-result">
        <div class="empty-state">
          <i class="fas fa-leaf"></i>
          Upload a leaf photo and click "Analyze Leaf" to get your AI diagnosis.
        </div>
      </div>
    </div>
  </div>
  ${footerHtml()}
  `;

  window.matchMedia('(max-width: 768px)').matches &&
    (document.getElementById('diag-grid').style.gridTemplateColumns = '1fr');
}

function onFileSelected(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('preview-area').innerHTML = `<img src="${e.target.result}" alt="preview"/>`;
  };
  reader.readAsDataURL(file);
  document.getElementById('analyze-btn').disabled = false;
}

async function analyzeLeaf() {
  if (!selectedFile) return;
  const resultEl = document.getElementById('diag-result');
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  resultEl.innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:#666;">🤖 AI analyzing your leaf image...</p></div>`;

  const formData = new FormData();
  formData.append('image', selectedFile);

  try {
    const { data } = await axios.post('/api/diagnosis/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (data.error) {
      resultEl.innerHTML = `<div class="diagnosis-error"><h4>❌ Error</h4><p>${escapeHtml(data.error)}</p></div>`;
    } else if (!data.is_leaf) {
      resultEl.innerHTML = `<div class="diagnosis-error"><h4>❌ Image Rejected</h4><p>${escapeHtml(data.message)}</p></div>`;
    } else if (data.is_healthy) {
      resultEl.innerHTML = `
        <div class="diagnosis-success">
          <h4>✅ Diagnosis Result</h4>
          <h2 style="color:#28a745;margin:10px 0;">${escapeHtml(data.plant_name)} — Healthy 🌱</h2>
          <p><strong>Confidence:</strong> ${data.confidence}%</p>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${data.confidence}%"></div></div>
          <p style="margin-top:12px;">✨ This plant appears healthy! Continue good care practices.</p>
          ${data.notes ? `<p style="color:#555;font-size:13px;margin-top:8px;"><em>${escapeHtml(data.notes)}</em></p>` : ''}
        </div>`;
    } else {
      const sevClass = severityClass(data.severity);
      resultEl.innerHTML = `
        <div class="diagnosis-success">
          <h4>✅ Diagnosis Result</h4>
          <h2 style="color:#28a745;margin:10px 0;">${escapeHtml(data.plant_name)} — ${escapeHtml(data.disease_name)}</h2>
          <p><strong>Confidence:</strong> ${data.confidence}% &nbsp; <span class="severity-badge ${sevClass}">${escapeHtml(data.severity)} Severity</span></p>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${data.confidence}%"></div></div>
        </div>
        <div class="library-grid-2">
          <div class="info-block"><h5>🔍 Symptoms</h5><ul>${listHtml(data.symptoms)}</ul></div>
          <div class="info-block"><h5>📡 How It Spreads</h5><ul>${listHtml(data.spread)}</ul></div>
          <div class="info-block"><h5>💊 Treatment</h5><ul>${listHtml(data.treatment)}</ul></div>
          <div class="info-block"><h5>🛡️ Prevention</h5><ul>${listHtml(data.prevention)}</ul></div>
        </div>
        ${data.notes ? `<p style="color:#777;font-size:13px;margin-top:14px;"><em>Note: ${escapeHtml(data.notes)}</em></p>` : ''}
        <p style="color:#2ecc71;font-size:13px;margin-top:10px;"><i class="fas fa-check-circle"></i> Saved to your diagnosis history</p>
      `;
    }
  } catch (e) {
    resultEl.innerHTML = `<div class="diagnosis-error"><h4>❌ Error</h4><p>${escapeHtml(e.response?.data?.error || e.message)}</p></div>`;
  } finally {
    btn.disabled = false;
  }
}

// ============== AI CHATBOT ==============

async function renderChatbot() {
  app.innerHTML = `
  ${navbarHtml('#/chatbot')}
  ${mainHeader('🤖 AI Plant Care Assistant', 'Chat live with an AI agronomist about any plant question')}
  <div class="page-container">
    ${backLink()}
    <div class="chat-window">
      <div class="chat-messages" id="chat-messages"><div class="chat-empty">Loading conversation...</div></div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" placeholder="Ask about plant diseases, care tips, pests..." onkeydown="if(event.key==='Enter') sendChatMessage()" />
        <button class="btn-primary" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
    <div style="text-align:right;margin-top:10px;">
      <button class="btn-danger" onclick="clearChat()"><i class="fas fa-trash"></i> Clear Conversation</button>
    </div>
  </div>
  ${footerHtml()}
  `;

  await loadChatHistory();
}

async function loadChatHistory() {
  const box = document.getElementById('chat-messages');
  try {
    const { data } = await axios.get('/api/chat/history');
    if (!data.messages || data.messages.length === 0) {
      box.innerHTML = `<div class="chat-empty">👋 Hi! Ask me anything about plant diseases, care, or farming.</div>`;
      return;
    }
    box.innerHTML = data.messages.map(chatBubbleHtml).join('');
    box.scrollTop = box.scrollHeight;
  } catch (e) {
    box.innerHTML = `<div class="chat-empty">Failed to load conversation.</div>`;
  }
}

function chatBubbleHtml(m) {
  const content = m.role === 'assistant' && window.marked ? marked.parse(m.content) : `<p>${escapeHtml(m.content)}</p>`;
  return `<div class="chat-bubble ${m.role}">${content}</div>`;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';

  const box = document.getElementById('chat-messages');
  if (box.querySelector('.chat-empty')) box.innerHTML = '';
  box.innerHTML += chatBubbleHtml({ role: 'user', content: message });
  box.innerHTML += `<div class="chat-bubble assistant" id="typing-indicator"><i class="fas fa-circle-notch fa-spin"></i> thinking...</div>`;
  box.scrollTop = box.scrollHeight;

  try {
    const { data } = await axios.post('/api/chat/send', { message });
    document.getElementById('typing-indicator')?.remove();
    if (data.error) {
      box.innerHTML += `<div class="chat-bubble assistant">⚠️ ${escapeHtml(data.error)}</div>`;
    } else {
      box.innerHTML += chatBubbleHtml({ role: 'assistant', content: data.reply });
    }
    box.scrollTop = box.scrollHeight;
  } catch (e) {
    document.getElementById('typing-indicator')?.remove();
    box.innerHTML += `<div class="chat-bubble assistant">⚠️ ${escapeHtml(e.response?.data?.error || e.message)}</div>`;
  }
}

async function clearChat() {
  if (!confirm('Clear this entire conversation?')) return;
  await axios.delete('/api/chat/history');
  await loadChatHistory();
  showToast('Conversation cleared');
}

// ============== COMMUNITY ==============

async function renderCommunity() {
  app.innerHTML = `
  ${navbarHtml('#/community')}
  ${mainHeader('👥 Farmer Community', 'Share your farming experiences and connect with others')}
  <div class="page-container">
    ${backLink()}
    <details style="background:white;border-radius:16px;padding:20px;margin-bottom:24px;box-shadow:0 4px 15px rgba(0,0,0,0.06);">
      <summary style="cursor:pointer;font-weight:700;color:#1e7145;">✍️ Create New Post</summary>
      <div style="margin-top:16px;">
        <div class="form-group"><label class="form-label">Your Name</label><input type="text" id="post-author" placeholder="Enter your name"/></div>
        <div class="form-group"><label class="form-label">Post Title</label><input type="text" id="post-title" placeholder="What would you like to share?"/></div>
        <div class="form-group"><label class="form-label">Content</label><textarea id="post-content" rows="4" placeholder="Write your experience or question here..."></textarea></div>
        <button class="btn-primary" onclick="createPost()"><i class="fas fa-paper-plane"></i> Post to Community</button>
      </div>
    </details>
    <div id="posts-list"><div style="text-align:center;padding:30px;"><div class="spinner"></div></div></div>
  </div>
  ${footerHtml()}
  `;
  await loadPosts();
}

async function loadPosts() {
  const listEl = document.getElementById('posts-list');
  try {
    const { data } = await axios.get('/api/community/posts');
    if (!data.posts || data.posts.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><i class="fas fa-comments"></i>No posts yet. Be the first to share!</div>`;
      return;
    }
    listEl.innerHTML = data.posts.map(postHtml).join('');
  } catch (e) {
    listEl.innerHTML = `<div class="empty-state">Failed to load posts.</div>`;
  }
}

function postHtml(p) {
  const commentsHtml = (p.comments || [])
    .map(
      (c) => `<div class="comment-box"><div class="comment-author">👤 ${escapeHtml(c.author)}</div><div class="comment-text">${escapeHtml(c.content)}</div></div>`
    )
    .join('');
  return `
  <div class="post-card" id="post-${p.id}">
    <div class="post-author">👤 ${escapeHtml(p.author)}</div>
    <div class="post-time">⏰ ${timeAgo(p.created_at)}</div>
    <h4 style="color:#1e7145;margin:10px 0;">${escapeHtml(p.title)}</h4>
    <p style="color:#555;line-height:1.6;">${escapeHtml(p.content)}</p>
    <div class="post-actions">
      <button class="${p.liked_by_me ? 'liked' : ''}" onclick="toggleLike(${p.id})"><i class="fas fa-thumbs-up"></i> ${p.likes}</button>
      <button onclick="toggleCommentBox(${p.id})"><i class="fas fa-comment"></i> ${p.comments.length}</button>
      <button onclick="deletePost(${p.id})"><i class="fas fa-trash"></i> Delete</button>
    </div>
    <div id="comment-box-${p.id}" class="hidden" style="margin-top:14px;">
      <input type="text" id="comment-author-${p.id}" placeholder="Your name" style="margin-bottom:8px;"/>
      <textarea id="comment-content-${p.id}" placeholder="Write a comment..." rows="2" style="margin-bottom:8px;"></textarea>
      <button class="btn-primary" style="padding:8px 20px;font-size:13px;" onclick="submitComment(${p.id})">Post Comment</button>
      <div style="margin-top:12px;">${commentsHtml}</div>
    </div>
  </div>`;
}

async function createPost() {
  const author = document.getElementById('post-author').value.trim();
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  if (!author || !title || !content) return showToast('Please fill in all fields', true);

  try {
    await axios.post('/api/community/posts', { author, title, content });
    showToast('Post published!');
    await renderCommunity();
  } catch (e) {
    showToast(e.response?.data?.error || 'Failed to post', true);
  }
}

async function toggleLike(id) {
  try {
    await axios.post(`/api/community/posts/${id}/like`);
    await loadPosts();
  } catch (e) {
    showToast('Failed to like post', true);
  }
}

function toggleCommentBox(id) {
  document.getElementById(`comment-box-${id}`).classList.toggle('hidden');
}

async function submitComment(id) {
  const author = document.getElementById(`comment-author-${id}`).value.trim();
  const content = document.getElementById(`comment-content-${id}`).value.trim();
  if (!author || !content) return showToast('Please enter your name and comment', true);
  try {
    await axios.post(`/api/community/posts/${id}/comments`, { author, content });
    showToast('Comment posted!');
    await loadPosts();
  } catch (e) {
    showToast('Failed to post comment', true);
  }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    await axios.delete(`/api/community/posts/${id}`);
    showToast('Post deleted');
    await loadPosts();
  } catch (e) {
    showToast(e.response?.data?.error || 'Failed to delete', true);
  }
}

// ============== DISEASE LIBRARY ==============

async function renderLibrary() {
  app.innerHTML = `
  ${navbarHtml('#/library')}
  ${mainHeader('📚 Disease Information Library', 'AI-generated disease details — symptoms, spread, treatment, prevention')}
  <div class="page-container">
    ${backLink()}
    <div class="form-group">
      <label class="form-label">Select a Disease to Learn More</label>
      <select id="disease-select" onchange="loadDiseaseInfo()"><option value="">Loading diseases...</option></select>
    </div>
    <div id="disease-detail"></div>
  </div>
  ${footerHtml()}
  `;

  try {
    const { data } = await axios.get('/api/library/diseases');
    const sel = document.getElementById('disease-select');
    sel.innerHTML =
      `<option value="">-- Choose a disease --</option>` +
      data.diseases.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
  } catch (e) {
    showToast('Failed to load disease list', true);
  }
}

async function loadDiseaseInfo() {
  const name = document.getElementById('disease-select').value;
  const detailEl = document.getElementById('disease-detail');
  if (!name) {
    detailEl.innerHTML = '';
    return;
  }
  detailEl.innerHTML = `<div style="text-align:center;padding:30px;"><div class="spinner"></div><p style="color:#666;">🤖 AI is preparing disease information...</p></div>`;
  try {
    const { data } = await axios.get(`/api/library/disease?name=${encodeURIComponent(name)}`);
    if (data.error) {
      detailEl.innerHTML = `<div class="diagnosis-error">${escapeHtml(data.error)}</div>`;
      return;
    }
    detailEl.innerHTML = `
      <div class="library-detail">
        <h3>🦠 ${escapeHtml(name)}</h3>
        ${data.plant_name ? `<p style="color:#888;">Affects: ${escapeHtml(data.plant_name)}</p>` : ''}
        <div class="library-grid-2">
          <div class="info-block"><h5>🔍 Symptoms</h5><ul>${listHtml(data.symptoms)}</ul></div>
          <div class="info-block"><h5>📡 How It Spreads</h5><ul>${listHtml(data.spread)}</ul></div>
          <div class="info-block"><h5>💊 Treatment</h5><ul>${listHtml(data.treatment)}</ul></div>
          <div class="info-block"><h5>🛡️ Prevention</h5><ul>${listHtml(data.prevention)}</ul></div>
        </div>
      </div>`;
  } catch (e) {
    detailEl.innerHTML = `<div class="diagnosis-error">${escapeHtml(e.response?.data?.error || e.message)}</div>`;
  }
}

// ============== CULTIVATION TIPS ==============

async function renderTips() {
  app.innerHTML = `
  ${navbarHtml('#/tips')}
  ${mainHeader('🌾 Cultivation Tips &amp; Best Practices', 'AI-generated growing guides for any plant or crop')}
  <div class="page-container">
    ${backLink()}
    <div class="form-group">
      <label class="form-label">Select a Plant</label>
      <select id="plant-select" onchange="loadCultivationGuide()"><option value="">Loading plants...</option></select>
    </div>
    <div id="plant-detail"></div>
  </div>
  ${footerHtml()}
  `;

  try {
    const { data } = await axios.get('/api/library/plants');
    const sel = document.getElementById('plant-select');
    sel.innerHTML =
      `<option value="">-- Choose a plant --</option>` +
      data.plants.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
  } catch (e) {
    showToast('Failed to load plant list', true);
  }
}

async function loadCultivationGuide() {
  const plant = document.getElementById('plant-select').value;
  const detailEl = document.getElementById('plant-detail');
  if (!plant) {
    detailEl.innerHTML = '';
    return;
  }
  detailEl.innerHTML = `<div style="text-align:center;padding:30px;"><div class="spinner"></div><p style="color:#666;">🤖 AI is preparing the cultivation guide...</p></div>`;
  try {
    const { data } = await axios.get(`/api/library/cultivation?plant=${encodeURIComponent(plant)}`);
    if (data.error) {
      detailEl.innerHTML = `<div class="diagnosis-error">${escapeHtml(data.error)}</div>`;
      return;
    }
    detailEl.innerHTML = `
      <h2 style="color:#1e7145;margin-top:20px;">🌱 ${escapeHtml(plant)} Cultivation Guide</h2>
      <div class="library-grid-2">
        ${tipBlock('💧', 'Watering', data.watering)}
        ${tipBlock('☀️', 'Sunlight', data.sunlight)}
        ${tipBlock('🌡️', 'Temperature', data.temperature)}
        ${tipBlock('🌍', 'Soil', data.soil)}
        ${tipBlock('🧪', 'Fertilizer', data.fertilizer)}
        ${tipBlock('📏', 'Spacing', data.spacing)}
      </div>
      ${
        data.extra_tips && data.extra_tips.length
          ? `<div class="info-block" style="margin-top:20px;"><h5>✨ Extra Tips</h5><ul>${listHtml(data.extra_tips)}</ul></div>`
          : ''
      }
    `;
  } catch (e) {
    detailEl.innerHTML = `<div class="diagnosis-error">${escapeHtml(e.response?.data?.error || e.message)}</div>`;
  }
}

function tipBlock(icon, title, text) {
  return `<div class="info-block"><h5>${icon} ${title}</h5><p style="color:#555;font-size:13.5px;margin:0;">${escapeHtml(text || '—')}</p></div>`;
}

// ============== HISTORY ==============

async function renderHistory() {
  app.innerHTML = `
  ${navbarHtml('#/history')}
  ${mainHeader('📋 My Diagnosis History', 'Track your plant health scans over time')}
  <div class="page-container">
    ${backLink()}
    <div id="history-content"><div style="text-align:center;padding:30px;"><div class="spinner"></div></div></div>
  </div>
  ${footerHtml()}
  `;
  await loadHistory();
}

async function loadHistory() {
  const el = document.getElementById('history-content');
  try {
    const { data } = await axios.get('/api/diagnosis/history');
    const { records, stats } = data;

    if (records.length === 0) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-history"></i>No diagnosis history yet. Start by analyzing a plant leaf!</div>`;
      return;
    }

    el.innerHTML = `
      <div class="metric-row">
        <div class="metric-box"><div class="num">${stats.total}</div><div class="lbl">📈 Total Diagnoses</div></div>
        <div class="metric-box"><div class="num">${stats.avg_confidence}%</div><div class="lbl">📊 Avg Confidence</div></div>
        <div class="metric-box"><div class="num">${stats.today_count}</div><div class="lbl">📅 Today</div></div>
      </div>
      <div id="history-list">${records.map(historyItemHtml).join('')}</div>
    `;
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Failed to load history.</div>`;
  }
}

function historyItemHtml(r) {
  const label = r.is_healthy ? 'Healthy' : r.disease_name;
  return `
  <div class="history-item" id="hist-${r.id}">
    <div class="history-item-header" onclick="document.getElementById('hist-${r.id}').classList.toggle('expanded')">
      <div>
        <strong style="color:#1e7145;">${escapeHtml(r.plant_name)} — ${escapeHtml(label)}</strong>
        <div style="font-size:12px;color:#999;">${r.confidence}% confidence • ${timeAgo(r.created_at)}</div>
      </div>
      <i class="fas fa-chevron-down"></i>
    </div>
    <div class="history-item-body">
      <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${r.confidence}%"></div></div>
      <div class="library-grid-2" style="margin-top:12px;">
        <div class="info-block"><h5>🔍 Symptoms</h5><ul>${listHtml(r.symptoms)}</ul></div>
        <div class="info-block"><h5>💊 Treatment</h5><ul>${listHtml(r.treatment)}</ul></div>
      </div>
      <div style="text-align:right;margin-top:12px;">
        <button class="btn-danger" onclick="deleteHistoryRecord(${r.id}, event)"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  </div>`;
}

async function deleteHistoryRecord(id, evt) {
  evt.stopPropagation();
  if (!confirm('Delete this record?')) return;
  try {
    await axios.delete(`/api/diagnosis/history/${id}`);
    showToast('Record deleted');
    await loadHistory();
  } catch (e) {
    showToast('Failed to delete record', true);
  }
}

// ============== WEATHER ==============

async function renderWeather() {
  app.innerHTML = `
  ${navbarHtml('#/weather')}
  ${mainHeader('🌡️ 7-Day Weather Forecast', 'Real-time forecast data for your farming planning')}
  <div class="page-container">
    ${backLink()}
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:20px;">
      <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
        <label class="form-label">📍 City Name</label>
        <input type="text" id="city-input" placeholder="e.g., Lahore, Karachi"/>
      </div>
      <button class="btn-primary" onclick="fetchWeather()"><i class="fas fa-search"></i> Get Weather</button>
    </div>
    <div id="weather-content"></div>
  </div>
  ${footerHtml()}
  `;

  try {
    const { data } = await axios.get('/api/weather/detect');
    document.getElementById('city-input').value = data.city;
    await fetchWeather();
  } catch (e) {
    // silent - user can type a city manually
  }
}

async function fetchWeather() {
  const city = document.getElementById('city-input').value.trim();
  const contentEl = document.getElementById('weather-content');
  if (!city) return showToast('Please enter a city name', true);

  contentEl.innerHTML = `<div style="text-align:center;padding:30px;"><div class="spinner"></div></div>`;

  try {
    const { data } = await axios.get(`/api/weather/forecast?city=${encodeURIComponent(city)}`);
    if (data.error) {
      contentEl.innerHTML = `<div class="diagnosis-error">${escapeHtml(data.error)}</div>`;
      return;
    }

    contentEl.innerHTML = `
      <div class="weather-card">
        <h2 style="margin:0;">🌍 ${escapeHtml(data.city)}${data.country ? ', ' + escapeHtml(data.country) : ''}</h2>
        <p style="margin:5px 0;opacity:0.9;">Today — ${escapeHtml(data.current.condition)}</p>
      </div>
      <div class="weather-metrics">
        <div class="weather-metric"><div class="value">${data.current.temp}°C</div><div class="label">🌡️ Temperature</div></div>
        <div class="weather-metric"><div class="value">${data.current.humidity}</div><div class="label">💧 Humidity</div></div>
        <div class="weather-metric"><div class="value">${data.current.wind}</div><div class="label">💨 Wind</div></div>
        <div class="weather-metric"><div class="value">${data.current.precipitation}</div><div class="label">🌧️ Precipitation</div></div>
      </div>
      <h3 style="color:#1e7145;margin-top:24px;">📅 7-Day Forecast</h3>
      <div class="forecast-grid">
        ${data.daily
          .map(
            (d) => `
          <div class="forecast-day">
            <div class="d">${escapeHtml(d.date)}</div>
            <div class="t">${d.temp_max}°C</div>
            <div class="c">${d.temp_min}°C · ${escapeHtml(d.condition)}</div>
            <div class="c">${escapeHtml(d.wind)}</div>
          </div>`
          )
          .join('')}
      </div>
    `;
  } catch (e) {
    contentEl.innerHTML = `<div class="diagnosis-error">${escapeHtml(e.response?.data?.error || e.message)}</div>`;
  }
}

// Expose functions used inline in HTML (module scope isn't global by default with type="module")
Object.assign(window, {
  navigate, onFileSelected, analyzeLeaf, sendChatMessage, clearChat,
  createPost, toggleLike, toggleCommentBox, submitComment, deletePost,
  loadDiseaseInfo, loadCultivationGuide, deleteHistoryRecord, fetchWeather
});
