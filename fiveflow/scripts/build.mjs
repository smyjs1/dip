import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

// A self-contained Worker serves the existing HTML app and its same-origin API.
const files = {
  '/': ['dist/index.html', 'text/html; charset=utf-8'],
  '/index.html': ['dist/index.html', 'text/html; charset=utf-8'],
  '/app.js': ['dist/app.js', 'text/javascript; charset=utf-8'],
  '/calendar.js': ['dist/calendar.js', 'text/javascript; charset=utf-8'],
  '/scene.js': ['dist/scene.js', 'text/javascript; charset=utf-8'],
  '/voice.js': ['dist/voice.js', 'text/javascript; charset=utf-8'],
  '/loading.js': ['dist/loading.js', 'text/javascript; charset=utf-8'],
  '/loading.css': ['dist/loading.css', 'text/css; charset=utf-8'],
  '/style.css': ['dist/style.css', 'text/css; charset=utf-8'],
};
const assets = Object.fromEntries(Object.entries(files).map(([path, [file, type]]) => [path, { content: readFileSync(file, 'utf8'), type }]));
const worker = readFileSync('worker/recommend.js', 'utf8') + '\n' + readFileSync('worker/translate.js', 'utf8');
const router = `
const ASSETS = ${JSON.stringify(assets)};
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/recommend') return handleRecommend(request, env);
    if (path === '/api/translate') return handleTranslate(request, env);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405});
    const asset = ASSETS[path];
    if (!asset) return new Response('Not found', {status: 404});
    return new Response(request.method === 'HEAD' ? null : asset.content, { headers: {'content-type':asset.type, 'x-content-type-options':'nosniff'} });
  }
};
`;
mkdirSync('dist/server', {recursive:true});
writeFileSync('dist/server/index.js', worker + router);
