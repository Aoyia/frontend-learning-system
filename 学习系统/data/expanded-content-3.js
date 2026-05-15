export const EXPANDED_MODULES_BATCH_3 = [
  {
    id: 'build-runtime-tooling',
    name: '构建工具与运行时',
    icon: '🧰',
    desc: '从包管理、开发服务器、Vite 构建到内部库发布，训练工程链路判断能力。',
    docs: [
      {
        title: '包管理器与 Lockfile：依赖为什么会在别人机器上炸',
        difficulty: '进阶',
        content: `
## 1. 真实问题

客户项目本地能跑，CI 或同事机器上却安装出不同依赖，最终出现构建失败、样式错乱或运行时异常。中高级前端不能只会删 node_modules，而要理解依赖解析和锁定策略。

## 2. 核心判断

- package.json 描述依赖范围，lockfile 锁定实际解析结果
- semver 范围允许补丁或小版本漂移
- frozen install 能阻止 CI 自动改锁文件
- peerDependencies 表示宿主项目需要提供依赖
- workspace 会改变依赖提升、链接和发布边界

## 3. 客户问题视角

依赖问题要先对比 lockfile、Node 版本、包管理器版本、registry、postinstall 脚本和 workspace 解析结果，而不是只看业务代码。

## 4. 面试版

稳定依赖的关键是把安装结果变成可复现资产：锁定 lockfile，固定 Node 与包管理器版本，在 CI 使用 frozen install，并把 peer 依赖和 workspace 边界说清楚。`,
        quiz: [
          { type: 'single', question: 'lockfile 的核心价值是？', options: ['锁定实际依赖解析结果', '替代所有测试', '提高 CSS 权重', '自动修复业务 bug'], answer: 0, explain: 'lockfile 让不同环境安装出一致的依赖图。' },
          { type: 'multiple', question: '排查依赖安装不一致应检查？', options: ['lockfile', 'Node 版本', '包管理器版本', 'registry 来源'], answer: [0,1,2,3], explain: '这些都会影响最终依赖解析。' },
          { type: 'judgment', question: 'package.json 中的版本范围一定能保证所有机器装出完全相同版本。', options: ['对', '错'], answer: 1, explain: '版本范围可能随时间解析到不同版本，需要 lockfile。' },
          { type: 'single', question: 'peerDependencies 更接近表达什么？', options: ['宿主项目应提供的依赖约束', '永远打包进库里的源码', '图片资源目录', '浏览器缓存策略'], answer: 0, explain: 'peer 依赖用于避免库和宿主之间出现多份不兼容实例。' },
          { type: 'multiple', question: 'CI 中更稳的安装策略包括？', options: ['frozen install', '提交 lockfile', '固定包管理器版本', '每次自动升级所有依赖'], answer: [0,1,2], explain: '自动升级依赖会扩大不可控变化。' },
          { type: 'single', question: 'workspace 项目最容易带来的额外复杂度是？', options: ['依赖提升与包间链接边界', '浏览器无法解析 HTML', 'HTTP 只能用 GET', '不能写 TypeScript'], answer: 0, explain: 'workspace 会影响依赖位置、软链和发布边界。' }
        ]
      },
      {
        title: 'Vite 开发服务器与生产构建：快在哪里，坑在哪里',
        difficulty: '进阶',
        content: `
## 1. 真实问题

开发环境秒开，但生产构建后白屏；本地 .env 生效，线上变量不对；某个依赖开发时正常，构建后语法或兼容性失败。这些都要求理解开发服务器和生产构建不是同一条链路。

## 2. 核心链路

- 开发环境利用原生 ESM、依赖预构建和 HMR 提升反馈速度
- 生产构建会走打包、压缩、代码分割和静态替换
- import.meta.env 通常在构建期被替换
- 环境变量需要区分 mode、NODE_ENV 和暴露前缀
- 线上兼容性问题要看 target、polyfill、依赖产物格式

## 3. 客户问题视角

遇到“本地正常线上白屏”，要对比开发请求、构建产物、环境变量、base 路径、资源 404、浏览器兼容性和 sourcemap，而不是只盯组件。

## 4. 面试版

Vite 的快主要来自开发期不全量打包和高效 HMR，但生产仍要经过 Rollup 构建；中高级前端要能区分开发时行为和构建时行为。`,
        quiz: [
          { type: 'single', question: 'Vite 开发环境快的关键之一是？', options: ['利用原生 ESM 减少全量打包', '每次都完整生产构建', '禁用浏览器缓存', '不用 JavaScript'], answer: 0, explain: '开发期按需加载 ESM，减少冷启动成本。' },
          { type: 'multiple', question: '本地正常线上白屏应排查？', options: ['构建产物资源路径', '环境变量', '浏览器兼容性', '接口和资源 404'], answer: [0,1,2,3], explain: '线上白屏常来自构建、部署、环境和兼容性的组合问题。' },
          { type: 'judgment', question: '开发服务器行为和生产构建行为完全一致。', options: ['对', '错'], answer: 1, explain: '开发期和生产期链路不同，必须分别验证。' },
          { type: 'single', question: '前端环境变量最大的安全误区是？', options: ['把服务端密钥放入前端构建变量', '变量名太短', '变量写在大写', '变量用于页面标题'], answer: 0, explain: '前端构建产物会暴露给用户，不能放真正密钥。' },
          { type: 'multiple', question: '生产构建通常会涉及？', options: ['代码分割', '压缩', '静态替换', 'HMR 热更新作为线上能力'], answer: [0,1,2], explain: 'HMR 是开发体验，不是生产能力。' },
          { type: 'single', question: '依赖开发正常但构建失败时，优先看什么？', options: ['依赖产物格式和构建配置', '按钮文案', '产品需求标题', '截图尺寸'], answer: 0, explain: '依赖模块格式、语法目标和外部化配置都可能导致构建问题。' }
        ]
      },
      {
        title: '内部 NPM 包与库模式：组件库如何不拖垮业务',
        difficulty: '困难',
        content: `
## 1. 真实问题

组件库升级后，业务项目体积暴涨、样式被污染、React 出现多实例、Tree Shaking 失效。库不是能发布就行，还要服务多个业务长期稳定使用。

## 2. 设计要点

- 明确 public API，避免业务依赖内部路径
- 正确声明 peerDependencies，避免框架多实例
- 输出 ESM 和类型声明，保留 Tree Shaking 条件
- 样式隔离和主题 token 要稳定
- 变更日志、迁移指南和语义化版本要可信
- 发布前用真实业务或示例工程验证

## 3. 大厂视角

内部包的价值是沉淀平台能力，但坏的内部包会把复杂度扩散到所有业务线。负责人要管理 API、版本、兼容性和迁移成本。

## 4. 面试版

设计内部前端库要把稳定 API、peer 依赖、产物格式、类型、样式隔离、版本策略和迁移路径作为整体，而不是只关注组件是否能渲染。`,
        quiz: [
          { type: 'single', question: '组件库把 React 打进 dependencies 并随库发布，最大风险是？', options: ['宿主出现多份 React 或版本冲突', 'CSS 无法写颜色', '无法使用 HTTPS', '页面不能滚动'], answer: 0, explain: '框架类依赖通常应由宿主提供并通过 peer 约束。' },
          { type: 'multiple', question: '内部库发布前应关注？', options: ['public API', '类型声明', 'Tree Shaking', '迁移指南'], answer: [0,1,2,3], explain: '这些决定业务接入和长期维护成本。' },
          { type: 'judgment', question: '业务大量依赖组件库内部文件路径不会带来兼容风险。', options: ['对', '错'], answer: 1, explain: '内部路径不是稳定契约，重构会直接破坏业务。' },
          { type: 'single', question: '语义化版本的价值更接近？', options: ['向消费方表达变更风险', '替代测试', '压缩图片', '提升 DNS 命中率'], answer: 0, explain: '版本号应帮助消费方判断升级影响。' },
          { type: 'multiple', question: '组件库样式治理应包括？', options: ['主题 token', '样式隔离', '默认样式边界', '全局覆盖所有业务按钮'], answer: [0,1,2], explain: '全局强覆盖会污染业务项目。' },
          { type: 'single', question: 'Tree Shaking 失效常见原因是？', options: ['产物格式或副作用声明不清', '页面标题太长', '接口使用 POST', '没有 favicon'], answer: 0, explain: '模块格式、sideEffects 和导出结构会影响摇树。' }
        ]
      }
    ]
  },
  {
    id: 'node-bff-runtime',
    name: 'Node 与 BFF',
    icon: '🟩',
    desc: '理解 Node 运行时、BFF 聚合层和 SSR 服务端问题定位。',
    docs: [
      {
        title: 'Node 事件循环：为什么一个同步循环能拖垮服务',
        difficulty: '困难',
        content: `
## 1. 真实问题

BFF 接口偶发超时，CPU 飙高，但数据库和下游接口都正常。最后发现是一次大 JSON 处理、同步加密或复杂循环阻塞了 Node 事件循环，导致其他请求无法及时处理。

## 2. 核心概念

- Node 适合 I/O 密集型服务，但同步 CPU 任务会阻塞事件循环
- Promise、timer、I/O callback 的调度有不同队列和时机
- 过多 nextTick 或微任务也可能饿死后续任务
- 大计算应拆分、缓存、下沉到 Worker 或独立服务
- 线上要观察 event loop delay、CPU、堆内存和慢接口

## 3. 面试版

Node 的并发优势来自事件循环和异步 I/O，不代表它能无成本处理 CPU 密集任务；BFF 超时要把事件循环延迟作为一等指标排查。`,
        quiz: [
          { type: 'single', question: 'Node 服务被同步 CPU 任务阻塞时，最直接影响是？', options: ['事件循环无法及时处理其他请求', 'CSS 选择器失效', '浏览器自动重启', 'HTTP 协议变成 UDP'], answer: 0, explain: '单线程执行 JS 时，同步长任务会阻塞后续回调。' },
          { type: 'multiple', question: '排查 Node BFF 卡顿应看？', options: ['event loop delay', 'CPU 使用率', '堆内存', '下游接口耗时'], answer: [0,1,2,3], explain: '需要区分本机阻塞、内存压力和下游慢。' },
          { type: 'judgment', question: 'Node 使用异步 I/O 后，任何 CPU 密集任务都不会影响请求响应。', options: ['对', '错'], answer: 1, explain: 'CPU 密集同步逻辑仍会占住 JS 执行线程。' },
          { type: 'single', question: '大 JSON 同步处理导致超时时，较合理的方向是？', options: ['拆分、缓存或移到 Worker/独立服务', '增加按钮圆角', '删除所有日志', '改成 GET 请求'], answer: 0, explain: '应减少主事件循环上的长时间同步计算。' },
          { type: 'multiple', question: '可能导致事件循环饥饿的因素包括？', options: ['长同步循环', '大量微任务', '过度使用 nextTick', '稳定的静态 HTML'], answer: [0,1,2], explain: '前三者都可能延迟 I/O callback。' },
          { type: 'single', question: 'Node 更天然适合哪类服务？', options: ['I/O 密集型聚合服务', '大型离线视频编码', 'GPU 渲染农场', '数据库内核实现'], answer: 0, explain: 'BFF、API 聚合和 I/O 编排是 Node 常见优势场景。' }
        ]
      },
      {
        title: 'BFF 聚合层：前端团队如何掌控客户体验',
        difficulty: '进阶',
        content: `
## 1. 真实问题

页面需要同时请求用户、权限、商品、推荐、活动和风控接口。前端直接串联会慢，后端通用接口又无法贴合页面。BFF 的价值是把页面体验需要的聚合、裁剪和降级放到靠近前端的位置。

## 2. BFF 应负责什么

- 聚合多个下游接口，减少端上请求编排
- 做字段裁剪和视图模型转换
- 统一错误码、兜底和降级
- 透传 Trace ID，串联链路定位
- 做轻量权限和租户上下文校验

## 3. 边界

BFF 不应绕过核心业务权限，不应复制大量领域逻辑，也不应成为所有业务的无边界中台。它要服务具体前端体验。

## 4. 面试版

BFF 是面向前端体验的服务层，核心价值是聚合、裁剪、降级和链路可观测；边界是不能替代后端核心业务规则和鉴权。`,
        quiz: [
          { type: 'single', question: 'BFF 最核心的价值是？', options: ['贴近前端体验做聚合和裁剪', '替代数据库', '让所有接口变成静态文件', '删除后端鉴权'], answer: 0, explain: 'BFF 服务页面体验和端侧编排效率。' },
          { type: 'multiple', question: 'BFF 可承担的职责包括？', options: ['接口聚合', '视图模型转换', '统一降级', '核心资金清算'], answer: [0,1,2], explain: '核心领域逻辑不应随意放入 BFF。' },
          { type: 'judgment', question: 'BFF 可以替代所有后端权限校验。', options: ['对', '错'], answer: 1, explain: 'BFF 可做上下文校验，但核心鉴权必须在服务端可信边界。' },
          { type: 'single', question: 'BFF 出现部分下游失败时，应优先考虑？', options: ['分级降级和清晰错误语义', '让页面永久 loading', '吞掉错误并返回假成功', '重启用户浏览器'], answer: 0, explain: '聚合层要能表达部分失败并提供可接受兜底。' },
          { type: 'multiple', question: 'BFF 链路定位需要传递？', options: ['Trace ID', '用户上下文', '下游耗时', '随机颜色'], answer: [0,1,2], explain: '这些有助于跨前后端定位。' },
          { type: 'single', question: 'BFF 设计过重的风险是？', options: ['变成无边界业务中台，维护成本失控', '浏览器不支持 HTML', '图片无法压缩', 'TypeScript 无法编译'], answer: 0, explain: 'BFF 要围绕前端体验，避免吞掉领域边界。' }
        ]
      },
      {
        title: 'SSR 服务端问题：首屏快了，服务也可能被打爆',
        difficulty: '困难',
        content: `
## 1. 真实问题

SSR 能改善首屏和 SEO，但也把渲染压力从浏览器部分转移到了服务端。促销峰值时，如果每个请求都同步渲染、串行取数、无缓存，服务端会先被打爆。

## 2. 关键取舍

- SSR 适合首屏强、SEO 强或内容首屏关键页面
- 高并发页面要设计缓存、流式、边缘渲染或静态化
- 取数要并行、可超时、可降级
- Hydration 错误会导致交互异常或重复渲染
- 监控要同时看 TTFB、LCP、服务端 CPU 和错误率

## 3. 面试版

SSR 不是免费性能优化，它改善首屏的同时增加服务端复杂度；设计时要结合缓存、并发取数、降级、Hydration 稳定性和容量评估。`,
        quiz: [
          { type: 'single', question: 'SSR 的主要代价之一是？', options: ['服务端渲染压力和复杂度增加', '浏览器不能执行 JS', 'CSS 无法加载', 'HTTP 缓存失效'], answer: 0, explain: 'SSR 把部分渲染工作移到服务端。' },
          { type: 'multiple', question: '高并发 SSR 页面应考虑？', options: ['缓存', '流式输出', '取数并行和超时', '所有请求都串行实时渲染'], answer: [0,1,2], explain: '串行实时渲染会放大延迟和容量压力。' },
          { type: 'judgment', question: 'SSR 一定能让所有页面在所有指标上变快。', options: ['对', '错'], answer: 1, explain: 'SSR 有适用场景，也可能增加 TTFB 和服务端压力。' },
          { type: 'single', question: 'Hydration 不一致最可能导致？', options: ['客户端交互异常或重新渲染', 'DNS 解析变快', '数据库自动扩容', '接口无需鉴权'], answer: 0, explain: '服务端 HTML 和客户端状态不一致会影响挂载。' },
          { type: 'multiple', question: 'SSR 监控应同时关注？', options: ['TTFB', 'LCP', '服务端 CPU', '渲染错误率'], answer: [0,1,2,3], explain: 'SSR 需要前端体验和服务端容量一起看。' },
          { type: 'single', question: '更适合 SSR 的页面通常是？', options: ['首屏内容和 SEO 很关键的页面', '完全后台配置页', '纯本地画板', '只给管理员看且无需首屏'], answer: 0, explain: 'SSR 更适合内容首屏价值高的页面。' }
        ]
      }
    ]
  },
  {
    id: 'api-reliability',
    name: '接口可靠性与协议',
    icon: '🔌',
    desc: '覆盖 REST、GraphQL、超时、重试、幂等和接口契约演进。',
    docs: [
      {
        title: 'REST 契约与版本演进：接口变更如何不炸前端',
        difficulty: '进阶',
        content: `
## 1. 真实问题

后端新增枚举、删除字段、修改分页结构，前端发布前没感知，线上出现空白、状态错乱或按钮误显示。接口不是能调通就行，还要能演进。

## 2. 契约治理

- 用 OpenAPI 或等价 schema 描述请求、响应、错误和认证
- 新增字段通常兼容，删除或改语义通常不兼容
- 枚举新增要有默认分支和监控
- 分页、排序、筛选要稳定
- 废弃字段要有通知、兼容期和迁移计划

## 3. 面试版

接口契约的重点是让前后端共享同一份机器可读约定，并把破坏性变更放进版本和迁移流程，而不是依赖口头同步。`,
        quiz: [
          { type: 'single', question: 'OpenAPI 这类接口描述最大的工程价值是？', options: ['把接口契约机器可读化', '替代所有后端代码', '提高图片清晰度', '自动设计 UI'], answer: 0, explain: '机器可读契约可用于文档、类型、Mock 和测试。' },
          { type: 'multiple', question: '接口契约应描述？', options: ['请求参数', '响应结构', '错误结构', '认证方式'], answer: [0,1,2,3], explain: '这些都是前端正确消费接口的基础。' },
          { type: 'judgment', question: '删除已有响应字段通常是兼容变更。', options: ['对', '错'], answer: 1, explain: '删除字段可能破坏已有消费方。' },
          { type: 'single', question: '枚举新增对前端的主要风险是？', options: ['默认分支缺失导致状态展示错误', '网络协议改变', '浏览器无法解析 JSON', 'Cookie 自动消失'], answer: 0, explain: '前端状态机和 UI 分支需要处理未知枚举。' },
          { type: 'multiple', question: '破坏性接口变更需要？', options: ['兼容期', '迁移说明', '消费方影响评估', '静默上线'], answer: [0,1,2], explain: '静默上线会让问题在联调或线上暴露。' },
          { type: 'single', question: '分页协议稳定性的核心原因是？', options: ['影响列表一致性、翻页和缓存', '决定按钮颜色', '决定页面字体', '决定 CSS 是否压缩'], answer: 0, explain: '分页结构会影响数据连续性和缓存策略。' }
        ]
      },
      {
        title: 'GraphQL、RPC 与 REST：不是越新越好',
        difficulty: '困难',
        content: `
## 1. 真实问题

团队想把 REST 全部换成 GraphQL，理由是“前端想要什么取什么”。但如果没有 schema 治理、权限控制、查询复杂度限制和缓存策略，GraphQL 也可能引入新的线上风险。

## 2. 取舍标准

- REST 简单直观，适合资源模型清晰的场景
- GraphQL 适合多端、多视图、字段选择复杂的场景
- RPC 适合强类型内部服务调用和高频内部协议
- GraphQL 要治理 N+1、复杂查询、权限和缓存
- 协议选择要看组织能力、工具链和问题类型

## 3. 面试版

协议没有绝对先进，REST、GraphQL、RPC 解决的是不同协作和数据访问问题；中高级前端要能说明收益、成本和治理要求。`,
        quiz: [
          { type: 'single', question: 'GraphQL 更适合的场景是？', options: ['多端多视图字段组合复杂', '只提供一个固定静态文件', '完全没有权限要求', '所有接口都无缓存'], answer: 0, explain: 'GraphQL 允许客户端按 schema 请求所需字段。' },
          { type: 'multiple', question: 'GraphQL 落地需要治理？', options: ['查询复杂度', '权限', 'N+1', '缓存策略'], answer: [0,1,2,3], explain: '缺少治理会把灵活性变成风险。' },
          { type: 'judgment', question: 'GraphQL 一定比 REST 更适合所有项目。', options: ['对', '错'], answer: 1, explain: '协议选择取决于场景和组织能力。' },
          { type: 'single', question: 'REST 的优势更接近？', options: ['资源模型直观、HTTP 语义清晰', '无需任何版本治理', '自动解决所有性能问题', '无需鉴权'], answer: 0, explain: 'REST 与 HTTP 资源语义结合紧密。' },
          { type: 'multiple', question: 'RPC 常见优势包括？', options: ['强类型契约', '内部服务调用效率', '工具生成', '天然适合所有公开 Web API'], answer: [0,1,2], explain: '公开 Web API 是否用 RPC 仍要看生态和兼容性。' },
          { type: 'single', question: '协议迁移前最应该先确认？', options: ['当前痛点是否由协议造成', 'Logo 是否好看', '能否删除测试', '是否必须重写全部 CSS'], answer: 0, explain: '不要用新协议掩盖模型和治理问题。' }
        ]
      },
      {
        title: '超时、重试、幂等：客户点一下为什么下了两单',
        difficulty: '困难',
        content: `
## 1. 真实问题

客户点击支付按钮后网络抖动，前端超时重试，服务端也重试，最终出现重复下单。可靠性不是“失败了再调一次”这么简单。

## 2. 核心策略

- 请求要有超时和取消能力
- 重试只适合可重试错误和安全场景
- 写操作需要幂等键或业务去重
- 前端按钮防重复只能改善体验，不能替代服务端幂等
- 失败要给用户明确状态：成功、失败、处理中、待确认
- 对 429、5xx、网络错误要采用不同策略

## 3. 面试版

可靠请求要区分超时、取消、重试和幂等：读请求可以谨慎重试，写请求必须先设计幂等和状态确认，否则会把网络抖动变成业务事故。`,
        quiz: [
          { type: 'single', question: '写操作重试前最关键的前提是？', options: ['具备幂等设计', '按钮是蓝色', '接口路径很短', '页面有动画'], answer: 0, explain: '没有幂等，重试可能产生重复副作用。' },
          { type: 'multiple', question: '可靠请求策略包括？', options: ['超时', '取消', '按错误类型重试', '所有失败无限重试'], answer: [0,1,2], explain: '无限重试会放大故障。' },
          { type: 'judgment', question: '前端禁用按钮可以完全替代服务端幂等。', options: ['对', '错'], answer: 1, explain: '刷新、并发、重放和多端请求仍需要服务端幂等。' },
          { type: 'single', question: 'AbortController 在请求可靠性中常用于？', options: ['取消 fetch 或相关异步操作', '自动生成订单号', '压缩图片', '修改 HTTP 状态码'], answer: 0, explain: '它能把取消信号传给 fetch 等 API。' },
          { type: 'multiple', question: '用户支付后超时，前端更合理的状态表达有？', options: ['处理中', '待确认', '查询订单状态', '直接再次创建新订单'], answer: [0,1,2], explain: '应先确认真实状态，避免重复副作用。' },
          { type: 'single', question: 'HTTP 429 更适合的处理是？', options: ['退避、限频或提示稍后再试', '立即高频重试', '忽略状态码当成功', '清空用户数据'], answer: 0, explain: '429 表示限流，应降低请求压力。' }
        ]
      }
    ]
  },
  {
    id: 'observability-incident',
    name: '可观测性与故障响应',
    icon: '📡',
    desc: '把错误、性能、Trace、灰度和事故复盘串成面向客户体验的闭环。',
    docs: [
      {
        title: '前端错误监控：白屏不是一句“刷新试试”',
        difficulty: '进阶',
        content: `
## 1. 真实问题

客户反馈白屏，但研发本地无法复现。没有错误监控时，只能靠截图和猜测；有监控后，可以定位版本、路由、浏览器、用户操作和错误堆栈。

## 2. 采集范围

- JS runtime error
- Promise rejection
- 资源加载失败
- 路由切换异常
- 框架 Error Boundary
- 关键接口失败
- 用户环境和 release 信息

## 3. 治理重点

错误监控不是收集越多越好，要聚合、去重、分级、关联版本和影响用户数，并能快速回滚或降级。

## 4. 面试版

前端错误监控的价值是把用户侧不可复现问题变成可定位事件，关键字段是版本、路由、环境、堆栈、资源、接口和用户影响面。`,
        quiz: [
          { type: 'single', question: '白屏监控最应该帮助研发拿到什么？', options: ['可定位的错误上下文和影响范围', '用户电脑品牌广告', '按钮圆角大小', '设计稿链接'], answer: 0, explain: '定位需要错误、环境、版本和影响面。' },
          { type: 'multiple', question: '前端错误采集可包括？', options: ['runtime error', 'Promise rejection', '资源加载失败', '关键接口失败'], answer: [0,1,2,3], explain: '这些都可能造成用户可感知故障。' },
          { type: 'judgment', question: '错误监控只要上报数量越多越好，不需要聚合和分级。', options: ['对', '错'], answer: 1, explain: '无分级和去重会制造噪声。' },
          { type: 'single', question: 'release 信息的价值是？', options: ['把错误和具体发布版本关联', '提高图片质量', '改变 HTTP 方法', '自动修复 CSS'], answer: 0, explain: '发布关联能快速判断是否由新版本引入。' },
          { type: 'multiple', question: '错误优先级可参考？', options: ['影响用户数', '是否阻断主链路', '是否新版本引入', '日志颜色'], answer: [0,1,2], explain: '优先级应服务客户影响和故障处理。' },
          { type: 'single', question: 'Error Boundary 主要能捕获哪类问题？', options: ['React 渲染树中的部分异常', '所有网络错误', '所有浏览器崩溃', '服务端数据库死锁'], answer: 0, explain: 'Error Boundary 主要处理渲染过程中的组件异常。' }
        ]
      },
      {
        title: 'RUM 与 Trace ID：从用户点击串到后端慢查询',
        difficulty: '困难',
        content: `
## 1. 真实问题

用户说“提交很慢”，前端看到按钮 loading 了 8 秒，后端却说接口只耗时 100ms。缺少端到端链路时，没人知道时间花在 DNS、排队、网关、BFF、下游还是浏览器主线程。

## 2. 链路串联

- RUM 采集真实用户性能和环境
- 前端请求携带 traceparent 或统一 Trace ID
- BFF 和后端继续透传上下文
- 日志、指标、trace 按同一请求关联
- 区分端侧耗时、网络耗时、服务端耗时和渲染耗时

## 3. 大厂视角

可观测性不是单个工具，而是定位闭环。中高级前端要能用 RUM、日志、Trace 和业务埋点解释客户体验为什么差。

## 4. 面试版

RUM 负责描述真实用户体验，Trace ID 负责跨系统关联请求；两者结合才能把用户侧慢和服务端链路打通。`,
        quiz: [
          { type: 'single', question: 'RUM 的核心价值是？', options: ['采集真实用户环境下的体验数据', '替代所有后端日志', '删除网络请求', '自动生成 UI'], answer: 0, explain: 'RUM 关注真实用户侧性能和错误。' },
          { type: 'multiple', question: '端到端慢请求定位应区分？', options: ['端侧耗时', '网络耗时', '服务端耗时', '渲染耗时'], answer: [0,1,2,3], explain: '总耗时需要拆成多个阶段。' },
          { type: 'judgment', question: '后端接口日志显示 100ms，就能证明用户一定只等了 100ms。', options: ['对', '错'], answer: 1, explain: '用户等待还包括网络、排队、前端处理和渲染。' },
          { type: 'single', question: 'traceparent 属于哪类能力？', options: ['跨服务传播追踪上下文', '压缩 JS 文件', '生成 CSS 变量', '替代 Cookie'], answer: 0, explain: 'Trace Context 用于跨边界传递追踪身份。' },
          { type: 'multiple', question: '一次用户提交慢，可能花时间在？', options: ['DNS/TLS', '网关/BFF', '下游服务', '浏览器主线程'], answer: [0,1,2,3], explain: '需要完整链路拆解。' },
          { type: 'single', question: '只做业务埋点但没有 Trace 的缺口是？', options: ['难以跨系统定位具体慢点', '无法写 HTML', '不能使用数组', '无法部署静态资源'], answer: 0, explain: '业务埋点描述行为，Trace 串联技术链路。' }
        ]
      },
      {
        title: '灰度健康指标与事故复盘：发布后如何快速止血',
        difficulty: '困难',
        content: `
## 1. 真实问题

新版本只影响 5% 用户，但这 5% 中下单转化骤降、白屏率上升。如果没有灰度指标和自动告警，团队可能等到全量后才发现事故。

## 2. 健康指标

- JS 错误率和白屏率
- 核心接口失败率和耗时
- 业务转化漏斗
- Core Web Vitals 或关键性能指标
- 灰度组与对照组差异
- 回滚、降级和暂停灰度开关

## 3. 事故复盘

复盘不只是找责任人，而是补系统：为什么没提前发现，为什么影响扩大，为什么回滚慢，哪些门禁和监控要补。

## 4. 面试版

成熟发布不是只看构建成功，而是把灰度人群、健康指标、告警、回滚和复盘连接起来，用客户影响驱动发布决策。`,
        quiz: [
          { type: 'single', question: '灰度发布最需要配套什么？', options: ['灰度健康指标和回滚能力', '更复杂的按钮动画', '隐藏所有日志', '手工刷新页面'], answer: 0, explain: '灰度要能发现问题并快速止血。' },
          { type: 'multiple', question: '前端灰度健康指标可包括？', options: ['白屏率', 'JS 错误率', '核心接口失败率', '业务转化'], answer: [0,1,2,3], explain: '技术指标和业务指标都要看。' },
          { type: 'judgment', question: '构建成功就说明本次发布对用户一定安全。', options: ['对', '错'], answer: 1, explain: '构建成功不能覆盖真实用户环境和业务影响。' },
          { type: 'single', question: '灰度组与对照组对比的价值是？', options: ['识别新版本带来的异常变化', '增加页面大小', '减少代码评审', '替代接口鉴权'], answer: 0, explain: '对照能排除整体流量波动。' },
          { type: 'multiple', question: '事故复盘应关注？', options: ['发现是否及时', '回滚是否快速', '门禁是否缺失', '如何惩罚某个人作为唯一目标'], answer: [0,1,2], explain: '复盘重点是改进系统能力。' },
          { type: 'single', question: '发现灰度白屏率异常，第一优先级是？', options: ['暂停灰度或回滚止血', '继续全量观察', '删除监控', '修改需求文档标题'], answer: 0, explain: '客户影响扩大前应先止血。' }
        ]
      }
    ]
  },
  {
    id: 'cloud-native-platform',
    name: '云原生与平台工程',
    icon: '☸️',
    desc: '理解容器、K8s、GitOps、配置与边缘发布对前端交付的影响。',
    docs: [
      {
        title: 'Docker 与 K8s 心智模型：前端为什么也要懂',
        difficulty: '进阶',
        content: `
## 1. 真实问题

前端 BFF 或 SSR 服务在线上偶发重启，客户看到间歇性 502。只懂页面代码无法定位，需要理解容器、Pod、探针、资源限制和滚动发布。

## 2. 核心概念

- 镜像是可分发运行包，容器是运行实例
- Pod 是 K8s 调度的基本单元
- readiness 决定是否接流量，liveness 决定是否重启
- requests 和 limits 影响调度和资源上限
- Deployment 管理副本、滚动更新和回滚

## 3. 面试版

前端涉及 BFF、SSR、Node 服务后，就进入服务端交付领域；理解容器和 K8s 能帮助定位 502、重启、容量和发布问题。`,
        quiz: [
          { type: 'single', question: 'K8s 中 readiness probe 主要影响？', options: ['Pod 是否接收流量', '代码是否压缩', '浏览器是否缓存图片', 'CSS 是否生效'], answer: 0, explain: 'readiness 未通过时实例不应进入服务流量。' },
          { type: 'multiple', question: '排查 SSR 服务间歇 502 可看？', options: ['Pod 重启', 'readiness/liveness', '资源 limits', '网关日志'], answer: [0,1,2,3], explain: '502 可能来自实例不可用、重启或网关链路。' },
          { type: 'judgment', question: '只要是前端团队，就永远不需要理解容器和 K8s。', options: ['对', '错'], answer: 1, explain: 'BFF、SSR 和平台交付都需要基本服务端运行知识。' },
          { type: 'single', question: 'Deployment 的常见能力包括？', options: ['副本管理、滚动更新和回滚', '设计页面图标', '替代 TypeScript', '生成接口字段'], answer: 0, explain: 'Deployment 管理应用副本和发布过程。' },
          { type: 'multiple', question: '容器资源配置相关概念有？', options: ['requests', 'limits', 'CPU/Memory', 'font-size'], answer: [0,1,2], explain: '资源配置会影响调度、限流和稳定性。' },
          { type: 'single', question: 'liveness probe 配置过于激进的风险是？', options: ['服务被频繁误重启', '图片变大', '路由变短', 'Cookie 自动加密'], answer: 0, explain: '误判会造成重启风暴和可用性问题。' }
        ]
      },
      {
        title: 'GitOps、IaC 与环境配置：为什么线上和测试不一样',
        difficulty: '困难',
        content: `
## 1. 真实问题

测试环境正常，生产环境接口域名、Feature Flag、CORS、Cookie Domain 或 CDN 配置不同，导致上线后部分用户无法使用。环境差异必须被版本化和审计。

## 2. 工程原则

- 基础设施配置应代码化和评审
- 环境差异要显式化，不靠人工记忆
- 密钥和非密钥配置分开管理
- 发布配置要能回滚和追溯
- Feature Flag 要有 owner、过期时间和清理机制

## 3. 面试版

GitOps 和 IaC 的价值是把环境与发布配置变成可审计、可回滚、可复现的工程资产，减少“手动改线上”带来的不可控风险。`,
        quiz: [
          { type: 'single', question: 'IaC 的核心价值是？', options: ['把基础设施配置代码化和可审计化', '替代所有业务代码', '让页面更花哨', '让接口不用鉴权'], answer: 0, explain: '代码化配置更容易评审、复现和回滚。' },
          { type: 'multiple', question: '线上和测试不一致可能来自？', options: ['接口域名', 'Cookie Domain', 'CORS', 'Feature Flag'], answer: [0,1,2,3], explain: '这些环境差异都会影响真实行为。' },
          { type: 'judgment', question: '生产环境紧急手工改配置后不需要补记录。', options: ['对', '错'], answer: 1, explain: '缺少记录会造成不可追溯和不可复现。' },
          { type: 'single', question: 'Feature Flag 长期不清理的风险是？', options: ['分支逻辑堆积并制造不可预测组合', '图片无法加载', '浏览器不支持数组', 'HTTP 状态码消失'], answer: 0, explain: '开关需要 owner、生命周期和清理。' },
          { type: 'multiple', question: '配置治理应支持？', options: ['评审', '审计', '回滚', '口头通知后直接改线上'], answer: [0,1,2], explain: '口头改线上不可控。' },
          { type: 'single', question: '密钥管理的基本原则是？', options: ['密钥不进入前端产物和普通配置仓库', '写在页面注释中', '放进 localStorage 给所有用户', '通过 URL 明文传递'], answer: 0, explain: '密钥必须在可信边界和安全存储中管理。' }
        ]
      },
      {
        title: 'CDN、边缘与回滚：前端发布不是上传 dist',
        difficulty: '进阶',
        content: `
## 1. 真实问题

前端发布后，部分地区仍访问旧 HTML，但 JS 已经更新；或 HTML 更新了，静态资源被 CDN 缓存 404。前端发布的难点在于 HTML、静态资源、缓存和回滚之间的一致性。

## 2. 发布策略

- 静态资源文件名带内容 hash，并设置长缓存
- HTML 短缓存或可控刷新
- 资源先上传，HTML 后切流
- 保留历史资源，避免旧 HTML 引用 404
- 回滚要同时考虑 HTML、资源、接口兼容和缓存刷新
- 边缘函数适合轻量逻辑，不适合无限制业务膨胀

## 3. 面试版

前端发布要把 HTML、hash 资源、CDN 缓存、切流顺序和回滚作为整体设计；只上传 dist 不等于安全发布。`,
        quiz: [
          { type: 'single', question: '静态资源使用内容 hash 的主要目的？', options: ['让资源可长缓存且内容变化时 URL 变化', '隐藏所有 bug', '替代 HTTPS', '让 HTML 不需要部署'], answer: 0, explain: '内容 hash 能平衡缓存和更新。' },
          { type: 'multiple', question: '安全的前端发布顺序通常包括？', options: ['先上传静态资源', '再切换 HTML', '保留历史资源', '先删除旧资源再发 HTML'], answer: [0,1,2], explain: '先删旧资源可能导致旧 HTML 引用 404。' },
          { type: 'judgment', question: '只要 dist 上传成功，前端发布就一定安全。', options: ['对', '错'], answer: 1, explain: '还要考虑缓存、一致性、切流和回滚。' },
          { type: 'single', question: 'HTML 通常不适合设置特别长且不可控缓存的原因是？', options: ['它承载资源入口和版本切换', 'HTML 文件不能缓存', '浏览器不支持 HTML', 'HTML 会自动加密'], answer: 0, explain: 'HTML 决定加载哪个版本的资源。' },
          { type: 'multiple', question: '前端回滚要考虑？', options: ['HTML 版本', '静态资源是否保留', '接口兼容', 'CDN 缓存刷新'], answer: [0,1,2,3], explain: '回滚是全链路动作。' },
          { type: 'single', question: '边缘函数更适合？', options: ['轻量路由、鉴权前置或个性化逻辑', '承载全部复杂核心交易', '替代数据库事务', '作为唯一日志系统'], answer: 0, explain: '边缘适合低延迟轻量逻辑，复杂业务仍要谨慎。' }
        ]
      }
    ]
  }
];
