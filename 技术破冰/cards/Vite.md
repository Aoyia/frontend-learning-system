---
title: Vite
category: 构建工具
tags:
  - frontend
  - engineering
  - vite
  - dev-server
  - hmr
  - build
difficulty: medium
status: draft
created: 2026-04-27
updated: 2026-04-27
---

# Vite

## 1. 它属于哪个知识板块？

Vite 属于：

```txt
前端工程化
→ 构建工具
→ 现代前端开发工具
→ dev server / HMR / build / plugin
```

==它不是单纯的 bundler。更准确地说，**Vite 是一套现代前端开发工具**，开发阶段提供 **dev server 和 HMR**，生产阶段负责**构建优化**，并通过**插件系统**接入 Vue、React、Svelte、SSR、静态资源、环境变量等能力。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**Vite** 解决的是传统前端构建工具在大型项目里“**启动慢、热更新慢、配置重**”的问题。==

传统 bundle-based dev server 往往要先把整个应用打包一遍，浏览器才能看到页面。项目越大，启动和更新越慢。

==Vite 的核心思路是：开发阶段**不先整体打包源码**，而是利用**浏览器原生 ESM**，浏览器请求哪个模块，Vite 就**按需转换**哪个模块；第三方依赖这种不常变化的代码则提前**预构建和缓存**。生产阶段再执行真正的 bundle，输出适合部署的静态资源。==

### 2.2 核心流程

开发阶段：

```txt
启动 vite dev server
→ 读取 index.html
→ 浏览器请求 ESM 模块
→ Vite 按需转换源码
→ 第三方依赖走预构建缓存
→ 文件变化触发 HMR
→ 浏览器局部更新
```

生产构建：

```txt
执行 vite build
→ 以 index.html 为默认入口
→ 解析模块依赖图
→ 调用插件流水线
→ 打包、代码拆分、压缩、资源处理
→ 输出 dist 静态产物
```

### 2.3 关键词清单

1. native ESM：浏览器原生 ES Module，Vite 开发阶段快的基础。
2. dev server：Vite 本地开发服务器，默认服务项目 root 下的文件。
3. `index.html`：Vite 项目的入口文件，开发时会被当作源码和模块图的一部分处理。
4. dependency pre-bundling：依赖预构建，把第三方依赖提前处理成更适合浏览器加载的形式。
5. source code on demand：源码按需转换，浏览器请求到某个模块时才处理它。
6. HMR：热模块替换，文件变化后尽量只更新受影响模块，不整页刷新。
7. plugin：插件系统，扩展解析、加载、转换、HTML 处理、构建等流程。
8. `vite.config.ts`：Vite 配置文件，用来配置插件、别名、开发代理、构建选项等。
9. `base`：部署基础路径，决定构建产物里静态资源 URL 如何生成。
10. `mode`：运行模式，例如 development、production，用来加载不同环境变量。
11. `vite build`：生产构建命令，输出可部署的静态产物。
12. `vite preview`：本地预览生产构建结果，不等于开发服务器。

### 2.4 一句面试版

==Vite 的核心是开发阶段基于**浏览器原生 ESM** 按需服务源码，并对第三方依赖做**预构建缓存**，从而获得很快的**启动和 HMR**；生产阶段再通过构建流程输出经过**代码拆分、压缩和资源处理**的静态产物，**插件系统贯穿 dev 和 build 两个阶段**。==

### 2.5 最小 demo / 最小案例

