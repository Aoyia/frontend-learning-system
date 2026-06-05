---
title: 前端性能优化系统复盘（腾讯面试/大厂拷打）
difficulty: 进阶
tags: [performance, LCP, INP, CLS, bundle, network, render, cache, tencent, tencent-senior-frontend, 腾讯面试, 大厂拷打]
module: performance
order: 1
---

# 前端性能优化系统复盘

## 一、Core Web Vitals（核心 Web 指标）

Google 官方的三个关键用户体验指标，直接影响 SEO 排名：

| 指标 | 全称 | 衡量 | 良好阈值 | 需改进 |
|------|------|------|---------|-------|
| **LCP** | Largest Contentful Paint | 首屏最大内容可见时间 | ≤ 2.5s | > 4s |
| **INP** | Interaction to Next Paint | 交互响应延迟（取代 FID） | ≤ 200ms | > 500ms |
| **CLS** | Cumulative Layout Shift | 累计布局偏移 | ≤ 0.1 | > 0.25 |

### LCP 优化方向

LCP 元素通常是大图片、视频缩略图、大段文字块。

**1. 消除渲染阻塞资源**
```html
<!-- 关键 CSS 内联，非关键 CSS 异步加载 -->
<style>/* critical CSS inline */</style>
<link rel="preload" as="style" href="non-critical.css" onload="this.rel='stylesheet'">

<!-- JS 脚本加 defer/async -->
<script defer src="app.js"></script>
```

**2. 预加载关键资源**
```html
<!-- 预加载 LCP 图片（尤其是 hero image）-->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">

<!-- 预连接第三方域名 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
```

**3. 图片优化**
- 使用现代格式（WebP/AVIF 比 JPEG 小 25~50%）
- 响应式图片（`srcset`/`sizes`）
- 设置正确的 `width`/`height` 避免布局偏移
- 使用 CDN 配合边缘缓存

### INP 优化方向（取代 FID）

INP 衡量页面整个生命周期中所有交互的响应延迟（取 P98 值）。

**主要来源：Long Task（>50ms 的主线程任务）**

```javascript
// 检测 Long Task
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    console.log('Long Task:', entry.duration, entry.attribution)
  }
})
observer.observe({ entryTypes: ['longtask'] })
```

**优化手段**：
1. **任务分解**：将长任务切分为多个小任务，每次用 `scheduler.yield()` 或 `setTimeout(0)` 让出主线程
2. **虚拟列表**：大量 DOM 节点渲染和操作是 Long Task 的主要来源
3. **Web Worker**：把 CPU 密集型计算移出主线程
4. **减少 JS 解析时间**：代码分割 + Tree Shaking，减少主包体积

### CLS 优化方向

CLS 的根源是**内容尺寸未确定就渲染，后来发生偏移**。

```css
/* 图片/视频预留空间 */
img, video {
  aspect-ratio: 16/9;  /* 或设置固定 width/height */
}

/* 广告位预留固定高度 */
.ad-container {
  min-height: 250px;
}
```

```javascript
// 动态插入内容时，在视口外插入不会导致 CLS
// 在视口内动态插入会累计 CLS 分值
```

## 二、资源加载优化

### 资源优先级控制

```html
<!-- fetchpriority：显式控制浏览器的加载优先级 -->
<img src="hero.webp" fetchpriority="high" />      <!-- LCP 图片 -->
<img src="below-fold.webp" fetchpriority="low" />  <!-- 折叠线以下 -->
<script src="analytics.js" fetchpriority="low"></script>
```

### HTTP 缓存策略

```
资源类型               Cache-Control 策略
───────────────────   ───────────────────────────────────────
HTML 文件              no-cache（每次验证，304 可复用）
带 hash 的 JS/CSS      max-age=31536000, immutable（永久缓存）
API 响应               no-store 或 max-age=60（视业务）
字体文件               max-age=31536000, immutable
```

**为什么带 hash 的静态资源可以设置永久缓存？**
文件内容变化时，hash 会改变，URL 随之改变，浏览器认为是新资源，不会使用旧缓存。

### 懒加载

```javascript
// 图片懒加载（原生支持）
<img loading="lazy" src="image.webp" alt="..." />

// 组件懒加载（Vue）
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// Intersection Observer 实现精细懒加载
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src
      observer.unobserve(entry.target)
    }
  })
}, { rootMargin: '200px' })
```

## 三、JavaScript 运行时性能

### 防抖与节流

```javascript
// 防抖（Debounce）：连续触发只执行最后一次
function debounce(fn, delay) {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 节流（Throttle）：规定时间内最多执行一次
function throttle(fn, interval) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      return fn.apply(this, args)
    }
  }
}
```

**区别口诀**：防抖是"最后一锤定音"，节流是"每隔一段打一次"。

### 虚拟列表（Virtual List）

渲染 10 万条列表时，只渲染视口内可见的 DOM 节点（通常 20-50 个），滚动时复用节点。

```javascript
// 核心计算（固定高度版）
const itemHeight = 50
const visibleCount = Math.ceil(containerHeight / itemHeight) + 2  // 超出缓冲
const startIndex = Math.floor(scrollTop / itemHeight)
const endIndex = startIndex + visibleCount

// 渲染 items.slice(startIndex, endIndex)
// 用 padding-top 撑开上方已滚过的高度
container.style.paddingTop = startIndex * itemHeight + 'px'
```

### requestAnimationFrame vs setTimeout

```javascript
// 动画和 DOM 操作应使用 rAF，不要用 setTimeout
// rAF 在浏览器渲染前执行，不会造成丢帧
function animate() {
  element.style.transform = `translateX(${x}px)`
  x += 1
  requestAnimationFrame(animate)
}

// setTimeout(fn, 0) 不能保证在下一帧执行，可能导致丢帧
```

## 四、Bundle 体积优化

### 分析工具

```bash
# Vite 分析
npx vite-bundle-visualizer

# Webpack 分析
npx webpack-bundle-analyzer dist/stats.json
```

### 常见优化手段

**1. 按需引入第三方库**
```javascript
// ❌ 引入整个 lodash（70KB+）
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ 只引入用到的函数
import debounce from 'lodash-es/debounce'
```

**2. 动态导入非核心功能**
```javascript
// 富文本编辑器只在需要时加载
const loadEditor = async () => {
  const { Editor } = await import('@tiptap/core')
  return Editor
}
```

