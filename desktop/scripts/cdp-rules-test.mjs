// 通过 CDP 验证 5E/5R 双规则集功能
// 覆盖：主菜单渲染、5R 物种列表、5E 种族列表、扩展种族、称呼切换
const port = process.argv[2] || '9223';

async function getPageWs() {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('NO_PAGE_TARGET');
  return page.webSocketDebuggerUrl;
}

function connect(ws) {
  return new Promise((resolve, reject) => {
    const sock = new WebSocket(ws);
    let id = 0;
    const pending = new Map();
    sock.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const mid = ++id;
          pending.set(mid, { res, rej });
          sock.send(JSON.stringify({ id: mid, method, params }));
        });
      },
      close: () => sock.close(),
    });
    sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res } = pending.get(msg.id);
        pending.delete(msg.id);
        res(msg.result);
      }
    };
    sock.onerror = reject;
  });
}

async function evalJson(client, expression) {
  const r = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('EVAL_FAIL: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const client = await connect(await getPageWs());

  // 同步最新构建并刷新
  await client.send('Page.enable');
  await client.send('Page.reload', { ignoreCache: true });
  await sleep(3000);

  const checks = [];
  const check = (name, ok, detail = '') => checks.push({ name, ok, detail });

  // 1. 主菜单渲染
  const menu = await evalJson(client, `JSON.stringify({
    rootChildren: document.getElementById('root').children.length,
    hasRulesBtn: document.body.innerText.includes('规则与扩充'),
    rulesetLabel: ((document.body.innerText.split('\\n').find(l => l.includes('当前：')) || '').replace('当前：', '').trim()),
  })`).then(JSON.parse);
  check('主菜单渲染', menu.rootChildren > 0, `root=${menu.rootChildren}`);
  check('规则按钮存在', menu.hasRulesBtn);
  check('默认显示 5R', menu.rulesetLabel.includes('5R'), menu.rulesetLabel);

  // 2. 打开规则对话框，检查 5E/5R 卡片
  await evalJson(client, `[...document.querySelectorAll('button')].find(b => b.innerText.includes('规则与扩充'))?.click(); 'ok'`);
  await sleep(600);
  const dlg = await evalJson(client, `JSON.stringify({
    has5r: document.body.innerText.includes('5R · 2024 新规'),
    has5e: document.body.innerText.includes('5E · 2014 经典'),
    hasSummary5r: document.body.innerText.includes('背景属性加值 · 起源专长 · 武器精通'),
    hasSummary5e: document.body.innerText.includes('种族属性加值 · 经典子职 · 旧版法术规则'),
  })`).then(JSON.parse);
  check('对话框含 5R 卡片', dlg.has5r);
  check('对话框含 5E 卡片', dlg.has5e);
  check('5R 要点文案', dlg.hasSummary5r);
  check('5E 要点文案', dlg.hasSummary5e);
  // 关闭对话框
  await evalJson(client, `[...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === '关闭')?.click(); 'ok'`);
  await sleep(400);

  // 3. 进入建卡页（默认 5R）：物种列表 + 称呼
  await client.send('Page.navigate', { url: 'http://127.0.0.1:26571/index.html#/create' });
  await sleep(2500);
  const create5r = await evalJson(client, `JSON.stringify({
    label: [...document.querySelectorAll('label')].map(l => l.innerText).find(t => t === '物种' || t === '种族'),
    opts: [...document.querySelectorAll('select')].map(s => [...s.options].map(o => o.text)).find(list => list.some(x => x.includes('歌利亚') || x.includes('半身人'))) || [],
  })`).then(JSON.parse);
  check('5R 称呼为物种', create5r.label === '物种', create5r.label);
  check('5R 含歌利亚', create5r.opts.includes('歌利亚'), create5r.opts.slice(0, 12).join('/'));

  // 4. 切换到 5E 并启用 motm 扩展，再查
  await evalJson(client, `localStorage.setItem('dnd5e_ruleset_v1','5e2014'); localStorage.setItem('dnd5e_enabled_expansions_v1', JSON.stringify(['motm'])); 'ok'`);
  await client.send('Page.reload', { ignoreCache: true });
  await sleep(3000);
  const create5e = await evalJson(client, `JSON.stringify({
    label: [...document.querySelectorAll('label')].map(l => l.innerText).find(t => t === '物种' || t === '种族'),
    opts: [...document.querySelectorAll('select')].map(s => [...s.options].map(o => o.text)).find(list => list.some(x => x.includes('半身人'))) || [],
  })`).then(JSON.parse);
  check('5E 称呼为种族', create5e.label === '种族', create5e.label);
  check('5E 含经典种族提夫林', create5e.opts.includes('提夫林'), create5e.opts.slice(0, 12).join('/'));
  check('5E 不含歌利亚', !create5e.opts.includes('歌利亚'));
  check('5E motm 扩展种族生效', create5e.opts.some(x => x.includes('兔人')), create5e.opts.filter(x => !['人类','精灵','矮人','半身人','侏儒','半精灵','半兽人','龙裔','提夫林',''].includes(x)).join('/'));

  // 5. 切回 5R 默认值，避免影响用户
  await evalJson(client, `localStorage.setItem('dnd5e_ruleset_v1','5r2024'); localStorage.setItem('dnd5e_enabled_expansions_v1','[]'); 'ok'`);

  console.log(JSON.stringify({ checks }, null, 1));
  const failed = checks.filter(c => !c.ok);
  console.log(failed.length === 0 ? 'ALL_PASS' : `FAIL: ${failed.map(f => f.name).join(', ')}`);
  client.close();
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