最小命令：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^8.0.0"
  }
}
```

最小入口：

```html
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
```

最小配置：

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

这段配置先抓五件事：

1. `server.port`：开发服务器端口。
2. `server.proxy`：本地接口代理，常用于解决开发跨域。
3. `base`：部署路径，线上资源 404 时优先检查它。
4. `build.outDir`：构建产物目录。
5. `build.sourcemap`：是否生成源码映射，方便排查线上问题。

### 2.6 Vite 为什么快？

开发启动快：

```txt
不是先打包全量应用
→ 而是启动 dev server
→ 浏览器请求哪个模块才转换哪个模块
```

热更新快：

```txt
文件变化
→ 只失效相关模块
→ 通过 HMR 通知浏览器
→ 框架插件局部更新组件
```

依赖处理快：

```txt
第三方依赖变化少
→ 预构建一次
→ 写入缓存
→ 后续开发复用
```

生产构建仍然需要 bundle：

```txt
开发阶段 ESM 按需加载适合速度
→ 生产环境如果保留大量嵌套请求会影响加载效率
→ 所以 build 阶段仍要打包、拆分和压缩
```

### 2.7 常见问题怎么定位？

#### 资源 404

优先检查：

```txt
base 配置
→ 部署子路径
→ 静态资源引用方式
→ public 目录和 src import 的区别
```

#### HMR 不生效

优先检查：

```txt
框架插件是否正确安装
→ 文件路径大小写是否一致
→ 组件是否被缓存
→ 是否修改了依赖包源码但没配置 workspace / optimizeDeps
```

#### 依赖预构建异常

优先检查：

```txt
依赖是否混用 CJS / ESM
→ optimizeDeps.include / exclude
→ 删除缓存或使用 --force 重新预构建
```

#### 开发能跑，build 失败

优先检查：

```txt
dev 和 build 的插件行为差异
→ 动态导入路径
→ Node-only API 是否进了浏览器代码
→ 类型检查是否独立执行
→ 生产环境变量是否缺失
```

#### 线上旧 chunk 加载失败

常见原因是新版本部署后旧 HTML 或旧 chunk 缓存还在。优先检查 HTML 缓存策略、静态资源 hash、CDN 刷新和动态导入失败处理。

### 2.8 Vite 和 webpack 怎么区分？

| 维度 | Vite | webpack |
| --- | --- | --- |
| 开发启动 | 倾向 ESM 按需服务源码 | 倾向先构建 bundle 或维护内存 bundle |
| 热更新 | 基于 ESM 的 HMR，更新粒度通常更直接 | 成熟稳定，依赖模块图和运行时代码 |
| 配置体验 | 开箱即用，常见场景默认处理 | 配置能力强，但历史包袱和配置复杂度更高 |
| 插件生态 | 兼容部分 Rollup / Rolldown 思路，也有 Vite 专用插件 | webpack loader / plugin 生态非常成熟 |
| 适用项目 | 新项目、现代框架、希望开发体验轻快 | 复杂历史项目、高度定制构建链路 |

不要把它理解成“Vite 一定替代 webpack”。更准确的判断是：新项目优先考虑 Vite；老项目如果 webpack 链路复杂、插件深度定制多，迁移前要评估插件兼容、构建差异和部署方式。

### 2.9 是否值得深入？

值得深入，特别是做 Vue、React、组件库、低代码平台、Monorepo、SSR 或性能优化时。

优先顺序：

1. 先理解 Vite 为什么把开发和生产分成两套策略。
2. 再理解 `index.html`、native ESM、HMR、依赖预构建。
3. 然后学会配置 `vite.config.ts`：plugins、resolve.alias、server.proxy、build、base。
4. 接着学会排查资源路径、HMR、预构建、chunk 加载失败。
5. 最后深入插件 API、SSR、Environment API、构建性能和框架集成。

优先看官方资料：Vite Getting Started、Why Vite、Features、Dependency Pre-Bundling、Plugin API、Building for Production，以及 Vite GitHub 源码里的 dev server、optimizer、import analysis。

## 3. 选择题自测

### Q1

Vite 开发阶段快的核心原因是什么？

A. 在后台启动了独立的 GPU 渲染加速服务
B. 开发阶段基于原生 ESM 按需服务源码，不先整体打包应用
C. 将所有第三方包物理拼接入主 HTML 的首屏内联脚本中
D. 强行阻断了对项目源码中第三方 node_modules 的依赖加载

答案：B

解析：Vite 开发阶段让浏览器按需请求模块，Vite 只转换被请求的源码，避免启动时全量打包。

### Q2

Vite 为什么还需要生产构建？

A. 因为开发阶段的按需 ESM 请求不适合直接作为生产最优产物
B. 因为浏览器不能加载 JavaScript
C. 因为 Vite 不能处理 CSS
D. 因为开发服务器就是 CDN

答案：A

解析：生产环境需要更少请求、更好缓存、更小体积和更稳定的静态产物，所以仍然需要 bundle、拆分和压缩。

### Q3

`base` 配置最常用于解决什么问题？

A. 线上部署到子路径时，静态资源 URL 生成错误
B. TypeScript 类型报错
C. Git 合并冲突
D. 代码格式化

答案：A

解析：资源路径 404 时，部署路径和 `base` 是优先检查项。

### Q4

`vite preview` 的作用是什么？

A. 本地预览生产构建产物
B. 启动数据库
C. 替代 `vite build`
D. 自动写测试

答案：A

解析：`vite preview` 用来预览 `vite build` 之后的产物，不是开发服务器，也不是生产部署方案。

### Q5

Vite 插件最重要的价值是什么？

A. 扩展 Vite 的解析、加载、转换、HTML 处理和构建流程
B. 删除所有依赖
C. 禁止使用框架
D. 自动替代需求评审

答案：A

解析：Vite 的框架集成、资源处理、构建扩展都依赖插件体系。
