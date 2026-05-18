---
title: 前端性能优化系统复盘
difficulty: 进阶
tags: [performance, LCP, INP, CLS, bundle, network, render, cache]
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

## 📝 面试题自测

### Q1 [single]
以下哪个 Core Web Vitals 指标衡量交互响应延迟（2024年已取代 FID）？
A. LCP
B. CLS
C. INP
D. FCP
答案：C
解析：INP（Interaction to Next Paint）于2024年3月正式取代 FID，衡量页面整个生命周期内所有交互的响应延迟中位数（P98）。

### Q2 [multiple]
提升 LCP 的有效手段包括哪些？
A. 使用 `<link rel="preload" fetchpriority="high">` 预加载 LCP 图片
B. 将所有 CSS 内联到 HTML，消除渲染阻塞
C. 为 `<script>` 标签添加 `defer` 属性
D. 给图片加 `loading="lazy"` 实现懒加载
答案：ABC
解析：D 错误，对 LCP 图片加懒加载会延迟加载，反而使 LCP 更慢。LCP 图片应该优先加载，使用 fetchpriority="high"。

### Q3 [judgment]
设置 `Cache-Control: max-age=31536000, immutable` 适合用在文件名带有 hash 的静态资源上。
答案：对
解析：带 hash 的文件内容不变则 URL 不变（命中缓存），内容变了 hash 也变（URL 变化，不命中旧缓存），因此可以放心设置超长缓存。

### Q4 [single]
防抖（Debounce）和节流（Throttle）最关键的区别是？
A. 防抖只能用于输入框，节流只能用于滚动事件
B. 防抖在最后一次触发后执行，节流保证在时间间隔内最多执行一次
C. 防抖使用 setTimeout，节流使用 requestAnimationFrame
D. 防抖会合并请求，节流不会
答案：B
解析：防抖（Debounce）重置计时器，连续触发时只有停止后才执行；节流（Throttle）保证固定时间间隔内最多触发一次，不会因停止而延迟。

### Q5 [multiple]
关于虚拟列表（Virtual List），以下哪些说法正确？
A. 虚拟列表的核心是只渲染视口内可见的 DOM 节点
B. 虚拟列表可以有效解决大量 DOM 节点导致的渲染和交互性能问题
C. 虚拟列表需要每行高度固定，不能处理不定高度的列表
D. 滚动时通过计算 scrollTop 和 itemHeight 确定起止索引
答案：ABD
解析：C 错误，不定高度的虚拟列表可以通过预估高度 + 渲染后测量实际高度 + 更新偏移量的方式实现，如 react-virtual 等库都支持。

### Q6 [single]
以下哪个操作最容易导致 CLS（累计布局偏移）？
A. 加载大型 JavaScript 文件
B. 图片没有设置 width/height 属性，加载完成后撑开布局
C. 使用 CSS transition 做动画
D. 在页面底部加载第三方脚本
答案：B
解析：图片未设置尺寸时，浏览器无法预留空间，图片加载后会导致下方内容突然下移，是 CLS 最常见来源。

### Q7 [judgment]
`requestAnimationFrame` 比 `setTimeout(fn, 0)` 更适合做动画，因为它保证在浏览器下次渲染前执行。
答案：对
解析：rAF 与浏览器的渲染节奏（通常 60fps/16.7ms）同步，不会出现多次修改只渲染一次或跳帧的问题；setTimeout(0) 的执行时机不稳定。

### Q8 [multiple]
关于 HTTP 缓存策略，以下哪些描述正确？
A. `no-cache` 不等于禁用缓存，它表示使用前必须向服务器验证
B. `no-store` 才是完全禁用缓存
C. `immutable` 告诉浏览器在有效期内无需进行条件请求验证
D. HTML 文件通常适合设置 `max-age=31536000` 长期缓存
答案：ABC
解析：D 错误，HTML 文件不能长期缓存，因为它是引用其他资源（带 hash 的 JS/CSS）的入口，更新时需要立即生效。应使用 no-cache。

