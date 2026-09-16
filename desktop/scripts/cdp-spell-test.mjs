// CDP 验证：法师车卡后法术页法术带完整介绍
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
  const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 200) });

  await c.eval(`localStorage.removeItem('dndbuilder_archive'); localStorage.setItem('dnd5e_ruleset_v1','5r2024'); 'ok'`);
  await c.send('Page.enable');
  await c.send('Page.reload', { ignoreCache: true });
  await sleep(2500);
  await c.send('Page.navigate', { url: 'http://127.0.0.1:26571/index.html#/create' });
  await sleep(2500);

  // 填表：法师/精灵/侍僧
  const fill = await c.eval(`(() => {
    const setVal = (el, v) => {
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const setToOption = (sel, txt) => { const o = [...sel.options].find(o => o.text === txt); if (o) setVal(sel, o.value); };
    const nameInput = document.querySelector('input[type=text]');
    if (nameInput) setVal(nameInput, '测试法师');
    const selects = [...document.querySelectorAll('select')];
    const byOption = (txt) => selects.find(s => [...s.options].some(o => o.text === txt));
    const cls = byOption('法师'); if (cls) setToOption(cls, '法师');
    const race = byOption('精灵'); if (race) setToOption(race, '精灵');
    const bg = byOption('侍僧'); if (bg) setToOption(bg, '侍僧');
    return JSON.stringify({ cls: cls?.value, race: race?.value, bg: bg?.value });
  })()`);
  check('基本信息已填', JSON.parse(fill).cls === '法师', fill);

  const clickNext = async () => { await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '下一步' && !b.disabled)?.click(); 'ok'`); await sleep(700); };
  await clickNext(); // method
  await clickNext(); // attributes
  await clickNext(); // hp_skills
  await sleep(500);
  await clickNext(); // 跳过 subclass（法师1级无子职）→ spells
  await sleep(1000);

  // 法术页：点前 3 个戏法 + 前 2 个一环
  const picked = await c.eval(`(() => {
    if (!document.body.innerText.includes('选择法术')) return 'not-spell-page';
    const h = [...document.querySelectorAll('h2, h3')].map(x => x.innerText);
    return JSON.stringify(h);
  })()`);
  check('到达法术页', String(picked).includes('法术'), picked);

  // 直接点击法术分组中的前几个按钮（排除向导按钮）
  const pickSpells = await c.eval(`(() => {
    const candidates = [...document.querySelectorAll('button')].filter(b =>
      b.innerText.length < 30 && !['下一步', '上一步', '查看摘要', '进入角色卡', '-', '+'].includes(b.innerText.trim())
      && b.className.includes('stone-800') && !b.className.includes('py-2 px-6')
    );
    const clicked = [];
    for (const b of candidates.slice(0, 5)) { clicked.push(b.innerText.trim().slice(0, 12)); b.click(); }
    return JSON.stringify(clicked);
  })()`);
  check('点选法术', Array.isArray(JSON.parse(pickSpells)) && JSON.parse(pickSpells).length >= 3, pickSpells);
  await sleep(600);

  // 推进到完成
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
    if (done === 'stuck') { check('向导推进', false, 'stuck ' + i); break; }
  }
  await sleep(2500);

  // 读存档检查法术
  const save = await c.eval(`(() => {
    const arc = JSON.parse(localStorage.getItem('dndbuilder_archive') || '{}');
    const ch = (arc.saves || []).find(x => x.id === arc.currentId);
    if (!ch) return 'none';
    const spells = (ch.spellBoxes || []).flatMap(b => (b.spells || []).map(s => ({
      lv: b.level, n: s.name, d: (s.description || '').length, school: s.school, conc: s.concentration,
    })));
    return JSON.stringify(spells);
  })()`);

  if (save === 'none') {
    check('存档生成', false, '');
  } else {
    const spells = JSON.parse(save);
    check('存档生成', true, spells.length + ' 个法术');
    check('法术均有介绍', spells.length > 0 && spells.every(s => s.d > 50), JSON.stringify(spells));
    check('法术含学派元数据', spells.every(s => !!s.school), spells.map(s => s.n + ':' + s.school).join(','));
  }

  console.log(JSON.stringify({ checks }, null, 1));
  const failed = checks.filter(x => !x.ok);
  console.log(failed.length === 0 ? 'ALL_PASS' : 'FAIL: ' + failed.map(f => f.name).join(', '));
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
