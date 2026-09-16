// CDP 全流程车卡验证：5R 模式创建野蛮人，检查技能/熟练/特性数据
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
    if (r.exceptionDetails) throw new Error('EVAL: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails).slice(0, 400));
    return r.result.value;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const c = new CDP();
  await c.connect(await getWs(CDP_PORT));
  const checks = [];
  const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 200) });

  // 初始化：5R 规则、清空扩展
  await c.eval(`localStorage.setItem('dnd5e_ruleset_v1','5r2024'); localStorage.setItem('dnd5e_enabled_expansions_v1','[]'); localStorage.removeItem('dndbuilder_archive'); 'ok'`);
  await c.send('Page.enable');
  await c.send('Page.reload', { ignoreCache: true });
  await sleep(2500);
  await c.send('Page.navigate', { url: 'http://127.0.0.1:26571/index.html#/create' });
  await sleep(2500);

  // 填基本信息
  const fill = await c.eval(`(() => {
    const setVal = (el, v) => {
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const nameInput = document.querySelector('input[type=text]');
    setVal(nameInput, '测试野蛮人');
    const selects = [...document.querySelectorAll('select')];
    const byOption = (txt) => selects.find(s => [...s.options].some(o => o.text === txt));
    const setToOption = (sel, txt) => {
      const opt = [...sel.options].find(o => o.text === txt);
      if (opt) setVal(sel, opt.value);
    };
    const cls = byOption('野蛮人'); if (cls) setToOption(cls, '野蛮人');
    const race = byOption('人类'); if (race) setToOption(race, '人类');
    const bg = byOption('侍僧'); if (bg) setToOption(bg, '侍僧');
    return JSON.stringify({ cls: cls?.value, race: race?.value, bg: bg?.value });
  })()`);
  const filled = JSON.parse(fill);
  check('基本信息已填', filled.cls && filled.race && filled.bg, fill);

  // 下一步 ×3 到 hp_skills
  const clickNext = async () => { await c.eval(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '下一步' && !b.disabled)?.click(); 'ok'`); await sleep(700); };
  await clickNext(); // method
  await clickNext(); // attributes
  await clickNext(); // hp_skills
  await sleep(800);

  // 检查技能页分区
  const pageInfo = await c.eval(`JSON.stringify({
    hasClassSec: document.body.innerText.includes('职业技能'),
    hasBgSec: document.body.innerText.includes('背景技能'),
    hasSpeciesSec: document.body.innerText.includes('物种技能'),
    classHint: (document.body.innerText.split('\\n').find(l => l.includes('从职业列表中选择')) || '').trim(),
    bgChips: [...document.querySelectorAll('div')].filter(d => d.className.includes('rounded-md') && d.className.includes('text-xs') && ['洞悉','宗教'].includes(d.innerText.trim())).map(d => d.innerText.trim()),
  })`).then(JSON.parse);
  check('职业技能分区', pageInfo.hasClassSec, pageInfo.classHint);
  check('背景技能分区', pageInfo.hasBgSec);
  check('物种技能分区(人类)', pageInfo.hasSpeciesSec);
  check('背景技能固定项', pageInfo.bgChips.length === 2, pageInfo.bgChips.join(','));

  // 点选：职业技能 运动+察觉；物种技能 求生
  const pickOne = async (name, section) => {
    const r = await c.eval(`(() => {
      const h = [...document.querySelectorAll('h3')].find(x => x.innerText === '${section}');
      if (!h) return 'no-section';
      let scope = h.parentElement;
      while (scope && scope.querySelectorAll('button').length < 3) scope = scope.parentElement;
      const b = [...(scope?.querySelectorAll('button') || [])].find(x => x.innerText.trim().startsWith('${name}'));
      if (!b) return 'no-btn';
      b.click(); return 'ok';
    })()`);
    await sleep(400);
    return r;
  };
  const picks = [
    await pickOne('运动', '职业技能'),
    await pickOne('察觉', '职业技能'),
    await pickOne('求生', '物种技能'),
  ];
  check('点选执行', picks.every(p => p === 'ok'), JSON.stringify(picks));

  // 点选后即时确认已选数量
  const afterPick = await c.eval(`JSON.stringify({
    classHint: (document.body.innerText.split('\\n').find(l => l.includes('从职业列表中选择')) || '').trim(),
    speciesHint: (document.body.innerText.split('\\n').find(l => l.includes('授予 1 项自选技能')) || '').trim(),
  })`).then(JSON.parse);
  check('职业技能已选2', afterPick.classHint.includes('已选 2/2'), afterPick.classHint);
  check('物种技能已选1', afterPick.speciesHint.includes('已选 1/1'), afterPick.speciesHint);

  // 走到 finish 并进入角色卡
  for (let i = 0; i < 10; i++) {
    const done = await c.eval(`(() => {
      const enter = [...document.querySelectorAll('button')].find(b => b.innerText.includes('进入角色卡'));
      if (enter) { enter.click(); return 'enter'; }
      const next = [...document.querySelectorAll('button')].find(b => ['下一步', '查看摘要'].includes(b.innerText.trim()) && !b.disabled);
      if (next) { next.click(); return 'next'; }
      return 'stuck';
    })()`);
    await sleep(800);
    if (done === 'enter') break;
    if (done === 'stuck') { check('向导推进', false, 'stuck at step ' + i); break; }
  }
  await sleep(2500);

  // 读存档验证结果（按 currentId 找新建角色）
  const save = await c.eval(`(() => {
    const arc = JSON.parse(localStorage.getItem('dndbuilder_archive') || '{}');
    const ch = (arc.saves || []).find(x => x.id === arc.currentId) || (arc.saves || [])[0];
    if (!ch) return 'none';
    return JSON.stringify({
      race: ch.basicInfo?.['种族'], cls: ch.basicInfo?.['职业'], bg: ch.basicInfo?.['背景'],
      skills: ch.skills,
      armorProfs: (ch.proficiencies?.armor || []).length,
      weaponProfs: (ch.proficiencies?.weapon || []).slice(0, 8),
      toolProfs: ch.proficiencies?.tool,
      traits: (ch.traitList || []).map(t => ({ n: t.name, d: (t.description || '').length })),
    });
  })()`);

  if (save === 'none') {
    check('存档生成', false, 'no save found');
  } else {
    const d = JSON.parse(save);
    check('存档生成', true, `${d.cls}/${d.race}/${d.bg}`);
    check('技能=运动/察觉/求生', d.skills?.['运动'] === 1 && d.skills?.['察觉'] === 1 && d.skills?.['求生'] === 1, JSON.stringify(d.skills));
    check('职业护甲熟练已写入', d.armorProfs >= 4, 'armor count ' + d.armorProfs);
    check('职业武器熟练已写入', d.weaponProfs.length > 5, d.weaponProfs.join(','));
    check('背景工具熟练已写入', (d.toolProfs || []).length >= 1, JSON.stringify(d.toolProfs));
    const names = d.traits.map(t => t.n);
    check('职业特性为2024真名', names.includes('狂暴') && names.includes('武器精通'), names.join(','));
    check('物种特性为2024真名', names.includes('适应力') || names.includes('技能'), names.join(','));
    check('特性含原文描述', d.traits.filter(t => t.d > 20).length >= 3, JSON.stringify(d.traits.slice(0, 6)));
    check('无背景伪特性', !names.some(n => ['信仰服务', '宗教知识'].includes(n)), '');
    check('无熟练类特性', !names.some(n => ['额外技能', '精灵武器训练', '矮人战斗训练'].includes(n)), '');
  }

  console.log(JSON.stringify({ checks }, null, 1));
  const failed = checks.filter(x => !x.ok);
  console.log(failed.length === 0 ? 'ALL_PASS' : 'FAIL: ' + failed.map(f => f.name).join(', '));
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
