import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const FRONTEND_ARCHITECTURE_CONTENT = {
  id: 'frontend-architecture-longform',
  name: '深度长文：前端架构',
  icon: '🏗️',
  desc: '沿着 TypeScript、Monorepo、微前端和组件库设计，训练中高级架构取舍能力。',
  sourceCards: ['TypeScript 进阶', 'Monorepo 工程', '微前端', '组件库设计'],
  docs: [
    makeLongformDoc({
      title: '类型系统做 API 约束：让错误用法进不了调用方',
      sourceCards: ['TypeScript 进阶', '组件库设计'],
      problem: '它解决的是“API 文档写了但调用方仍然乱用”的问题。中高级 TypeScript 不追求炫技，而是把互斥参数、状态分支、事件名、返回值、权限字段和运行时边界表达成调用方能被编辑器拦住的契约。',
      customerCase: '组件库的 Dialog 同时支持受控和非受控模式，但 props 全部可选，业务同时传 open 和 defaultOpen 后状态错乱。正确做法是用可辨识联合表达两种互斥用法，让错误组合在编译期失败。',
      flow: [
        '先明确业务约束，不直接写复杂类型。',
        '用联合类型表达“只能是这些形态之一”。',
        '用可辨识字段做 narrowing，避免一堆可选字段。',
        '用泛型、条件类型、infer、映射类型表达推导关系。',
        '公开 API 上使用 satisfies、as const 保留字面量精度。',
        '外部输入必须运行时校验，不能只靠 TypeScript。',
      ],
      keywords: [
        { term: 'discriminated union', desc: '用共同字段区分不同数据形态，让编译器自动窄化。[→ TS Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)' },
        { term: 'generic', desc: '让类型关系随输入变化，而不是写死。[→ TS Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)' },
        { term: 'conditional type', desc: '根据类型条件选择不同结果。[→ TS Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)' },
        { term: 'infer', desc: '在条件类型中抽取局部类型。[→ TS infer 关键字](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)' },
        { term: 'satisfies', desc: '检查值符合约束，同时保留更精确的推导。[→ TS 4.9 satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)' },
        { term: 'runtime schema', desc: '对接口、用户输入等不可信数据做运行时校验。[→ Zod 官方文档](https://zod.dev)' },
      ],
      interview: 'TypeScript 进阶的核心不是写复杂类型，而是把业务约束和 API 合法用法表达成编译器能检查的契约；对外部不可信数据，则必须用运行时 schema 校验补上类型系统不存在于运行时的边界。',
      demo: `互斥 props 示例：

\`\`\`ts
type Controlled = {
  mode: 'controlled'
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOpen?: never
}

type Uncontrolled = {
  mode: 'uncontrolled'
  defaultOpen?: boolean
  open?: never
  onOpenChange?: never
}

type DialogProps = Controlled | Uncontrolled
\`\`\`

这个类型让错误组合在调用方直接报错，比文档提醒更可靠。`,
      diagnosis: [
        '调用方经常传错参数时，先看 API 是否把非法状态表达成了可选字段。',
        '类型太复杂导致难读时，回到业务约束重新命名中间类型。',
        '类型检查慢时，用 TypeScript diagnostics 找最贵的类型实例化。',
        '外部接口数据错但 TS 不报错时，检查是否滥用 as 断言。',
        '库类型丢失时，检查 declaration、exports 和 typesVersions。',
        '泛型推导差时，检查是否需要从值推导而不是让调用方手写类型。',
      ],
      followups: [
        'unknown 和 any 的边界是什么？',
        '为什么运行时数据不能只靠 TypeScript interface？',
        'satisfies 和 as 的区别是什么？',
        '类型体操什么时候应该停止？',
      ],
      deepDive: '非常值得深入。类型系统是前端架构的低成本质量门禁。深入顺序是 union/narrowing、泛型、条件类型、infer、映射类型、satisfies、project references 和运行时 schema。',
      references: [
        { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
        { title: 'TypeScript 4.9：satisfies 操作符', url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html' },
        { title: 'TypeScript：Project References', url: 'https://www.typescriptlang.org/docs/handbook/project-references.html' },
        { title: 'Zod：运行时 Schema 校验', url: 'https://zod.dev' },
      ],
      quiz: [
        single('表达互斥参数最适合的方式是？', ['可辨识联合', '所有字段都可选', '全部 any', '写在 README 里'], 0, '可辨识联合能让编译器区分合法状态。'),
        multiple('TypeScript 可用于表达哪些约束？', ['合法参数组合', '返回值推导', '事件名约束', '运行时自动校验所有接口'], [0, 1, 2], '运行时校验需要 schema 或代码执行。'),
        judgment('接口返回的数据只要写了 interface，运行时就一定安全。', 1, 'TypeScript 类型不会在运行时执行。'),
        single('satisfies 相比 as 的优势是？', ['检查约束且保留精确推导', '跳过类型检查', '自动生成接口', '提升运行时性能'], 0, 'satisfies 比断言更安全。'),
        multiple('类型检查变慢可排查？', ['深递归条件类型', '巨大 tsconfig', 'project references 是否缺失', '图片宽高'], [0, 1, 2], '这些都会影响 TS 编译性能。'),
        single('外部不可信数据进入系统前应做什么？', ['运行时 schema 校验', '直接 as 成业务类型', '只改变量名', '忽略错误'], 0, '外部数据需要运行时验证。'),
      ],
    }),
    makeLongformDoc({
      title: 'Monorepo 依赖与构建：源码集中不等于架构清晰',
      sourceCards: ['Monorepo 工程', '包管理器', '构建工具'],
      problem: '它解决的是多包协作、共享代码、增量构建和统一发布的问题。Monorepo 不是把项目塞进一个仓库，而是把多个 package 放进同一依赖图，并用任务编排、缓存和版本治理降低协作成本。',
      customerCase: '一个公司把 Web、组件库、SDK、BFF 全放进 Monorepo 后，CI 反而更慢。原因是每次 PR 都全量构建和测试，没有 affected 分析、任务缓存和包边界约束。真正的 Monorepo 能力没有落地。',
      flow: [
        '划清 apps 和 packages 边界。',
        '用 workspace 管理包间依赖和本地联调。',
        '用 task pipeline 描述 build、test、lint 的依赖顺序。',
        '基于变更影响范围只运行 affected 任务。',
        '使用本地和远程缓存复用未变化结果。',
        '用 Changesets 或等价机制管理版本和发布。',
      ],
      keywords: [
        { term: 'workspace', desc: '包管理器提供的多包依赖管理机制。[→ pnpm Workspaces](https://pnpm.io/workspaces)' },
        { term: 'task pipeline', desc: '任务之间的依赖图，例如先 build 依赖包再 build 应用。[→ Turborepo Tasks](https://turborepo.com/docs/core-concepts/monorepos/running-tasks)' },
        { term: 'affected', desc: '根据变更文件和依赖图计算受影响包。[→ Nx Affected](https://nx.dev/concepts/affected)' },
        { term: 'remote cache', desc: '跨机器复用构建结果，降低 CI 时间。[→ Turborepo Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)' },
        { term: 'package boundary', desc: '包之间的 API 和依赖边界，防止随意跨层引用。[→ Nx Enforce Boundaries](https://nx.dev/features/enforce-module-boundaries)' },
        { term: 'Changesets', desc: '多包版本变更和发布管理工具。[→ Changesets GitHub](https://github.com/changesets/changesets)' },
      ],
      interview: 'Monorepo 的价值不是仓库合并，而是用 workspace 统一依赖图，用任务流水线和缓存做增量构建，用包边界和版本治理保证多包协作既快又稳定。',
      demo: `最小任务依赖：

\`\`\`json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
\`\`\`

\`^build\` 表示先构建依赖包，再构建当前包。这是 Monorepo 构建正确性的基础。`,
      diagnosis: [
        'CI 慢时先看是否所有包都全量执行。',
        '缓存不命中时检查 inputs、outputs、环境变量和 lockfile。',
        '包间引用混乱时检查是否绕过 public API 或使用相对路径跨包。',
        '本地能跑发布失败时检查 workspace 协议是否进入产物。',
        '版本混乱时检查 changeset、发布顺序和依赖版本提升。',
        '类型解析异常时检查 tsconfig references 和 moduleResolution。',
      ],
      followups: [
        'Monorepo 和 multi-repo 的组织取舍是什么？',
        '远程缓存如何避免错误复用？',
        '为什么包边界比目录结构更重要？',
        '多包发布时 fixed version 和 independent version 怎么选？',
      ],
      deepDive: '值得深入。中大型前端平台几乎都会遇到多包协作。深入顺序是 workspace、依赖图、任务编排、缓存、包边界、版本发布和 TS project references。',
      references: [
        { title: 'pnpm Workspaces 文档', url: 'https://pnpm.io/workspaces' },
        { title: 'Turborepo：Task Pipeline', url: 'https://turborepo.com/docs/core-concepts/monorepos/running-tasks' },
        { title: 'Nx：Affected 计算', url: 'https://nx.dev/concepts/affected' },
        { title: 'Changesets：多包版本管理', url: 'https://github.com/changesets/changesets' },
      ],
      quiz: [
        single('Monorepo 的核心不是？', ['把多个项目简单塞进一个仓库', '统一依赖图', '增量构建', '版本治理'], 0, '源码集中只是表象。'),
        multiple('Monorepo CI 提速常用手段包括？', ['affected 分析', '远程缓存', '任务依赖图', '每次全量构建所有包'], [0, 1, 2], '全量构建会抵消 Monorepo 优势。'),
        judgment('没有包边界约束的 Monorepo 很容易变成大泥球。', 0, '所有包互相乱引会破坏架构边界。'),
        single('task pipeline 中 ^build 表达的通常是？', ['先构建依赖包', '删除依赖包', '跳过测试', '只构建当前 README'], 0, '依赖包产物应先于消费包生成。'),
        multiple('缓存不命中可检查？', ['outputs 配置', '环境变量', 'lockfile', '组件颜色'], [0, 1, 2], '缓存 key 通常受输入和环境影响。'),
        single('Changesets 常用于？', ['多包版本和发布管理', '浏览器渲染', '网络代理', '图片裁剪'], 0, 'Changesets 管理变更记录、版本和发布。'),
      ],
    }),
    makeLongformDoc({
      title: '微前端边界治理：拆开之后怎么不互相污染',
      sourceCards: ['微前端'],
      problem: '它解决的是巨型前端、多团队、多技术栈、多发布节奏下的协作问题。微前端的难点不是把页面拼起来，而是运行时隔离、资源加载、路由边界、共享依赖、通信协议、样式污染和故障降级。',
      customerCase: '某集团后台拆成多个子应用后，A 团队升级 UI 库导致 B 团队页面样式错乱，另一个子应用异常让主应用白屏。根因是样式没有隔离、共享依赖无版本策略、子应用加载失败没有降级边界。',
      flow: [
        '先确认是否真的需要微前端，而不是用路由拆分或 Monorepo 就能解决。',
        '定义主应用和子应用的所有权边界。',
        '设计路由分发、资源加载和生命周期。',
        '治理 JS 沙箱、样式隔离和共享依赖。',
        '设计跨应用通信协议，避免共享全局状态。',
        '为子应用加载失败、超时和版本不兼容提供降级。',
      ],
      keywords: [
        { term: 'host', desc: '主应用，负责路由、布局、资源加载和公共能力。[→ webpack Module Federation](https://webpack.js.org/concepts/module-federation/)' },
        { term: 'remote', desc: '子应用或远程模块，独立开发和发布。[→ single-spa 文档](https://single-spa.js.org/docs/getting-started-overview)' },
        { term: 'sandbox', desc: '限制子应用全局变量、副作用和运行时污染。[→ qiankun 沙箱文档](https://qiankun.umijs.org/zh/guide/getting-started)' },
        { term: 'style isolation', desc: '避免子应用样式互相覆盖。[→ qiankun 样式隔离](https://qiankun.umijs.org/zh/faq#%E5%A6%82%E4%BD%95%E7%A1%AE%E4%BF%9D%E4%B8%BB%E5%BA%94%E7%94%A8%E6%A0%B7%E5%BC%8F%E4%B8%8D%E8%A2%AB%E5%AD%90%E5%BA%94%E7%94%A8%E8%A6%86%E7%9B%96)' },
        { term: 'shared dependency', desc: '多个应用共享框架或库，需治理版本兼容。[→ Module Federation shared](https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints)' },
        { term: 'communication contract', desc: '跨应用通信协议，最好少而稳定。[→ MDN CustomEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/CustomEvent)' },
      ],
      interview: '微前端的本质是运行时架构拆分，用独立开发、独立部署、独立运行换取组织效率；核心挑战是隔离与共享的平衡，必须治理路由、生命周期、沙箱、样式、依赖、通信和故障降级。',
      demo: `最小通信边界示例：

\`\`\`ts
type MicroEvent =
  | { type: 'user:changed'; payload: { id: string } }
  | { type: 'theme:changed'; payload: { theme: 'light' | 'dark' } }

function emit(event: MicroEvent) {
  window.dispatchEvent(new CustomEvent('app:event', { detail: event }))
}
\`\`\`

跨应用通信要像 API 一样设计契约，不要把整个 store 暴露给所有子应用。`,
      diagnosis: [
        '子应用白屏时检查资源 URL、publicPath、跨域和加载超时。',
        '样式错乱时检查全局选择器、CSS reset、样式注入顺序和隔离方案。',
        '运行时异常扩散时检查主应用是否有错误边界和降级 UI。',
        '依赖冲突时检查共享依赖版本、单例策略和框架多实例。',
        '通信混乱时检查是否共享了过大的全局状态。',
        '性能退化时检查子应用并行加载、预加载、重复依赖和首屏资源。',
      ],
      followups: [
        '微前端和 iframe 的边界差异是什么？',
        'Module Federation 共享依赖为什么可能出问题？',
        '样式隔离有哪些方案，各自代价是什么？',
        '什么时候不应该使用微前端？',
      ],
      deepDive: '谨慎深入。微前端是组织架构和技术架构共同作用的方案，适合多团队大型应用，不适合小项目为了技术新鲜感引入。深入时要同时看组织边界、发布边界和运行时边界。',
      references: [
        { title: 'webpack Module Federation 概念', url: 'https://webpack.js.org/concepts/module-federation/' },
        { title: 'single-spa：官方文档', url: 'https://single-spa.js.org/docs/getting-started-overview' },
        { title: 'qiankun：官方中文文档', url: 'https://qiankun.umijs.org/zh/guide' },
        { title: 'MDN：CustomEvent API', url: 'https://developer.mozilla.org/zh-CN/docs/Web/API/CustomEvent' },
      ],
      quiz: [
        single('微前端最核心解决的问题是？', ['多团队巨型应用的独立开发部署运行', '让页面更花哨', '替代所有后端接口', '减少所有测试'], 0, '微前端主要解决组织和运行时拆分问题。'),
        multiple('微前端需要治理哪些边界？', ['路由', '样式', '共享依赖', '跨应用通信'], [0, 1, 2, 3], '这些都是常见风险点。'),
        judgment('微前端适合所有前端项目，越早引入越好。', 1, '它有明显复杂度，适合特定规模和组织场景。'),
        single('子应用资源加载 404 最常见检查项是？', ['publicPath 或资源基础路径', '按钮圆角', '数据库索引', '字体名称'], 0, '微前端子应用经常因部署路径和资源前缀错误加载失败。'),
        multiple('样式隔离可关注？', ['CSS Modules/Scoped CSS', 'Shadow DOM', '命名空间约束', '全局 reset 随意覆盖'], [0, 1, 2], '全局覆盖会造成污染。'),
        single('跨应用通信设计原则是？', ['少而稳定，像 API 一样管理契约', '共享所有内部 store', '用任意全局变量', '每次随机事件名'], 0, '通信越随意，耦合越严重。'),
      ],
    }),
    makeLongformDoc({
      title: '组件库兼容与升级：公开 API 都是契约',
      sourceCards: ['组件库设计', 'TypeScript 进阶'],
      problem: '它解决的是组件库长期演进中“升级一次炸一片”的问题。组件库 API 不只是 props，还包括导出路径、CSS 类名、主题 token、ARIA、事件语义、错误行为和类型声明。发布后这些都是契约。',
      customerCase: '组件库把 Button 的 className 结构重构了，业务里的自动化测试、定制样式和埋点选择器全部失效。组件功能没坏，但公开行为变了。升级风险来自契约意识不足。',
      flow: [
        '定义哪些属于公开契约，哪些是内部实现。',
        '为组件 props、事件、slot/render props、主题 token 建立类型和文档。',
        '避免业务依赖内部 DOM 结构和私有 class。',
        '破坏性变更使用 major 版本、迁移指南和 codemod。',
        '发布前用业务 fixture、视觉回归、类型测试和 E2E 验证。',
        '保留弃用周期，给业务迁移窗口。',
      ],
      keywords: [
        { term: 'API contract', desc: '消费方依赖的稳定行为集合。[→ SemVer 规范](https://semver.org/lang/zh-CN/)' },
        { term: 'design token', desc: '颜色、间距、圆角、字号等设计变量。[→ Style Dictionary](https://amzn.github.io/style-dictionary/)' },
        { term: 'ARIA', desc: '可访问性语义，组件库公开行为的重要组成。[→ WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)' },
        { term: 'visual regression', desc: '对比 UI 截图，发现样式和布局意外变化。[→ Playwright 视觉对比](https://playwright.dev/docs/screenshots)' },
        { term: 'codemod', desc: '自动迁移代码的脚本，用于大规模 breaking changes。[→ jscodeshift](https://jscodeshift.com/)' },
        { term: 'deprecation', desc: '弃用策略，在删除前提供提示和迁移周期。[→ TS JSDoc @deprecated](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#deprecated)' },
      ],
      interview: '组件库升级的核心是契约治理：props、类型、导出路径、样式 token、可访问性和 DOM 行为都可能被业务依赖；成熟组件库要用 semver、弃用周期、迁移指南、类型测试和视觉回归控制升级风险。',
      demo: `弃用 API 的类型提示：

\`\`\`ts
type ButtonProps = {
  variant?: 'primary' | 'secondary'
  /** @deprecated use variant instead */
  type?: 'primary' | 'default'
}
\`\`\`

不要一刀切删除高频 API。先提示、再迁移、最后在 major 版本移除。`,
      diagnosis: [
        '升级后 UI 变化，先看视觉回归和设计 token 变更。',
        '类型报错，检查 props 改名、泛型变化和导出入口。',
        '运行时报错，检查 peer 依赖、框架版本和副作用初始化。',
        '样式覆盖失效，检查业务是否依赖私有 DOM 或 class。',
        '可访问性退化，检查 role、aria-*、键盘交互和焦点管理。',
        '迁移成本过大，评估是否需要 codemod 或兼容层。',
      ],
      followups: [
        'CSS 类名算不算公开 API？',
        '组件库怎么做类型测试？',
        '为什么可访问性也是组件契约？',
        'breaking change 什么时候值得做？',
      ],
      deepDive: '值得深入。组件库是平台团队和业务团队之间的接口。深入顺序是 API 契约、类型设计、样式系统、可访问性、版本策略、迁移工具和自动化验证。',
      references: ['SemVer 官方规范', 'TypeScript Declaration Files 文档', 'WAI-ARIA Authoring Practices', 'Playwright Visual Comparisons 文档'],
      quiz: [
        single('组件库公开契约不包括以下哪种？', ['完全私有且未暴露的内部变量名', '组件 props', '导出路径', '主题 token'], 0, '私有实现不应被消费方依赖。'),
        multiple('组件库升级验证可包括？', ['类型测试', '视觉回归', '业务 fixture', 'E2E'], [0, 1, 2, 3], '多层验证能降低升级风险。'),
        judgment('组件库的 ARIA 和键盘交互也属于用户可感知契约。', 0, '可访问性行为会影响真实用户和自动化测试。'),
        single('删除高频 API 前更合理的做法是？', ['弃用提示、迁移指南、major 版本移除', '静默删除', '不发 changelog', '让业务自己猜'], 0, '破坏性变更需要迁移周期。'),
        multiple('业务依赖私有 DOM 结构可能导致？', ['升级后样式失效', '测试选择器失效', '埋点失效', '接口自动加速'], [0, 1, 2], '私有结构变化会破坏这些隐式依赖。'),
        single('codemod 的主要用途是？', ['自动迁移大规模 API 使用', '压缩图片', '管理 Cookie', '提高 DNS 速度'], 0, 'codemod 能降低 breaking change 迁移成本。'),
      ],
    }),
  ],
};
