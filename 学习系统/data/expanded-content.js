export const EXPANDED_MODULES = [
  {
    id: 'performance-advanced',
    name: '性能优化进阶',
    icon: '⚡',
    desc: '面向真实用户体验、线上定位与性能治理的大厂级性能体系。',
    docs: [
      {
        title: '性能指标体系：从“感觉慢”到可定位问题',
        difficulty: '进阶',
        content: `
## 1. 面试与业务场景

中高级前端不能只回答“压缩资源、懒加载、上 CDN”。大厂面试更关注你能不能把用户反馈的“慢”拆成可度量、可定位、可治理的问题。

真实客户问题通常长这样：

> 某地区用户反馈首页打开慢，但公司内网和测试环境都很快。

这个问题不能直接改代码。正确做法是先拆链路：网络、TTFB、首屏关键资源、主线程执行、框架渲染、图片和字体加载、缓存命中率、设备性能。

## 2. 关键指标

- LCP：首屏主体内容出现时间，常用于判断“打开慢”
- INP：交互后下一帧反馈时间，常用于判断“点击卡”
- CLS：布局偏移，常用于判断“页面乱跳”
- TTFB：服务端或边缘节点响应第一个字节的时间
- FCP：页面首次出现内容的时间
- Long Task：主线程超过 50ms 的任务，常导致交互延迟
- RUM：真实用户监控，能看到不同地区、网络、设备下的真实体验

## 3. 大厂解题思路

\`\`\`txt
用户反馈慢
→ 先看 RUM 是否复现
→ 按地区、网络、设备、页面版本切分
→ 判断是加载慢、交互慢还是视觉不稳定
→ 用 DevTools / Lighthouse / Performance 复现
→ 找到瓶颈后做最小改动
→ 上线后对比指标和分位数
\`\`\`

## 4. 一句面试版

性能优化不是罗列技巧，而是围绕 LCP、INP、CLS、TTFB 等指标建立“采集、定位、优化、验证、预算”的闭环，把用户体验问题变成可追踪的工程问题。`,
        quiz: [
          { type: 'single', question: '用户反馈“首页打开慢”，中高级前端第一步更应该做什么？', options: ['马上压缩所有 JS', '先用指标和维度确认慢发生在哪里', '把接口全部改成并发', '把动画全部删除'], answer: 1, explain: '先度量和分维度定位，才能避免盲目优化。' },
          { type: 'multiple', question: '排查线上性能问题时，哪些维度通常有价值？', options: ['地区', '网络类型', '设备等级', '用户昵称颜色'], answer: [0,1,2], explain: '真实用户性能常受地理、网络和设备影响。' },
          { type: 'single', question: 'INP 更关注哪类问题？', options: ['首屏最大图片多久出现', '用户交互后页面多久反馈', '页面是否发生布局偏移', 'DNS 是否命中缓存'], answer: 1, explain: 'INP 衡量交互到下一次绘制的延迟。' },
          { type: 'judgment', question: 'Lighthouse 分数高，就可以证明所有真实用户体验都好。', options: ['对', '错'], answer: 1, explain: 'Lighthouse 是实验室数据，真实用户还要看 RUM。' },
          { type: 'single', question: 'TTFB 持续偏高更可能优先指向哪类问题？', options: ['服务端响应、边缘节点或网络链路', '按钮 hover 样式', 'React 组件命名', 'CSS 变量数量'], answer: 0, explain: 'TTFB 反映从请求到首字节返回的耗时。' },
          { type: 'multiple', question: '一个成熟性能治理闭环通常包括？', options: ['采集指标', '定位瓶颈', '上线验证', '只靠个人经验判断'], answer: [0,1,2], explain: '治理需要数据闭环，而不是只靠经验。' }
        ]
      },
      {
        title: 'LCP 首屏优化：关键路径与资源优先级',
        difficulty: '困难',
        content: `
## 1. 真实问题

LCP 差通常不是“某一个文件太大”这么简单。它可能来自服务端慢、HTML 晚到、CSS 阻塞、首屏图片优先级低、字体阻塞、客户端渲染等待接口等多个环节。

## 2. 定位顺序

\`\`\`txt
确定 LCP 元素
→ 看 TTFB 是否过高
→ 看 LCP 资源何时开始请求
→ 看 CSS/字体/JS 是否阻塞渲染
→ 看图片尺寸、格式、优先级
→ 看框架是否等待数据后才渲染主体内容
\`\`\`

## 3. 常见优化

- 首屏大图使用合适尺寸与现代格式
- 对真正的 LCP 图片设置更高优先级
- 减少阻塞首屏的 CSS 和同步 JS
- SSR/SSG/Streaming 让首屏 HTML 更早出现
- 接口慢时做骨架屏不是优化 LCP 的万能药，关键是主体内容是否能更早渲染

## 4. 面试版回答

我会先确认 LCP 元素和阶段耗时。如果是 TTFB，优先看服务端、CDN、缓存；如果 LCP 资源晚发现，优化 HTML 中资源发现和优先级；如果资源加载快但渲染晚，看 CSS、字体、JS 和框架渲染阻塞。`,
        quiz: [
          { type: 'single', question: '优化 LCP 前，最先应该确认什么？', options: ['页面用了几个组件', '哪个元素是 LCP 元素以及它的阶段耗时', '项目有多少依赖', '接口字段命名'], answer: 1, explain: 'LCP 优化要围绕真实 LCP 元素和耗时阶段展开。' },
          { type: 'multiple', question: '哪些因素可能导致 LCP 偏差？', options: ['TTFB 高', '首屏图片发现太晚', 'CSS 阻塞渲染', 'README 太长'], answer: [0,1,2], explain: '服务端、资源发现和渲染阻塞都会影响 LCP。' },
          { type: 'judgment', question: '骨架屏一定能改善 LCP。', options: ['对', '错'], answer: 1, explain: 'LCP 看最大内容元素，骨架屏不一定是最终主体内容。' },
          { type: 'single', question: '首屏大图是 LCP 元素且请求开始很晚，优先应考虑？', options: ['提高资源发现和加载优先级', '改按钮颜色', '删除 sourcemap', '减少注释'], answer: 0, explain: 'LCP 图片请求晚常见于懒加载误用或资源优先级不当。' },
          { type: 'multiple', question: '对首屏关键资源有帮助的手段包括？', options: ['合理 preload', '减少阻塞 CSS', '压缩和适配图片尺寸', '把所有代码放一个巨大 bundle'], answer: [0,1,2], explain: '巨大 bundle 反而可能拖慢首屏。' },
          { type: 'single', question: '如果 TTFB 很高，优先排查哪一层？', options: ['服务端/边缘缓存/网络链路', 'CSS hover', '组件 props 名称', '本地编辑器主题'], answer: 0, explain: 'TTFB 高通常先看请求到首字节返回的链路。' }
        ]
      },
      {
        title: 'INP 与主线程：从卡顿反馈到任务拆分',
        difficulty: '困难',
        content: `
## 1. 真实问题

用户说“点击按钮没反应”，前端不能只说“接口慢”。点击后的反馈要经历事件回调、状态更新、框架渲染、布局绘制。如果主线程被长任务占满，即使接口很快也会卡。

## 2. 定位方法

\`\`\`txt
录制 Performance
→ 找交互事件
→ 看事件回调耗时
→ 看长任务来源
→ 区分 JS 计算、样式布局、渲染提交
→ 缩小更新范围或拆任务
\`\`\`

## 3. 工程手段

- 避免在输入/点击回调里做大计算
- 大列表使用虚拟滚动
- 重计算缓存或移到 Web Worker
- 非关键任务延后执行
- 框架层减少无效渲染和过大组件更新范围

## 4. 面试重点

大厂更关注你是否能讲清楚“主线程为什么忙”和“如何验证改动有效”，而不是只说防抖节流。`,
        quiz: [
          { type: 'single', question: '用户点击后页面迟迟不更新，除了接口慢，还应重点排查？', options: ['主线程长任务和渲染阻塞', '文件夹命名', '注释风格', '域名长度'], answer: 0, explain: '交互反馈依赖主线程处理事件、渲染和绘制。' },
          { type: 'multiple', question: '改善 INP 的常见手段包括？', options: ['拆分长任务', '减少无效渲染', 'Web Worker 承担重计算', '同步渲染十万行 DOM'], answer: [0,1,2], explain: '十万行 DOM 会加剧卡顿。' },
          { type: 'judgment', question: '防抖节流可以解决所有交互性能问题。', options: ['对', '错'], answer: 1, explain: '防抖节流只是手段之一，核心仍是主线程工作量和渲染范围。' },
          { type: 'single', question: '排查点击卡顿最直接的浏览器工具是？', options: ['Performance 面板录制交互', 'Elements 面板改文字', 'Application 面板删 cookie', 'Console 打印版本号'], answer: 0, explain: 'Performance 可看到事件、长任务和渲染耗时。' },
          { type: 'multiple', question: '大列表导致交互卡顿时可考虑？', options: ['虚拟滚动', '分页', '减少单次渲染 DOM 数量', '一次性渲染全部隐藏节点'], answer: [0,1,2], explain: '核心是减少主线程和 DOM 渲染负担。' },
          { type: 'single', question: 'Long Task 通常指主线程任务超过多少毫秒？', options: ['50ms', '5ms', '5000ms', '1ms'], answer: 0, explain: '浏览器 Long Task 通常以 50ms 为阈值。' }
        ]
      },
      {
        title: '性能预算与监控：让优化不回退',
        difficulty: '进阶',
        content: `
## 1. 为什么需要性能预算

一次性能优化并不难，难的是三个月后不被新功能、依赖升级、图片误传、实验代码拖回去。

性能预算就是把“不能退化太多”写成规则，例如：

- 首屏 JS gzip 后不超过某个阈值
- LCP P75 不超过目标值
- INP P75 不超过目标值
- 新增路由 chunk 需要说明理由
- 图片超过尺寸自动告警

## 2. 大厂实践

\`\`\`txt
开发阶段：bundle 分析、Lighthouse CI
发布阶段：性能预算门禁
线上阶段：RUM 分位数监控
事故阶段：关联版本、地区、设备和灰度批次
\`\`\`

## 3. 面试版

性能优化要产品化和工程化：用预算守住入口，用监控发现退化，用灰度降低风险，用归因让每次退化能找到版本和负责人。`,
        quiz: [
          { type: 'single', question: '性能预算主要解决什么问题？', options: ['防止性能随迭代持续退化', '替代所有测试', '让 CSS 更好看', '减少产品需求'], answer: 0, explain: '预算用于把性能目标转成可执行门禁。' },
          { type: 'multiple', question: '可作为性能预算的指标有？', options: ['bundle 体积', 'LCP P75', 'INP P75', '变量命名长度'], answer: [0,1,2], explain: '预算可以覆盖产物和真实用户体验指标。' },
          { type: 'judgment', question: '只要上线前跑一次 Lighthouse，就不需要线上 RUM。', options: ['对', '错'], answer: 1, explain: '实验室数据不能替代真实用户监控。' },
          { type: 'single', question: '性能退化定位时，最应该关联什么？', options: ['版本、地区、设备、灰度批次', '开发者头像', '代码缩进', '主题色'], answer: 0, explain: '这些维度能帮助快速定位退化范围和原因。' },
          { type: 'multiple', question: '性能治理可落在哪些阶段？', options: ['开发阶段', '发布阶段', '线上阶段', '完全靠用户投诉阶段'], answer: [0,1,2], explain: '成熟治理应覆盖开发、发布、线上。' },
          { type: 'single', question: 'bundle 分析最适合发现哪类问题？', options: ['依赖体积异常和重复打包', '数据库死锁', '机房断电', '接口权限错误'], answer: 0, explain: 'bundle 分析用于产物依赖和体积归因。' }
        ]
      }
    ]
  },
  {
    id: 'frontend-architecture',
    name: '前端架构进阶',
    icon: '🏗️',
    desc: 'TypeScript、组件库、微前端与 Monorepo 的架构级能力。',
    docs: [
      {
        title: 'TypeScript 进阶：用类型表达业务约束',
        difficulty: '困难',
        content: `
## 1. 大厂关注点

中高级 TS 不是背工具类型，而是能不能把业务约束变成调用方无法误用的 API。

典型问题：

- 某些字段必须一起出现
- 不同状态下可访问字段不同
- 表单 schema 推导出提交值类型
- 组件库 props 需要互斥
- 接口返回值需要在运行时校验后再进入类型安全区

## 2. 常用工具

- 可辨识联合：表达状态机
- 条件类型和 infer：从 API 中抽取类型
- 映射类型：批量改造对象类型
- 模板字面量类型：约束事件名、路径、权限 key
- satisfies：校验结构，同时保留字面量推导

## 3. 面试版

TS 进阶的价值不是炫技，而是让错误用法在编辑器和 CI 阶段暴露；类型表达不了的边界，要交给运行时校验。`,
        quiz: [
          { type: 'single', question: '中高级 TS 最核心的工程价值是？', options: ['写更长的类型体操', '把业务约束前移到编译期', '替代所有运行时校验', '让 JS 文件更少'], answer: 1, explain: 'TS 的关键价值是提前暴露错误用法。' },
          { type: 'multiple', question: '哪些适合用可辨识联合表达？', options: ['请求成功/失败状态', '组件不同模式下互斥 props', '状态机分支', 'CSS 文件大小'], answer: [0,1,2], explain: '共同 discriminant 字段可以精确窄化状态。' },
          { type: 'judgment', question: '只要用了 TypeScript，就不再需要运行时校验。', options: ['对', '错'], answer: 1, explain: '外部输入仍需要运行时校验。' },
          { type: 'single', question: 'satisfies 相比直接 as 断言的优势是？', options: ['校验结构并保留更精确推导', '让运行速度翻倍', '删除类型错误', '自动发请求'], answer: 0, explain: 'satisfies 更适合配置对象的类型校验。' },
          { type: 'multiple', question: '大项目 TS 性能治理可能涉及？', options: ['project references', '合理拆包', '减少过深递归类型', '把所有类型写成 any'], answer: [0,1,2], explain: 'any 会降低类型价值，不是治理目标。' },
          { type: 'single', question: 'infer 常用于？', options: ['在条件类型中抽取局部类型', '压缩图片', '重启服务', '修改 DNS'], answer: 0, explain: 'infer 是条件类型中抽取类型的关键能力。' }
        ]
      },
      {
        title: '组件库设计：API、产物与长期兼容',
        difficulty: '困难',
        content: `
## 1. 为什么组件库难

业务组件只要当前项目能跑；组件库要面对不同项目、不同构建工具、不同 TS 配置、不同 React 版本和长期升级。

中高级面试会问：

- 为什么 React 要放 peerDependencies？
- exports 怎么设计？
- CSS 为什么可能被 tree shaking 掉？
- 如何做 breaking change？
- 组件 API 如何兼顾可扩展和不误用？

## 2. 设计主线

\`\`\`txt
明确使用场景
→ 设计公开 API
→ 设计 ESM/CJS/types/CSS 产物
→ 声明 exports、sideEffects、peerDependencies
→ 建立版本和迁移策略
→ 用示例、类型和测试保障消费体验
\`\`\`

## 3. 面试版

组件库的难点不只是组件实现，而是 API 契约、产物解析、类型导出、样式副作用和升级兼容。`,
        quiz: [
          { type: 'single', question: '组件库通常为什么把 React 放到 peerDependencies？', options: ['避免重复打包并复用宿主 React', '让包更大', '禁止用户安装 React', '提升 CSS 权重'], answer: 0, explain: '组件库不应内置一份宿主框架实例。' },
          { type: 'multiple', question: '组件库 package.json 常见关键字段包括？', options: ['exports', 'sideEffects', 'peerDependencies', 'randomColor'], answer: [0,1,2], explain: '这些字段影响解析、tree shaking 和宿主依赖。' },
          { type: 'judgment', question: '组件库只要功能能跑，就不需要考虑升级兼容。', options: ['对', '错'], answer: 1, explain: '公开 API 一旦发布就是契约。' },
          { type: 'single', question: 'sideEffects 标注 CSS 的主要原因是？', options: ['避免样式被错误 tree shake', '让 CSS 变成 JS', '提升数据库性能', '减少 HTTP 状态码'], answer: 0, explain: 'CSS import 通常有副作用，需要保留。' },
          { type: 'multiple', question: '一个好的组件 API 设计应关注？', options: ['可组合性', '可访问性', '类型提示', '只能通过复制源码使用'], answer: [0,1,2], explain: '组件库应重视消费体验和长期维护。' },
          { type: 'single', question: '破坏性变更应该如何发布？', options: ['major 版本并提供迁移说明', '悄悄发 patch', '直接覆盖旧包', '只在群里口头通知'], answer: 0, explain: '语义化版本和迁移说明是基本治理。' }
        ]
      },
      {
        title: '微前端：隔离、共享与运行时集成',
        difficulty: '困难',
        content: `
## 1. 真实场景

当一个后台系统由多个团队长期共建，单体前端构建慢、发布互相阻塞、技术栈升级困难时，才需要认真考虑微前端。

微前端不是银弹。它引入了运行时加载、沙箱、样式隔离、共享依赖、路由协调、通信协议和故障隔离等新复杂度。

## 2. 核心问题

- 主应用如何发现和加载子应用
- 子应用生命周期如何挂载和卸载
- JS 全局污染如何隔离
- CSS 如何避免互相覆盖
- React/Vue 等依赖是否共享
- 子应用失败如何降级
- 发布和灰度如何独立

## 3. 面试版

微前端的价值是组织和发布边界，不是为了技术炫技；核心权衡是隔离与共享，目标是让多团队独立交付又保持用户体验一致。`,
        quiz: [
          { type: 'single', question: '微前端最适合解决哪类问题？', options: ['多团队巨型应用独立交付困难', '单页面按钮太少', 'CSS 颜色不好看', '接口返回字段太多'], answer: 0, explain: '微前端主要解决组织、发布和运行时拆分问题。' },
          { type: 'multiple', question: '微前端落地需要重点考虑？', options: ['JS 沙箱', '样式隔离', '共享依赖', '数据库索引'], answer: [0,1,2], explain: '这些是微前端运行时集成的关键问题。' },
          { type: 'judgment', question: '所有中大型前端项目都应该使用微前端。', options: ['对', '错'], answer: 1, explain: '微前端有明显复杂度，只有边界收益足够时才值得。' },
          { type: 'single', question: 'Module Federation 更强调哪种能力？', options: ['运行时模块共享和远程加载', '图片裁剪', 'SQL 优化', '字体设计'], answer: 0, explain: 'Module Federation 用于运行时 remote/module 共享。' },
          { type: 'multiple', question: '微前端通信应避免什么？', options: ['过度共享全局状态', '隐式强耦合事件', '清晰协议', '无边界调用子应用内部实现'], answer: [0,1,3], explain: '通信应有边界和协议，避免强耦合。' },
          { type: 'single', question: '子应用加载失败时，中高级方案应考虑？', options: ['降级 UI、错误隔离和监控告警', '让整个主应用白屏', '刷新无限重试', '忽略用户'], answer: 0, explain: '大型系统要考虑局部失败和可观测性。' }
        ]
      },
      {
        title: 'Monorepo 工程：依赖边界与增量构建',
        difficulty: '困难',
        content: `
## 1. 为什么需要 Monorepo

当多个前端应用、组件库、工具包、BFF 类型定义需要共享代码时，多仓库会带来版本同步、联调、重复配置、跨仓发布顺序等成本。

Monorepo 的核心不是“放一个仓库里”，而是配套依赖边界、任务编排、缓存、版本策略和权限治理。

## 2. 关键能力

- workspace 依赖管理
- 包之间依赖图
- affected build/test
- 远程缓存
- 统一 lint/test/build 规范
- 发布版本策略
- 禁止非法跨层依赖

## 3. 面试版

Monorepo 的价值是用统一仓库和依赖图降低协作成本，但必须通过边界规则、缓存和增量构建控制复杂度。`,
        quiz: [
          { type: 'single', question: 'Monorepo 的核心价值更接近？', options: ['统一依赖图与协作边界', '把所有代码混成一个文件', '删除 CI', '禁止发布'], answer: 0, explain: 'Monorepo 重在依赖图、协作和任务编排。' },
          { type: 'multiple', question: '成熟 Monorepo 通常需要？', options: ['任务缓存', 'affected 构建', '依赖边界规则', '手动复制 node_modules'], answer: [0,1,2], explain: '缓存、增量和边界是控制规模的关键。' },
          { type: 'judgment', question: '代码放在一个仓库里，就自然拥有 Monorepo 工程能力。', options: ['对', '错'], answer: 1, explain: '没有工具链和治理，只是大仓库。' },
          { type: 'single', question: 'affected build 依赖什么信息？', options: ['包依赖图和变更范围', '用户头像', 'CSS 颜色', '机器品牌'], answer: 0, explain: '增量构建需要知道哪些包受影响。' },
          { type: 'multiple', question: 'Monorepo 常见风险包括？', options: ['边界失控', '全量构建变慢', '权限和发布治理复杂', '无法使用 TypeScript'], answer: [0,1,2], explain: 'TS 可以很好地用于 Monorepo。' },
          { type: 'single', question: '远程缓存的主要收益是？', options: ['复用团队内已完成任务结果', '自动写业务代码', '替代代码评审', '删除测试'], answer: 0, explain: '远程缓存能减少重复构建和测试。' }
        ]
      }
    ]
  },
  {
    id: 'browser-network',
    name: '浏览器与网络',
    icon: '🌐',
    desc: '从请求链路、缓存、接口设计到 Node/BFF，提升线上问题定位能力。',
    docs: [
      {
        title: '请求响应全链路：fetch 背后发生了什么',
        difficulty: '进阶',
        content: `
## 1. 客户问题视角

当前端说“接口慢”时，可能慢在 DNS、TCP、TLS、代理、应用服务、数据库、网关限流、缓存穿透，也可能是浏览器主线程没空处理响应。

中高级前端需要能读懂 Network 面板的 Timing，把问题定位到链路中的某一段。

## 2. 链路拆解

\`\`\`txt
URL 解析
→ DNS
→ TCP
→ TLS
→ HTTP 请求
→ CDN / 网关 / 反向代理
→ 应用服务
→ 数据库或下游服务
→ HTTP 响应
→ 浏览器解析和缓存
\`\`\`

## 3. 面试版

一次请求不是 fetch 到 JSON 的魔法，而是一条可观测链路；前端要能用 Network Timing、状态码、响应头和 trace id 与后端协同定位。`,
        quiz: [
          { type: 'single', question: 'Network Timing 中 Waiting(TTFB) 很高，优先说明什么？', options: ['请求到首字节返回慢', 'CSS 选择器太长', '按钮样式错误', '前端变量太多'], answer: 0, explain: 'TTFB 高说明首字节回来慢，可能在服务端、代理或网络链路。' },
          { type: 'multiple', question: '一次 HTTPS 请求可能经历哪些阶段？', options: ['DNS', 'TCP', 'TLS', 'React diff'], answer: [0,1,2], explain: 'React diff 不属于网络建连阶段。' },
          { type: 'judgment', question: '接口报错时，前端只需要看响应 body，不需要看状态码和响应头。', options: ['对', '错'], answer: 1, explain: '状态码、headers、body 都是定位依据。' },
          { type: 'single', question: '前后端协同排查链路问题时，trace id 的作用是？', options: ['串联一次请求在多服务中的日志', '改变字体', '压缩图片', '禁用缓存'], answer: 0, explain: 'trace id 能把跨服务日志关联起来。' },
          { type: 'multiple', question: '浏览器跨域问题常关注哪些响应头？', options: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Headers', 'font-size'], answer: [0,1,2], explain: '这些是 CORS 相关响应头。' },
          { type: 'single', question: '如果 DNS 查询耗时异常，优先属于哪层问题？', options: ['域名解析链路', 'React 状态管理', 'CSS scoped', '代码分支策略'], answer: 0, explain: 'DNS 是域名到 IP 的解析过程。' }
        ]
      },
      {
        title: 'HTTP 缓存：强缓存、协商缓存与 CDN',
        difficulty: '进阶',
        content: `
## 1. 为什么缓存重要

缓存不是“加一个 Cache-Control”就结束。线上常见事故包括：用户拿到旧 JS、HTML 被错误长缓存、CDN 没刷新、接口缓存穿透、灰度资源版本错配。

## 2. 前端静态资源策略

- HTML：通常不做长期强缓存，保证能拿到最新资源引用
- JS/CSS：文件名带 hash 后可长缓存
- 图片字体：按内容 hash 或版本策略缓存
- CDN：关注回源、刷新、预热、区域命中率

## 3. 面试版

缓存策略要区分资源类型：入口 HTML 要可更新，带 hash 的静态资源可长缓存；接口缓存要结合业务一致性，CDN 要考虑刷新、预热和灰度版本。`,
        quiz: [
          { type: 'single', question: '前端静态资源文件名带内容 hash 后，通常可以？', options: ['设置较长强缓存', '完全不缓存', '每秒刷新', '只能本地使用'], answer: 0, explain: '内容变 hash 变，可以安全长缓存。' },
          { type: 'multiple', question: '缓存策略需要区分哪些资源？', options: ['HTML', 'JS/CSS', '图片字体', '所有资源都完全相同'], answer: [0,1,2], explain: '入口和静态资源缓存策略不同。' },
          { type: 'judgment', question: 'HTML 入口文件通常适合和 hash JS 一样长期强缓存。', options: ['对', '错'], answer: 1, explain: 'HTML 长缓存可能导致用户拿不到新资源引用。' },
          { type: 'single', question: 'ETag/If-None-Match 属于哪类机制？', options: ['协商缓存', '布局算法', '组件通信', '数据库事务'], answer: 0, explain: 'ETag 用于客户端和服务端协商资源是否变化。' },
          { type: 'multiple', question: 'CDN 相关问题排查可能关注？', options: ['命中率', '回源耗时', '刷新/预热', '组件 props'], answer: [0,1,2], explain: 'CDN 关注边缘缓存和回源链路。' },
          { type: 'single', question: '用户仍加载旧 JS，优先排查？', options: ['HTML 缓存和资源版本引用', '按钮圆角', 'TS 类型别名', 'Git 用户名'], answer: 0, explain: '入口 HTML 或 CDN 缓存常导致旧资源引用。' }
        ]
      },
      {
        title: 'REST 与接口设计：前端如何判断接口好坏',
        difficulty: '进阶',
        content: `
## 1. 前端为什么要懂接口设计

大厂中高级前端不仅消费接口，还要和后端共同定义边界。接口设计不好，会直接导致页面状态复杂、错误处理混乱、缓存困难、幂等问题和线上事故。

## 2. 判断标准

- 资源语义是否清晰
- method 是否表达操作语义
- 状态码是否可用于分支处理
- 错误结构是否稳定
- 分页、排序、筛选是否一致
- 是否考虑幂等、重试、权限和审计
- 是否适合缓存

## 3. 面试版

好的接口不是“能返回数据”，而是语义清晰、错误稳定、可缓存、可重试、可观测，并能降低前端状态管理复杂度。`,
        quiz: [
          { type: 'single', question: '好的接口设计对前端最大的价值之一是？', options: ['降低状态和错误处理复杂度', '让 CSS 更少', '替代 UI 设计', '删除构建工具'], answer: 0, explain: '稳定语义和错误结构能降低前端复杂度。' },
          { type: 'multiple', question: '接口设计评审应关注？', options: ['状态码', '错误结构', '分页筛选约定', '按钮图标颜色'], answer: [0,1,2], explain: '这些影响前端消费和问题定位。' },
          { type: 'judgment', question: '所有错误都返回 HTTP 200，再在 body 里写 code，是最利于前端和监控的方式。', options: ['对', '错'], answer: 1, explain: '滥用 200 会削弱 HTTP 语义和基础设施监控。' },
          { type: 'single', question: '重试支付、下单等写操作时，特别需要关注？', options: ['幂等性', '字体大小', '路由动画', '图片格式'], answer: 0, explain: '写操作重试必须防止重复提交。' },
          { type: 'multiple', question: '稳定错误结构通常应包含？', options: ['错误码', '用户可读消息', '排查 trace id', '随机字段名'], answer: [0,1,2], explain: '稳定结构利于用户提示和工程排查。' },
          { type: 'single', question: 'GET 接口天然更适合什么能力？', options: ['缓存和安全重试', '上传大文件 body', '修改订单状态', '执行删除'], answer: 0, explain: 'GET 语义通常是读取，适合缓存。' }
        ]
      }
    ]
  },
  {
    id: 'engineering-core',
    name: '工程化核心',
    icon: '🛠️',
    desc: '包管理、构建、Vite、发布与故障恢复的工程实战能力。',
    docs: [
      {
        title: '包管理器：依赖确定性与供应链风险',
        difficulty: '进阶',
        content: `
## 1. 真实问题

“我本地能跑，CI 跑不起来”经常来自依赖不确定：lockfile 不一致、幽灵依赖、peer dependency 冲突、registry 差异、install 脚本风险。

中高级前端要理解 npm/pnpm/yarn 的依赖安装模型，而不是只会删 node_modules。

## 2. 关键点

- lockfile 保证版本确定性
- CI 使用 npm ci / pnpm install --frozen-lockfile
- peerDependencies 表达宿主依赖
- pnpm 通过硬链接和严格依赖减少幽灵依赖
- install scripts 是供应链风险点

## 3. 面试版

依赖治理的目标是可复现、可审计、可升级、可回滚；包管理器选择只是手段，lockfile、CI 安装策略和供应链治理才是关键。`,
        quiz: [
          { type: 'single', question: 'lockfile 最核心的价值是？', options: ['保证依赖版本可复现', '让代码自动变快', '替代测试', '删除 peerDependencies'], answer: 0, explain: 'lockfile 记录解析后的依赖版本。' },
          { type: 'multiple', question: 'CI 安装依赖时应关注？', options: ['冻结 lockfile', 'registry 稳定', 'Node 版本一致', '随机升级依赖'], answer: [0,1,2], explain: 'CI 需要可复现环境。' },
          { type: 'judgment', question: '删掉 lockfile 可以让项目更稳定。', options: ['对', '错'], answer: 1, explain: '删除 lockfile 会降低依赖确定性。' },
          { type: 'single', question: 'peerDependencies 主要表达？', options: ['需要由宿主项目提供的依赖', '开发者姓名', '代码覆盖率', '接口路径'], answer: 0, explain: '组件库常用 peerDependencies 声明 React 等宿主依赖。' },
          { type: 'multiple', question: '供应链风险可能来自？', options: ['恶意依赖', 'install scripts', 'registry 劫持或污染', 'CSS 注释'], answer: [0,1,2], explain: '依赖链本身也是安全边界。' },
          { type: 'single', question: 'pnpm 严格依赖模型有助于减少？', options: ['幽灵依赖', 'HTTP 状态码', 'DOM 节点', '图片尺寸'], answer: 0, explain: '严格依赖让未声明依赖更容易暴露。' }
        ]
      },
      {
        title: '构建工具：依赖图、Chunk 与线上故障',
        difficulty: '进阶',
        content: `
## 1. 为什么构建工具是中高级必修

线上白屏、chunk 加载失败、缓存错配、依赖重复打包、构建过慢、sourcemap 泄露，都和构建链路有关。

## 2. 核心模型

\`\`\`txt
入口
→ 模块依赖图
→ transform / plugin
→ tree shaking
→ chunk split
→ hash / sourcemap / assets
→ dist
\`\`\`

## 3. 大厂常问

- 为什么动态 import 会形成 chunk？
- vendor 拆分过细有什么风险？
- sourcemap 如何用于线上排查，又如何保护源码？
- chunk 404 如何定位？
- tree shaking 为什么失效？

## 4. 面试版

构建工具的核心是依赖图和产物治理；中高级前端要能从产物反推线上问题，而不是只会改配置。`,
        quiz: [
          { type: 'single', question: '构建工具分析依赖的核心数据结构是？', options: ['模块依赖图', '用户画像', '数据库表', '网络拓扑图'], answer: 0, explain: '构建从入口出发形成模块依赖图。' },
          { type: 'multiple', question: 'chunk 加载失败可能与哪些因素有关？', options: ['CDN 缓存错配', 'public path 配置错误', '发布期间新旧资源混用', '按钮文案太长'], answer: [0,1,2], explain: 'chunk URL 和版本一致性是常见问题。' },
          { type: 'judgment', question: '只要用了 tree shaking，未使用代码一定会全部删除。', options: ['对', '错'], answer: 1, explain: '副作用、模块格式和导出方式都会影响 tree shaking。' },
          { type: 'single', question: '线上压缩代码报错要定位源码，通常依赖？', options: ['sourcemap', 'CSS reset', '图片 EXIF', 'favicon'], answer: 0, explain: 'sourcemap 用于映射压缩后代码到源码。' },
          { type: 'multiple', question: '构建产物分析可以发现？', options: ['依赖重复打包', '大 chunk', '意外引入重库', '数据库索引缺失'], answer: [0,1,2], explain: '产物分析关注前端 bundle 组成。' },
          { type: 'single', question: '动态 import 的常见效果是？', options: ['形成异步 chunk', '同步阻塞所有代码', '删除类型', '关闭缓存'], answer: 0, explain: '动态导入常用于代码分割。' }
        ]
      },
      {
        title: '发布策略：灰度、回滚与客户影响控制',
        difficulty: '困难',
        content: `
## 1. 客户问题视角

中高级前端不仅要会发布，还要能控制发布影响面。客户线上问题发生时，最重要的是快速判断是否版本引入、影响哪些用户、能不能回滚、是否需要暂停放量。

## 2. 常见策略

- 灰度发布：逐步扩大用户范围
- 金丝雀发布：先让小流量验证
- 蓝绿发布：两套环境切换
- Feature Flag：功能开关控制风险
- 快速回滚：重新指向上一个稳定产物

## 3. 前端特殊点

前端发布要关注 HTML 与静态资源版本一致性、CDN 缓存、sourcemap、监控告警、接口兼容，以及用户已经加载旧页面时的兼容。

## 4. 面试版

发布策略的目标不是炫技，而是让变更可观测、可暂停、可回滚，把客户影响控制在最小范围。`,
        quiz: [
          { type: 'single', question: '灰度发布的核心目标是？', options: ['逐步扩大影响面并验证风险', '一次性覆盖所有用户', '删除监控', '跳过测试'], answer: 0, explain: '灰度通过小范围验证降低风险。' },
          { type: 'multiple', question: '前端发布需要特别关注？', options: ['HTML 与静态资源版本一致性', 'CDN 缓存', 'sourcemap 和监控', '用户发型'], answer: [0,1,2], explain: '这些会直接影响线上可用性和排查。' },
          { type: 'judgment', question: '只要构建成功，就说明这次发布一定没有风险。', options: ['对', '错'], answer: 1, explain: '构建成功不等于线上行为安全。' },
          { type: 'single', question: 'Feature Flag 的价值是？', options: ['按用户或环境控制功能开关', '自动优化 SQL', '替代 CDN', '减少 CSS 文件'], answer: 0, explain: '功能开关可以降低发布和回滚成本。' },
          { type: 'multiple', question: '客户投诉新版本异常时，前端应快速确认？', options: ['影响范围', '版本关联', '是否可回滚', '开发者座位'], answer: [0,1,2], explain: '故障响应要先控影响和定位版本。' },
          { type: 'single', question: '前端回滚更稳妥的对象通常是？', options: ['上一个已验证稳定产物', '本地临时文件', '随机 commit', '未构建源码'], answer: 0, explain: '回滚应指向可验证的稳定产物。' }
        ]
      }
    ]
  }
];
