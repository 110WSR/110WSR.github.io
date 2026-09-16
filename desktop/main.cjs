// ============================================================================
// DND 角色卡 - Electron 主进程
// 生产模式：在 127.0.0.1 上启动本地静态服务器托管 app-dist，
// 避免 Chromium 对 file:// 下 ES Module 的 CORS 限制（页面空白问题的根因）
// ============================================================================
const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDev = !!process.env.ELECTRON_DEV;

// 固定端口：localStorage 按源(origin)隔离，随机端口会导致每次启动都是新源、存档丢失
const STATIC_PORT = Number(process.env.CARDDY_STATIC_PORT) || 26571;

// 全局错误捕获，写入日志便于排查
process.on('uncaughtException', (err) => {
  console.log('[uncaughtException]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.log('[unhandledRejection]', reason);
});

// ---------- 本地静态服务器 ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function createStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
      if (urlPath === '/') urlPath = '/index.html';

      // 防目录穿越
      const filePath = path.normalize(path.join(rootDir, urlPath));
      if (!filePath.startsWith(path.normalize(rootDir))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA 回退：找不到的文件交给 index.html（HashRouter 一般用不到，兜底而已）
          const fallback = path.join(rootDir, 'index.html');
          fs.readFile(fallback, (err2, data2) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': MIME['.html'] });
              res.end(data2);
            }
          });
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    } catch (e) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  return new Promise((resolve, reject) => {
    // 优先固定端口（保证 localStorage 源稳定）；被占用时向后尝试最多 20 个端口
    const tryListen = (attempt) => {
      const port = STATIC_PORT + attempt;
      const onError = (err) => {
        server.off('error', onError);
        if (err.code === 'EADDRINUSE' && attempt < 20) {
          console.log('[server] port ' + port + ' busy, trying ' + (port + 1));
          tryListen(attempt + 1);
        } else {
          reject(err);
        }
      };
      server.once('error', onError);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', onError);
        resolve({ server, port: server.address().port });
      });
    };
    tryListen(0);
  });
}

// ---------- 窗口 ----------
function createWindow(loadTarget) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(loadTarget);

  // 诊断日志（生产排查问题时很有用）
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.log('[did-fail-load]', code, desc, url);
  });
  win.webContents.on('did-finish-load', () => {
    console.log('[did-finish-load]', win.webContents.getURL());
  });
  win.webContents.on('console-message', (e) => {
    console.log('[console]', e.level, e.message);
  });
  win.webContents.on('render-process-gone', (e, details) => {
    console.log('[render-process-gone]', details.reason, details.exitCode);
  });
  app.on('gpu-process-crashed', (e, killed) => {
    console.log('[gpu-process-crashed]', killed);
  });

  // 外部链接交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

// 单实例锁：第二次启动时聚焦已有窗口并退出，避免多实例抢端口/多份存档
// CARDDY_MULTI_INSTANCE=1 时跳过（仅供本机调试并行实例）
const gotLock = process.env.CARDDY_MULTI_INSTANCE ? true : app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      const w = wins[0];
      if (w.isMinimized()) w.restore();
      w.focus();
    }
  });

  app.whenReady().then(async () => {
  let server = null;

  if (isDev) {
    createWindow(process.env.VITE_DEV_URL || 'http://localhost:5173');
  } else {
    const rootDir = path.join(__dirname, 'app-dist');
    const { server: s, port } = await createStaticServer(rootDir);
    server = s;
    console.log('[server] listening on 127.0.0.1:' + port, 'root=' + rootDir);
    createWindow(`http://127.0.0.1:${port}/index.html`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (server) {
        createWindow(`http://127.0.0.1:${server.address().port}/index.html`);
      } else {
        createWindow(process.env.VITE_DEV_URL || 'http://localhost:5173');
      }
    }
  });
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
}
