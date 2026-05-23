import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const productionBase = '/frontend-learning-system';

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>跳转中...</title>
    <script>
      (function () {
        var base = '${productionBase}';
        var path = window.location.pathname;
        var normalizedPath = path.indexOf(base) === 0 ? path.slice(base.length) : path;
        if (!normalizedPath) normalizedPath = '/';
        var redirect = normalizedPath + window.location.search + window.location.hash;
        window.location.replace(base + '/?redirect=' + encodeURIComponent(redirect));
      })();
    </script>
  </head>
  <body></body>
</html>
`;

const distDir = resolve('dist');
mkdirSync(distDir, { recursive: true });
writeFileSync(resolve(distDir, '404.html'), html);
