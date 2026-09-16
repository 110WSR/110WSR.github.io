// 把 dist-offline 产物打包成单个 HTML 文件（JS/CSS/知识库 JSON 全部内联）
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist-offline');
const outDir = path.join(root, '离线版');
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'DND角色卡_单文件离线版.html');

let html = readFileSync(path.join(dist, 'index.html'), 'utf8');

// 内联 CSS
const cssFiles = readdirSync(path.join(dist, 'assets')).filter(f => f.endsWith('.css'));
for (const f of cssFiles) {
  const css = readFileSync(path.join(dist, 'assets', f), 'utf8');
  html = html.replace(
    new RegExp(`<link[^>]*href=["'][^"']*${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`),
    () => `<style>\n${css}\n</style>`
  );
}

// 内联 JS（module）
const jsFiles = readdirSync(path.join(dist, 'assets')).filter(f => f.endsWith('.js'));
for (const f of jsFiles) {
  const js = readFileSync(path.join(dist, 'assets', f), 'utf8');
  html = html.replace(
    new RegExp(`<script[^>]*src=["'][^"']*${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*></script>`),
    () => `<script type="module">\n${js}\n</script>`
  );
}

// 知识库 JSON：内联 + fetch 拦截（file:// 下无法 fetch 本地文件）
const kb = readFileSync(path.join(dist, 'DND_2024_Knowledge_Base.json'), 'utf8');
const patch = `<script id="offline-kb" type="application/json">${kb.replace(/</g, '\\u003c')}</script>
<script>
(function () {
  var raw = document.getElementById('offline-kb').textContent;
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf('DND_2024_Knowledge_Base.json') !== -1) {
      return Promise.resolve(new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return origFetch ? origFetch(input, init) : Promise.reject(new Error('offline'));
  };
})();
</script>`;
html = html.replace(/<script[^>]*type="module">/, patch + '\n<script type="module">');

writeFileSync(outFile, html, 'utf8');
console.log('OK ->', outFile, (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + 'MB');
console.log('残留引用检查:', /src="\.\/assets|href="\.\/assets/.test(html) ? 'FAIL 仍有外部引用' : 'PASS 全部内联');
