// 离线版 HTML 验证：Electron 无头窗口加载 file:// 单文件，检查渲染/路由/知识库/存档
const { app, BrowserWindow } = require('electron');
const path = require('path');

const HTML = process.argv[2];
const errors = [];

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1400, height: 900,
    webPreferences: { sandbox: false },
  });
  win.webContents.on('console-message', (_e, _l, msg) => {
    if (/error|failed|uncaught/i.test(msg)) errors.push(msg.slice(0, 200));
  });

  await win.loadFile(HTML);
  await new Promise(r => setTimeout(r, 2500));

  const result = await win.webContents.executeJavaScript(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const out = {};
    out.title = document.title;
    out.rootChildren = document.getElementById('root').children.length;
    out.menuText = document.body.innerText.slice(0, 80);

    // 知识库 fetch 拦截
    try {
      const r = await fetch('/DND_2024_Knowledge_Base.json');
      const d = await r.json();
      out.kbBuilds = (d.builds || []).length;
    } catch (e) { out.kbError = String(e); }

    // localStorage 读写
    localStorage.setItem('offline_test', 'yes');
    out.ls = localStorage.getItem('offline_test');

    // 路由到车卡页
    location.hash = '#/create';
    await sleep(2500);
    out.createPage = document.body.innerText.includes('创建') || document.body.innerText.includes('职业') || document.querySelectorAll('select').length > 0;
    out.selects = document.querySelectorAll('select').length;

    // 路由到角色卡页
    location.hash = '#/sheet';
    await sleep(2000);
    out.sheetText = document.body.innerText.slice(0, 60);

    return out;
  })()`);

  console.log(JSON.stringify({ result, errors: errors.slice(0, 8) }, null, 1));
  const ok = result.rootChildren > 0 && result.kbBuilds > 0 && result.ls === 'yes' && result.createPage;
  console.log(ok ? 'ALL_PASS' : 'FAIL');
  app.exit(ok ? 0 : 1);
}).catch(e => { console.error('BOOT_ERROR', e); app.exit(1); });
