// PlantGuard hash-router. Maps a URL hash to a page render function.
// Supports simple parameterized routes like #/report/123.

const routeTable = [];

export function registerRoute(pattern, handler) {
  // pattern like '#/report/:id' -> regex with named group
  const paramNames = [];
  const regexStr = pattern.replace(/:[^/]+/g, (m) => {
    paramNames.push(m.slice(1));
    return '([^/]+)';
  });
  const regex = new RegExp('^' + regexStr + '$');
  routeTable.push({ regex, paramNames, handler });
}

export function navigate(hash) {
  window.location.hash = hash;
}

function currentHash() {
  return window.location.hash || '';
}

export async function runRouter(appEl, fallbackHandler) {
  const fullHash = currentHash();
  const qIndex = fullHash.indexOf('?');
  const pathOnly = qIndex === -1 ? fullHash : fullHash.slice(0, qIndex);
  window.scrollTo(0, 0);

  for (const route of routeTable) {
    const match = pathOnly.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = match[i + 1]));
      await route.handler(params);
      return;
    }
  }
  await fallbackHandler();
}

export function startRouter(appEl, fallbackHandler) {
  window.addEventListener('hashchange', () => runRouter(appEl, fallbackHandler));
  window.addEventListener('DOMContentLoaded', () => runRouter(appEl, fallbackHandler));
}
