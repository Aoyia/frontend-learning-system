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
        single('选择渲染方案最应该先看什么？', ['业务目标和页面特征', '哪个技术最新', '团队谁声音大', '文件名长度'], 0, '渲染方案服务业务目标。'),
        multiple('SSR 的代价包括？', ['服务端容量', 'Hydration 复杂度', '缓存设计', '完全不需要 JS'], [0, 1, 2], 'SSR 后仍可能需要客户端 JS 接管交互。'),
        judgment('SSR 一定让所有页面所有指标都变快。', 1, 'SSR 可能改善首屏，也可能增加 TTFB 和复杂度。'),
        single('强登录后台且 SEO 不重要，通常优先考虑？', ['CSR + 工程优化', '全站 SSG', '只返回纯 HTML', '不用路由'], 0, '后台强交互场景 CSR 往往更简单合适。'),
        multiple('SSG 更适合？', ['文档', '博客', '营销页', '每个用户完全不同的实时控制台'], [0, 1, 2], '强个性化实时页面不适合纯 SSG。'),
        single('SSR 后 TTFB 高，优先排查？', ['服务端取数、缓存和渲染成本', '按钮颜色', 'CSS 类名', 'Git 用户名'], 0, 'TTFB 反映服务端首字节链路。'),
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
        single('Hydration 主要做什么？', ['让客户端接管服务端 HTML 并绑定交互', '压缩图片', '解析 DNS', '创建数据库'], 0, 'Hydration 让静态 HTML 变成交互应用。'),
        multiple('Hydration mismatch 可能来自？', ['Date.now()', 'Math.random()', '服务端客户端数据不同', '稳定 props'], [0, 1, 2], '不稳定值会让两端结果不一致。'),
        judgment('SSR HTML 出现在屏幕上，就说明页面所有交互都已经可用。', 1, '交互通常要等客户端 JS 和 Hydration 完成。'),
        single('Streaming 的核心价值是？', ['分块更早发送 HTML', '完全不需要服务端', '替代 CSS', '删除 JS'], 0, 'Streaming 让内容可以逐步到达。'),
        multiple('优化 Hydration 成本可考虑？', ['减少客户端组件范围', '拆分 JS', '延后非关键脚本', '增加无关依赖'], [0, 1, 2], '无关依赖会增加成本。'),
        single('用户看得见但点不了，常见方向是？', ['Hydration 或 JS 执行未完成', '图片 alt 错误', '接口状态码 204', 'README 缺目录'], 0, '可见不等于可交互。'),
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
        single('Server Component 的主要特点是？', ['在服务端执行且不进入客户端 JS bundle', '只能在浏览器运行', '必须使用 useState', '不能访问服务端数据'], 0, '服务端组件执行在服务端。'),
        multiple('需要 Client Component 的场景包括？', ['点击事件', 'useState', 'useEffect', '直接访问 window'], [0, 1, 2, 3], '这些都依赖客户端运行时。'),
        judgment('为了省事，把根组件标成 use client 通常会扩大客户端 bundle。', 0, '高层 use client 会让更多子树进入客户端边界。'),
        single('从服务端组件传给客户端组件的数据要求？', ['可序列化', '必须是函数', '必须是数据库连接', '必须是 DOM 节点'], 0, '跨边界 props 需要可序列化。'),
        multiple('RSC 可帮助改善？', ['客户端 JS 体积', '服务端取数边界', '密钥留在服务端', '所有 INP 问题自动消失'], [0, 1, 2], 'RSC 不会自动解决所有交互性能问题。'),
        single('RSC 和 SSR 的关系更准确是？', ['相关但不是同一概念', '完全相同', '完全互斥', '都只用于 CSS'], 0, 'RSC 是组件执行模型，SSR 是生成 HTML 的渲染方式。'),
      ],
    }),
  ],
};
