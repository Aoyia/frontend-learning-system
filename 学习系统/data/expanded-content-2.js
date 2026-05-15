export const EXPANDED_MODULES_BATCH_2 = [
  {
    id: 'testing-quality',
    name: '测试与质量保障',
    icon: '🧪',
    desc: '从单测、组件测试到 E2E 和质量门禁，建立可持续交付的质量体系。',
    docs: [
      {
        title: '测试金字塔：哪些问题该用哪类测试兜底',
        difficulty: '进阶',
        content: `
## 1. 真实问题

很多团队一提测试就只想到“补 E2E”。但 E2E 成本最高、反馈最慢、最容易受环境波动影响。中高级前端要能按风险选择测试层级，而不是把所有问题都塞到一种测试里。

## 2. 测试分层

- 单元测试：验证纯函数、工具函数、状态计算、边界条件
- 组件测试：验证组件渲染、交互、状态变化、可访问性
- 集成测试：验证模块之间的数据流和副作用
- E2E 测试：验证真实用户关键链路，例如登录、下单、支付、发布
- 视觉回归：验证 UI 结构和样式是否意外变化

## 3. 大厂视角

质量体系的目标不是追求 100% 覆盖率，而是让高风险路径能被稳定、快速、低噪声地发现问题。真正成熟的团队会把测试和 CI 门禁、代码评审、监控告警一起看。

## 4. 面试版

测试金字塔的核心是把更多确定性强、成本低的问题放到底层测试，把少量高价值用户链路放到 E2E，用分层测试控制反馈速度、稳定性和维护成本。`,
        quiz: [
          { type: 'single', question: '测试金字塔的核心思想是？', options: ['所有问题都写 E2E', '按成本和风险分层覆盖', '完全不写测试', '只看代码覆盖率'], answer: 1, explain: '分层测试能平衡反馈速度、稳定性和维护成本。' },
          { type: 'multiple', question: '适合单元测试覆盖的内容包括？', options: ['纯函数', '状态计算', '边界条件', '真实支付链路全流程'], answer: [0,1,2], explain: '真实支付链路更适合 E2E 或集成链路测试。' },
          { type: 'judgment', question: 'E2E 测试越多，质量体系就一定越稳定。', options: ['对', '错'], answer: 1, explain: 'E2E 成本高且更易波动，需要控制在关键链路。' },
          { type: 'single', question: '组件测试更适合验证什么？', options: ['组件渲染与交互状态', 'DNS 解析', '数据库索引', 'CDN 回源'], answer: 0, explain: '组件测试关注组件行为和用户交互。' },
          { type: 'multiple', question: '质量门禁可结合哪些信号？', options: ['单测结果', '构建结果', 'E2E 关键链路', '开发者心情'], answer: [0,1,2], explain: '门禁应基于可验证信号。' },
          { type: 'single', question: '覆盖率指标最大的问题是？', options: ['只能说明代码被执行，不能直接说明断言有效', '永远无意义', '无法统计', '只能用于 CSS'], answer: 0, explain: '覆盖率需要和断言质量、风险路径一起看。' }
        ]
      },
      {
        title: 'E2E 测试：稳定选择器、等待策略与关键路径',
        difficulty: '进阶',
        content: `
## 1. 真实问题

E2E 测试最怕两件事：不稳定和维护成本高。测试如果经常因为等待不当、选择器脆弱、环境数据不稳定而失败，团队很快就会不信任它。

## 2. 可靠 E2E 的关键

- 优先使用用户可感知选择器，例如角色、文本、label
- 避免依赖脆弱的层级 CSS 选择器
- 使用自动等待和 Web-first assertions
- 测试关键业务路径，而不是覆盖每个按钮
- 测试数据可控，可重复执行
- 失败时保留截图、视频、trace，便于定位

## 3. 大厂视角

E2E 不是 QA 的脚本，而是产品关键路径的工程契约。它应该进入 CI，在合并和发布前帮助团队发现真正会影响客户的问题。

## 4. 面试版

稳定 E2E 的核心是面向用户行为建模，用稳定 locator 和自动等待减少 flake，只覆盖高价值路径，并把失败证据沉淀成可定位的 trace。`,
        quiz: [
          { type: 'single', question: 'E2E 测试中更推荐的选择器策略是？', options: ['优先使用用户可感知 locator', '依赖深层 CSS 层级', '随机选择 DOM 节点', '只用 nth-child'], answer: 0, explain: '用户可感知 locator 更贴近真实行为，也更稳定。' },
          { type: 'multiple', question: '降低 E2E flake 的手段包括？', options: ['自动等待', '稳定测试数据', '失败 trace', '固定 sleep 所有步骤 10 秒'], answer: [0,1,2], explain: '固定 sleep 会让测试慢且仍不稳定。' },
          { type: 'judgment', question: 'E2E 应该覆盖所有边角 UI 状态。', options: ['对', '错'], answer: 1, explain: 'E2E 应聚焦关键用户路径，边角状态可下沉到组件测试。' },
          { type: 'single', question: 'Web-first assertions 的价值是？', options: ['自动等待页面达到预期状态', '自动写业务代码', '跳过断言', '删除测试报告'], answer: 0, explain: '它能减少时序导致的不稳定。' },
          { type: 'multiple', question: 'E2E 失败后有助于定位的信息包括？', options: ['截图', '视频', 'trace', '随机刷新页面'], answer: [0,1,2], explain: '失败证据能帮助定位真实失败原因。' },
          { type: 'single', question: '大厂更适合把 E2E 放在哪里发挥价值？', options: ['关键链路 CI 和发布门禁', '只在本地偶尔跑', '完全手工执行', '只给新人演示'], answer: 0, explain: '关键链路应成为交付质量信号。' }
        ]
      },
      {
        title: '契约测试与 Mock：前后端协作不靠口头约定',
        difficulty: '进阶',
        content: `
## 1. 真实问题

很多线上问题不是前端或后端单方写错，而是双方理解的接口契约不一致：字段缺失、枚举新增、错误码变化、分页结构变化。

## 2. 契约内容

- 请求参数和校验规则
- 响应字段、可选字段、枚举
- 错误码和错误结构
- 分页、排序、筛选协议
- 兼容性策略和废弃策略

## 3. Mock 的正确使用

Mock 应该服务于开发和测试效率，但不能长期脱离真实契约。推荐从 OpenAPI、GraphQL schema 或统一接口描述生成类型和 Mock，减少手写漂移。

## 4. 面试版

契约测试的价值是把前后端约定变成可验证资产，防止接口变化在联调或线上才暴露；Mock 要从契约生成，而不是复制一份会漂移的数据。`,
        quiz: [
          { type: 'single', question: '契约测试主要解决什么问题？', options: ['前后端接口理解不一致', '按钮颜色不好看', 'DNS 解析慢', '代码缩进不统一'], answer: 0, explain: '契约测试把接口约定变成可验证资产。' },
          { type: 'multiple', question: '接口契约通常应覆盖？', options: ['请求参数', '响应字段', '错误结构', '开发者昵称'], answer: [0,1,2], explain: '这些都会影响前端消费。' },
          { type: 'judgment', question: 'Mock 数据长期手写且不和接口契约同步，风险很低。', options: ['对', '错'], answer: 1, explain: '手写 Mock 容易漂移，导致联调或线上暴露问题。' },
          { type: 'single', question: '更可靠的 Mock 来源是？', options: ['统一接口契约生成', '复制线上某一次响应后永不更新', '随便编字段', '问产品口述'], answer: 0, explain: '从契约生成能降低漂移。' },
          { type: 'multiple', question: '字段枚举变化可能导致？', options: ['前端分支遗漏', '展示文案错误', '状态机异常', '浏览器无法打开 DevTools'], answer: [0,1,2], explain: '枚举变化会影响业务逻辑和 UI 状态。' },
          { type: 'single', question: '接口废弃策略应优先考虑？', options: ['兼容周期和迁移路径', '直接删除', '不通知消费方', '只改接口名字'], answer: 0, explain: '契约变化要管理影响面和迁移过程。' }
        ]
      }
    ]
  },
  {
    id: 'frontend-security',
    name: '前端安全',
    icon: '🛡️',
    desc: '覆盖 XSS、CSP、CSRF、供应链与前端敏感信息治理。',
    docs: [
      {
        title: 'XSS 与 CSP：用户输入到 DOM 的安全边界',
        difficulty: '困难',
        content: `
## 1. 真实问题

XSS 的本质是攻击者让不可信内容作为代码在用户浏览器里执行。它可能来自富文本、URL 参数、第三方脚本、评论区、低代码配置、埋点字段。

## 2. 防护层次

- 默认转义，不把用户输入当 HTML
- 富文本使用可信 sanitizer
- 避免危险 DOM API，例如直接拼 innerHTML
- 使用 CSP 限制脚本来源和执行方式
- 对高风险场景引入 Trusted Types
- 对第三方脚本做权限和来源治理

## 3. 客户问题视角

如果客户反馈账号异常、页面被插入陌生脚本、点击跳转异常，需要排查输入链路、存储链路、渲染链路、第三方脚本和响应头策略。

## 4. 面试版

XSS 防护不能只靠一个工具，要从输入、存储、输出、DOM API、CSP 和第三方脚本治理多层防护。`,
        quiz: [
          { type: 'single', question: 'XSS 的本质是？', options: ['不可信内容被当作代码执行', '图片太大', '接口太慢', 'CSS 权重太高'], answer: 0, explain: 'XSS 关键在于攻击内容进入可执行上下文。' },
          { type: 'multiple', question: '降低 XSS 风险的措施包括？', options: ['输出转义', '可信 sanitizer', 'CSP', '直接信任所有富文本'], answer: [0,1,2], explain: '富文本必须经过安全处理。' },
          { type: 'judgment', question: 'React 默认会转义文本，因此任何场景都不可能 XSS。', options: ['对', '错'], answer: 1, explain: 'dangerouslySetInnerHTML、第三方脚本和富文本仍有风险。' },
          { type: 'single', question: 'CSP 的主要作用是？', options: ['限制页面可加载和执行的资源来源', '提升数据库性能', '压缩 JS', '管理 Git 分支'], answer: 0, explain: 'CSP 通过响应头声明资源加载和执行策略。' },
          { type: 'multiple', question: '高风险 DOM API 或场景包括？', options: ['innerHTML 拼接', '富文本渲染', '第三方脚本注入', 'textContent 设置纯文本'], answer: [0,1,2], explain: 'textContent 设置纯文本通常更安全。' },
          { type: 'single', question: 'Trusted Types 更关注哪类风险？', options: ['把字符串传给可执行 DOM Sink', '图片懒加载', 'HTTP 缓存', '组件命名'], answer: 0, explain: 'Trusted Types 用于约束高风险 DOM sink 的输入。' }
        ]
      },
      {
        title: 'CSRF、Cookie 与登录态：浏览器自动携带凭证的风险',
        difficulty: '进阶',
        content: `
## 1. 真实问题

CSRF 利用的是浏览器会自动带上目标站点 Cookie。如果用户已登录，攻击页面可以诱导浏览器向目标站点发起请求。

## 2. 防护要点

- SameSite Cookie
- CSRF Token
- 关键写操作校验 Origin 或 Referer
- 避免用 GET 做有副作用操作
- 敏感操作二次确认或重新认证

## 3. Cookie 属性

HttpOnly 能降低脚本读取 Cookie 的风险；Secure 要求 HTTPS；SameSite 控制跨站请求携带行为；Domain 和 Path 控制作用范围。

## 4. 面试版

CSRF 的关键是跨站请求自动携带凭证，防护需要 Cookie SameSite、CSRF Token、Origin 校验和正确 HTTP 语义一起配合。`,
        quiz: [
          { type: 'single', question: 'CSRF 主要利用了浏览器的什么行为？', options: ['自动携带目标站点 Cookie', '自动压缩图片', '自动执行 TypeScript', '自动生成接口'], answer: 0, explain: '已登录 Cookie 被自动带上是 CSRF 的关键条件。' },
          { type: 'multiple', question: 'CSRF 防护手段包括？', options: ['SameSite Cookie', 'CSRF Token', 'Origin 校验', '把所有接口改成 GET'], answer: [0,1,2], explain: 'GET 不应承载有副作用操作。' },
          { type: 'judgment', question: 'HttpOnly 可以防止浏览器自动携带 Cookie 发请求。', options: ['对', '错'], answer: 1, explain: 'HttpOnly 防脚本读取 Cookie，但不阻止自动携带。' },
          { type: 'single', question: 'Secure Cookie 表示什么？', options: ['只在 HTTPS 等安全通道发送', '永不过期', '可被任意脚本读取', '只能本地使用'], answer: 0, explain: 'Secure 限制 Cookie 在安全通道发送。' },
          { type: 'multiple', question: 'Cookie 作用范围相关属性有？', options: ['Domain', 'Path', 'SameSite', 'font-weight'], answer: [0,1,2], explain: '前三者都影响 Cookie 发送范围或跨站行为。' },
          { type: 'single', question: '删除订单这类操作更不应该使用？', options: ['GET', 'POST/DELETE 并做校验', 'CSRF Token', '权限校验'], answer: 0, explain: 'GET 应保持安全和幂等语义。' }
        ]
      },
      {
        title: '供应链安全：依赖、构建与前端密钥',
        difficulty: '困难',
        content: `
## 1. 真实问题

前端供应链风险来自依赖包、构建脚本、CI 凭证、发布 Token、第三方 CDN 脚本、浏览器扩展和内部私有包。

## 2. 治理手段

- lockfile 和 frozen install
- 依赖审计和漏洞升级
- 控制 install scripts
- 最小权限 Token
- 私有 registry 权限治理
- 第三方脚本白名单和 SRI
- 禁止把密钥打进前端产物

## 3. 面试版

前端安全不只是在页面防 XSS，还包括依赖、构建、发布和第三方脚本的供应链治理；前端产物里不能存在真正的服务端密钥。`,
        quiz: [
          { type: 'single', question: '为什么不能把真正的服务端密钥放进前端代码？', options: ['前端产物会暴露给用户', '会让 CSS 失效', '会降低字体清晰度', '会阻止路由跳转'], answer: 0, explain: '前端代码和资源可被用户获取。' },
          { type: 'multiple', question: '供应链风险来源包括？', options: ['依赖包', 'install scripts', 'CI 发布 Token', '按钮圆角'], answer: [0,1,2], explain: '依赖、构建和发布凭证都是安全边界。' },
          { type: 'judgment', question: 'lockfile 只影响安装速度，不影响供应链治理。', options: ['对', '错'], answer: 1, explain: 'lockfile 有助于依赖版本可审计和可复现。' },
          { type: 'single', question: 'SRI 主要用于什么？', options: ['校验外部资源完整性', '压缩接口响应', '生成类型文件', '管理 React 状态'], answer: 0, explain: 'Subresource Integrity 用于校验加载资源是否被篡改。' },
          { type: 'multiple', question: 'CI Token 治理应关注？', options: ['最小权限', '有效期和轮换', '环境隔离', '永久全权限'], answer: [0,1,2], explain: '永久全权限 Token 风险很高。' },
          { type: 'single', question: '私有包 registry 权限失控可能导致？', options: ['内部包泄露或被污染', 'CSS 自动优化', '浏览器自动升级', '接口更快'], answer: 0, explain: '私有包也是供应链资产。' }
        ]
      }
    ]
  },
  {
    id: 'rendering-architecture',
    name: '渲染架构',
    icon: '🧭',
    desc: 'SSR、SSG、Streaming、RSC 与客户端水合的取舍。',
    docs: [
      {
        title: 'CSR、SSR、SSG：首屏、交互与成本的取舍',
        difficulty: '进阶',
        content: `
## 1. 真实问题

渲染方案不是流行什么就用什么。中后台可能 CSR 足够；内容站、营销页、SEO 强页面更看重首屏 HTML；高并发页面还要考虑缓存和服务端成本。

## 2. 对比

- CSR：服务端返回空壳，浏览器下载 JS 后渲染
- SSR：每次请求在服务端生成 HTML
- SSG：构建时生成 HTML，适合内容相对稳定页面
- ISR 或增量静态：在静态和动态之间折中

## 3. 面试版

渲染架构取舍要看首屏、SEO、数据实时性、缓存能力、服务端成本和团队复杂度，而不是简单说 SSR 一定更好。`,
        quiz: [
          { type: 'single', question: '选择渲染方案时最不应该依据什么？', options: ['团队真实目标和约束', 'SEO 和首屏诉求', '数据实时性', '单纯因为流行'], answer: 3, explain: '架构选择必须基于目标和约束。' },
          { type: 'multiple', question: 'SSR 可能带来的成本包括？', options: ['服务端计算压力', '缓存复杂度', '水合问题', '完全不需要 JS'], answer: [0,1,2], explain: 'SSR 仍通常需要客户端 JS 接管交互。' },
          { type: 'judgment', question: 'SSR 一定比 CSR 更适合所有页面。', options: ['对', '错'], answer: 1, explain: '中后台等强交互页面 CSR 可能更简单合适。' },
          { type: 'single', question: 'SSG 更适合哪类页面？', options: ['内容相对稳定且可缓存页面', '每毫秒变化的交易撮合页面', '只在本地使用的弹窗', '用户输入框'], answer: 0, explain: 'SSG 的优势是构建期生成和高缓存能力。' },
          { type: 'multiple', question: '渲染方案取舍关注？', options: ['首屏', 'SEO', '数据实时性', '开发者星座'], answer: [0,1,2], explain: '这些是架构决策核心因素。' },
          { type: 'single', question: 'CSR 首屏慢常见原因是？', options: ['HTML 到达后仍需下载和执行 JS 才能渲染主体', '服务器生成太多 HTML', '没有数据库', 'DNS 一定失败'], answer: 0, explain: 'CSR 主体内容依赖客户端 JS 执行。' }
        ]
      },
      {
        title: 'Hydration 与 Streaming：为什么服务端 HTML 还会卡',
        difficulty: '困难',
        content: `
## 1. 真实问题

SSR 返回 HTML 不代表页面马上可交互。浏览器还要下载 JS、解析执行、进行 hydration，把事件绑定和状态接回客户端。

如果 hydration 任务很重，用户会看到内容但点不动，这会影响交互体验。

## 2. 优化方向

- 拆分客户端组件，减少需要 hydration 的区域
- Streaming 让 HTML 分块更早到达
- Suspense 边界控制加载体验
- 避免把所有组件都变成客户端组件
- 延迟低优先级交互区域

## 3. 面试版

SSR 优化不只看 HTML 首屏，还要看 hydration 成本；Streaming 和边界拆分能改善内容到达和交互接管的节奏。`,
        quiz: [
          { type: 'single', question: 'Hydration 的核心作用是？', options: ['让服务端 HTML 接上客户端交互能力', '压缩图片', '创建数据库索引', '删除 CSS'], answer: 0, explain: 'Hydration 让静态 HTML 变成可交互应用。' },
          { type: 'multiple', question: 'Hydration 过重可能导致？', options: ['页面看得到但点不动', '主线程繁忙', 'INP 变差', 'DNS 自动变快'], answer: [0,1,2], explain: '重 hydration 会占用主线程并影响交互。' },
          { type: 'judgment', question: 'SSR 返回了 HTML，就一定不存在交互性能问题。', options: ['对', '错'], answer: 1, explain: '客户端接管和后续 JS 执行仍可能卡。' },
          { type: 'single', question: 'Streaming 的主要价值是？', options: ['让 HTML 分块更早到达浏览器', '让所有 JS 同步执行', '禁用缓存', '替代 HTTPS'], answer: 0, explain: 'Streaming 改善内容到达节奏。' },
          { type: 'multiple', question: '降低 hydration 成本可考虑？', options: ['减少客户端组件范围', '拆 Suspense 边界', '延迟低优先级区域', '所有组件都强制 client'], answer: [0,1,2], explain: '全量 client 会增加 hydration 成本。' },
          { type: 'single', question: '用户看到页面但点击无响应，更可能与什么有关？', options: ['hydration 或主线程任务未完成', 'HTML 文件名太短', '图片 alt 文案', 'Git 分支名'], answer: 0, explain: '可见不等于可交互。' }
        ]
      },
      {
        title: 'React Server Components：数据边界与客户端边界',
        difficulty: '困难',
        content: `
## 1. 真实问题

React Server Components 不是 SSR 的同义词。它把一部分组件放到服务器环境执行，减少客户端 bundle，并允许更靠近数据源获取数据。

但 RSC 也要求清楚地区分服务器组件和客户端组件。需要交互、状态、浏览器 API 的部分仍然要在客户端。

## 2. 关键边界

- Server Component 可访问服务端资源
- Client Component 承担交互和浏览器 API
- 不能随意把函数和不可序列化对象跨边界传递
- 过度 client 会丧失 RSC 减包收益
- 过度 server 会让交互设计受限

## 3. 面试版

RSC 的价值是重新划分数据获取和客户端交互边界，让不需要交互的 UI 留在服务端，减少客户端 JS；关键挑战是边界设计和序列化约束。`,
        quiz: [
          { type: 'single', question: 'React Server Components 的重要价值之一是？', options: ['减少不必要的客户端 JS', '让所有组件都能直接访问 DOM', '替代所有 API', '关闭服务端'], answer: 0, explain: 'RSC 可让部分 UI 不进入客户端 bundle。' },
          { type: 'multiple', question: 'Client Component 更适合承担？', options: ['交互状态', '浏览器 API', '事件处理', '直接读取数据库密码'], answer: [0,1,2], explain: '客户端组件用于交互和浏览器环境能力。' },
          { type: 'judgment', question: 'RSC 和传统 SSR 是完全同一个概念。', options: ['对', '错'], answer: 1, explain: 'RSC 是组件模型和边界设计，不等同于 SSR。' },
          { type: 'single', question: 'RSC 边界上需要特别关注？', options: ['序列化和数据传递限制', 'CSS 颜色数量', '图片名称', '编辑器插件'], answer: 0, explain: '跨 server/client 边界的数据需要可传递。' },
          { type: 'multiple', question: '过度使用 Client Component 可能导致？', options: ['客户端 bundle 变大', 'hydration 成本增加', '丧失部分 RSC 收益', '服务端自动消失'], answer: [0,1,2], explain: 'client 边界越大，客户端负担越重。' },
          { type: 'single', question: '需要使用 window 和点击状态的组件通常应是？', options: ['Client Component', '纯 Server Component', '数据库表', 'CDN 节点'], answer: 0, explain: '浏览器 API 和交互状态属于客户端环境。' }
        ]
      }
    ]
  },
  {
    id: 'state-data-layer',
    name: '状态与数据层',
    icon: '🧠',
    desc: '区分客户端状态、服务端状态、缓存一致性与复杂表单。',
    docs: [
      {
        title: 'Server State vs Client State：不要把所有状态塞进 Store',
        difficulty: '进阶',
        content: `
## 1. 真实问题

很多项目状态管理失控，是因为把服务端数据、表单草稿、弹窗开关、URL 参数、权限信息全部塞进同一个全局 store。

## 2. 状态分类

- Server State：来自服务端，需要缓存、重新拉取、失效、并发处理
- Client State：纯前端 UI 状态，例如弹窗、主题、侧边栏
- URL State：可分享、可回退的状态，例如筛选条件、分页
- Form State：用户正在编辑但未提交的数据
- Derived State：可由已有数据计算出来，不应重复存储

## 3. 面试版

状态管理的核心不是选 Redux 还是 Zustand，而是先给状态分类，把服务端状态交给数据请求缓存层，把 UI 状态保持局部，把 URL 状态放回路由。`,
        quiz: [
          { type: 'single', question: '状态管理失控的常见根因是？', options: ['没有区分状态类型', '按钮太少', 'CSS 文件太短', '使用了 HTTPS'], answer: 0, explain: '不同状态生命周期和一致性要求不同。' },
          { type: 'multiple', question: 'Server State 通常需要处理？', options: ['缓存', '重新拉取', '失效', '按钮 hover'], answer: [0,1,2], explain: '服务端状态有远程来源和一致性问题。' },
          { type: 'judgment', question: '所有状态都放全局 store 是中高级项目的最佳实践。', options: ['对', '错'], answer: 1, explain: '全局化会扩大影响面和复杂度。' },
          { type: 'single', question: '筛选条件和分页更适合放在哪里？', options: ['URL 状态', '随机全局变量', 'CSS', '图片名'], answer: 0, explain: 'URL 状态支持分享、刷新和回退。' },
          { type: 'multiple', question: 'Derived State 的风险包括？', options: ['重复存储导致不一致', '更新链路复杂', '可以由源数据计算', '天然必须全局'], answer: [0,1,2], explain: '能计算的状态不应随意重复存。' },
          { type: 'single', question: '选择状态库之前更应该先做什么？', options: ['分类状态和明确生命周期', '安装最多 star 的库', '删除路由', '重写 CSS'], answer: 0, explain: '工具选择之前先明确问题类型。' }
        ]
      },
      {
        title: '请求缓存与一致性：重新拉取、乐观更新与回滚',
        difficulty: '困难',
        content: `
## 1. 真实问题

列表页编辑后是否立即更新？删除失败如何回滚？多个标签页数据不一致怎么办？弱网下重复提交如何处理？这些都属于服务端状态一致性问题。

## 2. 核心策略

- stale-while-revalidate：先用旧数据，再后台刷新
- optimistic update：先更新 UI，失败再回滚
- invalidation：变更后让相关查询失效并重新获取
- dedupe：合并重复请求
- retry：对可重试错误做有限重试
- idempotency：写操作配合幂等键

## 3. 面试版

数据层设计要在体验和一致性之间取舍；读请求关注缓存和失效，写请求关注乐观更新、失败回滚、幂等和错误恢复。`,
        quiz: [
          { type: 'single', question: '乐观更新失败后必须考虑什么？', options: ['回滚 UI 或重新同步', '修改字体', '删除接口', '关闭缓存'], answer: 0, explain: '乐观更新先改 UI，失败必须恢复一致性。' },
          { type: 'multiple', question: '服务端状态缓存策略包括？', options: ['失效重拉', '请求去重', '后台刷新', '复制 DOM'], answer: [0,1,2], explain: '这些用于处理远程数据一致性和体验。' },
          { type: 'judgment', question: '所有写操作失败都可以忽略，因为前端已经更新 UI。', options: ['对', '错'], answer: 1, explain: '失败必须提示、回滚或重新同步。' },
          { type: 'single', question: 'stale-while-revalidate 的体验特点是？', options: ['先展示旧数据再后台刷新', '永远不更新', '只展示空白', '禁止缓存'], answer: 0, explain: 'SWR 平衡速度和新鲜度。' },
          { type: 'multiple', question: '写操作重试需要关注？', options: ['幂等性', '错误类型', '回滚策略', '按钮颜色'], answer: [0,1,2], explain: '写操作重复可能产生副作用。' },
          { type: 'single', question: 'invalidation 的作用是？', options: ['标记相关缓存失效并重新获取', '删除 CSS', '清空浏览器历史', '关闭路由'], answer: 0, explain: '变更后需要让相关查询重新同步。' }
        ]
      },
      {
        title: '复杂表单：校验、草稿、联动与提交一致性',
        difficulty: '进阶',
        content: `
## 1. 真实问题

企业级前端最复杂的页面常常不是动画，而是表单：几十个字段、联动校验、异步校验、草稿保存、权限控制、重复提交、错误回显。

## 2. 设计要点

- 字段模型和 UI 分离
- 同步校验与异步校验分层
- 联动逻辑集中管理
- 草稿和正式提交分开
- 提交按钮防重复
- 服务端错误能映射回字段
- Schema 和类型尽量复用

## 3. 面试版

复杂表单的关键是把字段模型、校验、联动、副作用和提交状态拆开管理，让用户输入过程可恢复、错误可定位、提交可幂等。`,
        quiz: [
          { type: 'single', question: '复杂表单设计中最应该避免什么？', options: ['字段、校验、联动、副作用全部散落在 JSX 中', '字段模型独立', '错误回显', '防重复提交'], answer: 0, explain: '散落逻辑会导致维护困难和状态不一致。' },
          { type: 'multiple', question: '复杂表单常见能力包括？', options: ['异步校验', '草稿保存', '字段联动', 'DNS 解析'], answer: [0,1,2], explain: '这些是企业级表单常见复杂点。' },
          { type: 'judgment', question: '服务端错误不需要映射到具体字段，只弹一个失败即可。', options: ['对', '错'], answer: 1, explain: '字段级错误能帮助用户修复输入。' },
          { type: 'single', question: '防重复提交主要解决什么？', options: ['用户多次点击导致重复写操作', '字体太大', '图片太多', '路由太短'], answer: 0, explain: '写操作需要防重复和幂等。' },
          { type: 'multiple', question: '表单 schema 的价值包括？', options: ['复用校验规则', '生成类型', '驱动 UI', '替代所有后端逻辑'], answer: [0,1,2], explain: 'schema 可统一模型，但不能替代服务端校验。' },
          { type: 'single', question: '草稿保存和正式提交应该如何看待？', options: ['不同语义和状态流', '完全一样', '都不需要错误处理', '只靠 localStorage'], answer: 0, explain: '草稿和正式提交的一致性要求不同。' }
        ]
      }
    ]
  },
  {
    id: 'frontend-system-design',
    name: '前端系统设计',
    icon: '📐',
    desc: '面向大厂系统设计面试和复杂客户问题的架构拆解能力。',
    docs: [
      {
        title: 'Feed 流前端设计：分页、缓存、去重与性能',
        difficulty: '困难',
        content: `
## 1. 真实问题

Feed 流看似只是列表，实际涉及分页游标、重复数据、插入新内容、曝光埋点、图片加载、虚拟滚动、弱网重试、离线恢复。

## 2. 设计重点

- 游标分页优先于简单 page number
- 客户端按 id 去重
- 新内容插入避免打断用户阅读
- 图片懒加载和占位尺寸
- 长列表虚拟滚动
- 曝光埋点去重和批量上报
- 错误重试和加载状态

## 3. 面试版

Feed 流前端设计的关键是数据连续性和体验稳定性：分页要稳定，列表要去重，滚动要流畅，曝光要准确，错误要可恢复。`,
        quiz: [
          { type: 'single', question: 'Feed 流更常用游标分页的原因是？', options: ['更适合动态插入和顺序稳定', '更容易改颜色', '不需要后端', '能自动压缩图片'], answer: 0, explain: '动态内容下 page number 容易重复或遗漏。' },
          { type: 'multiple', question: 'Feed 流前端要关注？', options: ['去重', '虚拟滚动', '曝光埋点', '删除所有缓存'], answer: [0,1,2], explain: '这些影响数据正确性和性能。' },
          { type: 'judgment', question: '新内容插入时直接把用户当前阅读位置顶走是好体验。', options: ['对', '错'], answer: 1, explain: '应避免打断用户阅读。' },
          { type: 'single', question: '长 Feed 列表性能优化常用？', options: ['虚拟滚动', '一次渲染所有历史内容', '禁用滚动', '同步加载全部图片'], answer: 0, explain: '虚拟滚动减少 DOM 数量。' },
          { type: 'multiple', question: '曝光埋点设计应考虑？', options: ['去重', '批量上报', '可恢复', '每帧同步发送'], answer: [0,1,2], explain: '每帧同步发送会影响性能。' },
          { type: 'single', question: '图片加载导致列表跳动，应优先做？', options: ['预留尺寸或比例容器', '关闭图片', '删除列表', '改接口名称'], answer: 0, explain: '预留尺寸能降低 CLS。' }
        ]
      },
      {
        title: '评论系统前端设计：嵌套、实时与审核状态',
        difficulty: '困难',
        content: `
## 1. 真实问题

评论系统涉及树形结构、分页、排序、删除、审核、折叠、实时更新、富文本安全和权限状态。

## 2. 设计重点

- 扁平存储 + parentId 组织树
- 楼中楼分页，避免一次拉全量
- 乐观发布和失败回滚
- 审核中、已删除、仅自己可见等状态
- 富文本 XSS 防护
- 实时更新不打断用户输入

## 3. 面试版

评论系统前端难点是树形数据和状态一致性：既要保证交互即时反馈，也要处理审核、删除、权限和安全。`,
        quiz: [
          { type: 'single', question: '评论树前端更推荐的本地存储方式是？', options: ['扁平 map 加 parentId 关系', '无限深嵌套且到处直接修改', '字符串拼接 HTML', '只存第一条'], answer: 0, explain: '扁平结构更利于更新和定位。' },
          { type: 'multiple', question: '评论系统需要处理哪些状态？', options: ['审核中', '已删除', '仅自己可见', 'DNS 失败'], answer: [0,1,2], explain: '这些是评论业务常见状态。' },
          { type: 'judgment', question: '评论富文本可以直接 innerHTML 渲染用户输入。', options: ['对', '错'], answer: 1, explain: '富文本必须做 XSS 防护。' },
          { type: 'single', question: '评论发布乐观更新失败后应？', options: ['回滚或标记失败并允许重试', '假装成功', '刷新整站', '删除用户账号'], answer: 0, explain: '要保持 UI 和服务端一致。' },
          { type: 'multiple', question: '楼中楼评论分页的价值包括？', options: ['减少首屏数据量', '控制 DOM 数量', '降低接口压力', '保证不需要权限'], answer: [0,1,2], explain: '权限仍然需要处理。' },
          { type: 'single', question: '实时新评论到达时，应避免什么？', options: ['打断用户正在输入或阅读的位置', '提示有新内容', '按需加载', '合并数据'], answer: 0, explain: '实时更新也要保护当前用户上下文。' }
        ]
      },
      {
        title: '权限系统前端设计：路由、按钮与数据边界',
        difficulty: '困难',
        content: `
## 1. 真实问题

企业系统常见权限包括菜单、路由、按钮、字段、数据范围。前端能做体验控制，但不能替代后端鉴权。

## 2. 设计重点

- 登录态和用户信息初始化
- 路由级权限控制
- 菜单和按钮按权限渲染
- 字段级可见、可编辑控制
- 403/401 错误处理
- 权限变更后的刷新策略
- 后端必须做最终鉴权

## 3. 面试版

前端权限的价值是体验和防误操作，安全边界必须在服务端；前端要把路由、菜单、按钮、字段和接口错误处理串成一致的权限体验。`,
        quiz: [
          { type: 'single', question: '前端权限控制能否替代后端鉴权？', options: ['不能，后端必须做最终鉴权', '能，隐藏按钮就安全', '能，只要路由拦截', '不需要任何鉴权'], answer: 0, explain: '前端代码可被绕过，安全边界在服务端。' },
          { type: 'multiple', question: '企业前端权限常见粒度包括？', options: ['路由', '按钮', '字段', '显示器品牌'], answer: [0,1,2], explain: '路由、按钮和字段都是常见权限粒度。' },
          { type: 'judgment', question: '隐藏删除按钮后，删除接口就不需要权限校验。', options: ['对', '错'], answer: 1, explain: '接口必须校验权限。' },
          { type: 'single', question: '401 和 403 的处理通常区别是？', options: ['401 偏未登录，403 偏无权限', '完全一样', '都表示成功', '都只能刷新页面'], answer: 0, explain: '两者代表不同身份和授权问题。' },
          { type: 'multiple', question: '权限系统前端应考虑？', options: ['初始化时机', '权限变更刷新', '错误兜底页', '跳过后端校验'], answer: [0,1,2], explain: '后端校验不能跳过。' },
          { type: 'single', question: '字段级权限主要影响？', options: ['字段是否可见或可编辑', 'DNS 查询', '图片压缩', '构建 hash'], answer: 0, explain: '字段权限常用于表单和详情页。' }
        ]
      }
    ]
  }
];
