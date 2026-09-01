// Shared layout pieces: navbar, footer, page header, back-link.

const NAV_LINKS = [
  ['#/home', 'Dashboard', 'fa-gauge-high'],
  ['#/diagnosis', 'Diagnosis', 'fa-magnifying-glass'],
  ['#/chatbot', 'AI Assistant', 'fa-comment-dots'],
  ['#/weather', 'Weather', 'fa-cloud-sun'],
  ['#/library', 'Library', 'fa-book'],
  ['#/community', 'Community', 'fa-users'],
  ['#/history', 'History', 'fa-clock-rotate-left']
];

export function navbarHtml(activePage) {
  return `
  <nav class="navbar" aria-label="Primary navigation">
    <button class="navbar-brand" onclick="navigate('#/home')" aria-label="PlantGuard home">
      <i class="fas fa-leaf" aria-hidden="true"></i> PlantGuard
    </button>
    <ul class="navbar-nav" id="navbar-nav">
      ${NAV_LINKS
        .map(
          ([href, label, icon]) =>
            `<li><button class="nav-link ${href === activePage ? 'active' : ''}" ${href === activePage ? 'aria-current="page"' : ''} onclick="navigate('${href}')"><i class="fas ${icon}" aria-hidden="true"></i> ${label}</button></li>`
        )
        .join('')}
    </ul>
    <button class="navbar-toggle" id="navbar-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navbar-nav">
      <i class="fas fa-bars" aria-hidden="true"></i>
    </button>
  </nav>`;
}

export function footerHtml() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand"><i class="fas fa-leaf" aria-hidden="true"></i> PlantGuard</div>
      <div class="footer-links">
        <button onclick="navigate('#/home')">Dashboard</button>
        <button onclick="navigate('#/diagnosis')">Diagnosis</button>
        <button onclick="navigate('#/community')">Community</button>
        <button onclick="navigate('#/chatbot')">AI Assistant</button>
      </div>
      <div class="footer-credit">AI plant diagnosis assistant &mdash; not a substitute for professional agronomic advice. Built with Hono + Cloudflare.</div>
    </div>
  </footer>`;
}

export function backLink(label) {
  return `<button class="page-back" onclick="navigate('#/home')"><i class="fas fa-arrow-left" aria-hidden="true"></i> ${label || 'Back to Dashboard'}</button>`;
}

export function mainHeader(title, subtitle) {
  return `
  <header class="main-header">
    <h1 class="main-header-title">${title}</h1>
    <p class="main-header-subtitle">${subtitle}</p>
  </header>`;
}

export function setupNavbarToggle() {
  const toggle = document.getElementById('navbar-toggle');
  const nav = document.getElementById('navbar-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}
