// History page — search/filter/pagination over past diagnoses, with
// expandable detail and links to full report + "Ask AI".
import { navbarHtml, footerHtml, backLink, mainHeader, setupNavbarToggle } from '../components/layout.js';
import { api } from '../api.js';
import { escapeHtml, timeAgo, showToast, qs, debounce } from '../utils.js';
import { state } from '../state.js';

let currentPage = 1;
const PAGE_SIZE = 10;
let filters = { q: '', plant: '', disease: '', date: '' };

export async function renderHistory(app) {
  currentPage = 1;
  filters = { q: '', plant: '', disease: '', date: '' };

  app.innerHTML = `
  <div class="page-shell">
    ${navbarHtml('#/history')}
    ${mainHeader('My Diagnosis History', 'Track your plant health scans over time')}
    <main class="page-main">
      <div class="page-container">
        ${backLink()}
        <div id="history-stats"></div>
        <div class="history-toolbar">
          <div class="form-group">
            <label class="form-label" for="hist-search">Search</label>
            <input type="search" id="hist-search" placeholder="Plant or disease name..."/>
          </div>
          <div class="form-group">
            <label class="form-label" for="hist-date">Date</label>
            <input type="date" id="hist-date"/>
          </div>
          <button class="btn btn-ghost" id="hist-clear-filters">Clear</button>
        </div>
        <div id="history-list"><div class="skeleton" style="height:100px;"></div></div>
        <div class="pagination" id="history-pagination"></div>
      </div>
    </main>
    ${footerHtml()}
  </div>`;

  setupNavbarToggle();

  const debouncedSearch = debounce(() => {
    filters.q = qs('hist-search').value.trim();
    currentPage = 1;
    loadHistory();
  }, 350);
  qs('hist-search').addEventListener('input', debouncedSearch);
  qs('hist-date').addEventListener('change', () => {
    filters.date = qs('hist-date').value;
    currentPage = 1;
    loadHistory();
  });
  qs('hist-clear-filters').addEventListener('click', () => {
    filters = { q: '', plant: '', disease: '', date: '' };
    qs('hist-search').value = '';
    qs('hist-date').value = '';
    currentPage = 1;
    loadHistory();
  });

  await loadHistory();
}

async function loadHistory() {
  const el = qs('history-list');
  const statsEl = qs('history-stats');
  const params = { page: currentPage, page_size: PAGE_SIZE };
  if (filters.q) params.q = filters.q;
  if (filters.date) params.date = filters.date;

  const res = await api.getHistory(params);
  if (!res.ok) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i>Failed to load history. <button class="btn btn-sm btn-secondary" onclick="reloadHistory()">Retry</button></div>`;
    return;
  }
  const { records, stats, page, total_pages } = res.data;

  statsEl.innerHTML = `
    <div class="metric-row">
      <div class="metric-box"><div class="num">${stats.total}</div><div class="lbl">Total Diagnoses</div></div>
      <div class="metric-box"><div class="num">${stats.avg_confidence}%</div><div class="lbl">Avg Confidence</div></div>
      <div class="metric-box"><div class="num">${stats.today_count}</div><div class="lbl">Today</div></div>
    </div>`;

  if (records.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-clock-rotate-left" aria-hidden="true"></i>No matching diagnosis history. Try adjusting your filters or start a new diagnosis.</div>`;
    qs('history-pagination').innerHTML = '';
    return;
  }

  el.innerHTML = `<div id="history-items">${records.map(historyItemHtml).join('')}</div>`;
  renderPagination(page, total_pages);
}

function renderPagination(page, totalPages) {
  const el = qs('history-pagination');
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <button class="btn btn-sm btn-ghost" ${page <= 1 ? 'disabled' : ''} onclick="goToHistoryPage(${page - 1})"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
    <span class="page-info">Page ${page} of ${totalPages}</span>
    <button class="btn btn-sm btn-ghost" ${page >= totalPages ? 'disabled' : ''} onclick="goToHistoryPage(${page + 1})"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>`;
}

function goToHistoryPage(page) {
  currentPage = page;
  loadHistory();
}

function historyItemHtml(r) {
  const label = r.is_healthy ? 'Healthy' : r.disease_name;
  return `
  <div class="history-item" id="hist-${r.id}">
    <div class="history-item-header" role="button" tabindex="0" onclick="toggleHistoryItem(${r.id})" onkeydown="if(event.key==='Enter')toggleHistoryItem(${r.id})">
      <div class="row gap-3">
        ${r.image_key ? `<img class="history-item-thumb" src="/api/diagnosis/image/${r.image_key}" alt="Leaf photo for ${escapeHtml(r.plant_name)}"/>` : ''}
        <div>
          <strong style="color:var(--color-brand-700);">${escapeHtml(r.plant_name)} &mdash; ${escapeHtml(label)}</strong>
          <div class="text-muted" style="font-size:var(--font-size-xs);">${Math.round(r.confidence)}% confidence &middot; ${timeAgo(r.created_at)}</div>
        </div>
      </div>
      <i class="fas fa-chevron-down" aria-hidden="true"></i>
    </div>
    <div class="history-item-body">
      <div class="progress-outer"><div class="progress-inner confidence-${(r.confidence_level || 'medium')}" style="width:${Math.max(2, r.confidence)}%"></div></div>
      <div class="grid-2 mt-3">
        <div class="info-block"><h5><i class="fas fa-magnifying-glass" aria-hidden="true"></i> Symptoms</h5><ul>${(r.symptoms || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>Not specified</li>'}</ul></div>
        <div class="info-block"><h5><i class="fas fa-pump-medical" aria-hidden="true"></i> Treatment</h5><ul>${(r.treatment || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>Not specified</li>'}</ul></div>
      </div>
      <div class="row justify-between wrap mt-3">
        <button class="btn btn-sm btn-ghost" onclick="askAiAboutHistoryItem(${r.id})"><i class="fas fa-comment-dots" aria-hidden="true"></i> Ask AI</button>
        <div class="row gap-2">
          <button class="btn btn-sm btn-secondary" onclick="navigate('#/report/${r.id}')"><i class="fas fa-file-lines" aria-hidden="true"></i> View Report</button>
          <button class="btn btn-sm btn-danger" onclick="deleteHistoryRecord(${r.id}, event)"><i class="fas fa-trash" aria-hidden="true"></i> Delete</button>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleHistoryItem(id) {
  qs(`hist-${id}`).classList.toggle('expanded');
}

async function deleteHistoryRecord(id, evt) {
  evt.stopPropagation();
  if (!confirm('Delete this record?')) return;
  const res = await api.deleteHistoryItem(id);
  if (!res.ok) return showToast('Failed to delete record', true);
  showToast('Record deleted');
  await loadHistory();
}

function askAiAboutHistoryItem(id) {
  state.setPendingChatDiagnosis(id);
  navigate('#/chatbot');
}

function reloadHistory() {
  loadHistory();
}

Object.assign(window, { goToHistoryPage, toggleHistoryItem, deleteHistoryRecord, askAiAboutHistoryItem, reloadHistory });
