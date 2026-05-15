import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const PERFORMANCE_DIAGNOSTICS_CONTENT = {
  id: 'performance-diagnostics',
  name: '深度长文：性能诊断',
  icon: '⚡',
  desc: '沿着技术破冰性能树，深入 Web Vitals、首屏、交互、稳定性、预算和内存诊断。',
  sourceCards: ['前端性能优化', '性能指标与度量', 'LCP 与首屏加载', 'INP 与交互响应', 'Long Task 与主线程让出', 'CLS 与视觉稳定', '资源加载与缓存策略', '渲染流程与渲染性能', '性能监控与性能预算', 'Chrome Memory 与 Performance Monitor'],
  docs: [
    makeLongformDoc({
      title: 'Web Vitals 诊断：慢不是感觉，是指标链路',
      sourceCards: ['前端性能优化', '性能指标与度量'],
      problem: '它解决的是团队用主观体验争论性能的问题。中高级前端要把“慢”拆成 LCP、INP、CLS、TTFB、FCP、资源瀑布、主线程任务和真实用户分布，而不是只看自己的电脑或一次 Lighthouse 分数。',
      customerCase: '客户反馈活动页“打开慢”，开发本地 Lighthouse 90 分，于是认为没问题。但 RUM 显示低端安卓和 4G 网络下 p75 LCP 超过 5 秒。真正的问题不是平均值，而是真实用户分布里的长尾。',
      flow: [
        '先定义业务页面和目标用户群，不直接优化全站平均值。',
        '采集 RUM 数据，按页面、设备、网络、地域、版本拆分。',
        '用 LCP、INP、CLS 判断主要体验类型：加载、交互、稳定性。',
        '用实验室工具复现具体页面和路径。',
        '定位到网络、服务端、资源、JS、渲染或第三方脚本。',
        '上线后对比 p75、错误率和业务转化，而不是只看单次结果。',
      ],
      keywords: [
        { term: 'LCP', desc: '最大内容绘制，衡量首屏主要内容多久出现。[→ web.dev LCP](https://web.dev/articles/lcp)' },
        { term: 'INP', desc: '交互到下一次绘制，衡量用户操作后的响应速度。[→ web.dev INP](https://web.dev/articles/inp)' },
        { term: 'CLS', desc: '累计布局偏移，衡量页面视觉稳定性。[→ web.dev CLS](https://web.dev/articles/cls)' },
        { term: 'TTFB', desc: '首字节时间，常反映服务器、网关、缓存和网络入口问题。[→ web.dev TTFB](https://web.dev/articles/ttfb)' },
        { term: 'RUM', desc: '真实用户监控，比实验室分数更能代表线上体验。[→ web-vitals npm](https://github.com/GoogleChrome/web-vitals)' },
        { term: 'p75', desc: '第 75 百分位，Web Vitals 常用来衡量大多数用户体验。[→ Core Web Vitals](https://web.dev/articles/vitals)' },
      ],
      interview: '性能优化不是压缩文件，而是先用 RUM 和实验室工具把用户体验拆成 LCP、INP、CLS 等指标，再定位网络、服务端、资源、JavaScript 和渲染瓶颈，最后用数据验证优化是否真的改善真实用户。',
      demo: `最小 RUM 上报：

\`\`\`ts
import { onCLS, onINP, onLCP } from 'web-vitals'

function report(metric) {
  navigator.sendBeacon('/rum', JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: location.pathname,
    connection: navigator.connection?.effectiveType,
    release: window.__RELEASE__
  }))
}

onLCP(report)
onINP(report)
onCLS(report)
\`\`\`

这个 demo 的重点不是上报 API，而是每条指标必须带页面、网络、版本等维度，否则无法定位具体人群。`,
      diagnosis: [
        '先看 RUM p75，而不是只看本地 Lighthouse。',
        '按页面、设备、网络、浏览器、版本切分，找到最差人群。',
        'LCP 差看 TTFB、关键资源、首屏图片、CSS、字体和渲染链路。',
        'INP 差看主线程长任务、事件回调和渲染范围。',
        'CLS 差看图片、广告、异步内容和字体替换。',
        '优化后对比同一人群同一版本窗口，避免被流量变化误导。',
      ],
      followups: [
        '为什么 p75 比平均值更适合衡量 Web Vitals？',
        '实验室数据和真实用户数据冲突时怎么判断？',
        '怎么把性能指标和业务转化关联？',
        '第三方脚本造成性能劣化如何治理？',
      ],
      deepDive: '必须深入。性能诊断是中高级前端解决客户问题的核心能力。顺序是先指标，再工具，再浏览器原理，再工程治理，最后把性能预算接入发布门禁。',
      references: [
        { title: 'web.dev：Core Web Vitals 总览', url: 'https://web.dev/articles/vitals' },
        { title: 'web-vitals npm 包文档', url: 'https://github.com/GoogleChrome/web-vitals' },
        { title: 'Chrome DevTools：Performance 面板文档', url: 'https://developer.chrome.com/docs/devtools/performance' },
        { title: 'MDN：Performance API', url: 'https://developer.mozilla.org/zh-CN/docs/Web/API/Performance' },
      ],
      quiz: [
        single('性能优化最正确的起手式是？', ['先采集指标并定位瓶颈', '先重写所有代码', '先删除所有图片', '只问开发电脑是否流畅'], 0, '没有指标就无法判断优化方向。'),
        multiple('RUM 数据常见切分维度包括？', ['页面路径', '设备和网络', '浏览器和版本', '开发者姓名笔画'], [0, 1, 2], '性能问题常集中在特定页面、人群和版本。'),
        judgment('一次 Lighthouse 高分就能证明所有真实用户体验都很好。', 1, '实验室数据不能覆盖真实设备、网络和长尾用户。'),
        single('INP 主要衡量什么？', ['交互后的响应和下一次绘制', '首屏最大内容出现', '页面是否乱跳', '接口字段命名'], 0, 'INP 关注用户交互响应。'),
        multiple('LCP 差可能来自？', ['TTFB 慢', '首屏图片慢', 'CSS 阻塞', '客户端渲染过重'], [0, 1, 2, 3], 'LCP 是跨网络、资源和渲染链路的指标。'),
        single('p75 的价值是？', ['关注大多数用户而不是少数极端或平均掩盖', '替代所有监控', '只用于后端 CPU', '用于 CSS 命名'], 0, 'p75 是 Web Vitals 常用聚合方式。'),
      ],
    }),
    makeLongformDoc({
      title: 'LCP 首屏链路：最大内容为什么迟迟不出现',
      sourceCards: ['LCP 与首屏加载', '资源加载与缓存策略', '渲染流程与渲染性能'],
      problem: '它解决的是首屏主要内容出现慢的问题。LCP 不是单点指标，它可能被 TTFB、HTML 流、CSS 阻塞、字体、首屏图片、客户端 JS、接口取数、资源优先级和 CDN 缓存共同影响。',
      customerCase: '一个商品详情页 LCP 元素是首屏主图。团队先压缩 JS，但效果很小。Performance 面板显示主图发现晚、优先级低，并且 CSS 阻塞首屏渲染。最终通过 preload 关键图、优化图片尺寸、内联关键 CSS 和 CDN 缓存才明显改善。',
      flow: [
        '确认 LCP 元素到底是什么，不猜测。',
        '拆分 LCP：TTFB、resource load delay、resource load duration、element render delay。',
        '优化服务器响应和 HTML 到达时间。',
        '让关键 CSS、字体和首屏图片更早、更高优先级加载。',
        '减少首屏 JS 阻塞和客户端渲染等待。',
        '用 RUM 验证目标人群 p75 是否改善。',
      ],
      keywords: [
        { term: 'LCP element', desc: '被浏览器认定为最大内容绘制的元素，可能是图片、文本块或视频首帧。[→ web.dev Optimize LCP](https://web.dev/articles/optimize-lcp)' },
        { term: 'TTFB', desc: 'HTML 第一个字节到达前的时间。[→ web.dev TTFB](https://web.dev/articles/ttfb)' },
        { term: 'preload', desc: '提示浏览器提前发现和加载关键资源。[→ MDN rel=preload](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/rel/preload)' },
        { term: 'fetchpriority', desc: '给浏览器资源优先级提示，常用于首屏关键图。[→ MDN fetchpriority](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority)' },
        { term: 'critical CSS', desc: '首屏渲染必须的 CSS。[→ web.dev Extract Critical CSS](https://web.dev/articles/extract-critical-css)' },
        { term: 'render delay', desc: '资源已到但元素仍因 JS、CSS 或渲染阻塞而没有绘制。[→ web.dev LCP 子指标拆解](https://web.dev/articles/optimize-lcp#lcp_breakdown)' },
      ],
      interview: '优化 LCP 要先找 LCP 元素，再拆成 TTFB、资源发现、资源加载和元素渲染几个阶段；常见手段是优化服务端响应、关键 CSS、首屏图片优先级、字体策略、JS 阻塞和 CDN 缓存。',
      demo: `首屏关键图优化示例：

\`\`\`html
<link rel="preload" as="image" href="/hero.avif" imagesrcset="/hero.avif 1x, /hero@2x.avif 2x">
<img
  src="/hero.avif"
  width="1200"
  height="630"
  fetchpriority="high"
  decoding="async"
  alt="商品主图"
/>
\`\`\`

不要对所有图片都 preload。只给真正的首屏 LCP 候选资源提高优先级，否则会抢占带宽。`,
      diagnosis: [
        '打开 Performance 或 Lighthouse，确认 LCP 元素。',
        '看 Network 瀑布：HTML、CSS、字体、LCP 图片是否过晚发现。',
        'TTFB 高时排查 CDN、服务端渲染、BFF 和缓存。',
        '图片 LCP 慢时检查尺寸、格式、压缩、CDN、preload、fetchpriority。',
        '文本 LCP 慢时检查字体加载、CSS 阻塞和客户端渲染。',
        '资源已加载但仍不绘制时，检查主线程长任务和框架渲染。',
      ],
      followups: [
        'preload 和 prefetch 的区别是什么？',
        '为什么首屏图片不能只靠 lazy loading？',
        'SSR 一定能改善 LCP 吗？',
        '字体加载如何影响文本 LCP？',
      ],
      deepDive: '值得深入。LCP 是电商、内容、营销页最常见的体验指标。深入时要同时懂浏览器资源调度、CDN 缓存、图片工程、服务端响应和框架渲染。',
      references: [
        { title: 'web.dev：Optimize LCP', url: 'https://web.dev/articles/optimize-lcp' },
        { title: 'MDN：rel=preload', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/rel/preload' },
        { title: 'MDN：fetchpriority', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority' },
        { title: 'Chrome DevTools：Performance 文档', url: 'https://developer.chrome.com/docs/devtools/performance' },
      ],
      quiz: [
        single('优化 LCP 第一步应该做什么？', ['确认 LCP 元素和阶段', '盲目压缩所有 JS', '删除所有 CSS', '重命名组件'], 0, '不知道 LCP 元素就无法定位瓶颈。'),
        multiple('图片 LCP 慢可能检查？', ['图片格式和尺寸', 'preload/fetchpriority', 'CDN 缓存', 'CSS 变量命名'], [0, 1, 2], '图片 LCP 和资源大小、发现时机、优先级、缓存有关。'),
        judgment('所有图片都应该 preload，这样 LCP 一定更好。', 1, '过多 preload 会争抢带宽，反而拖慢关键资源。'),
        single('TTFB 高更可能指向哪类问题？', ['服务端、CDN、网关或缓存', '按钮文案', 'DOM class 名称', '图片 alt 文案'], 0, 'TTFB 是首字节前的链路耗时。'),
        multiple('LCP 可被哪些因素拖慢？', ['CSS 阻塞', '字体加载', '客户端 JS 渲染', '首屏接口等待'], [0, 1, 2, 3], 'LCP 是端到端链路结果。'),
        single('fetchpriority="high" 更适合用于？', ['真正关键的首屏 LCP 图片', '所有非首屏图片', '所有接口请求', '所有 CSS 文件'], 0, '优先级提示应谨慎用于关键资源。'),
      ],
    }),
    makeLongformDoc({
      title: 'INP 与主线程治理：用户点了为什么没反应',
      sourceCards: ['INP 与交互响应', 'Long Task 与主线程让出', '渲染流程与渲染性能'],
      problem: '它解决的是用户交互后页面迟迟没有视觉反馈的问题。INP 把一次交互拆成 input delay、processing duration 和 presentation delay。真正影响它的常常不是接口，而是主线程长任务、事件回调重计算、框架大范围渲染和布局抖动。',
      customerCase: '客户反馈表格筛选卡顿。接口返回只需 80ms，但点击后页面 1 秒才更新。Performance 显示事件回调中同步过滤 5 万行，并触发整个表格重渲染。修复方案是服务端分页、虚拟列表、拆分计算和缩小状态更新范围。',
      flow: [
        '用 RUM 或 Performance 发现 INP 差的交互。',
        '拆分 input delay、processing duration、presentation delay。',
        '查找主线程长任务和事件回调里的同步计算。',
        '减少状态更新范围和组件重渲染范围。',
        '把重计算拆分、延后或移入 Worker。',
        '让浏览器在长流程中有机会绘制下一帧。',
      ],
      keywords: [
        { term: 'input delay', desc: '用户输入发生后，事件回调开始执行前的等待。[→ web.dev INP 指标](https://web.dev/articles/inp)' },
        { term: 'processing duration', desc: '事件回调执行和相关同步逻辑耗时。[→ web.dev Optimize INP](https://web.dev/articles/optimize-inp)' },
        { term: 'presentation delay', desc: '回调后到下一次绘制之间的延迟。[→ web.dev INP 子阶段](https://web.dev/articles/optimize-inp#presentation_delay)' },
        { term: 'Long Task', desc: '主线程上超过 50ms 的任务。[→ MDN Long Tasks API](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceLongTaskTiming)' },
        { term: 'yield', desc: '让出主线程，让浏览器有机会处理输入和绘制。[→ scheduler.yield 提案](https://developer.chrome.com/docs/web-platform/scheduler-yield)' },
        { term: 'virtualization', desc: '只渲染视口附近内容，减少 DOM 和渲染成本。[→ web.dev 虚拟列表](https://web.dev/articles/virtualize-long-lists-react-window)' },
      ],
      interview: 'INP 优化的核心是治理主线程：减少长任务、拆分重计算、缩小事件回调和渲染范围，必要时使用虚拟列表、Web Worker、调度让出和框架级 memo，让用户交互尽快产生下一次视觉反馈。',
      demo: `把长循环切片，让浏览器有机会响应：

\`\`\`ts
async function processLargeList(items, handle) {
  for (let i = 0; i < items.length; i++) {
    handle(items[i])

    if (i % 500 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
}
\`\`\`

真实项目里还可以根据场景使用 Web Worker、scheduler.yield、requestIdleCallback 或服务端分页。关键不是 API 名字，而是避免长时间独占主线程。`,
      diagnosis: [
        '先找到最差 INP 对应的具体交互，不泛泛优化。',
        'Performance 面板录制点击或输入，观察主线程任务。',
        '事件回调长时，拆计算、降频、缓存或移到 Worker。',
        '渲染慢时检查组件更新范围、列表规模、DOM 数量和布局计算。',
        'presentation delay 高时检查同步布局、样式计算和绘制压力。',
        '优化后用真实用户 p75 INP 和具体交互埋点验证。',
      ],
      followups: [
        '防抖和节流为什么不等于 INP 优化？',
        'Web Worker 适合哪些计算，不适合哪些场景？',
        'React 中哪些状态设计会放大渲染范围？',
        '虚拟列表的可访问性和动态高度如何处理？',
      ],
      deepDive: '非常值得深入。INP 已经取代 FID 成为核心交互指标，更能考察前端运行时能力。深入顺序是事件循环、长任务、渲染流水线、框架更新机制、调度 API 和 Worker。',
      references: [
        { title: 'web.dev：INP 指标文档', url: 'https://web.dev/articles/inp' },
        { title: 'web.dev：Optimize INP', url: 'https://web.dev/articles/optimize-inp' },
        { title: 'MDN：Long Tasks API', url: 'https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceLongTaskTiming' },
        { title: 'MDN：Web Workers API', url: 'https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API' },
      ],
      quiz: [
        single('INP 差最常见的技术方向是？', ['主线程长任务和渲染范围过大', 'HTML title 太短', 'Git 分支太多', '接口路径太短'], 0, 'INP 关注交互后的下一次绘制。'),
        multiple('INP 可以拆成哪些阶段？', ['input delay', 'processing duration', 'presentation delay', 'DNS TTL'], [0, 1, 2], 'INP 的三段拆解有助于定位问题。'),
        judgment('接口 80ms 就能证明点击响应一定快。', 1, '前端同步计算和渲染可能远大于接口耗时。'),
        single('虚拟列表主要解决什么？', ['大量 DOM 渲染和更新成本', 'Cookie 丢失', 'DNS 慢', '图片格式错误'], 0, '虚拟列表减少渲染节点数量。'),
        multiple('降低主线程压力的手段包括？', ['拆分长任务', 'Web Worker', '减少渲染范围', '一次渲染 10 万行'], [0, 1, 2], '一次渲染大量节点会加重压力。'),
        single('Long Task 通常指主线程上超过多少毫秒的任务？', ['50ms', '5ms', '5000ms', '1s 固定值'], 0, 'Long Tasks API 以 50ms 为阈值。'),
      ],
    }),
    makeLongformDoc({
      title: 'CLS 与渲染稳定：页面为什么突然乱跳',
      sourceCards: ['CLS 与视觉稳定', '渲染流程与渲染性能'],
      problem: '它解决的是用户正在阅读或准备点击时，页面内容突然移动的问题。CLS 的根源通常是元素尺寸不确定、异步内容插入、字体替换、广告位变化、图片视频未预留尺寸或框架 hydration 后结构变化。',
      customerCase: '客户投诉移动端结算页误点广告。分析发现顶部异步活动横幅加载后把付款按钮向下挤，用户原本要点付款却点到了横幅。修复不是优化接口，而是给横幅预留稳定空间并控制插入位置。',
      flow: [
        '确认发生布局偏移的页面、设备和交互路径。',
        '用 DevTools Layout Shifts 找到移动元素和触发源。',
        '检查图片、视频、广告、iframe 是否预留宽高。',
        '检查异步内容是否在已有内容上方插入。',
        '检查字体加载和 fallback 字体尺寸差异。',
        '检查 SSR/Hydration 是否导致 DOM 结构变化。',
      ],
      keywords: [
        { term: 'CLS', desc: '累计布局偏移，衡量非预期视觉移动。[→ web.dev CLS](https://web.dev/articles/cls)' },
        { term: 'layout shift', desc: '可见元素起始位置发生变化。[→ web.dev Optimize CLS](https://web.dev/articles/optimize-cls)' },
        { term: 'aspect-ratio', desc: '提前声明宽高比例，避免媒体资源加载后撑开布局。[→ MDN aspect-ratio](https://developer.mozilla.org/zh-CN/docs/Web/CSS/aspect-ratio)' },
        { term: 'font-display', desc: '控制字体加载期间文本显示策略。[→ MDN font-display](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@font-face/font-display)' },
        { term: 'placeholder', desc: '为异步内容保留接近最终尺寸的空间。[→ web.dev 占位最佳实践](https://web.dev/articles/optimize-cls#placeholders)' },
        { term: 'hydration mismatch', desc: '服务端 HTML 与客户端渲染结果不一致，可能引发布局变化。[→ Chrome Layout Shifts 文档](https://developer.chrome.com/docs/devtools/performance/reference#layout-shifts)' },
      ],
      interview: 'CLS 优化的核心是让页面在资源和异步内容到达前就具备稳定布局：为图片、广告、iframe、异步模块预留尺寸，控制字体替换和上方插入，并用 Layout Shifts 定位具体偏移源。',
      demo: `稳定媒体尺寸：

\`\`\`css
.product-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.promo-slot {
  min-height: 64px;
}
\`\`\`

\`\`\`html
<img class="product-cover" src="/cover.avif" alt="商品图">
<div class="promo-slot">活动加载中...</div>
\`\`\`

CLS 优化不是不让内容变化，而是让变化发生在预期空间里。`,
      diagnosis: [
        '用 DevTools Performance 或 Lighthouse 找 Layout Shifts 记录。',
        '确认是加载期间偏移还是用户交互后的合理变化。',
        '图片、视频、iframe 先查 width、height、aspect-ratio。',
        '广告、横幅、推荐位查是否预留占位。',
        '字体导致偏移时检查 font-display、fallback 字体和尺寸。',
        'SSR 页面查 hydration mismatch 和客户端二次渲染。',
      ],
      followups: [
        '用户点击后展开内容是否计入 CLS？',
        '骨架屏为什么也可能造成 CLS？',
        'SSR hydration mismatch 为什么会影响稳定性？',
        '广告位如何在收益和 CLS 之间取舍？',
      ],
      deepDive: '值得深入。CLS 看似是 UI 问题，本质涉及资源尺寸、异步渲染、广告系统、字体和 SSR。它直接影响误触、转化和可信度。',
      references: [
        { title: 'web.dev：CLS 指标文档', url: 'https://web.dev/articles/cls' },
        { title: 'web.dev：Optimize CLS', url: 'https://web.dev/articles/optimize-cls' },
        { title: 'MDN：aspect-ratio', url: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS/aspect-ratio' },
        { title: 'Chrome DevTools：Layout Shifts 文档', url: 'https://developer.chrome.com/docs/devtools/performance/reference#layout-shifts' },
      ],
      quiz: [
        single('CLS 主要衡量什么？', ['非预期布局偏移', '首屏最大内容时间', '接口响应时间', 'JS 包大小'], 0, 'CLS 关注页面是否乱跳。'),
        multiple('常见 CLS 来源包括？', ['图片未预留尺寸', '广告异步插入', '字体替换', '稳定占位'], [0, 1, 2], '稳定占位是治理手段。'),
        judgment('给图片设置 width/height 或 aspect-ratio 有助于降低 CLS。', 0, '预留尺寸能避免图片加载后撑开布局。'),
        single('用户准备点击时顶部横幅突然插入，最合理的修复是？', ['预留横幅空间或改变插入策略', '压缩 JS', '修改接口状态码', '删除 lockfile'], 0, '应让布局在内容到达前稳定。'),
        multiple('排查 CLS 可使用？', ['DevTools Layout Shifts', 'Lighthouse', 'RUM CLS 数据', 'Git commit message'], [0, 1, 2], '前三者都能帮助定位布局偏移。'),
        single('Hydration mismatch 可能导致 CLS 的原因是？', ['客户端重渲染结构和尺寸变化', 'DNS 失败', 'Cookie 被读取', 'lockfile 冲突'], 0, '服务端和客户端 DOM 不一致可能造成布局变化。'),
      ],
    }),
    makeLongformDoc({
      title: '性能预算与内存排查：优化如何不反弹',
      sourceCards: ['性能监控与性能预算', 'Chrome Memory 与 Performance Monitor', '资源加载与缓存策略'],
      problem: '它解决的是性能优化一次有效、几次迭代后又退化的问题。性能必须从项目动作变成工程门禁：预算、监控、告警、发布对比和事故复盘缺一不可；内存问题也要用工具定位对象为什么没释放。',
      customerCase: '某后台系统上线初期流畅，三个月后越用越卡。Performance Monitor 显示 DOM 节点和 JS Heap 每次切换路由后都上涨，Memory 快照发现弹窗关闭后事件监听和表格数据仍被全局 store 引用。',
      flow: [
        '定义页面级性能预算：JS 体积、LCP、INP、CLS、错误率。',
        'CI 检查构建体积和关键资源变化。',
        '发布后用 RUM 对比新旧版本和灰度组。',
        '性能异常时联动告警、暂停放量或回滚。',
        '运行时卡顿时先看 Performance Monitor 趋势。',
        '内存疑似泄漏时用 Memory 快照和 Retainers 找引用链。',
      ],
      keywords: [
        { term: 'performance budget', desc: '对体积、指标和资源数量设置可执行阈值。[→ web.dev Performance Budgets](https://web.dev/articles/performance-budgets-101)' },
        { term: 'bundle analysis', desc: '分析构建产物体积、重复依赖和 chunk 组成。[→ rollup-plugin-visualizer](https://www.npmjs.com/package/rollup-plugin-visualizer)' },
        { term: 'release comparison', desc: '按版本对比性能和错误指标，判断退化是否由发布引入。[→ Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)' },
        { term: 'JS Heap', desc: 'JavaScript 堆内存，用于观察对象占用趋势。[→ Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory-problems)' },
        { term: 'Detached DOM', desc: '已脱离页面但仍被 JS 引用的 DOM，常见泄漏源。[→ Chrome 堆快照文档](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots)' },
        { term: 'Retainers', desc: 'Memory 快照中显示对象为什么仍可达的引用链。[→ Chrome 堆快照 Retainers](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots#look_up_color_coding)' },
      ],
      interview: '性能治理要把预算接入 CI 和发布：构建期看体积，运行期看 RUM 和灰度健康指标，退化时能告警、暂停和回滚；内存泄漏则通过 Performance Monitor 观察趋势，再用 Memory 快照和 Retainers 定位引用链。',
      demo: `最小预算配置思路：

\`\`\`json
{
  "budgets": {
    "mainJsGzipKb": 180,
    "routeChunkGzipKb": 120,
    "lcpP75Ms": 2500,
    "inpP75Ms": 200,
    "clsP75": 0.1
  }
}
\`\`\`

预算不是为了卡死开发，而是让每次变慢都能被看见、解释和批准。`,
      diagnosis: [
        '构建体积变大时，先看新增依赖、重复依赖和公共 chunk 变化。',
        '线上指标退化时，按版本、灰度组、页面和人群对比。',
        '页面越用越慢时，观察 JS Heap、DOM 节点、事件监听器趋势。',
        '反复操作后手动 GC，若基线持续上升，再怀疑泄漏。',
        '用 heap snapshot 对比对象数量，并通过 Retainers 找引用链。',
        '修复后加入回归场景，避免同类泄漏再次出现。',
      ],
      followups: [
        '性能预算应该卡 CI 还是只告警？',
        '如何避免 bundle 分析只看总量不看首屏？',
        'Detached DOM 常见来源有哪些？',
        '灰度阶段性能退化如何自动止损？',
      ],
      deepDive: '值得深入。真正成熟的性能优化不是单次专项，而是持续治理。深入顺序是 bundle 分析、RUM、预算门禁、灰度对比、内存快照和事故复盘。',
      references: ['web.dev Performance Budgets', 'Chrome DevTools Memory 文档', 'Chrome Performance Monitor 文档', 'Lighthouse CI 文档'],
      quiz: [
        single('性能预算的核心价值是？', ['让性能退化可见并可治理', '替代产品需求', '删除所有图片', '禁止发布'], 0, '预算是治理手段，不是单纯限制。'),
        multiple('性能预算可以覆盖？', ['JS 体积', 'LCP p75', 'INP p75', 'CLS p75'], [0, 1, 2, 3], '预算既可包含构建体积，也可包含真实体验指标。'),
        judgment('页面内存短时间上涨就一定是内存泄漏。', 1, '需要看重复操作和 GC 后基线是否持续上升。'),
        single('Retainers 的主要用途是？', ['找对象为什么仍然被引用', '压缩图片', '修改接口路径', '生成类型声明'], 0, 'Retainers 展示对象可达引用链。'),
        multiple('页面越用越慢可观察？', ['JS Heap', 'DOM 节点数', '事件监听器数量', 'README 字数'], [0, 1, 2], '这些是 Performance Monitor 常见趋势信号。'),
        single('灰度版本性能明显退化，优先动作是？', ['暂停放量或回滚并定位', '继续全量发布', '删除监控', '忽略 p75'], 0, '灰度的目的就是提前发现并止血。'),
      ],
    }),
  ],
};
