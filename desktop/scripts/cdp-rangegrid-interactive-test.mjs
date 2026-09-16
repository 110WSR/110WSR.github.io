// CDP 验证：交互式范围格子图（点击放置/瞄准 + 覆盖格子高亮 + 重置）
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

/** 在页面上找到范围小图 svg（依据其底部标签文案），滚入视野后返回最新位置 */
const FIND_SVG = `(() => {
  const label = [...document.querySelectorAll('span')].find(s => s.textContent && s.textContent.includes('点击放置') && s.textContent.includes('1格='));
  if (!label) return null;
  const wrap = label.parentElement;
  const svg = wrap.querySelector('svg');
  if (!svg) return null;
  svg.scrollIntoView({ block: 'center' });
  const r = svg.getBoundingClientRect();
  return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height });
})()`;

/** 统计覆盖格子高亮块数量 */
const COUNT_COVERED = `[...document.querySelectorAll('svg rect')].filter(r => r.getAttribute('fill') === 'rgba(217,119,6,0.45)').length`;

/** 当前底部标签文案（点击前含"点击放置"，点击后含"距施法者"） */
const LABEL_TEXT = `(() => {
  const s = [...document.querySelectorAll('span')].find(x => x.textContent && (x.textContent.includes('点击放置') || x.textContent.includes('距施法者')));
  return s ? s.textContent : null;
})()`;

async function main() {
  const c = new CDP();
  await c.connect(await getWs(CDP_PORT));
  const checks = [];
  const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 200) });

  await c.eval(`localStorage.removeItem('dndbuilder_archive'); 'ok'`);
  await c.send('Page.enable');
  await c.send('Page.navigate', { url: APP + '#/' });
  await sleep(1800);
  await c.send('Page.navigate', { url: APP + '#/create' });
  await sleep(2500);

  // 填表：法师
  await c.eval(`(() => {
    const setVal = (el, v) => {
      const p = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const ni = document.querySelector('input[type=text]'); if (ni) setVal(ni, '交互测试员');
    const sel = [...document.querySelectorAll('select')];
    const byOpt = t => sel.find(s => [...s.options].some(o => o.text === t));
    const cc = byOpt('法师'); if (cc) setVal(cc, [...cc.options].find(o => o.text === '法师').value);
    const r = byOpt('精灵'); if (r) setVal(r, [...r.options].find(o => o.text === '精灵').value);
    const b = byOpt('侍僧'); if (b) setVal(b, [...b.options].find(o => o.text === '侍僧').value);
    return 'ok';
  })()`);
  const clickNext = async () => { await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '下一步' && !b.disabled)?.click(); 'ok'`); await sleep(700); };
  await clickNext(); await clickNext(); await clickNext(); await sleep(500); await clickNext(); await sleep(1000);

  // ── 场景 1：车卡预览 - 燃烧之手（自身 15尺锥状）点击瞄准 ──
  await c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('燃烧之手'));
    if (!b) return null;
    b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    return 'ok';
  })()`);
  await sleep(600);
  const svg1 = await c.eval(FIND_SVG);
  check('车卡预览出现范围小图', !!svg1, String(svg1));
  if (svg1) {
    const { x, y, w, h } = JSON.parse(svg1);
    // 点击施法者上方偏右 → 锥状朝该方向
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + w * 0.62, y: y + h * 0.15, button: 'left', clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + w * 0.62, y: y + h * 0.15, button: 'left', clickCount: 1 });
    await sleep(600);
    const covered = await c.eval(COUNT_COVERED);
    const label = await c.eval(LABEL_TEXT);
    check('锥状点击后出现覆盖格子', covered >= 3, `covered=${covered} label=${label}`);
    check('底部标签显示距离+覆盖', label && label.includes('距施法者') && label.includes('覆盖'), String(label));
    // 重置
    await c.eval(`[...document.querySelectorAll('span')].find(s => s.textContent && s.textContent.trim() === '↺')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); 'ok'`);
    await sleep(400);
    const label2 = await c.eval(LABEL_TEXT);
    const covered2 = await c.eval(COUNT_COVERED);
    check('重置后恢复默认', label2 && label2.includes('点击放置') && covered2 === 0, `label=${label2} covered=${covered2}`);
  }

  // ── 场景 2：车卡预览 - 魔法飞弹（120尺无形状）点击测距 ──
  await c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('魔法飞弹'));
    if (!b) return null;
    b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    return 'ok';
  })()`);
  await sleep(600);
  const svg2 = await c.eval(FIND_SVG);
  check('魔法飞弹预览出现范围小图', !!svg2, String(svg2));
  if (svg2) {
    const { x, y, w, h } = JSON.parse(svg2);
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + w * 0.85, y: y + h * 0.5, button: 'left', clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + w * 0.85, y: y + h * 0.5, button: 'left', clickCount: 1 });
    await sleep(500);
    const label = await c.eval(LABEL_TEXT);
    const covered = await c.eval(COUNT_COVERED);
    check('无形状法术点击显示测距', label && label.includes('距施法者') && !label.includes('覆盖') && covered === 0, `label=${label}`);
  }

  // 完成车卡进入角色卡
  await c.eval(`[...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('燃烧之手'))?.click(); 'ok'`);
  await sleep(400);
  for (let i = 0; i < 10; i++) {
    const done = await c.eval(`(() => {
      const enter = [...document.querySelectorAll('button')].find(b => b.innerText.includes('进入角色卡'));
      if (enter) { enter.click(); return 'enter'; }
      const next = [...document.querySelectorAll('button')].find(b => ['下一步', '查看摘要'].includes(b.innerText.trim()) && !b.disabled);
      if (next) { next.click(); return 'next'; }
      return 'stuck';
    })()`);
    await sleep(900);
    if (done !== 'next') break;
  }
  await sleep(2500);

  // ── 场景 3：规则速查 - 火球术（150尺 20尺球状）点击放置 ──
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('规则速查'))?.click(); 'ok'`);
  await sleep(1200);
  await c.eval(`(() => {
    const inp = [...document.querySelectorAll('input')].find(i => i.placeholder && i.placeholder.includes('输入关键词'));
    if (!inp) return null;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, '火球术');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);
  await sleep(800);
  await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.includes('火球术'))?.click(); 'ok'`);
  await sleep(800);
  const svg3 = await c.eval(FIND_SVG);
  check('速查火球术展开含范围小图', !!svg3, String(svg3));
  if (svg3) {
    const { x, y, w, h } = JSON.parse(svg3);
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + w * 0.7, y: y + h * 0.3, button: 'left', clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + w * 0.7, y: y + h * 0.3, button: 'left', clickCount: 1 });
    await sleep(500);
    const covered = await c.eval(COUNT_COVERED);
    const label = await c.eval(LABEL_TEXT);
    check('火球术点击后覆盖格子高亮', covered >= 4, `covered=${covered} label=${label}`);
    check('火球术标签显示距离+覆盖', label && label.includes('距施法者') && label.includes('覆盖'), String(label));
  }

  console.log(JSON.stringify({ checks }, null, 1));
  const failed = checks.filter(x => !x.ok);
  console.log(failed.length === 0 ? 'ALL_PASS' : 'FAIL: ' + failed.map(f => f.name).join(', '));
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
