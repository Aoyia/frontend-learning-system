import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const RENDERING_ARCHITECTURE_CONTENT = {
  id: 'rendering-architecture-longform',
  name: '深度长文：渲染架构',
  icon: '🧩',
  desc: '补齐技术破冰待补的 SSR/SSG/RSC/Streaming 主线，训练渲染方案取舍。',
  sourceCards: ['工程化主干待补：SSR / RSC', '渲染流程与渲染性能', 'LCP 与首屏加载'],
  docs: [
    makeLongformDoc({
      title: 'CSR、SSR、SSG：渲染方案不是越重越高级',
      sourceCards: ['工程化主干待补：SSR / RSC', '渲染流程与渲染性能'],
      problem: '它解决的是团队盲目选择渲染方案的问题。CSR、SSR、SSG、ISR、Edge Rendering 不是等级关系，而是首屏、SEO、交互、个性化、成本、缓存和复杂度之间的取舍。',
      customerCase: '客户营销页用纯 CSR，弱网下白屏时间长且 SEO 差。改成 SSG 后首屏和收录改善。另一个强登录后台想上 SSR，但页面高度个性化且 SEO 不重要，最终保留 CSR 并优化代码分割更划算。',
      flow: [
        '先判断页面是否需要 SEO 和首屏内容直出。',
        '判断内容是否静态、半静态还是强个性化。',
        '评估数据实时性、缓存策略和失效成本。',
        '评估服务端容量、部署复杂度和团队能力。',
        '选择 CSR、SSR、SSG、ISR 或混合方案。',
        '用 LCP、TTFB、错误率和服务端成本验证选择。',
      ],
      keywords: [
        { term: 'CSR', desc: '客户端渲染，浏览器下载 JS 后生成主要 UI。' },
        { term: 'SSR', desc: '服务端请求时生成 HTML，再由客户端 Hydration 接管。' },
        { term: 'SSG', desc: '构建时生成静态 HTML，适合静态或低频变化内容。' },
        { term: 'ISR', desc: '静态生成和按需/周期再生成的折中方案。' },
        { term: 'TTFB', desc: 'SSR 常需关注的首字节时间。' },
        { term: 'cacheability', desc: '页面是否容易被 CDN 或边缘缓存。' },
      ],
      interview: '渲染架构选择要围绕业务目标：SEO 和首屏强的内容页优先 SSR/SSG，强交互后台可用 CSR，半静态内容可用 ISR 或缓存；SSR 不是免费性能优化，它会增加服务端容量和 Hydration 复杂度。',
      demo: `选择判断表：

| 场景 | 推荐方向 |
| --- | --- |
| 文档、博客、营销页 | SSG / ISR |
| 商品详情、新闻详情 | SSR / ISR |
| 登录后后台系统 | CSR |
| 高个性化首屏 | SSR + 缓存拆分 |

真正项目里经常是混合架构，而不是全站一种方案。`,
      diagnosis: [
        '首屏慢时先确认是 HTML 慢、资源慢还是客户端渲染慢。',
        'SEO 差时检查搜索引擎是否能拿到主要 HTML 内容。',
        'SSR 后 TTFB 高时检查服务端取数、缓存和并发容量。',
        'CSR 白屏长时检查 JS 体积、代码分割和骨架屏策略。',
        'SSG 内容过期时检查构建频率、增量生成和缓存失效。',
        '方案争论时用页面类型和指标决策，不用技术偏好决策。',
      ],
      followups: [
        'SSR 一定比 CSR 快吗？',
        'SSG 内容过期怎么处理？',
        '什么页面不适合 SSR？',
        'Edge Rendering 和传统 SSR 的差异是什么？',
      ],
      deepDive: '值得深入。渲染方案是前端架构和业务目标之间的核心取舍。深入顺序是浏览器渲染、LCP/TTFB、CSR/SSR/SSG、缓存、Hydration、Streaming 和 RSC。',
      references: ['React Rendering 文档', 'Next.js Rendering 文档', 'web.dev Rendering on the Web', 'Google Search JavaScript SEO 文档'],
      quiz: [
        single('选择渲染方案最应该先看什么？', ['业务目标和页面特征', '哪个技术最新', '团队谁声音大', '文件名长度'], 0, `💡 它解决了什么问题：
解决了团队技术选型时“唯技术论”或“跟风选型”的重大架构偏离。防止为了使用最新的 SSR 或 RSC 架构，强行推倒原本简单的 CSR 后台系统，结果带来服务器资源成本剧增和不必要的首屏白屏排查负担。

🔍 核心原理解析（防拷打）：
1. 架构决策模型：渲染方案选择是围绕首屏性能（LCP/TTFB）、搜索引擎收录（SEO）、数据实时性、服务端计算成本以及部署复杂度进行的工程取舍。
2. 例如，静态文档和营销页由于内容几乎不变且强依赖 SEO，最适合 SSG；高实时、高交互且无 SEO 需求的 SaaS 后台，使用 CSR 反而体验更佳且节约服务器硬件成本。
3. 进一步拓展大厂面试追问：对于一个高度个性化（如根据用户地理位置推荐不同商品）、又强依赖 SEO 的电商首页，在选型上如何取舍？应采用“动态SSR + CDN 边缘缓存（Edge Rendering）”或“SSG + 客户端二次 Hydration 动态填充”。将通用商品骨架静态生成，个性化数据在客户端异步拉取，以此兼顾 SEO 与首屏速度。`),
        multiple('SSR 的代价包括？', ['服务端容量', 'Hydration 复杂度', '缓存设计', '完全不需要 JS'], [0, 1, 2], `💡 它解决了什么问题：
打破了“SSR 只有好处没有坏处”的架构认知偏差。它提醒开发团队，SSR 并不是免费的首屏加速，而是将客户端的计算压力物理转移到了 Node.js 服务端，增加了系统脆弱性与运维复杂度。

🔍 核心原理解析（防拷打）：
1. 代价拆解：首先是服务端容量（CPU/内存）压力暴增，Node.js 的单线程特性在处理大规模的 React/Vue 渲染字符串（renderToString）时是 CPU 密集型任务，极易阻塞事件循环。
2. 其次，引入了客户端 Hydration 激活过程，使得首屏“看得见但不能点”，增加了 INP 指标恶化的风险，并且大幅提升了整体架构的调试与排查成本。
3. 进一步拓展大厂面试追问：在大流量促销场景下，Node.js SSR 服务极易因为高并发导致 CPU 100% 并引起大面积 502/504 错误。如何设计容灾方案？可以实施“动态降级机制”。在网关层监控 Node 服务的 CPU 和响应延迟，一旦超过安全阈值，立即自动降级为返回纯静态的 CSR HTML 模板，让计算压力平滑转移到用户浏览器，保障服务高可用。`),
        judgment('SSR 一定让所有页面所有指标都变快。', 1, `💡 它解决了什么问题：
纠正了对 SSR 性能的教条式迷信。明确指出在服务端数据接口响应慢（TTFB高）或主 JS 包体积过大导致 Hydration 长任务阻塞等场景下，SSR 不仅不会提速，反而可能造成首屏白屏更久、页面响应变卡。

🔍 核心原理解析（防拷打）：
1. 指标的对立统一：SSR 能改善首屏的可视渲染指标（如 LCP），但由于它必须等待服务端所有数据接口返回后才能开始吐出 HTML 字符流，这会导致首字节时间（TTFB）显著升高。
2. 此外，浏览器渲染出 HTML 后，必须加载并运行大体积的 JS 以完成 Hydration，这期间会阻塞主线程，导致交互响应（INP）指标急剧恶化。
3. 进一步拓展大厂面试追问：如何在大流量 SSR 页面中，在不影响 LCP 的前提下优化 TTFB？应该使用“流式渲染（Streaming HTML Rendering）”。服务端不需要等所有数据接口都返回，而是立即先发送静态骨架的 HTML 头部，并在后续数据返回时，以分块（Chunk）形式源源不断地向浏览器流式推送剩余 HTML，从而将 TTFB 压缩到极限。`),
        single('强登录后台且 SEO 不重要，通常优先考虑？', ['CSR + 工程优化', '全站 SSG', '只返回纯 HTML', '不用路由'], 0, `💡 它解决了什么问题：
解决了在开发 SaaS 系统或企业中后台应用时，盲目引入复杂的 SSR 导致开发效率大打折扣、部署难度攀升的工程痛点。

🔍 核心原理解析（防拷打）：
1. 场景对齐：强登录后台（如 CRM、ERP）的页面内容完全个性化（每个用户权限和数据都不同），搜索引擎爬虫无法绕过登录态进行收录，因此 SEO 价值为零。
2. 采用 CSR 方案，所有路由切换都在浏览器端本地完成，Node 仅作为静态资源托管，配合 CDN 缓存，能以极低的服务器运维成本和极高的开发迭代效率完成交付。
3. 进一步拓展大厂面试追问：在 CSR 架构下，如何解决首次加载时主 JS Bundle 过大导致的白屏时间长的问题？必须实施严格的“代码分割（Code Splitting）”和“路由懒加载”，并配合在 index.html 中硬编码骨架屏（Skeleton Screen）或使用 Service Worker 提前预拉取关键资产，确保白屏体验不弱于 SSR。`),
        multiple('SSG 更适合？', ['文档', '博客', '营销页', '每个用户完全不同的实时控制台'], [0, 1, 2], `💡 它解决了什么问题：
解决了高频变化的内容页被强行做成静态生成导致“数据经常过期”、或每次编辑一个小字都需要全量触发几小时 CI 构建的发布痛点。

🔍 核心原理解析（防拷打）：
1. SSG（静态站点生成）在打包构建阶段（Build Time）就通过静态解析将页面和数据渲染为纯 HTML。
2. 这使得页面部署在 CDN 上时具有极高的性能和极低的托管成本，因此它完美适用于内容几乎不怎么改变、且强依赖搜索引擎收录的文档、博客和官方营销页。
3. 进一步拓展大厂面试追问：如果是拥有 10 万个商品详情页的电商系统，采用纯 SSG 会导致构建生成时间长达数小时，且无法处理库存 and 价格的实时更新。如何优化？应采用'ISR（增量静态生成）'或'On-demand Revalidation'。构建时只生成最热门的 1000 个商品页，其余页在用户首次访问时按需在后台生成并缓存，并配置失效时间窗口或通过 Webhook 精准使页面失效重建。`),
        single('SSR 后 TTFB 高，优先排查？', ['服务端取数、缓存和渲染成本', '按钮颜色', 'CSS 类名', 'Git 用户名'], 0, `💡 它解决了什么问题：
指明了当用户反馈“SSR 页面点开白屏更久”时，架构师应当聚焦的排查主线。防止开发人员把精力浪费在前端 CSS 或图片优化上，未能找出服务端取数接口阻塞、渲染循环死锁等 TTFB 的罪魁祸首。

🔍 核心原理解析（防拷打）：
1. TTFB（首字节时间）代表了浏览器从发起请求到收到服务器第一个字节响应的等待耗时。在 SSR 中，Node.js 必须等所有 getServerSideProps 中的异步数据接口返回后，才能开始 renderToString 生成 HTML。
2. 于是，TTFB 高的根本原因通常是：Node 端的慢速网络取数接口、缺乏 Redis 缓存、或者 CPU 密集型的组件树递归渲染阻塞了事件循环。
3. 进一步拓展大厂面试追问：如何在 Node.js 侧定位出是哪个特定的数据库资源获取拖慢了 TTFB？可以在 Node.js 中集成 APM 工具（如 Jaeger、OpenTelemetry），在异步数据获取函数中包裹 Trace，并通过请求头向下游微服务传递 traceparent 标识，最终生成火焰图定位到性能瓶颈。`),
      ],
    }),
    makeLongformDoc({
      title: 'Hydration 与 Streaming：首屏 HTML 出来了，为什么还不能点',
      sourceCards: ['工程化主干待补：SSR / RSC', 'INP 与交互响应'],
      problem: '它解决的是 SSR 页面“看得见但不能用”的问题。SSR 输出 HTML 后，客户端还要下载 JS、执行代码、绑定事件和恢复组件状态，这个过程就是 Hydration。Streaming 可以更早输出部分 HTML，但也要求边界和加载状态设计正确。',
      customerCase: '客户商品页 SSR 后 LCP 变好，但用户点击规格按钮没反应。分析发现主 bundle 太大，Hydration 还没完成。优化方向不是继续堆 SSR，而是拆分客户端组件、减少 Hydration 范围和延后非关键 JS。',
      flow: [
        '服务端生成 HTML。',
        '浏览器开始解析和绘制，用户看到内容。',
        '客户端下载 JS bundle。',
        'React/Vue 等框架执行 Hydration，绑定事件和状态。',
        '交互边界完成后页面才真正可操作。',
        'Streaming 允许服务端分块发送 HTML，但需要 Suspense/loading 边界。',
      ],
      keywords: [
        { term: 'Hydration', desc: '客户端接管服务端 HTML，绑定事件并恢复状态。' },
        { term: 'hydration mismatch', desc: '服务端 HTML 和客户端渲染结果不一致。' },
        { term: 'Streaming', desc: '服务端分块发送 HTML，让部分内容更早到达。' },
        { term: 'Suspense boundary', desc: '声明异步内容的加载边界。' },
        { term: 'islands', desc: '只让页面部分区域具备客户端交互的架构思想。' },
        { term: 'selective hydration', desc: '按优先级逐步 Hydrate 交互区域。' },
      ],
      interview: 'SSR 解决“先看到 HTML”，Hydration 解决“HTML 变成可交互应用”；优化 SSR 体验要同时看 LCP、TTFB、JS 体积、Hydration 成本和交互可用时间，Streaming 则通过边界设计让内容分块更早到达。',
      demo: `典型 Hydration mismatch：

\`\`\`tsx
function Time() {
  return <span>{Date.now()}</span>
}
\`\`\`

服务端和客户端时间不同，可能导致 mismatch。应把不稳定值放到客户端 effect，或从服务端稳定传入同一份数据。`,
      diagnosis: [
        '看到内容但不能点，检查客户端 JS 是否下载和执行完成。',
        'Hydration 错误时检查时间、随机数、浏览器 API、用户态数据差异。',
        'JS 过大时拆分客户端组件和低优先级逻辑。',
        'Streaming 没效果时检查是否有粗粒度阻塞边界。',
        '交互慢时同时看 Hydration long task 和 INP。',
        '第三方脚本阻塞 Hydration 时调整加载优先级和执行时机。',
      ],
      followups: [
        'Hydration mismatch 为什么危险？',
        'Streaming 如何影响 TTFB 和 LCP？',
        '为什么服务端 HTML 不能代表页面已经可交互？',
        '哪些组件应该是客户端组件？',
      ],
      deepDive: '必须深入。现代 React/Next 架构大量围绕 Hydration、Streaming 和客户端边界做取舍。深入顺序是 SSR、Hydration、Suspense、Streaming、Selective Hydration 和 Server Components。',
      references: ['React hydrateRoot 文档', 'React Suspense 文档', 'Next.js Streaming 文档', 'web.dev Hydration 文档'],
      quiz: [
        single('Hydration 主要做什么？', ['让客户端接管服务端 HTML 并绑定交互', '压缩图片', '解析 DNS', '创建数据库'], 0, `💡 它解决了什么问题：
解决了服务端生成的“静态 HTML 骨架”在浏览器中如何激活成为“具备交互响应力、状态绑定和指令执行能力”的动态单页应用（SPA）的技术平滑过渡问题。

🔍 核心原理解析（防拷打）：
1. 机制解剖：服务端 SSR 吐出的只是没有 JS 事件绑定的纯 HTML 文本。
2. 浏览器渲染并展示这些静态 DOM 后，客户端框架（如 React）会在后台加载对应的组件 JS 包，重新在内存中执行一遍组件渲染并构建虚拟 DOM 树，最终遍历该树，将事件监听器一一绑定到浏览器现有的物理 DOM 节点上，并激活组件的 hooks 与 state。
3. 进一步拓展大厂面试追问：如果在 Hydration 过程中，由于大体积 JS 执行导致了超过 50ms 的 Long Task 阻塞主线程，此时用户频繁点击输入框却毫无反应，如何治理？可以采用 React 18 的 Selective Hydration 机制，利用 Suspense 拆分组件边界，让浏览器优先对用户正在交互点击的区域进行高优先级的局部 Hydration，从而改善交互响应指标。`),
        multiple('Hydration mismatch 可能来自？', ['Date.now()', 'Math.random()', '服务端客户端数据不同', '稳定 props'], [0, 1, 2], `💡 它解决了什么问题：
解决了在开发 SSR/SSG 应用时，由于忽略了服务端与客户端在环境运行、时间戳、本地缓存等层面的物理差异，导致两端生成的 HTML 结构不一致而触发“页面内容闪烁、DOM 树被框架强制销毁重构、交互失效”的 Bug。

🔍 核心原理解析（防拷打）：
1. 根因剖析：在 Hydration 阶段，客户端框架会严格比对本地生成的虚拟 DOM 树和浏览器已有的服务端 HTML。
2. 若发现结构或属性不一致（例如服务端用了本地服务器时间，而客户端读取了用户本地时间；或者代码中直接使用了 window.innerWidth 等浏览器专属 API 导致服务端输出 undefined），即判定为 mismatch。框架在开发环境下会报错，且在生产环境下往往会退化为重新全量渲染，消除了 SSR 性能优势。
3. 进一步拓展大厂面试追问：如果页面中有些区域确实必须展示客户端特有的非确定性内容（如本地时间、不同国家的币种符号），如何安全编写避免 mismatch？可以使用“双阶段渲染（Two-pass Rendering）”。定义一个 isMounted 状态，在 useEffect 中将其置为 true。在 isMounted 为 false 时（首屏第一遍）统一输出服务端的占位结构，在 isMounted 为 true 后才动态更新为客户端特有数据。`),
        judgment('SSR HTML 出现在屏幕上，就说明页面所有交互都已经可用。', 1, `💡 它解决了什么问题：
纠正了对“首屏画出来等于能交互”的认知偏差，避免团队在用户大面积点击无响应时，将原因误判为接口响应慢，忽视了客户端 Hydration 长任务卡死的隐患。

🔍 核心原理解析（防拷打）：
1. 物理空窗期：SSR 输出的仅是静态 HTML，此时浏览器虽能渲染出 DOM 结构，但客户端激活事件绑定（Hydration）的 JS 尚未加载运行完毕，页面处于“可见不可交互”状态。
2. 性能评估指标：大厂性能治理中，不仅关注首屏展示的 LCP，更关注可交互的 INP（Interaction to Next Paint）指标，防止长任务卡死主线程。
3. 进一步拓展大厂面试追问：如果在此空窗期用户频繁点击输入框却无反应，如何进行用户体验降级兜底？可利用组件级懒加载和 Selective Hydration 异步分水激活交互区，或使用 CSS 的 :active 样式和 inline JS 原生劫持方案收集前置点击事件，等 Hydrate 完成后再分发回放。`),
        single('Streaming 的核心价值是？', ['分块更早发送 HTML', '完全不需要服务端', '替代 CSS', '删除 JS'], 0, `💡 它解决了什么问题：
解决了在传统 SSR 下，一旦有某个异步慢接口，整页的响应就不得不被“卡住”、导致浏览器迟迟拿不到任何 HTML 数据而长时间白屏的瓶颈。

🔍 核心原理解析（防拷打）：
1. 原理剖析：流式渲染（Streaming SSR）利用了 HTTP 1.1 的 Chunked Transfer Encoding。
2. 服务端 Node 在收到请求后，会立即开始渲染，把不需要等待异步数据的布局头部（如 Header、Navigation）渲染为 HTML 片段并立即发送给客户端；同时将异步取数组件包裹在 Suspense 边界中，在后台取数完成后，再将该子组件渲染出的 HTML 片段以及替换占位符的 JS 代码流式追加发送给浏览器。
3. 进一步拓展大厂面试追问：如果在 Streaming 渲染过程中，Node 服务端在发送后半部分 HTML 时发生了未捕获的运行时异常（比如接口突然报错），前端在页面上表现为什么？怎么容灾？如果发送头部后出错，HTTP 状态码（200）已无法更改。React 客户端会在浏览器收到残残 HTML 时自动抛出错误，并在客户端降级为 CSR 重新拉取该部分数据，保障了整体界面的完整性。`),
        multiple('优化 Hydration 成本可考虑？', ['减少客户端组件范围', '拆分 JS', '延后非关键脚本', '增加无关依赖'], [0, 1, 2], `💡 它解决了什么问题：
指明了治理 SSR 页面“交互卡顿、响应慢（INP高）”的优化路径，避免盲目做无谓的编译优化，专注于减少客户端 JS 运载量和拆分长任务的核心矛盾。

🔍 核心原理解析（防拷打）：
1. 成本机制：Hydration 成本直接正比于“客户端需要运行的 JS 体积”和“虚拟 DOM 的深度与节点总数”。
2. 优化方案包括：使用 React 的懒加载和 dynamic 导入，将页面折叠屏下方、首屏不可见、或者低频交互组件的 Hydration 过程延后执行；尽量将组件定义为纯服务端组件（RSC），切断它们进入客户端 bundle 的路径。
3. 进一步拓展大厂面试追问：如何在打包阶段审计出哪些第三方依赖库被无意间带入了客户端的 Hydration 队列中？可以使用 Webpack Bundle Analyzer 或 Vite Bundle Visualizer 插件，配合在 React 源码中查找带有 "use client" 指令的边界。如果在顶层组件错误声明了 use client，会导致其下的所有依赖包（即使只是格式化日期的 moment.js）被全量打入客户端 JS 中，必须下沉 use client 到精确的交互叶子节点组件中。`),
        single('用户看得见但点不了，常见方向是？', ['Hydration 或 JS 执行未完成', '图片 alt 错误', '接口状态码 204', 'README 缺目录'], 0, `💡 它解决了什么问题：
定义了线上大流量 SSR/SSG 系统“假死”事故的经典诊断路径，使得技术团队能快速将问题定位到客户端主线程阻塞或资源加载挂起，缩短故障恢复时间。

🔍 核心原理解析（防拷打）：
1. 机制解析：当页面能渲染（可视）但无交互响应时，核心问题通常是浏览器主线程正处于长任务（Long Task）卡死状态。
2. 这可能是因为客户端 JS bundle 文件极其庞大，网络下载受阻，或者下载后执行了大体积的 JS 解析与 Hydration 逻辑。导致用户点击被输入事件队列积压，迟迟得不到主线程处理。
3. 进一步拓展大厂面试追问：如何在线上真实用户环境中度量和监控这种“看得见但点不了”的糟糕体验？应当通过监控 Chrome 用户体验报告（CrUX）中的 INP（Interaction to Next Paint）指标，或利用 Long Animation Frames API (LoAF) 捕获页面上的 Long Task 发生时机与具体的脚本调用栈，精确定位出拖慢交互的 culprit 代码。`),
      ],
    }),
    makeLongformDoc({
      title: 'React Server Components：把什么留在服务端，什么交给客户端',
      sourceCards: ['工程化主干待补：SSR / RSC', 'TypeScript 进阶'],
      problem: '它解决的是前端应用中“数据读取、服务端能力、客户端交互和包体积”边界不清的问题。RSC 允许组件在服务端执行，直接访问服务端资源，并不把这部分组件代码发送到浏览器。',
      customerCase: '客户内容站页面包体积大，很多组件只是读数据库并渲染静态内容，却被打进客户端 bundle。引入 Server Components 后，纯数据展示留在服务端，收藏、评论输入、弹窗等交互才作为客户端组件。',
      flow: [
        '默认把无交互、依赖服务端数据的组件放服务端。',
        '需要浏览器状态、事件、effect、DOM API 的组件声明为客户端组件。',
        '服务端组件负责取数、权限边界和静态结构。',
        '客户端组件负责交互、局部状态和浏览器 API。',
        '通过 props 从服务端向客户端传递可序列化数据。',
        '用缓存、路由和 Suspense 管理取数与加载边界。',
      ],
      keywords: [
        { term: 'Server Component', desc: '在服务端执行，不进入客户端 JS bundle 的组件。' },
        { term: 'Client Component', desc: '在客户端执行，可使用 state、effect 和浏览器事件。' },
        { term: 'use client', desc: '声明客户端组件边界。' },
        { term: 'serializable props', desc: '从服务端传给客户端的数据必须可序列化。' },
        { term: 'server-only secret', desc: '只能留在服务端的密钥和能力。' },
        { term: 'bundle boundary', desc: '服务端/客户端边界会影响最终 JS 体积。' },
      ],
      interview: 'RSC 的核心是重新划分组件执行位置：数据读取和无交互 UI 尽量留在服务端，浏览器状态和事件交给客户端组件；它能减少客户端 JS，但要求清楚序列化、缓存、权限和边界设计。',
      demo: `边界示例：

\`\`\`tsx
// Server Component
export default async function ProductPage({ id }) {
  const product = await db.product.find(id)
  return <BuyBox product={product} />
}

// Client Component
'use client'
function BuyBox({ product }) {
  const [count, setCount] = useState(1)
  return <button onClick={() => addToCart(product.id, count)}>加入购物车</button>
}
\`\`\`

服务端取数，客户端负责交互。不要为了方便把整棵树都标成客户端组件。`,
      diagnosis: [
        '包体积异常时检查是否过早使用 use client 扩大客户端边界。',
        '服务端组件报浏览器 API 错误时检查 window、document、effect 使用位置。',
        '客户端收不到函数或复杂对象时检查 props 是否可序列化。',
        '数据重复请求时检查缓存和路由层取数策略。',
        '密钥泄漏时检查服务端能力是否穿过客户端边界。',
        '交互失效时检查客户端组件边界是否正确声明。',
      ],
      followups: [
        'RSC 和 SSR 是同一件事吗？',
        'use client 放在很高层会有什么后果？',
        'Server Component 能不能使用 useState？',
        'RSC 如何影响组件库设计？',
      ],
      deepDive: '值得深入。RSC 是 React 生态的重要架构变化，但不是所有项目都必须马上采用。深入顺序是 SSR/Hydration、Server/Client Component 边界、序列化、缓存、Server Actions 和框架实现。',
      references: ['React Server Components 文档', 'Next.js Server and Client Components 文档', 'React use client 文档', 'React Suspense 文档'],
      quiz: [
        single('Server Component 的主要特点是？', ['在服务端执行且不进入客户端 JS bundle', '只能在浏览器运行', '必须使用 useState', '不能访问服务端数据'], 0, `💡 它解决了什么问题：
解决了传统组件“既想读取数据库/密钥，又想精简客户端打包体积”的双重矛盾。打破了“所有 React/Vue 组件都必须打包发给浏览器”的传统思维局限。

🔍 核心原理解析（防拷打）：
1. RSC 设计特征：Server Component 直接在服务端（Node.js 环境）运行并生成中间数据结构，其组件代码、引用的第三方包（如 md5、lodash 等）以及服务端密钥绝不会被发送到浏览器端。
2. 浏览器只接收序列化后的组件结构流并挂载。由于不进入客户端 JS bundle，这实现了近乎 O(0) 的包体积增长开销。
3. 进一步拓展大厂面试追问：在 RSC 架构中，如果服务端组件的数据发生了更新，它是如何实现不刷新页面就更新 UI 的？RSC 会通过专用的 React 路由框架发起一个带有特制 Header 的 fetch 请求，服务端重新计算 Server Component 并返回最新序列化流，客户端 React 会在不销毁现有客户端组件状态的前提下，进行智能 DOM Diff 并执行增量更新。`),
        multiple('需要 Client Component 的场景包括？', ['点击事件', 'useState', 'useEffect', '直接访问 window'], [0, 1, 2, 3], `💡 它解决了什么问题：
明确了在 Server Component（RSC）新时代下，如何安全、准确地划定“浏览器交互”与“服务端渲染”的物理边界，防止因混淆边界导致的状态丢失或编译错误。

🔍 核心原理解析（防拷打）：
1. 边界划分：Client Component（客户端组件）依然需要在浏览器端执行。任何需要管理本地状态（useState/useReducer）、触发副作用（useEffect/useLayoutEffect）、绑定原生事件监听（onClick/onChange）以及访问浏览器专属 API（window/document）的场景，都必须显式声明为客户端组件。
2. 它是通过在文件顶部加上 "use client" 指令来定义的，划定了打包工具打包客户端 bundle 的入口边界。
3. 进一步拓展大厂面试追问：客户端组件（Client Component）在 SSR 模式下会在服务端运行吗？是的。客户端组件虽然打入了客户端 JS，但在首次 SSR 时，它们依然会在服务端被 renderToString 跑一遍，以生成首屏 HTML。因此，必须注意不要在客户端组件的 top-level 作用域直接使用 window 等浏览器对象，否则会导致首屏 SSR 直接报错。`),
        judgment('为了省事，把根组件标成 use client 通常会扩大客户端 bundle。', 0, `💡 它解决了什么问题：
警告开发团队不要采用“偷懒式开发”将 use client 标志声明在极高层节点（如 Layout 或根 App），这会使新架构的体积优化优势化为乌有。

🔍 核心原理解析（防拷打）：
1. 边界传染：在打包编译期，当一个文件被标记为 "use client" 后，打包工具（如 Rollup/Webpack）会将其视为客户端打包的入口起点。
2. 这意味着，该文件引用的所有子组件、工具函数、外部 npm 依赖，都会被默认划入客户端的 JS bundle 中。如果你把 use client 放在根节点，整棵组件树都会被当成 Client Component 打包发送，RSC 架构直接退化为普通的 CSR/SSR。
3. 进一步拓展大厂面试追问：如何在保持叶子节点为 Client Component 的情况下，让 Server Component 依然能嵌套在它的内部运行？可以利用“插槽/Children 传递机制”。将 Server Component 作为 props.children 传入 Client Component 中。由于 children 的解析在服务端已经完成并序列化，客户端组件仅作为容器渲染它，而不会将 children 对应的组件代码打包进客户端，实现了完美的嵌套设计。`),
        single('从服务端组件传给客户端组件的数据要求？', ['可序列化', '必须是函数', '必须是数据库连接', '必须是 DOM 节点'], 0, `💡 它解决了什么问题：
解决了在跨越“服务端 - 客户端”这一物理物理屏障传递数据时，由于不规范的数据类型（如函数、数据库连接对象、自定义类实例）在网络传输中无法被反序列化，而导致运行时崩溃的风险。

🔍 核心原理解析（防拷打）：
1. 序列化限制：服务端组件是在 Node 端执行的，而客户端组件在浏览器端执行，两者之间的通信是通过特定的序列化文本流进行的。
2. 因此，从服务端传给客户端的所有 props，必须能够被完全序列化为 JSON 安全的格式（如 String、Number、Array、Plain Object）。任何非序列化类型（如 Class 实例、Function、Symbol、Map/Set）都会触发序列化报错。
3. 进一步拓展大厂面试追问：如果服务端组件确实需要将一个异步的数据获取 Promise 传给客户端组件，这能被序列化吗？如何实现？React 18 特殊支持了 Promise 的序列化传递。服务端可以将一个未 resolve 的 Promise 作为 props 传给客户端组件，客户端组件在内部使用最新的 use hook 接收并结合 Suspense 挂起等待决议，这为跨边界异步协作提供了原生通道。`),
        multiple('RSC 可帮助改善？', ['客户端 JS 体积', '服务端取数边界', '密钥留在服务端', '所有 INP 问题自动消失'], [0, 1, 2], `💡 它解决了什么问题：
定义了 RSC 在首屏性能与工程治理上的核心价值，防止团队期望错配——它重点解决的是 JS 运载体积和数据取数延迟，而不是自动抹平所有不当的客户端慢任务交互。

🔍 核心原理解析（防拷打）：
1. 性能提升落脚点：RSC 最大的贡献是减少了首屏所需下载和解析的 JS 包体积。因为这部分组件的运行时纯留在服务端。
2. 同时，由于组件在服务端直接运行，相比客户端发起多次串行网络 fetch（瀑布流请求），RSC 在内网直接调取数据库或微服务，极大地降低了数据获取的时间开销。
3. 进一步拓展大厂面试追问：在 RSC 下，如果服务端组件的数据源频繁变化（如实时报价），为了保持更新而频繁重算 RSC，是否会对 Node 服务器造成极大的 CPU 算力损耗？是的。因此，必须对 Server Component 的数据源调用加上合理的缓存策略（如 Next.js 的 fetch cache 或者是 unstable_cache），对静态和半静态数据进行缓存隔离，防止并发流量直接拖挂 Node 服务。`),
        single('RSC 和 SSR 的关系更准确是？', ['相关但不是同一概念', '完全相同', '完全互斥', '都只用于 CSS'], 0, `💡 它解决了什么问题：
理清了现代前端渲染引擎两个极易混淆的核心概念（RSC与SSR）之间的技术差异与协作关系，帮助架构师设计出最合理的渲染流水线。

🔍 核心原理解析（防拷打）：
1. 概念界定：RSC（React Server Components）是关于“组件在何处执行”的组件模型设计；而 SSR（Server-Side Rendering）是关于“如何将组件树转换为 HTML 字符串”的渲染技术方案。
2. 两者不互斥，而是完美协同：在一个应用中，我们可以先通过 RSC 在服务端执行组件并拉取数据，生成轻量化流，然后再通过 SSR 将这个流直接转换为 HTML 字符流吐给浏览器，实现“首屏极速呈现（SSR）”与“JS 运载体积最小化（RSC）”的兼得。
3. 进一步拓展大厂面试追问：在没有 SSR、仅有 RSC 的情况下，首屏加载体验会如何？在没有 SSR 的纯 RSC 下，首屏依然需要先下载一个空白的 HTML，然后由客户端运行时动态加载并解析 RSC 的流数据来动态绘制 DOM。虽然 JS 体积依然小，但首屏会经历短暂的白屏，无法享受到 HTML 直出的极致性能，因此在生产环境中，通常必须将两者结合使用。`),
      ],
    }),
  ],
};