**3. 外部化大型库（CDN）**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: { vue: 'Vue' }
      }
    }
  }
}
```

## 五、首屏性能优化全链路

```
1. 网络层
   ├── CDN 加速（减少 RTT）
   ├── HTTP/2 多路复用（减少请求建立开销）
   ├── Brotli 压缩（比 gzip 小 15~25%）
   └── 资源预加载（preload / prefetch）

2. 资源层
   ├── 关键路径 CSS 内联
   ├── 非关键 JS defer/async
   ├── 图片 WebP/AVIF + 懒加载
   └── 字体 font-display: swap

3. 渲染层
   ├── SSR/SSG（服务端直出 HTML，减少白屏时间）
   ├── 骨架屏（改善感知性能）
   └── 渐进式渲染（Streaming SSR）

4. 代码层
   ├── Tree Shaking + 代码分割
   ├── 路由懒加载
   └── 第三方库按需引入
```

---

## 六、大厂中高级性能优化方法论与真题拷打

在腾讯及大厂的中高级前端面试中，性能优化绝非“开启 Gzip、图片懒加载、CDN 托管”等背诵式八股文。大厂更关注你在复杂业务场景下如何进行系统化性能度量、链路深度剖析、分层治理以及面对回滚兼容时的工程权衡。

### 6.1 核心性能治理方法论
1. **方法论重于技巧**：性能优化的路径永远是：**监控大盘现象 ──▶ Trace 分析定位 ──▶ 提出假设方案 ──▶ 灰度验证效果**，而非盲目调优。
2. **主链路优先**：遵循 **Amdahl 定律（阿姆达尔定律）**，有限资源优先优化耗时最长的主路径（如首屏 Waterfall），收益才最大。
3. **区分性能债**：主动讲明哪些是已解决的瓶颈（如加载串行、包冗余），哪些是目前仍在治理的“性能债”（如长列表局部卡顿、复杂规则的首次编译耗时），展现架构师的宏观视角。

### 6.2 性能优化分层模型
```
┌──────────────────────────────────────────────┐
│  构建层：DLL预编译、Code Splitting、Tree Shaking  │
├──────────────────────────────────────────────┤
│  专项链路层：串行并行化、LRU缓存、竞态控制        │
├──────────────────────────────────────────────┤
│  加载模式层：插件按需加载、不用功能完全不装载    │
├──────────────────────────────────────────────┤
│  规则与渲染层：依赖图触发规则、子表虚拟滚动      │
└──────────────────────────────────────────────┘
```

### 6.3 中高级性能优化面试口语化模板

#### 🎤 60 秒主线话术
> 我做性能优化时不是从“调配置”开始，而是先看用户感知最强的链路。
> 
> 第一层是已经落地的专项成果：我们通过 **DLL 预编译**把稳定依赖抽出来，构建时间从 5 分钟降到 2 分钟；在 **钉钉审批表单打开专项**里，在客户未开缓存约 8 秒的场景下，我补上静态资源与上下文缓存策略，再用 `Promise.all`、LRU 缓存、Map 索引和 CancelToken 做链路优化，把打开耗时稳定到约 3.5 秒。
> 
> 第二层是加载模式治理：原本是整体包一次性加载，后面改成**插件按需加载**；有些用户不用插件时，对应资源就完全不加载，主包和首屏链路都更轻。
> 
> 第三层是规则和渲染：规则引擎改成**依赖图触发**，子表场景上**虚拟滚动**，读多写少数据用 `Object.freeze` 跳过深度响应式。最后我会用 LCP、INP、CLS 和 Sentry 去验证收益，确保不是“一个指标变好，别的指标变坏”。

#### 🎤 90 秒主线话术
> 我在低代码平台做的是一套分层性能治理。
> 
> **第一层是构建层**，把 Vue、Element-UI、X6、ag-grid 这类低频变化依赖拆出去做 DLL 预编译，主构建只引用 manifest，构建时间从 5 分钟降到 2 分钟。
> 
> **第二层是我已经做出的专项成果**。在钉钉审批表单打开专项里，我先录 Performance trace，发现不是单纯 JS 慢，而是客户环境没开缓存，同时表单配置、表单数据、业务事件还有明显的串行等待。于是把三个请求改成 `Promise.all` 并行，再叠加 LRU 缓存减少重复请求、Map 索引把组件查找从 O(n) 变成 O(1)，最终把打开耗时从客户未开缓存时约 8 秒，稳定到约 3.5 秒。
> 
> **第三层是加载模式治理**。原本这条链路是整体包一次性加载，后面改成插件按需加载，把非核心能力从主包拆出去；对不使用插件的用户，对应插件资源不进入下载链路，包体积和加载压力都明显下降。
> 
> **第四层是规则和渲染**。规则引擎从全量计算改成依赖图触发，复杂场景性能提升 80%；子表场景用虚拟滚动把千级 DOM 压到几十个，读多写少的数据用 `Object.freeze` 跳过 Vue2 深度响应式。
> 
> **最后是治理闭环**，用 Performance 面板定位瓶颈，用 Web Vitals 看 LCP/INP/CLS，用 Sentry 看线上趋势和版本归因。我的方法论是“定位 -> 分层 -> 验证 -> 复盘”，展现系统化治理能力。

### 6.4 重点攻坚：钉钉审批加载优化专项（大厂拷打级 STAR 案例）

在腾讯等大厂面试中，最喜欢深挖端到端性能治理的闭环案例。

| 步骤 | 讲什么 | 本专项实战落地细节 |
| :--- | :--- | :--- |
| **1. 业务背景** | 说明优化价值 | 钉钉审批表单是高频入口，用户从待办点进审批单，如果打开慢，直接影响审批效率和客户体感。 |
| **2. 指标定义** | 定义衡量维度 | 从点击审批进入表单，到表单主要内容可见（LCP 元素渲染完毕）、Loading 关闭的打开耗时。 |
| **3. 采集基线** | 获取优化前数据 | 客户环境未开缓存时，打开表单平均耗时约 **8s**（冷启动场景）。 |
| **4. 定位瓶颈** | 提供 Trace 证据 | 通过 Chrome Performance Trace 和 Network 发现：<br>1) 客户环境未配置 `Cache-Control`/`Expires`，导致每次重新下载 `chunk-vendors`、`chunk-x-apaas` 及 DLL 等资源；<br>2) 初始化阶段的表单配置、表单数据和业务事件接口存在严重串行等待（waterfall）。 |
| **5. 链路拆解** | 拆分主要耗时段 | `表单上下文加载 (串行) -> 业务事件初始化 (串行) -> 数据回填 (串行) -> 引擎渲染 (JS 阻塞)`。 |
| **6. 分层改造** | 落地针对性方案 | 1) **缓存分层**：静态资源层补强缓存；表单上下文层设计 `formContextMap` 缓存（按 formId 复用表单结构配置）；运行时使用 LRU 规避重复接口请求。<br>2) **初始化并行**：在 Context 就绪后，使用 `Promise.all` 并行拉取配置、事件和表单数据。 |
| **7. 风险控制** | 保证高可用降级 | 第一版并行方案在复杂场景暴露数据覆盖 bug 后，迅速回滚止血。二次版本中将上下文获取、配置组装和数据处理完全解耦，并加入依赖 Context 的**串行优雅降级分支**防止崩溃。 |
| **8. 效果验证** | 拿出同口径对比 | 客户未开缓存约 8s -> 补强缓存后 5s-6s -> 缓存+并行初始化后 3.8s-4.2s -> 结合 LRU 与防抖稳定在约 **3.5s**。 |
| **9. 复盘沉淀** | 提炼方法论 | 性能优化不是机械套用 `Promise.all`，而是先通过 Trace 还原真实耗时占比，再进行静态资源、状态上下文、数据请求的分层治理与竞态控制。 |

#### 🎤 拷打追问：“优化过程中每一步大概多少秒？你是怎么估算的？”
> **标准话术**：
> 8s 到 3.5s 是链路级优化的总体结果。我通过 Performance Trace 和 Network 瀑布流做过阶段性估算：
> 1. **原始状态 (约 8s)**：客户现场网络较差且未配置静态资源强缓存，多个大 JS chunk 及 DLL 库重复下载，加上初始化接口 waterfall 串行，导致首屏极慢。
> 2. **静态资源强缓存 + formContextMap 缓存 (降至约 5s - 6s)**：通过补上 `Cache-Control` 并利用 `formContextMap` 缓存表单的 Schema 和字段定义，二次访问消除了 60% 以上的静态资源网络开销与上下文组装耗时。
> 3. **缓存 + 并行初始化 (降至约 3.8s - 4.2s)**：在上下文就绪后，将原本串行的三个核心请求（配置、事件、表单数据）通过 `Promise.all` 包装为并行发起，使接口等待时间由原来的三者相加，缩短为接近三者中的最大值。
> 4. **防抖 + LRU 缓存 + 竞态取消 (稳定在约 3.5s)**：在频繁输入和切页时，利用 LRU 请求缓存避免重复网络 I/O，并利用 `AbortController` 绑定请求做 CancelToken 竞态注销，防止旧接口迟到返回覆盖新状态，同时大幅减少了线上长尾慢请求的比例，最终使打开耗时稳定在 3.5s 左右。

### 6.5 腾讯中高级前端面试真题拷打

#### 🎤 问题 1：为什么并行请求不是越快越好？在高并发或弱网场景下有什么副作用？
**腾讯面试官考核点：浏览器连接限制、HTTP 协议底层、带宽竞争。**
> **答题套路**：
> 1. **连接数限制瓶颈**：在 HTTP/1.1 协议下，浏览器对同一个域名限制最多 6 个并发 TCP 连接。如果我们一上来盲目用 `Promise.all` 发起十几个并发请求，多出的请求会被挂起（Queueing/Stalled），反而阻塞了关键首屏 CSS/JS 资源的下载。
> 2. **带宽竞争与延迟上升**：在弱网环境，过多的请求并发会导致带宽抢占，每个请求都分不到足够带宽，从而使所有请求的 TTFB（首字节时间）全部被拉长，导致首屏首字渲染更慢。
> 3. **解决方案**：针对 HTTP/1.1，应做域名分片（Domain Sharding）或在应用层使用队列控制器限制并发连接数；针对 modern web，应推进 **HTTP/2 或 HTTP/3（多路复用）**，用单一 TCP 连接解决并发挂起问题。

#### 🎤 问题 2：单纯的 LCP（最大内容绘制时间）很好，就代表用户体验好吗？
**腾讯面试官考核点：Core Web Vitals 的多维度评判。**
> **答题套路**：
> 1. **澄清指标片面性**：LCP 仅说明页面中最大的视觉块渲染完成了，它是个**静态的视觉指标**。
> 2. **引入其他指标**：
>    *   **INP (Interaction to Next Paint - 交互到下次绘制时间)**：大厂目前最看重的指标。如果首屏出来了，但主线程被大包 JS 评估（Evaluate Script）或复杂规则引擎编译卡死，用户点击按钮时响应迟钝，INP 指标就会极差，用户依然会觉得卡顿。
>    *   **CLS (Cumulative Layout Shift - 累积布局偏移)**：如果页面加载时字体、异步图片导致内容上下抖动跳跃，用户点击时容易误点，也是极差的体验。
> 3. **结论**：性能优化应当关注 **LCP（看得到） + INP（动得快） + CLS（滑得稳）** 三维组合，而非单点优化。

#### 🎤 问题 3：前端性能优化中，最难的部分往往不是想方案，而是“不退化”。你如何保证优化上线半年后，性能指标不出现反弹退化？
**腾讯面试官考核点：工程防退化门禁、CI/CD 自动化卡点。**
> **答题套路**：
> 性能指标不是一次性攻坚，而需要建立**自动化防退化门禁**：
> 1. **构建包体积防线**：在 CI 流程中，使用 `bundlesize` 或自定义 webpack 插件，限制编译产物的 size 阈值，一旦 MR 导致主包体积增幅超过 5%，直接挂起流水线，拒绝合并。
> 2. **自动化 LightHouse/Playwright 质量跑测**：在预发部署流水线中，通过 CI 调用无头浏览器（Headless Chrome）跑测页面性能，收集 LCP, CLS, INP 数据，并比对基线值，恶化则自动报警。
> 3. **生产监控与告警大盘**：在客户端引入 APM SDK，上报真实的 RUM（Real User Monitoring）数据。按版本、机型和网络建立性能趋势看板，对性能指标下降的版本进行灰度截断。


#### 🎤 问题 4：DLL 预编译和 SplitChunks 分层的底层区别是什么？在实际 H5 工程中如何取舍？
**腾讯面试官考核点：编译打包工具链、缓存命中率、构建速度与包体积的权衡。**
> **答题套路**：
> 1. **根本原理差异**：
>    *   **DLL (Dynamic Link Library)**：是**构建时预编译**方案。它是将几乎不发生变动的三方大库（如 vue、echarts）提前物理编译为一个独立的 dll.js，主项目构建时直接读取 manifest 映射，跳过对这些包的解析、AST 转换与打包阶段。核心解决的是**构建编译速度**。
>    *   **SplitChunks**：是 **Webpack 运行时的拆包与依赖分析**配置。它在构建期间动态扫描模块树，根据大小、引用次数等条件，将运行时代码物理切分为不同的 Chunk。核心解决的是**生产产物分包和浏览器强缓存命中率**。
> 2. **取舍与配合**：
>    在 H5 项目中，我们双管齐下：对大型且极其稳定的运行时依赖（如 Vue生态、Cube-UI、Babel-standalone 转换引擎）采用 DLL，缩减本地与 CI/CD 编译时间；而对于业务公共逻辑、平台能力库（`@x-apaas` 基础依赖）以及扫码、富文本、加密等按需功能模块，采用 SplitChunks 进行动态按需分包加载（拆出 async chunk），在打包效率与资源缓存命中率上达到完美配合。

#### 🎤 问题 5：运行时网络请求防抖、LRU 缓存以及并发合并（去重）分别解决了什么场景？它们的核心实现要点是什么？
**腾讯面试官考核点：数据流调控、内存占用治理、弱网竞态防御。**
> **答题套路**：
> 1. **防抖 (Debounce)**：解决**高频操作引起的多余请求**。例如在表单输入框实时打字时，对关联校验或联动计算做 500ms 的防抖，只发送最后一次稳定请求。
> 2. **LRU 缓存 (最近最少使用)**：解决**不同时间点的重复数据请求**。在表单联动中，如果用户反复切换下拉框的同一选项，其依赖的外部 API 数据直接走前端 Map 维护的 LRU 缓存。读写时必须执行 `cloneDeep`（深拷贝），防止前端内存被修改污染，且设置 `maxSize`（如 10）避免大表单下内存泄露。
> 3. **并发合并 (去重)**：解决**同一时刻并发重复请求**的问题。如页面内 5 个独立组件同时加载用户基本信息，我们将当前正在进行（Pending）的 Fetch Promise 缓存进 Map 中，后面 4 个并发请求直接复用第一个 Promise，在 Resolve 时同步返回，并在请求结束时统一从 Map 中释放。
> 4. **请求取消 (CancelToken)**：解决**网络竞态覆盖**问题。使用 `AbortController`，在发送新请求时自动 abort 掉相同 `requestKey` 处于 pending 的旧请求，防止弱网下旧请求迟到返回，覆盖最新输入的状态。

#### 🎤 问题 6：前端处理几万条只读业务数据时，如何避免由于 Vue 的响应式追踪导致的严重内存及计算卡顿？
**腾讯面试官考核点：Vue 响应式拦截机制、内存泄漏防御、底层 Object.defineProperty/Proxy 原理。**
> **答题套路**：
> 1. **瓶颈分析**：Vue 默认会深度遍历传入的 data 对象，通过 `Object.defineProperty` (Vue 2) 或 `Proxy` (Vue 3) 给每个属性加 getter/setter 拦截，创建大量的 Dep 和 Watcher 实例。当数据达到万级且属性众多时，响应式初始化 and 内存占用会导致严重的卡顿（甚至 OOM）。
> 2. **Object.freeze 极致剪枝**：对于明确只读、不作修改的数据（如表单初始上下文配置、全局常量环境变量），在将其赋值给 Vue 实例属性前，使用 `Object.freeze(data)` 进行冻结。Vue 源码检测到对象被冻结（`Object.isFrozen` 为真）后，会直接跳过深度响应式观测，从根本上消除了大量的 Watcher 实例和劫持开销。
> 3. **配合深拷贝防污染**：为了防止冻结行为影响共享的内存对象或导致下游逻辑写入报错，在 freeze 前先进行一次深拷贝（如 `JSON.parse(JSON.stringify(data))`），以纯粹的只读局部快照形式挂载。



## 📝 面试题自测

### Q1 [single]
以下哪个 Core Web Vitals 指标衡量交互响应延迟（2024年已取代 FID）？
A. LCP
B. CLS
C. INP
D. FCP
答案：C
解析：
💡 它解决了什么问题：
解决了旧的首次输入延迟（FID）指标只能衡量用户与页面的“第一次交互”且忽略了“事件回调执行与下一次帧更新时间”，无法全面、真实反映用户在页面整个生命周期内的交互流畅度卡顿的问题。

🔍 核心原理解析（防拷打）：
1. INP（Interaction to Next Paint）在2024年3月取代 FID 成为核心 Web 性能指标（Core Web Vital）。INP 统计的是页面生命周期内所有交互（如点击、触摸、键盘按键）从触发到下一次像素绘制（Next Paint）的整体延迟。
2. 每一个交互被拆分为三个核心子阶段：输入延迟（Input Delay，主线程因已有任务而无法执行回调的等待时间）、处理耗时（Processing Duration，事件回调函数的执行时间）、呈现延迟（Presentation Delay，重新计算样式、布局和进行合成绘制渲染下一帧的耗时）。
3. 面试大厂追问：INP 取所有交互的第 98 百分位数（P98），对于交互极少的页面取最差值。这意味着哪怕 99% 的点击很快，只要存在极少数由于后台垃圾回收（GC）或者长任务（Long Task）积压导致的卡顿交互，INP 就会迅速劣化。

### Q2 [multiple]
提升 LCP 的有效手段包括哪些？
A. 使用 `<link rel="preload" fetchpriority="high">` 预加载 LCP 图片
B. 将所有 CSS 内联到 HTML，消除渲染阻塞
C. 为 `<script>` 标签添加 `defer` 属性
D. 给图片加 `loading="lazy"` 实现懒加载
答案：ABC
解析：
💡 它解决了什么问题：
解决了团队在面临首屏慢（LCP 差）时，因缺乏端到端网络和关键路径分析，而采取懒加载、盲目压缩等错误策略，甚至导致核心 LCP 元素加载延迟恶化的痛点。

🔍 核心原理解析（防拷打）：
1. LCP（Largest Contentful Paint）衡量的是视口中最大内容元素（如 Banner 英雄图、大段文本块）完全呈现在屏幕上的时刻。优化 LCP 图片的关键在于缩短以下四个阶段：TTFB、资源发现延迟（Resource Load Delay）、资源加载时间（Resource Load Duration）和元素渲染延迟（Element Render Delay）。
2. 使用 `<link rel="preload">` 并配合 `fetchpriority="high"` 能够强行让浏览器预解析扫描器（Preload Scanner）提早发现该资源，并将该图片放入网络最高优先级队列中。添加 `defer` 属性能够使非关键 JS 的加载与执行不阻塞 DOM 的解析，提前解析出 LCP 容器。
3. 极端边界追问：如果给 LCP 图片设置了 `loading="lazy"` 会发生什么？图片会在渲染引擎进行布局（Layout）并确定其在视口内后才发起网络请求，这导致“资源发现延迟”被无限拉长，直接推迟 LCP 发生时间，是典型的性能自杀操作。

### Q3 [judgment]
在 Web 缓存优化中，设置 `Cache-Control: max-age=31536000, immutable` 适合用在文件名带有 hash 的静态资源上。
答案：对
解析：
💡 它解决了什么问题：
解决了由于用户手动点击“刷新”按钮（或浏览器行为），导致已命中强缓存的静态资源被迫向服务器发起条件请求（304 Not Modified），消耗多余的握手 RTT 和服务器算力的问题。

🔍 核心原理解析（防拷打）：
1. 传统的强缓存（如 `Cache-Control: max-age=31536000`）在用户点击刷新（Reload）时，浏览器仍会向服务端发送 `If-Modified-Since` 或 `If-None-Match` 的条件请求以校验缓存有效性。
2. `immutable` 是 RFC 8246 规范引入的属性。它指示浏览器在指定的 max-age 时间内，**即使内容发生刷新，也绝对不要**发起缓存验证条件请求，直接从本地读取缓存，实现零网络 RTT 开销。
3. 大厂追问：如何更新 immutable 资源？由于使用了 immutable，一旦文件缓存，客户端在有效期内不会再向服务端求证。物理文件的内容修改时，必须将内容哈希值（Hash）直接嵌入到文件名（URL）中（例如 `chunk.[contenthash].js`）。当文件内容变化时，其哈希值改变产生全新的 URL，强迫客户端发起对新 URL 的请求。

### Q4 [single]
防抖（Debounce）和节流（Throttle）最关键的区别是？
A. 防抖只能用于输入框，节流只能用于滚动事件
B. 防抖在最后一次触发后执行，节流保证在时间间隔内最多执行一次
C. 防抖使用 setTimeout，节流使用 requestAnimationFrame
D. 防抖会合并请求，节流不会
答案：B
解析：
💡 它解决了什么问题：
解决了因高频事件（如 window resize、scroll、mousemove 或 input 输入）触发频繁、同步计算太重、大范围 DOM 变更，导致主线程瞬间爆满、帧率骤降卡顿的运行时性能缺陷。

🔍 核心原理解析（防拷打）：
1. 防抖（Debounce）的核心原理是“延迟与重置”：它利用定时器，在连续高频触发时不断清除旧的计时器并重新计时，直至用户操作停止且静止时间达到设定的阈值后，才执行一次回调。适用于搜索联想输入、窗口大小重算。
2. 节流（Throttle）的核心原理是“稀释频率”：它确保在设定的时间窗口内（如 100ms），只允许一次回调函数执行，其余高频触发的请求均被阻断。适用于滚动页面无限加载（Infinite Scroll）、滚轮图表缩放。
3. 面试官拷打：节流的两种实现（时间戳 vs 定时器）有什么区别？时间戳实现会在事件触发的瞬间**立刻执行**，且停止后不会再执行最后一次；定时器实现则是在延迟设定时间后**首次执行**，并且能确保在停止后额外触发最后一次漏掉的回调。在防抖和节流中，为保证不丢帧，可进一步将回调挂载在 `requestAnimationFrame` 下运行。

### Q5 [multiple]
关于虚拟列表（Virtual List），以下哪些说法正确？
A. 虚拟列表的核心是只渲染视口内可见的 DOM 节点
B. 虚拟列表可以有效解决大量 DOM 节点导致的渲染和交互性能问题
C. 虚拟列表需要每行高度固定，不能处理不定高度的列表
D. 滚动时通过计算 scrollTop 和 itemHeight 确定起止索引
答案：ABD
解析：
💡 它解决了什么问题：
解决了在展示海量数据（如 10 万行微博列表、商品瀑布流）时，由于生成数万个真实 DOM 节点，导致浏览器面临沉重的 V8 内存占用、极其缓慢的样式计算与重排（Reflow），使滚动卡死乃至 OOM 崩溃的痛点。

🔍 核心原理解析（防拷打）：
1. 虚拟列表（Virtual List）的核心机制是“按需渲染”与“视口计算”。浏览器在进行样式计算和布局时，其时间复杂度随着 DOM 节点数量的增长而呈非线性飙升。虚拟列表通过计算滚动容器的 `scrollTop`，在运行时精准裁减只保留视口内可见的几十个 DOM 节点进行挂载。
2. 对于不定高度的列表（C选项错误），优化的工程方案是：① 引入预估高度（Estimated Height）进行占位计算，并对列表项渲染后在 `useLayoutEffect` 中通过 `getBoundingClientRect` 动态测量并缓存实际高度；② 实时修正滚动容器的整体滚动高度和累计 Offset，以避免滚动条突兀跳动。
3. 极端边界追问：当快速滑动虚拟列表时，出现短暂的“白屏闪烁”该如何排查和解决？白屏是由于主线程 JS 计算与排版的速度跟不上 GPU 合成器（Compositor）的滚动响应速度。解决方案通常是：① 设置合理的外缓冲区（Buffer），预先渲染视口外额外 5~10 项；② 对滑动事件进行限频，或在滚动期间采用 CSS 骨架图占位。

### Q6 [single]
以下哪个操作最容易导致 CLS（累计布局偏移）？
A. 加载大型 JavaScript 文件
B. 图片没有设置 width/height 属性，加载完成后撑开布局
C. 使用 CSS transition 做动画
D. 在页面底部加载第三方脚本
答案：B
解析：
💡 它解决了什么问题：
解决了页面在加载过程中，由于异步资源尺寸未确定，导致文档流位置发生突发性的剧烈跳动，引发用户误触广告、确认按钮，甚至中断阅读体验的视觉稳定性难题。

🔍 核心原理解析（防拷打）：
1. CLS（Cumulative Layout Shift）累计布局偏移指标计算的是视口中所有可见元素在其生命周期内“非预期发生位移”的偏离分数的最大会话窗口累加。
2. 当图片、广告或 iframe 容器在 HTML 中没有指定 `width` / `height` 或者 CSS 的 `aspect-ratio` 比例时，浏览器在解析 HTML 过程中会默认分配 0 像素高度；当这些资源二进制数据下载完毕并被渲染引擎解析出实际大小后，会在主线程重新计算整个 DOM 树的几何坐标并触发重排（Reflow），把原本在其下方的所有节点无预警向下挤压。
3. 面试大厂追问：如何避免第三方动态广告导致的 CLS 劣化？工程上应当：① 为广告位设置最大/最小高度的稳定占位空间；② 如果广告未能加载成功，保留占位骨架或显示占位文案，而绝不应该将空间坍塌收缩（Collapse）；③ 限制将广告动态插入至页面的顶端，优先将其渲染于视口外部或固定侧边栏中。

### Q7 [judgment]
在前端动画与渲染优化中，`requestAnimationFrame` 比 `setTimeout(fn, 0)` 更适合执行动画逻辑，因为它保证在浏览器下次渲染绘制前执行。
答案：对
解析：
💡 它解决了什么问题：
解决了利用 `setTimeout` 或 `setInterval` 实现前端动画时，由于事件循环（Event Loop）宏任务队列积压引起的动画时间帧“漂移”、跳帧、画面撕裂以及在后台 Tab 运行依旧消耗 CPU/电池寿命的弊病。

🔍 核心原理解析（防拷打）：
1. 浏览器的渲染管线是在每次事件循环的“渲染阶段”执行，包括样式计算、布局、绘制和合成。`setTimeout(fn, 0)` 的回调执行是作为普通的宏任务挂在队列中，无法预测其何时调度，容易发生在一个帧周期内执行多次或不执行的“丢帧”现象。
2. `requestAnimationFrame`（rAF）的回调是直接注册在浏览器的渲染通道中，在每次浏览器物理重绘（通常是配合显示器 16.7ms 的刷新频率）**之前**被严格执行一次，这确保了动画更新与显示器的物理刷新率完全同步，消除了跳帧。
3. 大厂追问：当页面处于后台运行（Tab 隐藏或浏览器最小化）时，rAF 与 setTimeout 表现有什么不同？当页面不可见时，rAF 动画会完全**暂停**，从而极大地节省了客户端主线程的 CPU 算力和移动设备的电池电量；而 `setTimeout` 虽在现代浏览器中会被降频至 1 秒触发一次，但仍会继续空转消耗资源。

### Q8 [multiple]
关于 HTTP 缓存策略，以下哪些描述正确？
A. `no-cache` 不等于禁用缓存，它表示使用前必须向服务器验证
B. `no-store` 才是完全禁用缓存
C. `immutable` 告诉浏览器在有效期内无需进行条件请求验证
D. HTML 文件通常适合设置 `max-age=31536000` 长期缓存
答案：ABC
解析：
💡 它解决了什么问题：
解决了在前端打包产物全面引入 hash（文件名哈希）更新机制后，如果 HTML 引导文件本身被设置了强缓存，导致用户在版本升级后无法拉取到最新的 HTML，从而继续访问旧的、已失效甚至已从 CDN 下线的静态资源文件的致命故障。

🔍 核心原理解析（防拷打）：
1. 现代 SPA 应用是以 HTML 作为所有打包资源的入口（如 `<script src="/app.hash.js">`）。静态资源（JS/CSS/Image）由于文件名带有 unique hash，可以放心设置 `Cache-Control: max-age=31536000` 超长缓存。
2. HTML 入口文件本身极不适合设置强缓存（D选项错误）。若将 HTML 设置强缓存，浏览器在缓存期内将直接读取本地 HTML 副本，不再向服务器请求新版 HTML，导致客户端完全无法感知线上新版本的发布。
3. 最佳实践是给 HTML 设置 `Cache-Control: no-cache` 或 `max-age=0, must-revalidate`。这表示浏览器每次都必须携带 ETag 或 Last-Modified 前往源服务器进行条件验证（304校验）。一旦检测到文件更新（ETag 改变），能立刻获取最新 HTML 以引入新版 hash 资源。

### Q9 [single]
以下哪种方案最适合优化 10 万条数据的列表渲染性能？
A. 使用 CSS will-change: transform 开启 GPU 加速
B. 使用 Web Worker 在后台渲染 DOM
C. 虚拟列表 + 只渲染视口内节点
D. 将所有列表项放入 DocumentFragment 后一次性插入
答案：C
解析：
💡 它解决了什么问题：
解决了试图一次性将十万级别的大型 DOM 结构注入页面时，主线程被连续样式计算（Recalculate Style）与重排布局（Layout）长期独占卡死，直接使整个浏览器进程瞬间假死、白屏或系统崩溃的硬伤。

🔍 核心原理解析（防拷打）：
1. DOM 节点本身在浏览器底层（C++ 实现）是一个极其庞大的对象，创建、插入 DOM 的 JS 计算非常昂贵；更为致命的是，十万个 DOM 的样式计算时间复杂度极大。
2. `DocumentFragment` 仅仅是一次性插入，无法减少 DOM 树的最终节点数量，样式重算与布局避无可避；Web Worker 无法直接访问 DOM API（B错，多线程隔离限制）；`will-change` 仅在 GPU 渲染加速层进行图层分层，无法优化 DOM 树解析开销。只有虚拟列表从根本上消除了非视口内的真实 DOM 节点，让浏览器始终保持轻量级渲染。
3. 面试大厂追问：在虚拟列表中，如果列表项包含复杂的图像渲染和动画，频繁挂载与卸载 DOM 仍然会引起少量布局开销（Layout Scope），如何优化？可以使用“DOM 节点复用”策略（类似 React Fiber 的 Diff 或虚拟 DOM 复用）：始终保持固定数量 of DOM 卡片，只修改卡片内部的数据（TextContent/Src），避免反复销毁与重建 DOM 节点。

### Q10 [judgment]
在前端性能优化中，对首屏可见的 LCP（最大内容渲染）核心图片添加 `loading="lazy"` 延迟加载可以提升页面性能。
答案：错
解析：
💡 它解决了什么问题：
纠正了团队不分场景盲目应用“图片懒加载”作为性能优化通用手段，导致页面最重要的核心首屏主图因等待布局计算和网络延迟，反而大幅度拖慢 LCP 体验的工程误区。

🔍 核心原理解析（防拷打）：
1. 原生懒加载 `loading="lazy"` 的原理是延迟加载：浏览器在 HTML 解析阶段虽然发现了 `<img>` 标签，但不会立即发起网络请求。渲染引擎必须等到 DOM 树构建完成、CSS 计算完毕、进行布局（Layout）后，判定图片元素是否接近或进入视口（Intersection Observer 逻辑），才会触发图片的网络请求。
2. 首屏 LCP 图片本就处于视口核心位置。如果对其加了懒加载，导致该图片无法在 Preload Scanner（预解析器）扫描到它的第一时刻发起网络请求，而是被延后到了 Layout 阶段之后，严重拉长了 LCP 的“资源发现延迟”。
3. 极端边界追问：对于不能 100% 确定是否为首屏图片的元素（如轮播图），如何决定是否懒加载？最佳实践为：在服务端渲染（SSR）或静态模板中，对确定的前 1-2 张首屏图（如电商首屏大图）设置 `fetchpriority="high"` 且不加懒加载；而对其余折叠线以下的图片，统一使用 `loading="lazy"` 进行延迟处理。

### Q11 [multiple]
Bundle 体积优化常用的手段有哪些？
A. Tree Shaking 消除未使用的代码
B. 动态导入（import()）实现代码分割
C. 第三方大型库按需引入或外部化（externals）
D. 使用 CSS-in-JS 替代外部 CSS 文件
答案：ABC
解析：
💡 它解决了什么问题：
澄清了引入 CSS-in-JS（如 styled-components、emotion）对静态构建包体积带来的负面性能开销，指出了前端在运行时由于动态解析 CSS 导致的 CPU 损耗以及如何选择体积优化手段。

🔍 核心原理解析（防拷打）：
1. Tree Shaking（消除无效代码）、代码分割（利用 dynamic import 提取 chunk）以及 externals（剥离公共库至 CDN 加载）是减少前端构建产物总体积（Bundle Size）的经典优化策略。
2. 传统的运行时 CSS-in-JS 会在 JavaScript 包中打包一个体积不小的编译器/解析引擎（如 Emotion 的 stylis），直接增加了打包体积；而且在运行时，由于每次组件渲染都需要动态生成 CSS 字符串、哈希化并向 HTML 头部插入 `<style>` 标签，会额外增加主线程的 CPU 负载，甚至导致 INP 指标变差。
3. 大厂追问：CSS-in-JS 真的无法用于体积和性能优化吗？现代方案已开始拥抱**零运行时（Zero-Runtime）CSS-in-JS** 框架（如 Linaria、Vanilla Extract）。它们在构建（Build Time）阶段通过 Babel 插件将 styled 语法静态编译并抽离成原生的 `.css` 文件，既保留了 CSS-in-JS 的开发体验，又规避了运行时的 JS 体积与主线程开销。

### Q12 [single]
Brotli 压缩相比 gzip 的主要优势是？
A. 解压速度更快，适合低端设备
B. 相同质量下文件更小（约小 15~25%），降低传输体积
C. 支持所有浏览器，兼容性更好
D. 可以在客户端实时压缩上传的文件
答案：B
解析：
💡 它解决了什么问题：
解决了在有限的网络带宽和长 RTT（往返时延）下，传统 gzip 压缩极限已达瓶颈，需要通过更先进的算法来缩短静态文本文件在网络层传输耗时，从而显著加速首屏关键路径资源获取速度的问题。

🔍 核心原理解析（防拷打）：
1. Brotli 压缩是由谷歌开发的新一代无损压缩算法，它采用了一个包含 1.3 万个常用中文、英文、HTML/JS/CSS 常用词汇的“内置字典”，并结合改进的 LZ77 算法和霍夫曼编码。在相同文本数据下，其压缩产物通常比传统 gzip 还要小 15% 到 25% 左右，能显著减少静态资源下载时间。
2. Brotli 的工程取舍：Brotli 包含 11 个压缩等级。高等级的压缩需要消耗极高的服务端 CPU 算力和较长的压缩时间，这对于高并发实时请求是无法接受的。因此在实际工程中：对于静态 JS/CSS 资源，通常在 Webpack 构建打包阶段预压缩成 `.br` 静态文件供 Web 服务器直出；而对于动态页面响应，则通过 CDN 边缘节点的硬件加速进行动态压缩。
3. 大厂追问：Brotli 支持哪些协议和浏览器？Brotli 要求必须在 HTTPS（安全协议）环境下才能被浏览器支持（避免网络代理中介被干扰），当浏览器在请求头中携带 `Accept-Encoding: br` 时，服务端方可返回 `Content-Encoding: br` 格式的文件。

### Q13 [judgment]
在前端首屏渲染与性能优化中，使用 SSR（服务端渲染）一定能提升 LCP（最大内容渲染）性能。
答案：错
解析：
💡 它解决了什么问题：
打破了“SSR 必然带来性能加速”的银弹神话，揭示了由于服务端路由解析、远程数据抓取阻塞、网关转发瓶颈等引起的服务端“冷启动”与“首字节白屏”（TTFB 差）反向拖累客户端 LCP 体验的架构痛点。

🔍 核心原理解析（防拷打）：
1. 传统的客户端渲染（CSR）在接收到极简的 HTML 后，必须经历“下载 JS -> 执行框架路由 -> 异步 API 抓取 -> 组装并渲染 DOM”的漫长阶段。而服务端渲染（SSR）在服务端就完成 HTML 的拼接，将已包含首屏骨架和主要数据的 HTML 直接推送给客户端，极大地提前了 FP、FCP 并有助于加速 LCP 元素的呈现。
2. 但 SSR 的耗时受制于服务端执行 JavaScript 并等待接口返回的速度。如果服务端在渲染 HTML 时，必须串行等待多个慢接口（TTFB 增高），浏览器在等待首字节到达期间会处于绝对白屏，从而抵消了 SSR 的所有优势，甚至使 LCP 指标更差。
3. 面试大厂追问：如何治理高动态 SSR 下的 TTFB 瓶颈？可应用以下高级模式：① 引入流式渲染（Streaming SSR，使用 React 的 renderToPipeableStream）：将 `<head>` 和基础骨架以流的形式即刻发送给客户端，使浏览器提前下载 JS/CSS 资源，而慢接口数据则在后续通过流通道逐步推送到屏幕上；② 对半动态内容采用增量静态生成（ISR，Incremental Static Regeneration），在 CDN 边缘节点实现毫秒级响应。

### Q14 [single]
`<link rel="prefetch">` 和 `<link rel="preload">` 的核心区别是？
A. preload 用于图片，prefetch 用于脚本
B. preload 是高优先级（当前页面需要），prefetch 是低优先级（未来页面可能需要）
C. prefetch 只支持 HTTP/2
D. preload 会阻塞页面渲染，prefetch 不会
答案：B
解析：
💡 它解决了什么问题：
解决了在浏览器复杂的资源请求队列中，开发者由于无法手动指引请求优先级，导致当前页面急需的资源下载被滞后、或者未来页面所需的资源加载抢占了当下渲染带宽的调度痛点。

🔍 核心原理解析（防拷打）：
1. 浏览器渲染引擎内置了严密的资源分配机制。`<link rel="preload">` 是**强强制性的指令**，它指示预加载扫描器将该资源的优先级提到最高（由资源类型决定，如 CSS/Font/Script），代表当前页面的渲染**绝对不可或缺**，必须立即启动下载。
2. `<link rel="prefetch">` 则是**提示性的推荐**，它指示浏览器在当前页面所有核心资源加载完毕、主线程空闲（Idle）时，利用多余的带宽静默下载资源缓存到本地，代表该资源是**未来页面（如下一页）**可能会用到的。
3. 极端边界拷打：若使用 preload 预加载了某资源，但在随后的 3 秒内页面并没有执行该资源的引用，会发生什么？Chrome 会在控制台打印一条 unused preload 警报。此外，如果 preload 和 prefetch 在同一时间加载同一资源，会导致该资源在网络中被下载两次，这同样是严重的带宽资源浪费。

### Q15 [multiple]
以下哪些是减少 INP 的有效方法？
A. 将 Long Task 分解为多个小任务，用 scheduler.yield() 让出主线程
B. 使用 Web Worker 处理 CPU 密集型计算
C. 使用虚拟列表减少大量 DOM 操作
D. 给所有图片加 loading="lazy"
答案：ABC
解析：
💡 它解决了什么问题：
解决了页面在长时间交互运行下（如连续填写复杂表单、长图表点击），主线程被大体积同步任务、强制回流（Layout Thrashing）或过多 DOM 节点调和频繁锁死，导致用户点击毫无反馈的性能顽疾。

🔍 核心原理解析（防拷打）：
1. INP (Interaction to Next Paint) 指标的核心治理在于：① 缩短 Input Delay：避免主线程被大于 50ms 的 JavaScript 长任务（Long Task）独占，从而能快速提取用户的输入事件；② 缩短 Processing Duration：优化回调本身的执行效率；③ 缩短 Presentation Delay：规避由于重写 DOM 导致的大范围重布局与重绘。
2. 将 Long Task 进行任务分片（Time Slicing），使用 scheduler.yield() 或微任务机制把执行流拆成多段，强行插缝让出主线程给用户事件；使用 Web Worker 剥离 CPU 密集算法；使用虚拟列表消除视口外的无用 DOM 结构。
3. 大厂追问：图片懒加载（D选项）为什么对 INP 没有帮助？因为图片懒加载优化的是首次首屏资源的网络带宽占用，减少的是 LCP 时间。一旦页面完全呈现进入可交互状态，用户的点击响应速度（INP）完全受制于当时的 CPU 执行和 DOM 渲染开销，与图片的懒加载行为毫无因果关联。

### Q16 [single]
以下关于 `font-display: swap` 的说法，哪个是正确的？
A. 完全消除由于字体解析耗时而导致的布局偏移（CLS）
B. 在自定义字体加载完成前优先显示系统回退（Fallback）字体，加载完成后再切换，以避免 FOIT（无样式文本闪烁）
C. 在字体文件加载完成前，阻塞页面渲染以保证首屏排版的绝对稳定性
D. 允许自定义字体与系统默认衬线字体在渲染时进行无缝的多通道混合绘制
答案：B
解析：
💡 它解决了什么问题：
解决了由于网络加载自定义字体文件（WOFF2/TTF）慢，导致浏览器为了避免无样式字体闪烁（FOUC）而默认将文字区域保持 3 秒不可见（FOIT，Flash of Invisible Text），产生“字迟迟不出来”的严重首屏阅读障碍。

🔍 核心原理解析（防拷打）：
1. 浏览器在加载自定义 Web 字体时，其渲染引擎会进入一个“字体阻塞期”（Font Block Period）。如果在此期间字体未下载完，文字就会被隐藏。若设置了 `font-display: swap`，浏览器会立即使用系统默认回退字体（Fallback Font）将文本绘制出来，一旦自定义字体下载完成，再瞬间将其替换为自定义字体。
2. swap 策略的工程权舍在于：用少量的布局偏移（FOUT，因为系统字体与自定义字体的字符间距、高度不同，替换时文字容器尺寸会变化，引起 CLS）去换取页面内容“立即可见”的感官体验。
3. 大厂面试追问：如何消除 font-display: swap 带来的字符切换闪烁与 CLS？现代 CSS 引入了字体度量微调属性（如 `@font-face` 中的 `size-adjust`、`ascent-override`、`descent-override`）。大厂会通过工具（如 Capsize）测量自定义字体与系统默认字体的几何偏离度，并在 CSS 中设置微调比例，使两者占据的几何空间完美重合，从而实现零 CLS 的丝滑字体过渡。

### Q17 [single]
关于浏览器对同一个域名限制最多 6 个并发 TCP 连接的机制，下列协议或方案中能够彻底解决这一并发限制的是？
A. 开启服务端 Gzip 压缩
B. 升级网络传输协议至 HTTP/2 (多路复用)
C. 将静态资源托管至 CDN 节点上
D. 使用 Promise.all 对接口进行合并发送
答案：B
解析：
💡 它解决了什么问题：
解决了在 HTTP/1.1 协议下，由于浏览器连接并发上限限制（同源 6 个），导致多余请求被强行挂起，进而延长关键路径资源下载的问题。
🔍 核心原理解析：
HTTP/2 引入了多路复用机制，允许在单个 TCP 连接上同时交错传输多个请求 and 响应，从根本上打破了并发限制。而 Promise.all 只是应用层发起请求的方式，底层连接池依然受限。

### Q18 [judgment]
在前端性能优化中，使用 `Promise.all` 进行接口并行初始化时，必须考虑到旧版本浏览器的兼容性以及依赖数据的先后顺序，必要时应提供串行的稳态回退机制（Graceful Degradation）。
答案：对
解析：
💡 它解决了什么问题：
解决了在复杂系统级或遗留项目中，接口突然由串行改为并行可能导致上下文（Context）依赖缺失，触发页面级运行时崩溃的问题。
🔍 核心原理解析：
对于并行化改造，通过设置降级逻辑（如在 Context 缺失时自动切换回串行加载），能够在优化性能的同时，保障系统的稳定性和容灾能力。
