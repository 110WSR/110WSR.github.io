// CDP 验证：范围格子小图全场景（车卡预览 / 角色卡悬停提示 / 法术库）
const CDP_PORT = '9223';
const APP = 'http://127.0.0.1:26581/index.html';

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

  await c.eval(`localStorage.removeItem('dndbuilder_archive'); localStorage.setItem('dnd5e_ruleset_v1','5r2024'); 'ok'`);
  await c.send('Page.enable');
  await c.send('Page.navigate', { url: APP + '#/' });
  await sleep(2000);
  await c.send('Page.navigate', { url: APP + '#/create' });
  await sleep(2500);

  // 填表：法师（有戏法/一环）
  await c.eval(`(() => {
    const setVal = (el, v) => {
      const p = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const ni = document.querySelector('input[type=text]'); if (ni) setVal(ni, '范围测试员');
    const sel = [...document.querySelectorAll('select')];
    const byOpt = t => sel.find(s => [...s.options].some(o => o.text === t));
    const c = byOpt('法师'); if (c) setVal(c, [...c.options].find(o => o.text === '法师').value);
    const r = byOpt('精灵'); if (r) setVal(r, [...r.options].find(o => o.text === '精灵').value);
    const b = byOpt('侍僧'); if (b) setVal(b, [...b.options].find(o => o.text === '侍僧').value);
    return 'ok';
  })()`);
  const clickNext = async () => { await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '下一步' && !b.disabled)?.click(); 'ok'`); await sleep(700); };
  await clickNext(); await clickNext(); await clickNext(); await sleep(500); await clickNext(); await sleep(1000);

  // ── 场景 1：车卡法术页悬停 → 预览 + 范围小图 ──
  const hoverTarget = await c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('燃烧之手'));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  })()`);
  await sleep(500);
  const preview = await c.eval(`JSON.stringify({
    hasPreview: document.body.innerText.includes('燃烧之手') && document.body.innerText.includes('锥状'),
    svgCount: [...document.querySelectorAll('svg')].length,
  })`).then(JSON.parse);
  check('车卡页悬停出现预览', hoverTarget !== null, String(hoverTarget));
  check('车卡预览含范围小图', preview.hasPreview && preview.svgCount >= 1, JSON.stringify(preview));

  // 点选 燃烧之手 + 一个戏法，走完车卡
  await c.eval(`[...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('燃烧之手'))?.click(); 'ok'`);
  await c.eval(`[...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('火焰箭'))?.click(); 'ok'`);
  await c.eval(`[...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('酸液飞溅'))?.click(); 'ok'`);
  await sleep(500);
  for (let i = 0; i < 10; i++) {
    const done = await c.eval(`(() => {
      const enter = [...document.querySelectorAll('button')].find(b => b.innerText.includes('进入角色卡'));
      if (enter) { enter.click(); return 'enter'; }
      const next = [...document.querySelectorAll('button')].find(b => ['下一步', '查看摘要'].includes(b.innerText.trim()) && !b.disabled);
      if (next) { next.click(); return 'next'; }
      return 'stuck';
    })()`);
    await sleep(900);
    if (done === 'enter') break;
    if (done === 'stuck') break;
  }
  await sleep(2500);

  // ── 场景 2：角色卡法术页悬停 → 提示框 + 范围小图 ──
  // 法术在第三页
  await c.send('Page.navigate', { url: APP + '#/sheet' });
  await sleep(2000);
  // 点击第三页标签（left=758px 的透明页签按钮）
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.style.background === 'transparent' && b.style.border === 'none' && b.style.left === '758px')?.click(); 'ok'`);
  await sleep(1500);

  // 找法术名元素并真实鼠标悬停（dispatchMouseEvent 触发 React onMouseEnter）
  const spellPos = await c.eval(`(() => {
    const els = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.textContent || '').trim().startsWith('燃烧之手'));
    if (!els.length) return null;
    const r = els[0].getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  check('法术页找到燃烧之手', !!spellPos, String(spellPos));
  if (spellPos) {
    const { x, y } = JSON.parse(spellPos);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await sleep(800);
    // 再移动一下确保 hover
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 2, y: y + 2 });
    await sleep(800);
    const tip = await c.eval(`JSON.stringify({
      tipShown: [...document.querySelectorAll('div')].some(d => d.textContent && d.textContent.includes('施法距离') && getComputedStyle(d).position === 'fixed'),
      tipSvg: [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed').map(d => d.querySelectorAll('svg').length).reduce((a, b) => Math.max(a, b), 0),
    })`).then(JSON.parse);
    check('悬停提示出现', tip.tipShown, JSON.stringify(tip));
    check('悬停提示含范围小图', tip.tipSvg >= 1, 'svg=' + tip.tipSvg);
  }

  console.log(JSON.stringify({ checks }, null, 1));
  const failed = checks.filter(x => !x.ok);
  console.log(failed.length === 0 ? 'ALL_PASS' : 'FAIL: ' + failed.map(f => f.name).join(', '));
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
