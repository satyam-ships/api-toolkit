'use strict';
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

// Lint an OpenAPI 3.x document (already parsed JSON).
function validate(spec) {
  const issues = [];
  const add = (level, msg) => issues.push({ level, msg });
  if (!spec.openapi || !/^3\./.test(String(spec.openapi))) add('error', 'missing or unsupported "openapi" version (need 3.x)');
  if (!spec.info || !spec.info.title) add('error', 'info.title is required');
  if (!spec.info || !spec.info.version) add('error', 'info.version is required');
  if (!spec.paths || !Object.keys(spec.paths).length) add('error', 'no paths defined');
  const ids = new Set();
  for (const [p, item] of Object.entries(spec.paths || {})) {
    if (!p.startsWith('/')) add('error', `path "${p}" must start with "/"`);
    for (const m of METHODS.filter(m => item[m])) {
      const op = item[m]; const where = `${m.toUpperCase()} ${p}`;
      if (!op.responses || !Object.keys(op.responses).length) add('error', `${where}: no responses`);
      if (!op.summary && !op.description) add('warn', `${where}: missing summary`);
      if (op.operationId) { if (ids.has(op.operationId)) add('error', `${where}: duplicate operationId "${op.operationId}"`); ids.add(op.operationId); }
      else add('warn', `${where}: missing operationId`);
      if (['post', 'put', 'patch'].includes(m) && !op.requestBody) add('warn', `${where}: no requestBody`);
      const sec = op.security !== undefined ? op.security : spec.security;
      if (!sec || (Array.isArray(sec) && !sec.length)) add('warn', `${where}: no security requirement`);
      const declared = (op.parameters || []).map(x => x.name);
      for (const name of [...p.matchAll(/\{(\w+)\}/g)].map(x => x[1]))
        if (!declared.includes(name) && !(item.parameters || []).some(x => x.name === name)) add('error', `${where}: path parameter "${name}" not declared`);
    }
  }
  return issues;
}

// Check security headers of a live URL.
const HEADERS = [
  ['strict-transport-security', 'Add HSTS (Strict-Transport-Security)'],
  ['x-content-type-options', 'Add X-Content-Type-Options: nosniff'],
  ['content-security-policy', 'Add a Content-Security-Policy'],
  ['x-frame-options', 'Add X-Frame-Options or CSP frame-ancestors'],
];
async function security(url, fetchImpl = fetch) {
  const res = await fetchImpl(url);
  const issues = [];
  if (!url.startsWith('https://')) issues.push({ level: 'error', msg: 'not served over HTTPS' });
  for (const [h, fix] of HEADERS) if (!res.headers.get(h)) issues.push({ level: 'warn', msg: `missing ${h}: ${fix}` });
  if (res.headers.get('server') && /\d/.test(res.headers.get('server'))) issues.push({ level: 'warn', msg: `server header leaks version: ${res.headers.get('server')}` });
  if (res.headers.get('x-powered-by')) issues.push({ level: 'warn', msg: `x-powered-by exposes stack: ${res.headers.get('x-powered-by')}` });
  const acao = res.headers.get('access-control-allow-origin');
  if (acao === '*') issues.push({ level: 'warn', msg: 'CORS allows any origin (*)' });
  return { status: res.status, issues };
}

// Quick latency/health probe.
async function test(url, n = 5, fetchImpl = fetch) {
  const times = []; let failures = 0;
  for (let i = 0; i < n; i++) {
    const t = Date.now();
    try { const r = await fetchImpl(url); if (!r.ok) failures++; } catch { failures++; }
    times.push(Date.now() - t);
  }
  times.sort((a, b) => a - b);
  return { requests: n, failures, min: times[0], median: times[Math.floor(n / 2)], max: times[n - 1] };
}
module.exports = { validate, security, test };
