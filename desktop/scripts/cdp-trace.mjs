const port = process.argv[2] || '9223';

async function main() {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) { console.log('NO_PAGE'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const events = [];
  let idSeq = 0;
  const send = (method, params) => ws.send(JSON.stringify({ id: ++idSeq, method, params }));

  await new Promise((resolve) => {
    ws.onopen = () => {
      send('Runtime.enable');
      send('Page.enable');
      send('Page.reload', { ignoreCache: true });
      setTimeout(resolve, 8000);
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        events.push('console.' + msg.params.type + ': ' + msg.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        events.push('EXCEPTION: ' + (d.exception && (d.exception.description || d.exception.value) || d.text).slice(0, 500));
      } else if (msg.method === 'Runtime.bindingCalled') {
        events.push('binding: ' + msg.params.payload);
      }
    };
  });

  // 顺便再看 root 状态
  const evalP = new Promise((resolve) => {
    let answered = false;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === 999 && !answered) {
        answered = true;
        resolve(msg.result && msg.result.result ? msg.result.result.value : 'ERR');
      }
    };
    ws.send(JSON.stringify({ id: 999, method: 'Runtime.evaluate', params: { expression: "document.getElementById('root').children.length + '|' + document.body.innerText.length", returnByValue: true } }));
    setTimeout(() => { if (!answered) resolve('TIMEOUT'); }, 8000);
  });
  const rootState = await evalP;

  console.log('EVENTS:\n' + events.join('\n'));
  console.log('ROOT_STATE:', rootState);
  ws.close();
  process.exit(0);
}
main();