### Q9 [single]
以下哪种方案最适合优化 10 万条数据的列表渲染性能？
A. 使用 CSS will-change: transform 开启 GPU 加速
B. 使用 Web Worker 在后台渲染 DOM
C. 虚拟列表 + 只渲染视口内节点
D. 将所有列表项放入 DocumentFragment 后一次性插入
答案：C
解析：Web Worker 无法直接操作 DOM（B错）；will-change 对 10 万个节点无效；DocumentFragment 一次插入后仍然有 10 万个 DOM 节点。只有虚拟列表从根本上解决了 DOM 节点数量问题。

### Q10 [judgment]
对 LCP 图片添加 `loading="lazy"` 可以提升页面性能。
答案：错
解析：loading="lazy" 会延迟加载折叠线以下的图片，但 LCP 图片通常在首屏可见，懒加载会推迟其加载，直接导致 LCP 分数下降。

### Q11 [multiple]
Bundle 体积优化常用的手段有哪些？
A. Tree Shaking 消除未使用的代码
B. 动态导入（import()）实现代码分割
C. 第三方大型库按需引入或外部化（externals）
D. 使用 CSS-in-JS 替代外部 CSS 文件
答案：ABC
解析：CSS-in-JS 通常会增加 JS 体积，不属于体积优化手段。A、B、C 是标准做法。

### Q12 [single]
Brotli 压缩相比 gzip 的主要优势是？
A. 解压速度更快，适合低端设备
B. 相同质量下文件更小（约小 15~25%），降低传输体积
C. 支持所有浏览器，兼容性更好
D. 可以在客户端实时压缩上传的文件
答案：B
解析：Brotli 使用更复杂的压缩算法，产物通常比 gzip 小 15~25%；但压缩速度较慢，通常在构建时预压缩（或 CDN 实时压缩）。

### Q13 [judgment]
使用 SSR（服务端渲染）一定能提升 LCP。
答案：错
解析：SSR 可以减少白屏时间（TTFB 后 HTML 已包含内容），有助于 LCP；但如果服务器响应慢（TTFB 高），SSR 反而会拖慢 LCP。SSR 并不是银弹。

### Q14 [single]
`<link rel="prefetch">` 和 `<link rel="preload">` 的核心区别是？
A. preload 用于图片，prefetch 用于脚本
B. preload 是高优先级（当前页面需要），prefetch 是低优先级（未来页面可能需要）
C. prefetch 只支持 HTTP/2
D. preload 会阻塞页面渲染，prefetch 不会
答案：B
解析：preload 告诉浏览器"这个资源当前页面马上要用，高优先级预加载"；prefetch 是"未来页面可能用，空闲时预加载"，优先级低。两者都不阻塞渲染。

### Q15 [multiple]
以下哪些是减少 INP 的有效方法？
A. 将 Long Task 分解为多个小任务，用 scheduler.yield() 让出主线程
B. 使用 Web Worker 处理 CPU 密集型计算
C. 使用虚拟列表减少大量 DOM 操作
D. 给所有图片加 loading="lazy"
答案：ABC
解析：D（图片懒加载）主要优化 LCP，对 INP 无直接帮助。A、B、C 都能减少主线程占用，直接改善交互响应。

### Q16 [single]
以下关于 `font-display: swap` 的说法，哪个是正确的？
A. 完全消除自定义字体的 CLS
B. 先显示系统回退字体，自定义字体加载完成后替换，避免 FOIT（字体不可见闪烁）
C. 让字体异步加载，不阻塞页面渲染
D. 仅在 Chrome 中有效
答案：B
解析：font-display: swap 避免了 FOIT（Flash of Invisible Text），代价是 FOUT（Flash of Unstyled Text，字体切换时的布局偏移），选择 swap 意味着接受少量 CLS 换取不闪烁的文字。
