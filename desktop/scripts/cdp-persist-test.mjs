// 存档持久化测试：mode=set 写入标记，mode=get 读取标记
const port = '9224';
const mode = process.argv[2] || 'get';

async function main() {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) { console.log('NO_PAGE'); process.exit(1); }

  const sock = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { sock.onopen = r; sock.onerror = j; });
  const result = await new Promise((resolve) => {
    sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === 1) resolve(msg.result);
    };
    const expr = mode === 'set'
      ? `localStorage.setItem('__persist_test', 'hello-26571'); JSON.stringify({url: location.href, ok: true})`
      : `JSON.stringify({url: location.href, value: localStorage.getItem('__persist_test')})`;
    sock.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    setTimeout(() => resolve(null), 10000);
  });
  console.log(mode.toUpperCase(), result && result.result ? result.result.value : 'TIMEOUT');
  sock.close();
  process.exit(0);
}
main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
