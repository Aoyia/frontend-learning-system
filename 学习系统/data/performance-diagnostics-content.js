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
        single('在对大型 Web 应用进行性能优化治理时，以下哪项作为“起手式”最科学？', ['通过性能分析工具收集真实用户体验指标（RUM），结合性能瀑布图定位核心瓶颈。', '立即将整个旧业务项目推倒，采用最新的框架 and 组件库进行全量重构。', '采用批量无损压缩的方式，将首屏渲染所需的所有关键静态图像文件强制删除。', '仅在开发环境以开发本机的执行帧率是否流畅作为线上用户体验的唯一标准。'], 0, `💡 它解决了什么问题：
解决了盲目优化导致投入产出比（ROI）极低、无法量化优化成果以及在多维用户环境中“头痛医头、脚痛医脚”的工程失控问题。

🔍 核心原理解析（防拷打）：
1. 浏览器渲染与网络请求的生命周期高度复杂，性能瓶颈可能存在于 DNS 解析、TCP 建连、TTFB 延迟、关键渲染路径（CRP）阻塞、主线程 Long Task 或者是 DOM 节点过多等多个阶段。缺乏指标统计将导致无法实现科学的归因分析。
2. 工程上应当建立“建立基线 - 指标拆解 - 定位瓶颈 - 灰度验证”的科学排查链路。例如，针对 LCP 差，必须通过 Performance API 拆解出 TTFB、资源发现延迟、资源加载耗时和元素渲染延迟这四个子阶段，而非盲目压缩图片或混淆 JS 代码。
3. 在大厂真实用户监控（RUM）场景下，需采用 P75 或 P90 等百分位数来呈现真实的性能分布，以规避平均值（Average）和中位数（Median）对长尾低端设备、恶劣网络用户的体验遮蔽效应；同时，Lighthouse 作为实验室（Lab）工具存在局限性，其固定的设备模拟和网络限速无法真实反映复杂的网络波动及用户交互。`),
        multiple('在收集真实用户体验数据（RUM）以指导性能优化时，常见的性能指标切分维度包括？', ['用户当前访问的具体页面路径与路由分类', '用户所使用的物理设备类型与当前的网络吞吐速率', '用户运行的浏览器类型、主版本号以及渲染内核规范', '负责该模块的前端研发团队成员的姓名笔画数量'], [0, 1, 2], `💡 它解决了什么问题：
解决了单一维度的性能平均值掩盖局部业务性能退化、长尾用户体验恶劣，导致无法针对特定高价值页面或设备机型实施精准优化的工程盲区。

🔍 核心原理解析（防拷打）：
1. 真实用户监控（RUM）性能数据具有极高的离散性。不同设备的 CPU 算力（单核性能差异巨大）、不同网络制式（3G/4G/5G/Wi-Fi 的丢包率与 RTT）以及浏览器的渲染引擎差异，直接决定了同一份 JS 产物在端侧的解析、执行和绘制耗时。
2. 优化方案应当建立多维下钻分析能力，将 LCP、INP、CLS 等指标按页面路径、地理位置、网络制式（navigator.connection.effectiveType）、设备等级（通过设备内存和 CPU 核心数近似估算）进行交叉切分，从而能够迅速定位是某个特定版本引入的 JS 执行卡顿，还是特定区域 CDN 的 TTFB 异常。
3. 在实际生产中，聚合 RUM 数据需要使用 web-vitals npm 包，通过 navigator.sendBeacon 或 RFC 9116 的 HTTP Reporting API 异步上报，避免上报行为本身抢占主线程带宽；此外，需要注意部分广告拦截插件对 RUM 脚本的拦截，会导致高阶指标统计存在一定的选择性偏差。`),
        judgment('一次 Lighthouse 高分就能证明所有真实用户体验都很好。', 1, `💡 它解决了什么问题：
解决了“开发本地测试很顺畅，线上用户投诉卡成 PPT”的典型认知冲突，消除了实验室测试环境（Lab Data）由于设备同质化、网络理想化所带来的“幸存者偏差”。

🔍 核心原理解析（防拷打）：
1. Lighthouse 是基于 headless Chrome 在受控沙盒环境下运行的单次测试。它采用固定的网络限速（如 Preset Throttling）和 CPU 降频模拟，无法模拟真实世界中千差万别的硬件性能、动态网络抖动（如丢包率、延迟抖动）、后台进程争抢、以及长生命周期的复杂交互行为。
2. 实验室测试（Lab）用于提供可复现的深度诊断与诊断建议（如未使用的 CSS/JS），而真实用户监控（RUM）则反映真实业务的转化流失与体验分布（Field Data）。两者的工程取舍在于：开发阶段以 Lighthouse 跑分卡 CI 门禁，生产阶段以 RUM 的 P75 Web Vitals 决定业务优化策略。
3. 面试追问防拷打：Lighthouse 在单页应用（SPA）后续路由跳转的度量上存在天然缺陷（默认仅度量首屏加载），且由于每次执行时测试宿主机的 CPU 负载不同，分数可能存在 10%-20% 的波动。必须配合 User Timing API 或 RUM 监控，在真实的客户端环境（RUM）下通过聚合大样本量来消除单点抖动。`),
        single('核心 Web 指标（Core Web Vitals）中的 INP（互动到下次绘制）主要衡量：', ['用户在页面生命周期内发生的所有交互操作后，到浏览器下一次重绘之间的最大延迟时间。', '页面首屏加载过程中，视口内可见的最大图像或文本块被渲染并完整呈现的时间点。', '由于异步资源（如无宽高的广告图）加载导致的页面视觉元素非预期位移。', '客户端与服务端进行数据交互时，接口字段命名规范所带来的本地反序列化开销。'], 0, `💡 它解决了什么问题：
解决了旧指标 FID（首次输入延迟）只度量“首次交互的输入等待时间”而忽略“后续交互”以及“事件处理本身与渲染帧更新延迟”的问题，能够准确衡量页面整个生命周期内的整体交互流畅度。

🔍 核心原理解析（防拷打）：
1. INP (Interaction to Next Paint) 指标追踪页面生命周期内的所有交互（如点击、轻触、键盘输入），它由三部分组成：输入延迟（Input Delay，主线程忙于其他任务导致回调无法及时触发）、处理耗时（Processing Duration，事件回调 JS 执行时间）、呈现延迟（Presentation Delay，框架渲染、计算样式、布局和合成绘制下一帧的耗时）。
2. 优化 INP 必须拆解上述三个子阶段。如果是 Input Delay 过长，说明主线程有长任务（Long Task）抢占，需要拆分长任务或利用 scheduler.yield() 让出；如果是 Processing Duration 过长，需优化回调函数内的算法或移交 Web Worker；如果是 Presentation Delay 过长，需要规避强制同步布局（Reflow）并减小 DOM 树规模。
3. 面试官深追：INP 的统计方法是取页面所有交互的第 98 百分位数（对于交互次数较少的页面则取最大值），以此代表用户的最差交互体验。在 RUM 实践中，INP 会因为页面关闭时的 unload 行为或动态复杂 DOM 的垃圾回收（GC）引起偶发性的长尾延迟，需要通过长任务分析器（Long Tasks API / Element Timing API）进行协同诊断。`),
        multiple('LCP 差可能来自？', ['TTFB 慢', '首屏图片慢', 'CSS 阻塞', '客户端渲染过重'], [0, 1, 2, 3], `💡 它解决了什么问题：
解决了团队将首屏渲染慢（LCP 差）简单粗暴地归咎于“图片过大”或“接口太慢”，忽略了网络传输、关键渲染路径（CRP）以及客户端框架渲染等全链路耦合性瓶颈的问题。

🔍 核心原理解析（防拷打）：
1. LCP (Largest Contentful Paint) 衡量的是视口中最大可见图像或文本块的渲染时间。浏览器渲染管线要求：HTML 到达后，解析并发现 LCP 资源，下载该资源，解析并执行阻塞的 CSS/JS，最后由主线程进行样式计算、布局（Layout）并绘制（Paint）。上述任意一环的延迟都会线性累加到 LCP 上。
2. 优化方案需遵循 LCP 的四个组成部分进行拆解排查：① TTFB（减少服务端路由及数据库查询耗时，开启 CDN 缓存）；② 资源加载延迟（使用 preload 提前发现资源，应用 fetchpriority="high" 提高优先级）；③ 资源加载时间（压缩体积，采用 WebP/AVIF 格式，启用 HTTP/2）；④ 元素渲染延迟（内联关键 CSS，对非关键 JS 启用 defer/async，避免客户端框架长时间空转渲染）。
3. 极端边界追问：如果 LCP 元素是图片，即使图片下载完成，但由于主线程正忙于执行一个 300ms 的 React hydration 任务，导致该图片迟迟无法被绘制到屏幕上，这就是典型的元素渲染延迟（Element Render Delay）。此时必须拆分 React 组件，进行 Selective Hydration（渐进式注水）以释放主线程。`),
        single('在衡量 Core Web Vitals 性能数据时，推荐关注第 75 百分位数（p75）指标的主要价值在于：', ['能够真实代表绝大多数用户的实际访问体验，同时过滤掉极端网络环境下的噪音数据。', '能够完全替代生产环境中所有的全链路主动拨测与性能异常告警机制。', '该数据段专门用于评估后端服务在分布式网关层所面临的 CPU 算力分配负载。', '用于评估 CSS 自定义命名规范在复杂组件样式加载中的冲突概率。'], 0, `💡 它解决了什么问题：
解决了使用平均值（Average）容易地被极少数超长延迟的极端噪音拉偏、使用中位数（Median）又过于乐观地掩盖了 50% 用户的真实痛点的问题，实现了兼顾长尾体验与工程优化可行性的科学折中。

🔍 核心原理解析（防拷打）：
1. 性能数据在数学分布上呈现明显的“长尾分布”或“非正态多峰分布”，包含大量的长尾噪声。平均值易受极值影响（例如一个 60 秒的死锁会导致整体平均值剧烈劣化），而中位数只代表第 50 百分位，对 25% 甚至更坏体验的用户视而不见。
2. 谷歌及 W3C Web 性能工作组将 P75（第 75 百分位）定义为 Core Web Vitals 的达标判定线。它的工程考量是：如果一个页面的 P75 指标处于“良好”区间，代表 75% 的用户访问都获得了良好体验，这既能确保大部分用户的痛点得到治理，又避免了团队在极少数受网络或设备硬件绝对限制的 5% 极端用户身上过度消耗研发资源。
3. 大厂追问：如何在大规模 RUM 监控系统中高效计算 P75 指标？在海量数据写入时，直接进行全局排序计算分位数内存和计算开销极大。工程上常使用 T-Digest 算法或 HDR Histogram（高动态范围直方图）进行在线估算，从而在流式计算中低成本地获取秒级实时的百分位数据。`),
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
        single('针对 Largest Contentful Paint (LCP) 指标退化的问题进行性能专项优化时，第一步应当：', ['确定引发 LCP 的具体 DOM 元素，并拆分出加载延迟、渲染延迟等核心渲染阶段。', '盲目调高构建工具的压缩率配置，对项目中引入的所有 JS 库做无差别二次重压缩。', '将整个应用的全局外置 CSS 样式文件强制移除以缩短关键渲染路径。', '通过全局修改组件的 PascalCase 命名规则来降低浏览器解析模板的语法树开销。'], 0, `💡 它解决了什么问题：
解决了在优化首屏性能（LCP 差）时，由于不进行元素定位与阶段拆解，导致盲目优化非关键路径资源（如压缩无关 JS、重构非关键样式），造成研发资源浪费却无法切实改善核心性能指标的痛点。

🔍 核心原理解析（防拷打）：
1. LCP（Largest Contentful Paint）衡量视口内最大图像或文本块的绘制时间。浏览器在解析 DOM 树、计算样式、布局（Layout）后才能最终确定哪一个是 LCP 元素。在未明晰 LCP 元素之前，所有的优化手段都缺乏针对性。
2. 谷歌推荐将 LCP 的耗时分解为四个核心阶段：① TTFB（首字节时间）、② 资源发现延迟（Resource Load Delay）、③ 资源加载时间（Resource Load Duration）、④ 元素渲染延迟（Element Render Delay）。第一步必须通过 DevTools Performance 面板或 Web Vitals 库定位到具体的 LCP 元素，并计算出四个阶段 of 占比，以此决定具体优化优先级。
3. 大厂追问：如果页面没有显式的图片，仅有文本块作为 LCP 元素，且其受字体文件加载影响，如何优化？当 LCP 元素为文本时，必须排查 Web 字体的加载时机与 CSS 阻塞。可通过 font-display: swap 或字体子集化、预加载等手段，缩减文本的“元素渲染延迟”。`),
        multiple('在定位和优化页面中由关键首屏图片引发的 LCP 慢问题时，应重点排查？', ['首屏大图的压缩格式、物理尺寸以及是否包含合理的响应式多图规格', '是否对 LCP 图片配置了 link preload 预加载与 fetchpriority="high"', '图片资源是否成功命中了 CDN 的边缘节点缓存并实现了低时延分发', '页面内部自定义的全局 CSS 主题变量及局部样式属性命名是否规范'], [0, 1, 2], `💡 它解决了什么问题：
解决了团队将“图片加载慢”单一地归因于“带宽限制”，而忽视了关键图片资源发现晚、下载优先级低、CDN 命中率低以及图片格式落后等多维网络与资源调度层面的瓶谣。

🔍 核心原理解析（防拷打）：
1. 浏览器对网络资源的请求是有默认优先级策略的。图片资源在初始扫描时默认优先级较低（Low 或 Medium）。若不对 LCP 图片显式提升优先级，浏览器会优先下载阻塞渲染的 CSS 和头部 JS，拉长 LCP 资源的下载延迟。
2. 优化方案应当实施“组合拳”：首先，在静态 HTML 中使用 <link rel="preload" as="image" fetchpriority="high"> 让预解析扫描器（Preload Scanner）尽早发起请求；其次，开启 CDN 边缘缓存并根据客户端 Accept 报头动态响应 WebP/AVIF 等高压缩率格式；最后，利用响应式图片（srcset / sizes）避免低分设备下载超大图。
3. 极端边界追问：如果 LCP 图片的 CDN 响应带了 Cache-Control: no-cache 且该图片是动态生成的（如防盗链图片），如何保证性能？应尽量避免将高动态、防盗链的图片用作 LCP 首图。若不可避免，必须在 CDN 侧开启 HTTP/2 协议，并对鉴权接口做极致的毫秒级优化，同时内联该图片的 Base64 首帧占位图。`),
        judgment('所有图片都应该 preload，这样 LCP 一定更好。', 1, `💡 它解决了什么问题：
解决了滥用 preload 导致浏览器网络请求队列拥堵、抢占关键阻塞资源（如 CSS、核心 JS）的网络带宽，反而使页面发生整体性能退化的工程灾难。

🔍 核心原理解析（防拷打）：
1. 浏览器底层的网络线程是共享连接和带宽的。HTTP/2 虽然有多路复用，但在同一个 TCP 连接上，带宽总量是固定的。如果对大量非关键图片进行 preload，它们将与当前页面渲染必须的 CSS、DOM 解析必须的 JS 争抢带宽。
2. preload 是强强制性的指令，声明资源在当前页面具有最高优先级。合理的工程做法是：只对视口内确定作为 LCP 候选的 1-2 张核心英雄图（Hero Image）设置 preload，对其余非首屏图片使用 loading="lazy"。
3. 大厂追问：在单页应用（SPA）中，如何避免路由预加载与当前页面 LCP 的带宽冲突？应该区分当前路由与目标路由：当前页面的关键资源使用 preload（高优先级），而将下一页的 JS/图片资源使用 prefetch（低优先级、空闲加载）或在用户悬浮/点击链接时再发起动态加载。`),
        single('当监控数据显示某个页面的 TTFB（首字节到达时间）显著偏高时，通常意味着瓶颈存在于：', ['后端接口处理逻辑缓慢、CDN 回源率过高、网关路由开销大或缓存策略失效。', '浏览器在渲染阶段解析过长的 DOM class 类名或 HTML 按钮文本内容所带来的 CPU 负载。', '前端图片资源缺少 alt 描述属性，导致浏览器无法利用加速通道对其进行网络预解析。', '本地 Service Worker 在处理离线缓存数据时，因为内存溢出触发了路由兜底机制。'], 0, `💡 它解决了什么问题：
解决了页面加载“首字节”耗时过长，使得后续所有网络资源发现、DOM 解析和页面渲染起点被整体线性推迟，从而导致整体 LCP 性能严重劣化的“网络源头阻塞”问题。

🔍 核心原理解析（防拷打）：
1. TTFB（Time to First Byte）反映了从客户端发起页面请求，到接收到服务器响应的第一个字节之间的时间。它由三部分组成：① 网络往返时延（RTT，受物理距离和 DNS 解析影响）、② 服务端处理耗时（业务逻辑、数据库查询、BFF 聚合）、③ 响应传输延迟。
2. 当 TTFB 过高时，说明浏览器在等待 HTML 响应，此时页面是完全白屏的。排查方向包括：优化 CDN 缓存命中率（减少回源）、优化服务端的 SSR/BFF 接口串行逻辑、引入 Redis 缓存高频渲染结果、升级 HTTP/2 减少连接建立耗时。
3. 极端边界追问：如果服务端的 SSR 渲染必须要等待一个需要 800ms 的外部业务接口，如何优化以降低客户端感知的 TTFB？可采用 Streaming SSR（流式服务端渲染）方案。服务端先渲染并吐出不依赖该接口的 <head> 及骨架 HTML，让客户端提前开始下载 CSS 和 JS；当接口数据返回后，服务端再通过同一个 HTTP 管道将剩余 of DOM 节点和数据流式传输并插入到客户端页面中。`),
        multiple('LCP 可被哪些因素拖慢？', ['CSS 阻塞', '字体加载', '客户端 JS 渲染', '首屏接口等待'], [0, 1, 2, 3], `💡 它解决了什么问题：
打破了性能优化中“头痛医头、脚痛医脚”的单点思维，阐明了 LCP 作为一个端到端链路指标，受到网络协议、关键路径阻塞、运行时 JavaScript 以及框架渲染机制等多重因素共同影响的本质。

🔍 核心原理解析（防拷打）：
1. 浏览器的渲染管线中，关键渲染路径（Critical Rendering Path）的任何一环受阻都会直接推迟 LCP 绘制。这包括：HTML 传输延迟、CSS 文件未就绪导致的渲染树阻塞、JS 脚本执行抢占主线程、字体未加载完毕导致的 FOIT（不可见文本闪烁）、以及由于客户端单页应用（SPA）异步请求首屏数据未返回导致的“空容器”等待。
2. 治理 LCP 必须执行全局链路拆解：通过服务端渲染（SSR）或静态生成（SSG）消除客户端渲染等待；内联关键路径 CSS 以消除外部样式表阻塞；对大 JS 包进行代码分割并添加 defer/async；对字体应用 font-display: swap 并配合 CSS 尺寸微调以减少布局偏移。
3. 面试大厂追问：在现代 React SPA 中，如果所有的网络资源下载都很快，但 LCP 依然长达 4s，可能是什么原因？很有可能是发生了 Hydration Blocking（注水阻塞）。即使服务端直出了 HTML，但如果客户端的 JS 文件庞大，主线程在执行 hydrateRoot 时需要进行庞大的 DOM 树 diff 与事件绑定，这会独占主线程（Long Task），使得浏览器迟迟无法将已经就绪的图片绘制呈现出来。`),
        single('在图像或静态资源标签上配置 fetchpriority="high" 属性，最推荐的工程实践场景是：', ['优先应用于对页面首屏 Largest Contentful Paint (LCP) 起决定性作用的英雄大图。', '强制应用到位于视口之外的所有非关键的轮播图或底部装饰性背景图像。', '对单页应用中发生的所有异步 API 接口请求进行拦截并提升其连接复用权重。', '强制作用于项目中所有的第三方外链 CSS 样式表以提升浏览器样式解析优先级。'], 0, `💡 它解决了什么问题：
解决了在没有显式控制优先级的情况下，浏览器默认将图片资源设为低优先级（Low），导致重要的首屏主图在页面其他非关键脚本和样式下载完后才开始加载的“资源排队滞后”缺陷。

🔍 核心原理解析（防拷打）：
1. 浏览器渲染引擎（如 Blink）内部维护了一个复杂的资源加载优先级队列。默认情况下，处于视口外的图片优先级极低，而处于视口内的图片也是在中后期才会被升级为高优先级。fetchpriority 属性可以让开发者直接干预这一调度机制。
2. 为 LCP 候选图片（通常为 <img> 或 <link rel="preload">）设置 fetchpriority="high"，可以在浏览器发现该资源的瞬间就将其网络加载优先级提到最高，与关键样式、阻塞脚本平起平坐，从而大幅压缩 LCP 的“资源发现与下载耗时”。
3. 边界场景拷打：如果对页面上 10 张图片都加上 fetchpriority="high"，会有什么后果？这会使所有图片的加载优先级乱作一团，失去了优先级区分的意义。更糟糕的是，它们会抢占原本用来加载核心业务 JS 和 CSS 的带宽，导致首屏彻底变慢。因此，fetchpriority="high" 必须有节制地专用于 LCP 图片。`),
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
        single('INP 差最常见的技术方向是？', ['主线程长任务和渲染范围过大', 'HTML title 太短', 'Git 分支太多', '接口路径太短'], 0, `💡 它解决了什么问题：
解决了在交互卡顿优化中，团队只关注“后端接口快慢”而忽视前端“主线程被长任务独占”以及“DOM 树过大导致重排重绘延迟”，导致页面交互响应“迟钝”的运行时性能硬伤。

🔍 核心原理解析（防拷打）：
1. 交互响应速度不仅取决于数据获取。当用户触发点击时，浏览器主线程如果正忙于执行一个长时间的 JS 任务（如 React 大范围组件 Diff、大量数据格式化），或者在执行回调后触发了整页大范围的重布局（Reflow），事件响应就会被卡在队列中无法被处理。
2. INP（Interaction to Next Paint）衡量的是用户交互到浏览器渲染出下一帧的完整耗时。主线程长任务（Long Task）会拉长 Input Delay；而大规模的 DOM 修改、框架全量重新渲染会推迟 Presentation Delay。优化手段必须双管齐下：任务切片和缩小渲染范围（Memo / 虚拟化）。
3. 面试大厂追问：在 React 18 中，如何通过并发特性（Concurrent Features）优化 INP？可以使用 useTransition 或 useDeferredValue。将非紧急的视图渲染标记为“过渡状态”，React 会在后台低优先级渲染这部分内容，如果中途用户再次输入或点击，React 能够中断当前的低优先级渲染，优先响应用户的最新交互，从而极大地优化了交互响应速度。`),
        multiple('INP 可以拆成哪些阶段？', ['input delay', 'processing duration', 'presentation delay', 'DNS TTL'], [0, 1, 2], `💡 它解决了什么问题：
解决了无法科学定位交互响应瓶颈来源的问题，将模糊的“交互卡顿”拆解为可量化的输入等待、逻辑执行、浏览器排版三个子指标，从而能进行针对性的精确治理。

🔍 核心原理解析（防拷打）：
1. INP (Interaction to Next Paint) 代表交互到下一次像素绘制的时间。这其中：① Input Delay 指从用户操作开始，到事件监听器开始执行的时间，通常因主线程正执行其他 Long Task 而产生；② Processing Duration 指事件监听器内同步 JS 代码的执行耗时；③ Presentation Delay 指 JS 执行完毕后，浏览器更新渲染树、进行样式计算、布局、绘制及合成并把新帧呈现到屏幕的耗时。
2. 不同的子阶段瓶颈有截然不同的优化策略：Input Delay 长需要使用 scheduler.yield() 拆分后台初始化任务；Processing Duration 长需要优化回调内部的算法、引入 Web Worker；Presentation Delay 长需要缩减 DOM 节点、规避强制同步布局（Reflow）。
3. 大厂追问：在实际 RUM 数据中，Presentation Delay（呈现延迟）特别高，可能与哪些 CSS 属性或操作相关？通常是由于修改了触发全局重排（Reflow）的 CSS 属性（如 width、height、font-size 等），或者在事件回调中触发了“读写交替”导致了强制同步布局（Layout Thrashing）；此外，对包含数万个节点的超大 DOM 树进行小范围修改，也会引起耗时极长的样式重算（Recalculate Style）。`),
        judgment('接口 80ms 就能证明点击响应一定快。', 1, `💡 它解决了什么问题：
消除了“网络请求快 = 页面体验好”的直觉误区，阐明了在数据获取（Network）与页面更新渲染（Execution & Render）之间，主线程同步计算和重排重绘可能成为真正瓶颈的原理。

🔍 核心原理解析（防拷打）：
1. 当用户点击按钮时，从触发交互到看到视觉变化经历两个完全不同维度的过程：异步的网络请求，以及主线程上的 JS 执行和渲染。即使 API 接口在 80ms 内返回数据，但如果回调函数中需要对返回的数据进行复杂的树形结构转换（JS 独占主线程），或者前端框架要将这些数据渲染到一个包含数千个子组件的列表里，整个主线程可能被阻塞数百毫秒。
2. 用户真正感知到“没反应”是在像素更新的那一刻。如果在点击后 300ms 屏幕上才出现 Loading 动画或第一行文字，在 INP 指标看来就是 300ms，处于“需改进”的区间。
3. 大厂追问：为了改善由于接口返回后主线程被大面积更新卡死的体验，应该如何设计交互？应当实行“乐观更新（Optimistic UI）”或“即时 Loading 状态”。在发起异步网络请求的同步代码内，立刻改变状态渲染出 Loading 指示器（控制在 50ms 内更新，确保 INP 合格），等网络数据真正返回后再分批次或通过虚拟列表更新具体内容，从而将交互拆分为两次独立的帧绘制。`),
        single('在中高级前端架构设计中，引入“虚拟列表（Virtual List）”优化方案的核心价值是：', ['限制只渲染视口内可见的 DOM 节点，大幅降低海量数据下的渲染计算与更新成本。', '解决跨域单点登录时，浏览器同源策略所导致的 Cookie 写入丢失故障。', '对大型局域网的域名解析过程进行加速，以消除静态资源在 DNS 握手阶段的延迟。', '自动识别并纠正本地上传组件在解析各种非标准压缩图片格式时的解码异常。'], 0, `💡 它解决了什么问题：
解决了在长列表或大数据展示场景下，由于浏览器内存中挂载过多 DOM 节点，导致垃圾回收（GC）频繁、样式重算和布局排版（Reflow）耗时随节点数非线性飙升、滚动卡死乃至整个页面崩溃的缺陷。

🔍 核心原理解析（防拷打）：
1. 浏览器解析和维护 DOM 节点需要巨大的 C++ 对象内存。更重要的是，当用户滚动或更新列表时，浏览器必须对修改的元素及相关容器重新计算样式并排版。若列表中有数万个真实节点，即使仅仅修改其中一个小属性，重排的耗时也会导致主线程发生长达数百毫秒的卡顿（丢帧）。
2. 虚拟列表（Virtual List）本质是一种“以 JS 换渲染”的池化技术。它只创建和渲染视口内可见的几十个 DOM 容器，随着用户滚动，在 JS 中动态计算当前视口起止索引，复用已有的 DOM 节点并替换其展示数据，从而将 DOM 树的规模锁定在常数级（O(1)）。
3. 极端边界追问：如果列表项高度是不固定的，如何进行高效的虚拟列表定位计算？若列表项高度由其内容（如动态文字、图片）决定，无法在渲染前准确获知高度。工程上的解决方案是：① 引入一个 Estimate Height（预估高度）来初始化滚动条，② 在 DOM 挂载后通过 ResizeObserver 或生命周期钩子实时测量实际几何高度并更新缓存的高度表，③ 在滚动时根据已测高度的累加值动态修正 scrollTop 和偏移值，避免滚动条突变抖动。`),
        multiple('当浏览器主线程负载过重导致页面交互无响应时，可以采取哪些优化手段降低主线程压力？', ['将耗时超过 50ms 的 Long Task 拆分为多个使用 scheduler.yield 让出主线程的小任务', '将非 DOM 操作的复杂 CPU 密集型计算（如大数据过滤）移至 Web Worker 中执行', '启用虚拟列表或按需懒加载，缩减单次布局和绘制的 DOM 渲染范围', '将 10 万行大列表数据不加任何优化地一次性全量挂载并渲染至页面中'], [0, 1, 2], `💡 它解决了什么问题：
解决了高复杂度、大计算量的前端应用中，主线程长期处于“饥饿”状态，无法及时响应用户的手势操作、定时器及网络回调，导致页面高频出现假死和掉帧的问题。

🔍 核心原理解析（防拷打）：
1. 浏览器的主线程是单线程模型。它既要负责 JavaScript 的解析与执行，又要处理用户交互（Event Loop）和页面的样式重算、布局及绘制。任何独占主线程超过 50ms 的 JavaScript 任务（Long Task）都会直接阻断其他任务的执行。
2. 优化方案需从“卸载”与“分流”两个维度展开：对于无 DOM 操作的 CPU 密集型计算（如大文件哈希计算、海量数据过滤），利用 Web Worker 开辟辅助线程进行计算并以 Message 通信传回；对于必须在主线程执行的长任务，使用 scheduler.yield()、requestIdleCallback 等手段实施任务切片（Time Slicing），让浏览器在子任务间隙能插空处理交互和重绘。
3. 大厂追问：Web Worker 在与主线程通信时，由于数据克隆（Structured Clone）带来的序列化耗时，如果数据量达数十兆，依然会导致主线程卡顿，如何解决？对于超大数据量的多线程传输，应当使用“可转移对象（Transferable Objects）”，如 ArrayBuffer。这种方式直接转让数据内存空间的“所有权”，在主线程和 Worker 之间共享一块内存，实现零拷贝（Zero-copy）的瞬时传输。`),
        single('Long Task 通常指主线程上超过多少毫秒的任务？', ['50ms', '5ms', '5000ms', '1s 固定值'], 0, `💡 它解决了什么问题：
解决了在前端性能度量中，对主线程阻塞程度缺乏科学界定标准的问题。通过定义“50ms”为红线，建立起一套可以通过 PerformanceObserver 自动捕获、衡量运行时交互延迟的工程监控基线。

🔍 核心原理解析（防拷打）：
1. 50ms 阈值来源于谷歌的 RAIL 性能模型。RAIL 模型指出，为了在 100ms 内对用户的输入做出响应（使用户感到瞬时响应），浏览器必须在 50ms 内处理完当前的输入事件，而留给主线程开始处理该事件的等待时间（Input Delay）也必须控制在 50ms 以内。因此，超过 50ms 的 JS 任务被定义为长任务（Long Task）。
2. 在 W3C Long Tasks API 中，只要一个 Task 的执行时间超过 50ms，浏览器就会在 Performance 缓冲区中产生一条 longtask 类型的 PerformanceEntry。开发者可以通过 new PerformanceObserver() 注册监听，精准收集用户线上环境的卡顿状况。
3. 大厂追问：如何区分 Long Task 与 Long Animation Frame (LoAF)？Long Task API 仅能告诉你任务执行超过了 50ms，但无法提供该任务是由哪段 JS 脚本、哪个事件回调触发的。Chrome 在 2024 年推出了 Long Animation Frame API (LoAF)，它是以“帧延迟”为视角，度量从任务开始到下一帧渲染的整体耗时（通常为 >50ms 且导致丢帧），并能精确溯源到具体阻塞的 script 来源、编译耗时及 layout 耗时，是定位 INP 的终极利器。`),
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
        single('CLS 主要衡量什么？', ['非预期布局偏移', '首屏最大内容时间', '接口响应时间', 'JS 包大小'], 0, `💡 它解决了什么问题：
解决了在度量用户体验时，仅关注“速度（如加载耗时）”而忽视“页面稳定性（布局抖动）”的盲区。避免了由于异步资源加载导致的内容乱跳，从而引起的误触、打断用户阅读等糟糕体验。

🔍 核心原理解析（防拷打）：
1. CLS（Cumulative Layout Shift）代表累计布局偏移，是 W3C 定义的一个视觉稳定性指标。它计算视口内可见元素在页面生命周期中“非预期”发生的位移。其计算公式为：布局偏移分数 = 影响分数 (Impact Fraction) × 距离分数 (Distance Fraction)。
2. 只有“非预期”的偏移才会记入 CLS 分数。如果是在用户发起交互（如点击“展开全文”）后的 500ms 内发生的布局变化，且该事件监听器带有 hadRecentInput 标记，则不会被计入 CLS，因为这是用户符合预期的操作结果。
3. 大厂追问：在复杂的 SPA 页面中，CLS 往往呈现长尾累加效应（即用户在页面停留时间越长，CLS 越高），对此指标采集规范做过什么修正？原有的 CLS 计算方式在长生命周期页面（如单页社交媒体、无限滚动页）下非常不公平。W3C 后来将 CLS 修改为“会话窗口（Session Window）”模式：在最大 5 秒的会话窗口内进行偏移量累加，窗口之间相隔 1 秒，最终取所有会话窗口中的最大值作为该页面的 CLS，从而规避了因用户停留时间过长而导致的分数无限膨胀。`),
        multiple('常见 CLS 来源包括？', ['图片未预留尺寸', '广告异步插入', '字体替换', '稳定占位'], [0, 1, 2], `💡 它解决了什么问题：
定位了页面生命周期中破坏布局稳定性的核心元凶，避免了由于图片二进制流、第三方 SDK（广告）以及 Web 字体文件加载的“时间差”导致的文档流位置瞬间重排。

🔍 核心原理解析（防拷打）：
1. 当浏览器解析 HTML 时，如果媒体资源（图片、视频、iframe）未指明尺寸，渲染引擎会默认以 0×0 像素排版；一旦数据加载完毕，浏览器会重新计算它们的几何属性并强制触发重排（Reflow），将其下方的内容无预警向下推送。
2. 此外，第三方广告 SDK 的异步插入（例如在页面头部插入一个高度为 90px 的 Banner）、以及自定义字体的 FOIT（默认隐藏 3 秒，加载后突然替换系统字体，因两者的字符几何围框尺寸不同导致行高和宽度突变），是导致页面乱跳的另外两大主要原因。
3. 极端边界追问：如果为了避开 CLS，将所有异步内容都放在屏幕最底部（Footer 之外）渲染，是否就彻底安全了？这是一种取巧但可行的策略，因为视口外的布局偏移（非可见区域）不会被 CLS 统计。但是，如果用户已经向下滚动，原本的底部内容已经进入视口，此时再异步插入内容，同样会触发 CLS。所以，最安全的做法依然是“预留占位”。`),
        judgment('给图片设置 width/height 或 aspect-ratio 有助于降低 CLS。', 0, `💡 它解决了什么问题：
解决了响应式布局中，图片尺寸因自适应视口而必须采用 width: 100%，导致在图片二进制数据下载完成前，浏览器无法提前预留其垂直高度，从而引发严重重排（Reflow）的痛点。

🔍 核心原理解析（防拷打）：
1. 传统的 img { width: 100%; height: auto; } 虽然实现了响应式，但由于高度 auto 依赖图片的实际宽高比，在图片文件下载完之前，其占位高度为 0，必然引发布局塌陷。
2. 现代浏览器的优化机制是：当你在 HTML 中显式写明 <img width="600" height="400">，且在 CSS 中配置了 img { width: 100%; height: auto; } 时，渲染引擎会利用 HTML 的属性自动计算出其宽高比（User Agent Stylesheet 自动生成 aspect-ratio: 600/400），从而在图片还未开始下载时，就在布局中预留出完美的几何空间。
3. 大厂追问：有了 CSS aspect-ratio 属性后，是否可以直接抛弃 HTML 的 width/height 属性？可以。在 CSS 中直接编写 aspect-ratio: 16 / 9 配合 width: 100% 可以达到完全一致的预留空间效果。但出于工程健壮性考虑，在 HTML 中显式标明宽高，可以为不支持现代 CSS 特性的老旧浏览器提供回退支持（Fallback）。`),
        single('用户准备点击时顶部横幅突然插入，最合理的修复是？', ['预留横幅空间或改变插入策略', '压缩 JS', '修改接口状态码', '删除 lockfile'], 0, `💡 它解决了什么问题：
消除了“布局偏移诱发误触”的严重用户体验与业务信誉危机。防止了因活动横幅、弹窗等异步组件突发性插入文档流，导致用户操作（如点击“确认”或“付款”）时目标节点位置发生瞬间偏移，误触到横幅或广告的情况。

🔍 核心原理解析（防拷打）：
1. 页面顶部的任何动态插入都是对下方所有元素坐标的“整体挤压”。当用户将手指移动到某一个按钮上方并准备按下时，输入事件从发生到主线程捕获有微小的延迟。如果在这数十毫秒内，顶部横幅插入并触发了 Layout，按钮就会被向下推开，使用户的触点落到了横幅上。
2. 工程上彻底避免此缺陷的方案是：在骨架屏或 CSS 样式中，为顶部横幅直接声明一个固定的 min-height（或根据容器宽高比预留空间）。即使横幅数据尚未返回，该区域也表现为占位骨架，当横幅数据到达时，仅在已有区域内进行内容渲染，绝不触发外部文档流重排。
3. 极端边界追问：如果广告/横幅的高度是不可预测的（如广告商可能随机返回 50px、100px 或 250px 高度的创意），如何做 CLS 治理？应根据历史最大高度或平均高度预留空间；如果返回的广告尺寸小于占位空间，保留多余 of 空白或使用背景图填充，切忌将空间坍塌收缩；如果返回的高度大于占位空间，则使用 overflow: hidden 裁剪或利用绝对定位（position: absolute）让其浮在当前页面之上，而不是将下方元素挤开。`),
        multiple('当监控到页面的累计布局偏移（CLS）指标不达标时，开发者可以使用哪些工具和手段定位并分析偏移来源？', ['利用 Chrome DevTools 中的 Performance 面板过滤并追踪 Layout Shift 节点', '运行 Lighthouse 进行静态性能审计以获取潜在的无宽高布局偏移元素建议', '收集真实用户的 RUM CLS 偏移数据以统计高频发生布局闪烁的组件', '审查团队历史提交日志中的 Git commit message 以推算样式变更的物理时间'], [0, 1, 2], `💡 它解决了什么问题：
解决了在优化视觉稳定性时，由于无法准确定位具体是“哪个 DOM 元素”在“哪个时间点”发生了“多大像素”的位移，导致只能靠人眼在屏幕上捕捉晃动的尴尬境地。

🔍 核心原理解析（防拷打）：
1. CLS 优化需要实验室（Lab）与生产环境（RUM）监控的协同运作。Lighthouse 能提供静态的分数诊断并标注出存在偏移的候选元素；Chrome DevTools 的 Performance 面板在录制过程中，会在 Layout Shifts 轨道上用红色方块标记每一次偏移，悬浮其上能直观看到发生位移的 DOM 节点的起始与终点坐标；真实用户监控（RUM）则能聚合海量用户的真实数据，过滤掉开发环境难以复现的长尾设备布局抖动。
2. 最佳排查步骤是：先通过 RUM 告警确定受灾页面，然后在本地开启 DevTools Rendering 面板中的 “Layout Shift Regions”，在页面上模拟用户操作，凡是变蓝闪烁的区域即为发生布局偏移的源头。
3. 大厂追问：在 RUM 监控中，如何通过 Layout Instability API 获取更详细的线上 CLS 偏移源信息？可以通过 PerformanceObserver 监听 layout-shift。在回调中，除了读取 entry.value 累加 CLS 之外，还应该读取 entry.sources 数组。该数组包含了每一个发生偏移的具体 DOM 节点（提供 node 引用）、偏移前的 previousRect 和偏移后的 currentRect 几何信息，将其序列化后上报，即可线上定位到引发偏移的具体组件。`),
        single('Hydration mismatch 可能导致 CLS 的原因是？', ['客户端重渲染结构和尺寸变化', 'DNS 失败', 'Cookie 被读取', 'lockfile 冲突'], 0, `💡 它解决了什么问题：
揭示了服务端渲染（SSR）或静态生成（SSG）架构中，由于服务端生成的 HTML 结构与客户端 JavaScript 执行注水（Hydration）时的渲染结构不一致，导致浏览器在注水瞬间发生 DOM 树重建与几何形变的底层隐患。

🔍 核心原理解析（防拷打）：
1. 在 SSR 应用中，浏览器会先渲染服务端直出的 HTML 并绘制在屏幕上。随后，客户端 JS 加载完毕，React/Vue 等框架会启动注水（Hydration）过程，对比虚拟 DOM 与现有的真实 DOM。
2. 如果在此过程中，由于“时间戳差异”、“随机数差异”或“客户端独有状态（如根据 window.innerWidth 渲染不同组件）”导致客户端生成的 DOM 与服务端直出 HTML 产生了不一致（Mismatch），框架为了修正这一偏差，会强制销毁旧 of DOM 节点并重新生成新的 DOM 元素并插入。这会在注水的一瞬间引发大规模的重布局（Reflow），从而造成剧烈的 CLS 抖动。
3. 大厂面试追问：在 React 中如何规避 Hydration Mismatch 导致的 CLS？① 确保所有随机数、时间戳、多语言解析在服务端和客户端生成完全一致的结果；② 对于完全依赖客户端环境的渲染逻辑（如读取 localStorage 的主题模式），应当将其包裹在 useEffect 中，在注水完成后再发起 state 变更进行二次渲染，或者利用 suppressHydrationWarning 属性（仅适合文本），或者在注水前将这部分组件渲染为不变的高宽占位符。`),
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
      references: [
        { title: 'web.dev：Performance Budgets 入门', url: 'https://web.dev/articles/performance-budgets-101' },
        { title: 'Chrome DevTools：Memory 问题排查', url: 'https://developer.chrome.com/docs/devtools/memory-problems' },
        { title: 'Chrome DevTools：堆快照分析', url: 'https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots' },
        { title: 'Lighthouse CI：持续性能监控', url: 'https://github.com/GoogleChrome/lighthouse-ci' },
      ],
      quiz: [
        single('在前端研发流程中引入“性能预算（Performance Budget）”机制，其最核心的工程价值是：', ['建立量化的可观测性基线，使每次迭代引入的性能退化可见、可阻断并可协同治理。', '彻底替代业务端产品团队提出的核心交互原型以及各类产品发布需求。', '在构建打包阶段自动将所有静态图片资源从物理包体中完全剔除。', '限制全部日常的紧急发布热更新，以保持服务器运行状态的绝对平稳。'], 0, `💡 它解决了什么问题：
解决了前端团队在“一次性性能专项优化”后，随着业务日常迭代开发，代码体积失控、引入劣质依赖、首屏响应指标无意识地缓慢退化，导致优化成果迅速反弹、无法持续长效维持的工程痛点。

🔍 核心原理解析（防拷打）：
1. 性能优化是一个持续对抗熵增的过程。如果没有一个强制性的度量和卡点机制，随着需求增加，页面质量必然退化。性能预算（Performance Budget）的核心思想是把抽象的“变慢”转换为具体的、可量化、可监控的工程卡点（例如：主包大小限制在 200KB Gzip，LCP 必须在 2.5s 内）。
2. 在工程实践中，预算可以部署在两个节点：① 构建阶段（CI 门禁）：使用 Webpack/Vite 插件，当 Bundle 体积或关键 Chunk 超过限制时，直接 CI 构建失败报错，强制开发自查；② 灰度/发布阶段（CD 及 RUM 门禁）：通过对灰度版本的 Web Vitals 进行实时指标监控，一旦相比上一版本出现统计学上的显著劣化（Degradation），自动触发告警或暂停放量。
3. 大厂追问：如果业务方坚持要上线一个会导致性能超出预算的复杂业务需求，工程上如何权衡与取舍？性能预算不是僵死的教条。面对这种情况，通常有以下协作机制：① 交换预算（Performance Trade-offs）：如果必须增加一个 50KB 的业务 JS，就必须在同一个页面里重构、下线或懒加载其他 50KB 的代码；② 延迟加载：将非首屏交互所需的重型模块（如富文本编辑器、大图表）完全改写为按需动态导入（Dynamic Import）。`),
        multiple('性能预算可以覆盖？', ['JS 体积', 'LCP p75', 'INP p75', 'CLS p75'], [0, 1, 2, 3], `💡 它解决了什么问题：
解决了性能预算指标制定的片面性，防止了仅仅卡住“代码体积（构建时指标）”却对用户在线上环境的“加载速度、交互响应、视觉稳定（运行时指标）”缺乏约束力，导致指标与真实体验脱节的弊端。

🔍 核心原理解析（防拷打）：
1. 完整的性能预算体系必须覆盖构建时预算（Build-time Budgets）与运行时/真实用户预算（RUM Budgets）。构建时预算包括 JS 资源大小、关键 CSS 长度、初始网络请求数等，特点是 100% 可控、拦截容易；运行时预算包括 LCP P75、INP P75、CLS P75 等 Web Vitals，反映了真实网络、复杂设备及交互环境下的综合结果。
2. 唯体积论的局限性在于：一个 100KB 的 JS 脚本如果包含了极高时间复杂度的同步计算，它对 INP 造成的伤害可能远超一个 300KB 但只做纯静态渲染的脚本。因此，必须将 RUM 指标（如 P75 Web Vitals）同样纳入版本发布健康度的考核标准中。
3. 面试大厂追问：如何在大厂多页面复杂系统下制定合理的运行时预算阈值？不能对全站页面一刀切。通常会根据页面业务属性进行分级治理：① 营销页/活动页：对 LCP 要求极高，预算应设定在 ≤1.5s；② 核心交易页/列表页：对 CLS 和 INP 极其敏感，预算可设定为 CLS ≤ 0.05，INP ≤ 150ms；③ 复杂中后台页：DOM 节点极多，可适当放宽 LCP 限制，但必须严格卡住 JS Heap 内存占用及 GC 频率。`),
        judgment('页面内存短时间上涨就一定是内存泄漏。', 1, `💡 它解决了什么问题：
纠正了对内存波动“草木皆兵”的误判，确立了如何科学区分正常的数据积压/延迟垃圾回收（GC）与真正的运行时对象无法被释放（内存泄漏）的诊断准则。

🔍 核心原理解析（防拷打）：
1. JavaScript 具有自动垃圾回收（Garbage Collection）机制。在用户执行复杂交互（如打开大弹窗、切换列表）时，V8 引擎会在堆中分配大量临时对象，此时 JS Heap 内存会呈现陡峭的上升趋势，这是完全合法的正常现象。
2. 只有当用户关闭弹窗、切换路由，或者手动点击 Chrome 开发者工具的“Collect Garbage”按钮（触发强制 GC）后，原本分配的对象仍然无法被 GC 清理、且每次重复操作后内存的“基线（Base Line）”持续抬升，才被定义为内存泄漏（Memory Leak）。这意味着对象仍然被某种全局的、长生命周期的活动引用链（如全局变量、未清除的事件监听器、全局 Store）所持有。
3. 大厂追问：在 V8 引擎中，有哪些垃圾回收机制和判定算法？V8 主要采用分代回收机制：① 新生代（Young Generation）：存放存活时间短的对象，使用 Scavenge 算法进行快速复制整理，GC 频率极高；② 老生代（Old Generation）：存放存活时间长或从新生代晋升的对象，使用 Mark-Sweep（标记清除）和 Mark-Compact（标记整理）算法。垃圾回收的判定基于“可达性分析算法（Reachability Analysis）”，即从根节点（GC Roots，如 window、全局作用域、DOM 树根）出发，凡是无法通过引用链达到的对象，都会在 GC 周期被清理。`),
        single('在利用 Chrome DevTools 对 JavaScript 内存泄漏进行排查时，Heap Profiler 中的 Retainers 树主要用于：', ['追踪并展示堆内存中的某个对象是如何被引用链根节点（GC Roots）保持关联而无法被垃圾回收的。', '执行本地图像资源的多核异步无损压缩以释放物理内存空间。', '对由于路由切换导致失效 of API 接口重试路径进行动态修复与域名映射。', '分析现有模块的导出字段并自动生成 TypeScript 的命名空间声明文件。'], 0, `💡 它解决了什么问题：
解决了在内存泄漏诊断中，虽然找到了“哪个对象”占据了庞大内存，却无法获知“谁在持有它的引用”，导致开发人员无从下手修改代码以阻断引用链的困境。

🔍 核心原理解析（防拷打）：
1. 在 Chrome DevTools 内存快照（Heap Snapshot）分析中，选中某个对象后，下方会展示其保留树（Retainers）面板。这个面板呈现的是该对象到 GC Roots（如 Window 全局对象）的反向引用链（Retainer Tree）。
2. Retainers 面板会清晰展示对象的持有者（如一个名为 activeUsers 的 Array，或者是闭包中的某个变量上下文），并以不同颜色（如黄色代表有直接 DOM 引用，红色代表由于 DOM 被 JS 引用导致的 Detached DOM 节点）标明引用类型。通过分析这条链，开发人员可以追踪到是哪一行代码在组件销毁后，未能将该引用设置为 null 或者是忘记调用 removeEventListener。
3. 大厂追问：Retainers 面板中的 Shallow Size 和 Retained Size 分别代表什么？① Shallow Size（自身占用大小）：指对象本身所占用的内存大小（不包括它所引用的其他对象）；② Retained Size（保留大小）：指释放该对象后，能够被垃圾回收机制释放的内存总大小（即该对象以及只能通过它直接或间接访问的所有对象的内存总和）。在内存优化中，我们应该优先关注并释放那些自身 Shallow Size 很小但 Retained Size 极大的“枢纽节点（Dominator）”。`),
        multiple('当用户反馈某个单页应用在使用几小时后，页面交互响应越来越慢甚至崩溃卡死时，开发者在排查内存泄漏时应重点观察：', ['利用 Chrome DevTools 内存面板观察 JS Heap（堆内存）是否持续攀升而无法回收', '观察当前活跃的 DOM 节点总数是否随着交互操作呈线性无阻挡式上升', '利用 Performance 监视在后台注册的 Active Event Listeners（事件监听器）数量', '审查项目根目录下托管的 README 配置文件在发布后的累计字符数量变化'], [0, 1, 2], `💡 它解决了什么问题：
避免了在面对运行时逐渐卡顿的页面时，缺乏直接的量化物理指标支撑，只能瞎猜是“JS 跑得慢”还是“浏览器渲染卡”的无奈。

🔍 核心原理解析（防拷打）：
1. 页面在长时间运行后逐渐变得卡顿，通常是由三类资源不断膨胀积压导致的运行时退化：① JS Heap（JS 堆内存持续上涨，频繁触发 V8 的垃圾回收，引发 GC 停顿/Stop-The-World，使页面掉帧卡顿）；② DOM Nodes（DOM 节点数暴增，导致浏览器的渲染树极其臃肿，每一次重排样式计算耗时翻倍）；③ Event Listeners（事件监听器持续累加，不仅耗费内存，还会增加事件冒泡/捕获链路的计算负担）。
2. Chrome DevTools 提供了 Performance Monitor（性能监视器）面板。它能以秒级实时的波形图展示 JS 堆大小、DOM 节点数、监听器数以及 CPU 使用率的波动趋势。如果用户在重复执行某一操作时（如打开并关闭表格），这三个指标没有随 GC 回落而是呈现出“阶梯状”持续攀升，说明发生了内存、DOM 或事件监听器泄漏。
3. 极端边界追问：有一种泄漏被称为 Detached DOM（游离 DOM 节点），它是如何形成的，又是如何在 Retainers 中呈现的？当一个 DOM 元素已经从浏览器的 DOM 树中被 removeChild 移除，但在 JavaScript 代码中（例如一个全局变量或闭包）仍然保留着对该 DOM 节点的引用时，它就变成了游离 DOM。由于它已经脱离 DOM 树，用户在页面上看不见它，但由于 JS 引用未切断，它和它的所有子节点都无法被 GC 释放。在 Heap Snapshot 中，它们会被标记为红色，并且 Retainers 面板会显示指向某个 JavaScript 对象的引用链。`),
        single('灰度版本性能明显退化，优先动作是？', ['暂停放量或回滚并定位', '继续全量发布', '删除监控', '忽略 p75'], 0, `💡 它解决了什么问题：
避免了低性能版本代码全量推向线上，对海量真实用户体验造成灾难性破坏，甚至导致核心业务漏斗转化率、跳出率等商业指标出现不可挽回滑坡的工程灾难。

🔍 核心原理解析（防拷打）：
1. 灰度发布（Canary Release）是现代前端工程中控制线上风险的核心防线。灰度阶段的本质就是利用统计学样本，提前检验新版本在真实复杂网络、低端硬件以及多端浏览器环境下的稳定度与体验（Web Vitals 表现）。
2. 当监控系统检测到灰度版本的 P75 LCP、INP 或崩溃率等硬性指标发生统计学显著退化时，必须坚守“安全第一、疑罪从有”的发布策略，立刻拦截发布、暂停放量或执行回滚操作，将受灾范围限制在极小的灰度用户群体内。绝对不允许带着已知严重性能倒退强行全量上线，去指望后续补丁修复。
3. 大厂追问：如何设计一个自动化前端性能防线，避免依赖人工看盘？可以在 CI/CD 流程中联动 RUM 性能监控系统：① 部署灰度后，由监控中心自动对比同一路由下新旧版本的 Web Vitals 均值与 P75 分布，引入假设检验（如 T 检验）剔除自然流量波动；② 若判定性能指标超出设定的退化阈值（例如 LCP 变慢超过 15%），自动触发告警给发布系统，触发“熔断机制（Circuit Breaker）”，系统自动阻断发布并将灰度流量即刻路由回上一稳定版本。`),
      ],
    }),
  ],
};
