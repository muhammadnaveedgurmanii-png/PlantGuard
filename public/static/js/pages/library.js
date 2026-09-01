// Disease Library + Cultivation Tips — combined into one page with tabs,
// search, and clear source labeling (verified knowledge base vs AI-generated).
import { navbarHtml, footerHtml, backLink, mainHeader, setupNavbarToggle } from '../components/layout.js';
import { api } from '../api.js';
import { escapeHtml, listHtml, qs, debounce } from '../utils.js';
import { errorStateHtml, rateLimitHtml } from '../components/diagnosisView.js';

let activeTab = 'disease';

export async function renderLibrary(app, initialTab) {
  activeTab = initialTab === 'cultivation' ? 'cultivation' : 'disease';

  app.innerHTML = `
  <div class="page-shell">
    ${navbarHtml('#/library')}
    ${mainHeader('Disease &amp; Cultivation Library', 'Verified reference entries and AI-generated guidance')}
    <main class="page-main">
      <div class="page-container">
        ${backLink()}
        <div class="row gap-2" role="tablist" aria-label="Library sections">
          <button class="btn ${activeTab === 'disease' ? 'btn-primary' : 'btn-ghost'}" id="tab-disease" role="tab" aria-selected="${activeTab === 'disease'}">Disease Library</button>
          <button class="btn ${activeTab === 'cultivation' ? 'btn-primary' : 'btn-ghost'}" id="tab-cultivation" role="tab" aria-selected="${activeTab === 'cultivation'}">Cultivation Tips</button>
        </div>
        <div id="library-panel" class="mt-4"></div>
      </div>
    </main>
    ${footerHtml()}
  </div>`;

  setupNavbarToggle();
  qs('tab-disease').addEventListener('click', () => switchTab('disease'));
  qs('tab-cultivation').addEventListener('click', () => switchTab('cultivation'));

  await renderActivePanel();
}

function switchTab(tab) {
  activeTab = tab;
  qs('tab-disease').className = `btn ${tab === 'disease' ? 'btn-primary' : 'btn-ghost'}`;
  qs('tab-disease').setAttribute('aria-selected', String(tab === 'disease'));
  qs('tab-cultivation').className = `btn ${tab === 'cultivation' ? 'btn-primary' : 'btn-ghost'}`;
  qs('tab-cultivation').setAttribute('aria-selected', String(tab === 'cultivation'));
  renderActivePanel();
}

async function renderActivePanel() {
  const panel = qs('library-panel');
  if (activeTab === 'disease') {
    panel.innerHTML = `
      <div class="library-search-row">
        <div class="form-group">
          <label class="form-label" for="disease-select">Select a Disease</label>
          <select id="disease-select"><option value="">Loading diseases...</option></select>
        </div>
      </div>
      <div id="disease-detail"></div>`;
    const res = await api.getDiseases();
    const sel = qs('disease-select');
    if (res.ok) {
      sel.innerHTML =
        `<option value="">-- Choose a disease --</option>` +
        res.data.diseases.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
      sel.addEventListener('change', loadDiseaseInfo);
    } else {
      sel.innerHTML = `<option value="">Failed to load</option>`;
    }
  } else {
    panel.innerHTML = `
      <div class="library-search-row">
        <div class="form-group">
          <label class="form-label" for="plant-select">Select a Plant</label>
          <select id="plant-select"><option value="">Loading plants...</option></select>
        </div>
      </div>
      <div id="plant-detail"></div>`;
    const res = await api.getPlants();
    const sel = qs('plant-select');
    if (res.ok) {
      sel.innerHTML =
        `<option value="">-- Choose a plant --</option>` +
        res.data.plants.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
      sel.addEventListener('change', loadCultivationGuide);
    } else {
      sel.innerHTML = `<option value="">Failed to load</option>`;
    }
  }
}

function sourceBadge(source, label) {
  if (source === 'verified_knowledge_base') {
    return `<span class="badge badge-source-verified"><i class="fas fa-shield-check" aria-hidden="true"></i> Verified PlantGuard Knowledge</span>`;
  }
  return `<span class="badge badge-source-ai"><i class="fas fa-robot" aria-hidden="true"></i> General AI Knowledge</span>`;
}

