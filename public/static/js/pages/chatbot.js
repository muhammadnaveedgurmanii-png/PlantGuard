// AI Assistant chat page — conversation UI, tool-activity indicator,
// diagnosis context banner, suggested questions, feedback buttons.
import { navbarHtml, footerHtml, backLink, mainHeader, setupNavbarToggle } from '../components/layout.js';
import { api } from '../api.js';
import { escapeHtml, showToast, qs, renderMarkdownSafe } from '../utils.js';
import { state } from '../state.js';

let pendingDiagnosisId = null;
let pendingDiagnosisLabel = null;

const SUGGESTED_QUESTIONS = [
  'What causes early blight and how do I treat it?',
  'Should I water my tomatoes today given the weather?',
  'How can I prevent powdery mildew?'
];

export async function renderChatbot(app) {
  pendingDiagnosisId = state.takePendingChatDiagnosis();

  app.innerHTML = `
  <div class="page-shell">
    ${navbarHtml('#/chatbot')}
    ${mainHeader('AI Plant Care Assistant', 'Ask about plant diseases, care, weather-related risk, or your diagnosis history')}
    <main class="page-main">
      <div class="page-container">
        ${backLink()}
        <div id="chat-context-area"></div>
        <div class="chat-window">
          <div class="chat-messages" id="chat-messages" aria-live="polite"><div class="chat-empty">Loading conversation...</div></div>
          <div class="chat-input-row">
            <label for="chat-input" class="sr-only">Type your message</label>
            <input type="text" id="chat-input" placeholder="Ask about plant diseases, care tips, pests..." />
            <button class="btn btn-primary btn-icon" id="chat-send-btn" aria-label="Send message"><i class="fas fa-paper-plane" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="suggested-questions" id="suggested-questions"></div>
        <div class="row justify-end mt-4">
          <button class="btn btn-sm btn-danger" id="clear-chat-btn"><i class="fas fa-trash" aria-hidden="true"></i> Clear Conversation</button>
        </div>
      </div>
    </main>
    ${footerHtml()}
  </div>`;

  setupNavbarToggle();

  qs('chat-send-btn').addEventListener('click', sendChatMessage);
  qs('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });
  qs('clear-chat-btn').addEventListener('click', clearChat);

  renderSuggestedQuestions();
  renderContextBanner();
  await loadChatHistory();
}

function renderSuggestedQuestions() {
  const el = qs('suggested-questions');
  el.innerHTML = SUGGESTED_QUESTIONS.map(
    (q) => `<button class="suggested-question-chip" onclick="askSuggested(${JSON.stringify(q).replace(/"/g, '&quot;')})">${escapeHtml(q)}</button>`
  ).join('');
}

function renderContextBanner() {
  const el = qs('chat-context-area');
  if (!pendingDiagnosisId) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
  <div class="chat-context-banner mb-4">
    <span><i class="fas fa-link" aria-hidden="true"></i> This conversation is aware of your recent diagnosis (#${pendingDiagnosisId}).</span>
    <button class="btn btn-sm btn-ghost" onclick="clearDiagnosisContext()">Remove</button>
  </div>`;
}

function clearDiagnosisContext() {
  pendingDiagnosisId = null;
  renderContextBanner();
}

async function loadChatHistory() {
  const box = qs('chat-messages');
  const res = await api.getChatHistory();
  if (!res.ok) {
    box.innerHTML = `<div class="chat-empty">Failed to load conversation. <button class="btn btn-sm btn-secondary" onclick="reloadChatHistory()">Retry</button></div>`;
    return;
  }
  const messages = res.data.messages || [];
  if (messages.length === 0) {
    box.innerHTML = `<div class="chat-empty">Hi! Ask me anything about plant diseases, care, or farming.</div>`;
    return;
  }
  box.innerHTML = messages.map((m) => chatBubbleHtml(m)).join('');
  box.scrollTop = box.scrollHeight;
}

function chatBubbleHtml(m, toolsUsed) {
  const content = m.role === 'assistant' ? renderMarkdownSafe(m.content) : `<p>${escapeHtml(m.content)}</p>`;
  const toolIndicator =
    toolsUsed && toolsUsed.length
      ? `<div class="chat-tool-indicator"><i class="fas fa-wrench" aria-hidden="true"></i> Used: ${toolsUsed.filter((t) => !t.endsWith(':error')).join(', ') || 'none'}</div>`
      : '';
  const feedback =
    m.role === 'assistant' && m.id
      ? `<div class="feedback-row mt-1">
          <button class="feedback-btn" id="cfb-up-${m.id}" onclick="sendChatFeedback(${m.id}, 'helpful')" aria-label="Mark helpful"><i class="fas fa-thumbs-up" aria-hidden="true"></i></button>
          <button class="feedback-btn" id="cfb-down-${m.id}" onclick="sendChatFeedback(${m.id}, 'not_helpful')" aria-label="Mark not helpful"><i class="fas fa-thumbs-down" aria-hidden="true"></i></button>
        </div>`
      : '';
  return `<div class="chat-bubble ${m.role}">${content}${toolIndicator}${feedback}</div>`;
}

async function sendChatMessage() {
  const input = qs('chat-input');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';

  const box = qs('chat-messages');
  if (box.querySelector('.chat-empty')) box.innerHTML = '';
  box.innerHTML += chatBubbleHtml({ role: 'user', content: message });
  box.innerHTML += `<div class="chat-bubble assistant" id="typing-indicator"><i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> thinking...</div>`;
  box.scrollTop = box.scrollHeight;

  const res = await api.sendChatMessage(message, pendingDiagnosisId);
  document.getElementById('typing-indicator')?.remove();

  if (!res.ok) {
    if (res.status === 429) {
      box.innerHTML += `<div class="chat-bubble assistant"><i class="fas fa-hourglass-half" aria-hidden="true"></i> ${escapeHtml(res.data.error)}</div>`;
    } else {
      box.innerHTML += `<div class="chat-bubble assistant"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ${escapeHtml(res.data.error || 'Something went wrong.')} <button class="btn btn-sm btn-secondary" onclick="retryLastChat(${JSON.stringify(message).replace(/"/g, '&quot;')})">Retry</button></div>`;
    }
    box.scrollTop = box.scrollHeight;
    return;
  }

  // Context is only relevant for the first follow-up message; clear after use.
  pendingDiagnosisId = null;
  renderContextBanner();

  box.innerHTML += chatBubbleHtml({ role: 'assistant', content: res.data.reply, id: res.data.message_id }, res.data.tools_used);
  box.scrollTop = box.scrollHeight;
}

async function retryLastChat(message) {
  qs('chat-input').value = message;
  await sendChatMessage();
}

async function askSuggested(question) {
  qs('chat-input').value = question;
  await sendChatMessage();
}

async function clearChat() {
  if (!confirm('Clear this entire conversation?')) return;
  const res = await api.clearChatHistory();
  if (!res.ok) return showToast('Failed to clear conversation', true);
  await loadChatHistory();
  showToast('Conversation cleared');
}

async function sendChatFeedback(id, feedback) {
  const res = await api.sendChatFeedback(id, feedback);
  if (!res.ok) return showToast('Could not save feedback', true);
  const upBtn = qs(`cfb-up-${id}`);
  const downBtn = qs(`cfb-down-${id}`);
  if (upBtn) upBtn.classList.toggle('selected-up', feedback === 'helpful');
  if (downBtn) downBtn.classList.toggle('selected-down', feedback === 'not_helpful');
  showToast('Thanks for the feedback!');
}

async function reloadChatHistory() {
  await loadChatHistory();
}

Object.assign(window, { askSuggested, retryLastChat, clearDiagnosisContext, sendChatFeedback, reloadChatHistory });
