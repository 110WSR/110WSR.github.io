const port = process.argv[2] || '9223';

async function main() {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) { console.log('NO_PAGE'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const result = await new Promise((resolve) => {
    let answered = false;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1, method: 'Runtime.evaluate',
        params: {
          expression: `import('./assets/index-8F-N3nJ2.js').then(() => {
            return new Promise(r => setTimeout(() => r('IMPORT_OK rootChildren=' + document.getElementById('root').children.length + ' textLen=' + document.body.innerText.length), 1500));
          }).catch(e => 'IMPORT_ERR: ' + (e && e.message ? e.message : e))`,
          awaitPromise: true,
          returnByValue: true,
        },
      }));
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === 1 && !answered) {
        answered = true;
        resolve(msg.result && msg.result.result ? (msg.result.result.value || JSON.stringify(msg.result.result).slice(0, 500)) : JSON.stringify(msg).slice(0, 800));
      }
    };
    ws.onerror = () => { if (!answered) { answered = true; resolve('WS_ERROR'); } };
    setTimeout(() => { if (!answered) { answered = true; resolve('TIMEOUT'); } }, 20000);
  });
  console.log('RESULT:', result);
  ws.close();
  process.exit(0);
}
main();
