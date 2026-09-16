const port = process.argv[2] || '9223';

async function main() {
  let targets;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      targets = await res.json();
      if (targets.some(t => t.type === 'page')) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  const page = (targets || []).find(t => t.type === 'page');
  if (!page) { console.log('RESULT: NO_PAGE_TARGET'); process.exit(1); }

  const expr = `JSON.stringify({
    scripts: Array.from(document.scripts).map(s => ({src: s.src, type: s.type})),
    resources: performance.getEntriesByType('resource').map(e => e.name + ' dur=' + Math.round(e.duration) + ' size=' + (e.transferSize||0)),
    readyState: document.readyState,
    jsEnabled: true,
    navEntries: performance.getEntriesByType('navigation').map(e => e.responseStatus + ' ' + e.name)
  })`;

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const result = await new Promise((resolve) => {
    let answered = false;
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === 1 && !answered) { answered = true; resolve(msg.result && msg.result.result ? msg.result.result.value : JSON.stringify(msg)); }
    };
    ws.onerror = () => { if (!answered) { answered = true; resolve('WS_ERROR'); } };
    setTimeout(() => { if (!answered) { answered = true; resolve('TIMEOUT'); } }, 15000);
  });
  console.log('RESULT:', result);
  ws.close();
  process.exit(0);
}
main();
