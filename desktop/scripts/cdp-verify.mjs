// 通过 CDP 验证 Electron 渲染进程 DOM 是否真正渲染
const port = process.argv[2] || '9223';

async function main() {
  // 找页面 target
  let targets;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      targets = await res.json();
      if (targets.some(t => t.type === 'page')) break;
    } catch (e) { /* retry */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  const page = (targets || []).find(t => t.type === 'page');
  if (!page) { console.log('RESULT: NO_PAGE_TARGET'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const send = (id, method, params) => ws.send(JSON.stringify({ id, method, params }));

  const result = await new Promise((resolve) => {
    let answered = false;
    ws.onopen = () => {
      send(1, 'Runtime.evaluate', {
        expression: `JSON.stringify({
          url: location.href,
          title: document.title,
          bodyTextLen: document.body ? document.body.innerText.length : -1,
          rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : -1,
          textSample: (document.body.innerText || '').slice(0, 60)
        })`,
        returnByValue: true,
      });
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === 1 && !answered) {
        answered = true;
        resolve(msg.result && msg.result.result ? msg.result.result.value : JSON.stringify(msg));
      }
    };
    ws.onerror = () => { if (!answered) { answered = true; resolve('WS_ERROR'); } };
    setTimeout(() => { if (!answered) { answered = true; resolve('TIMEOUT'); } }, 15000);
  });

  console.log('RESULT:', result);
  ws.close();
  process.exit(0);
}
main();
