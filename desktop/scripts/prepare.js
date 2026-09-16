// 将父项目 vite 构建产物 (../dist) 复制到本目录 app-dist，供 electron-builder 打包
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '..', 'dist');
const dest = path.resolve(__dirname, '..', 'app-dist');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('[prepare] 未找到 ../dist/index.html，请先运行: npm run build');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[prepare] 已复制 ${src} -> ${dest}`);
