// CDP 验证：顶部工具栏 + 规则速查 + 法术范围格子图
const CDP_PORT = '9223';

async function getWs(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const t = (await res.json()).find(x => x.type === 'page');
  if (!t) throw new Error('NO_PAGE');
  return t.webSocketDebuggerUrl;
}

class CDP {
  constructor() { this.id = 0; this.pending = new Map(); }
  async connect(ws) {
    this.sock = new WebSocket(ws);
    await new Promise((r, j) => { this.sock.onopen = r; this.sock.onerror = j; });
    this.sock.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m.result); this.pending.delete(m.id); }
    };
  }
  send(method, params = {}) {
    return new Promise((res) => { const id = ++this.id; this.pending.set(id, res); this.sock.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('EVAL: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails).slice(0, 300));
    return r.result.value;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const c = new CDP();
  await c.connect(await getWs(CDP_PORT));
  const checks = [];
  const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 160) });

  await c.send('Page.enable');
  await c.send('Page.reload', { ignoreCache: true });
  await sleep(2500);
  await c.send('Page.navigate', { url: 'http://127.0.0.1:26581/index.html#/sheet' });
  await sleep(2500);

  // 1. 顶部导航按钮
  const nav = await c.eval(`JSON.stringify({
    export: [...document.querySelectorAll('button')].some(b => b.innerText.includes('导出')),
    archive: [...document.querySelectorAll('button')].some(b => b.innerText.trim() === '存档'),
    custom: [...document.querySelectorAll('button')].some(b => b.innerText.trim() === '自定义'),
    quickref: [...document.querySelectorAll('button')].some(b => b.innerText.includes('规则速查')),
    bottomToolbar: [...document.querySelectorAll('button')].filter(b => ['导出文件','存档管理','自定义项管理'].includes(b.innerText.trim())).length,
  })`).then(JSON.parse);
  check('顶栏有导出按钮', nav.export);
  check('顶栏有存档按钮', nav.archive);
  check('顶栏有自定义按钮', nav.custom);
  check('顶栏有规则速查', nav.quickref);
  check('底部旧工具栏已移除', nav.bottomToolbar === 0, 'remaining=' + nav.bottomToolbar);

  // 2. 打开规则速查
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('规则速查'))?.click(); 'ok'`);
  await sleep(700);
  const dlg = await c.eval(`JSON.stringify({
    tabs: [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => ['🔍 检索','⚔️ 战斗轮','💡 小知识','📐 换算'].includes(t)),
  })`).then(JSON.parse);
  check('四个页签齐全', dlg.tabs.length === 4, dlg.tabs.join(','));

  // 检索：火球术
  await c.eval(`(() => {
    const inp = [...document.querySelectorAll('input')].find(i => i.placeholder && i.placeholder.includes('关键词'));
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(inp, '火球术'); inp.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);
  await sleep(900);
  const search = await c.eval(`JSON.stringify({
    hasFireball: document.body.innerText.includes('火球术'),
  })`).then(JSON.parse);
  check('检索到火球术', search.hasFireball);

  // 展开火球术看范围格子图
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('火球术'))?.click(); 'ok'`);
  await sleep(600);
  const grid = await c.eval(`JSON.stringify({
    svgCount: document.querySelectorAll('svg').length,
    gridLabel: (document.body.innerText.split('\\n').find(l => l.includes('1格=')) || '').trim(),
  })`).then(JSON.parse);
  check('法术条目含范围格子图', grid.svgCount >= 1, grid.gridLabel);

  // 战斗轮页签
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('战斗轮'))?.click(); 'ok'`);
  await sleep(500);
  check('战斗轮讲解', await c.eval(`document.body.innerText.includes('先攻') && document.body.innerText.includes('附赠动作')`));

  // 小知识页签
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('小知识'))?.click(); 'ok'`);
  await sleep(500);
  check('小知识+换一条', await c.eval(`document.body.innerText.includes('换一条')`));

  // 换算页签
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('换算'))?.click(); 'ok'`);
  await sleep(500);
  const conv = await c.eval(`JSON.stringify({
    dist: document.body.innerText.includes('1 格'),
    coin: document.body.innerText.includes('铂金币'),
    load: document.body.innerText.includes('力量值 × 15'),
  })`).then(JSON.parse);
  check('距离换算', conv.dist);
  check('金钱换算', conv.coin);
  check('负重查询', conv.load);

  console.log(JSON.stringify({ checks }, null, 1));
  const failed = checks.filter(x => !x.ok);
  console.log(failed.length === 0 ? 'ALL_PASS' : 'FAIL: ' + failed.map(f => f.name).join(', '));
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