async function loadDiseaseInfo() {
  const name = qs('disease-select').value;
  const detailEl = qs('disease-detail');
  if (!name) {
    detailEl.innerHTML = '';
    return;
  }
  detailEl.innerHTML = `<div class="text-center" style="padding:var(--space-6) 0;"><div class="spinner"></div></div>`;
  const res = await api.getDiseaseInfo(name);
  if (!res.ok) {
    if (res.status === 429) {
      detailEl.innerHTML = rateLimitHtml(res.data);
    } else {
      detailEl.innerHTML = errorStateHtml(res.data.error, 'retryLoadDiseaseInfo');
    }
    return;
  }
  const data = res.data;
  detailEl.innerHTML = `
    <div class="library-detail">
      <div class="row justify-between wrap">
        <h3>${escapeHtml(name)}</h3>
        ${sourceBadge(data.source)}
      </div>
      ${data.plant_name ? `<p class="text-muted">Affects: ${escapeHtml(data.plant_name)}</p>` : ''}
      <div class="grid-2">
        <div class="info-block"><h5><i class="fas fa-magnifying-glass" aria-hidden="true"></i> Symptoms</h5><ul>${listHtml(data.symptoms)}</ul></div>
        <div class="info-block"><h5><i class="fas fa-satellite-dish" aria-hidden="true"></i> How It Spreads</h5><ul>${listHtml(data.spread)}</ul></div>
        <div class="info-block"><h5><i class="fas fa-pump-medical" aria-hidden="true"></i> Treatment</h5><ul>${listHtml(data.treatment)}</ul></div>
        <div class="info-block"><h5><i class="fas fa-shield-halved" aria-hidden="true"></i> Prevention</h5><ul>${listHtml(data.prevention)}</ul></div>
      </div>
    </div>`;
}

async function loadCultivationGuide() {
  const plant = qs('plant-select').value;
  const detailEl = qs('plant-detail');
  if (!plant) {
    detailEl.innerHTML = '';
    return;
  }
  detailEl.innerHTML = `<div class="text-center" style="padding:var(--space-6) 0;"><div class="spinner"></div></div>`;
  const res = await api.getCultivationGuide(plant);
  if (!res.ok) {
    if (res.status === 429) {
      detailEl.innerHTML = rateLimitHtml(res.data);
    } else {
      detailEl.innerHTML = errorStateHtml(res.data.error, 'retryLoadCultivationGuide');
    }
    return;
  }
  const data = res.data;
  detailEl.innerHTML = `
    <div class="row justify-between wrap mt-4">
      <h2 class="mb-0">${escapeHtml(plant)} Cultivation Guide</h2>
      ${sourceBadge(data.source)}
    </div>
    <div class="grid-2 mt-4">
      ${tipBlock('fa-droplet', 'Watering', data.watering)}
      ${tipBlock('fa-sun', 'Sunlight', data.sunlight)}
      ${tipBlock('fa-temperature-half', 'Temperature', data.temperature)}
      ${tipBlock('fa-mound', 'Soil', data.soil)}
      ${tipBlock('fa-flask', 'Fertilizer', data.fertilizer)}
      ${tipBlock('fa-ruler', 'Spacing', data.spacing)}
    </div>
    ${
      data.extra_tips && data.extra_tips.length
        ? `<div class="info-block mt-4"><h5><i class="fas fa-star" aria-hidden="true"></i> Extra Tips</h5><ul>${listHtml(data.extra_tips)}</ul></div>`
        : ''
    }`;
}

function tipBlock(icon, title, text) {
  return `<div class="info-block"><h5><i class="fas ${icon}" aria-hidden="true"></i> ${title}</h5><p class="mb-0" style="font-size:var(--font-size-sm);">${escapeHtml(text || 'Not specified')}</p></div>`;
}

function retryLoadDiseaseInfo() { loadDiseaseInfo(); }
function retryLoadCultivationGuide() { loadCultivationGuide(); }

Object.assign(window, { retryLoadDiseaseInfo, retryLoadCultivationGuide });
