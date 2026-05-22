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
        single('表达互斥参数最适合的方式是？', ['可辨识联合', '所有字段都可选', '全部 any', '写在 README 里'], 0, `💡 它解决了什么问题：
如果组件的 API 存在互斥参数（例如 Dialog 同时支持受控的 open 和非受控的 defaultOpen），若只用可选字段，调用方可能同时传递或漏传，导致组件内部状态机错乱，产生难以预测的渲染 bug，且只能通过运行时提示或文档口头约束，无法在开发阶段被编辑器拦截。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用 TypeScript 的 Discriminated Unions（可辨识联合）。通过引入一个共同的字面量类型属性（通常是 type 或 mode）作为“辨识标签”，结合每个分支独有的属性和利用 never 排除互斥字段，使 TS 编译器能够执行控制流分析和类型收窄（Narrowing）。
2. 工程取舍上，虽然可辨识联合会增加类型声明的复杂度与调用方书写属性时的显式心智负担，但它在编译期就消除了非法状态（Make Impossible States Unrepresentable），避免了在组件内部编写大量复杂的运行时条件互斥校验代码。
3. 大厂追问：在处理多层嵌套或复杂的联合类型时，如何避免类型推导在联合分支过多（Union Explosion）时导致的 TS Server 性能崩塌？可采用属性拆分、多级可辨识标签，或使用局部辅助函数将收窄逻辑抽离，减少大联合类型的实例化成本。`),
        multiple('TypeScript 可用于表达哪些约束？', ['合法参数组合', '返回值推导', '事件名约束', '运行时自动校验所有接口'], [0, 1, 2], `💡 它解决了什么问题：
如果不使用静态类型约束，开发者在编写和维护复杂模块时，拼写错误、非法参数组合、以及调用深层 API 时的契约缺失，极易在运行时抛出 TypeError。它解决的是研发全生命周期中“代码意图与执行结果不符”的痛点。

🔍 核心原理解析（防拷打）：
1. TypeScript 是静态类型系统，在编译期（或利用编辑器语言服务 LSP 实时）对 AST（抽象语法树）进行类型双向流转与契约检查。它支持条件类型推导、模板字面量类型约束事件名、以及重载函数规范复杂入参与返回值的关系。
2. 工程取舍上，静态类型系统具有“运行时擦除”特性（Type Erasure），所有的类型定义在编译成 JS 后都会消失，这意味着它无法防范运行时的外部输入（如 API 请求、用户表单输入）引起的契约破裂。
3. 大厂追问：如何保证生成的 TS 声明文件（.d.ts）与实际构建出来的 JS 行为是 100% 同步的？通常需要在 CI 中配置 API 提取工具（如 API Extractor）做静态契约比对，并使用 ts-expect-error 写断言测试，防范因为构建配置（如 target、moduleResolution）差异引起的契约泄漏。`),
        judgment('接口返回的数据只要写了 interface，运行时就一定安全。', 1, `💡 它解决了什么问题：
如果仅依靠 TS 的 interface 声称数据结构，在遇到后端字段变更、网络劫持、或是本地脏数据时，前端应用会直接在运行时抛出 Cannot read properties of undefined 的致命白屏错误，导致静态类型保护网全面溃败。

🔍 核心原理解析（防拷打）：
1. TypeScript 采用的是结构化类型系统（Structural Typing），且具有运行时类型擦除（Type Erasure）的特性。在打包阶段，所有 interface、type 都会被剥离，无法在实际数据流入业务层时进行任何数据合法性校验。
2. 工程取舍上，如果引入强运行时校验（如 Zod 或 Valibot），会带来体积开销与 CPU 计算损耗。开发团队必须在“仅类型标注（零开销、低安全）”与“全链路运行时验证（高安全性、有计算开销）”之间做平衡，通常仅对核心边界（如 HTTP 网关、缓存加载、用户交互输入）做拦截。
3. 大厂追问：在极高性能要求的场景下（如海量数据实时表格渲染），如何进行高效的运行时校验？可以采用渐进式校验（只验证核心字段）、利用条件编译剔除测试环境校验、或者基于 Rust 编写的 WASM 校验器来优化 Zod 带来的 JS 运行时解析开销。`),
        single('satisfies 相比 as 的优势是？', ['检查约束且保留精确推导', '跳过类型检查', '自动生成接口', '提升运行时性能'], 0, `💡 它解决了什么问题：
如果使用传统的 as 类型断言（Type Assertion），容易诱导编译器忽略实际的结构缺失，掩盖潜在的代码 Bug（即 Downcasting 的安全隐患）；而使用冒号显式类型注解，则会“擦除”字面量的具体精度，丢失其字面量类型的特异性，导致后续链式调用或属性读取时类型被强行拓宽（Widen）。

🔍 核心原理解析（防拷打）：
1. satisfies 是 TS 4.9 引入的关键字，其工作原理是“在不改变表达式推导类型的前提下，验证表达式是否符合给定的类型约束”。它使得变量能保留其最窄的字面量类型（Narrowest Type），同时不丧失类型的安全性。
2. 在工程取舍上，satisfies 用作“局部类型安全锁”，而冒号常用作“面向接口的强制规约”。在设计具有复杂结构且需要推导字面量的配置项（如主题变量、配置路由图）时，satisfies 能够完美替代 as const as T 等繁琐写法。
3. 大厂追问：如何区分使用 as const satisfies T 与单纯的 satisfies T？as const 会将整个表达式推导为 readonly 且为字面量值，而 satisfies T 保证类型能满足结构契约的前提下，支持属性的重新赋值与推导。`),
        multiple('类型检查变慢可排查？', ['深递归条件类型', '巨大 tsconfig', 'project references 是否缺失', '图片宽高'], [0, 1, 2], `💡 它解决了什么问题：
如果 Monorepo 仓库或巨型应用的 TS 编译与编辑器响应速度极慢（例如修改一行代码 TS 检查要卡 10 秒），会极大损害研发的反馈循环（Feedback Loop），降低开发效能，甚至导致 CI 部署时间成倍增加。

🔍 核心原理解析（防拷打）：
1. TS 编译器的主要性能杀手在于深递归类型计算（Deep Recursive Conditional Types）和联合类型过度实例化（Union Types Explosion）。当遇到巨型 tsconfig 或全量扫描 node_modules 时，编译器在内存中生成的 AST 会急剧膨胀，GC 回收频繁。
2. 工程取舍上，通过启用 Project References（项目引用），可以将巨型仓库拆分为多个独立编译的子工程，实现增量编译与缓存共享。虽然这会带来工程配置上的心智负担（多份 tsconfig，输出声明文件），但换取了数量级的编译速度提升。
3. 大厂追问：如何诊断巨型 TS 项目的编译瓶颈？可以使用 tsc --extendedDiagnostics 或 --generateTrace 导出编译 Trace JSON，然后利用 Chrome DevTools 对解析器（Parser）、检查器（Checker）和绑定器（Binder）的 CPU 占用进行可视化火焰图分析。`),
        single('外部不可信数据进入系统前应做什么？', ['运行时 schema 校验', '直接 as 成业务类型', '只改变量名', '忽略错误'], 0, `💡 它解决了什么问题：
如果从外部网络（API）、跨进程通信（postMessage）、或者本地存储（localStorage）读取的数据，未经任何验证就直接“信任”并传递给深层业务组件，一旦其数据结构发生偏离，将导致整个应用在不可预知的时机崩溃，极难复现和定位。

🔍 核心原理解析（防拷打）：
1. 核心原理解析是：在架构边界处设立 Guard/Gateway（守卫/网关）模式，将“非安全域”和“安全域”彻底隔离。利用基于 Schema 的解析库（如 Zod / Runtypes）执行运行时类型推导与强校验，将外部脏数据在入口处抛出，阻断污染向核心业务域扩散。
2. 工程取舍上，运行时校验会引入包体积（Zod 压缩后约 10-15KB）和数据解析耗时。因此，在开发环境中通常开启全量字段强校验，而在生产环境可以结合过滤策略，只对具有破坏性变更风险的契约字段进行局部校验。
3. 大厂追问：当 API 契约和 TS Interface 频繁变化时，如何避免手动编写 Zod Schema 导致的双重维护成本？可利用 ts-to-zod 等工具从 TS 类型自动生成 Schema 校验器，或者利用 OpenAPI 规范（Swagger）一键生成 TS 定义与校验脚本，维护单一事实源（Single Source of Truth）。`),
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
        single('Monorepo 的核心不是？', ['把多个项目简单塞进一个仓库', '统一依赖图', '增量构建', '版本治理'], 0, `💡 它解决了什么问题：
如果不推行规范的 Monorepo 管理，而只是将多个项目生硬地归档在同一个 Git 仓（即 Multi-repo 拼盘），会导致依赖关系错乱、本地联调困难、重复安装冗余包、CI/CD 慢如乌龟，且失去多包独立发布和公共逻辑复用的工程能力。

🔍 核心原理解析（防拷打）：
1. Monorepo 架构的核心是依赖拓扑图（Dependency Graph）和任务管道编排（Task Pipeline）。包管理器（如 pnpm）通过 Workspace 符号链接（Symlinks）构建全局唯一的拓扑依赖网，从而消除幽灵依赖并实现本地秒级联调。
2. 工程取舍上，Monorepo 极大降低了内部多团队的共享协作与代码联调成本，但其代价是 Git 仓库体积膨胀较快，且在分支隔离与开发人员权限细粒度控制上具有更高的系统配置难度。
3. 大厂追问：如何防范 Monorepo 引起的“依赖无限升级风暴”（某一底层通用包发布破坏性变更导致全局消费包链式损坏）？可引入严格的依赖发布规范，如锁定内部包版本、使用 peerDependencies 声明框架契约，并通过包隔离与自动化测试（Matrix Tests）来防止破坏性修改扩散。`),
        multiple('Monorepo CI 提速常用手段包括？', ['affected 分析', '远程缓存', '任务依赖图', '每次全量构建所有包'], [0, 1, 2], `💡 它解决了什么问题：
如果不采取提速手段，Monorepo 下的大型复杂应用在每次提交时都会面临超长的构建排队。一个项目有 20 个 package 时，全量构建可能消耗数十分钟，这会严重阻塞日常发版进度，甚至耗尽 CI 机器的计算资源。

🔍 核心原理解析（防拷打）：
1. 核心提速原理由三部分组成：拓扑排序（Topological Sorting）任务编排、变更影响树计算（Affected Analysis）、以及产物缓存（Caching/Remote Cache）。工具（如 Turborepo/Nx）通过计算文件 Hash、依赖锁文件、环境变量等生成 Cache Key，并基于 Git Diff 仅执行相关分支的任务。
2. 在工程取舍上，远程缓存的复用存在“安全性风险”（若缓存的 Key 计算不当，可能将坏的构建结果共享给团队其他成员）。因此，在接入 Turborepo Remote Caching 时，必须极力规范 Inputs 和 Outputs 的声明，杜绝未声明的全局环境变量污染 Key。
3. 大厂追问：在远程 CI 节点上，如果因网络拥堵导致拉取缓存（Restore Cache）的时间甚至超过了本地直接构建的时间，该如何调优？可以通过限制缓存粒度、只缓存编译时间超长的重型模块、或在 CI 流程中引入局域网级的高速缓存代理（如私有存储桶 S3）来缩短传输链路。`),
        judgment('没有包边界约束的 Monorepo 很容易变成大泥球。', 0, `💡 它解决了什么问题：
当缺乏严格的包边界约束时，开发人员可能会随意跨层引用（例如业务 app 越权直接引用底层的未公开 package，或者 package 之间循环依赖）。久而久之，Monorepo 会退化为一个庞大、无法解耦且剪不断理还乱的“单体大泥球”。

🔍 核心原理解析（防拷打）：
1. 包边界约束通常通过静态 lint 规则（如 ESLint 结合 eslint-plugin-import、dependency-cruiser 或 Nx 提供的 @nx/enforce-module-boundaries）在 AST 解析阶段拦截。核心机制是基于路径标签（Tags）建立依赖准入规则（比如禁止 Shared/UI 依赖 Apps/Console）。
2. 工程取舍上，强加约束会使开发阶段抛出更多的 lint 错误，要求开发人员规范地暴露 API（通过 package.json 的 exports 导出）以及进行架构分层。这虽然降低了短期的发版灵活性，但极大保护了软件的高内聚低耦合特征。
3. 大厂追问：如何检测和处理 Monorepo 内部包与包之间的循环依赖（Circular Dependencies）？这需要借助 madge 或 dependency-cruiser 在 CI 流程中生成依赖拓扑图，一旦检测到有回路生成，立即阻断并强制重构，将共用部分下沉到更低阶的共享包。`),
        single('task pipeline 中 ^build 表达的通常是？', ['先构建依赖包', '删除依赖包', '跳过测试', '只构建当前 README'], 0, `💡 它解决了什么问题：
在复杂的 Workspace 体系中，消费包（如 App）依赖了工具包（如 UI Component）。如果直接启动 App 的构建而没有优先构建 UI 包，会导致 App 编译因找不到依赖的 dist 目录或声明文件（.d.ts）而直接失败，引发构建顺序的失控。

🔍 核心原理解析（防拷打）：
1. ^build 语法（以 Turborepo 为例）表达的是拓扑依赖任务编排。^ 代表“当前 package 拓扑上游的所有直接/间接依赖包（Dependencies）”。因此，任务引擎会先递归遍历依赖树，依次执行叶子节点包的 build，最后合并执行根节点的 build。
2. 工程取舍上，同步的拓扑构建会增加初始构建的时间。因此，像 Turborepo 会采用“流水线并行化（Task Pipelines Parallelization）”——如果 UI 的 TypeScript 类型定义提取完成，即使其完全打包尚未结束，App 的类型检查便可提前并发运行。
3. 大厂追问：在 monorepo 极其庞大时，拓扑排序的极深层遍历可能引发任务调度延迟，如何防范？可通过减少不必要的跨包耦合、使用不需要预编译的 TypeScript 源码引用方案（如 tsconfig paths 或 Vite 的直接源码联调模式）来绕过前置 build，缩短冷启动时间。`),
        multiple('缓存不命中可检查？', ['outputs 配置', '环境变量', 'lockfile', '组件颜色'], [0, 1, 2], `💡 它解决了什么问题：
如果构建工具的缓存策略设置不当，可能导致“该重新编译时命中了旧缓存（造成脏包）”，或者“代码没变却总是缓存失效（白白消耗 CI 资源）”。这解决的是编译产物的一致性与高频 CI 执行效率 of 冲突。

🔍 核心原理解析（防拷打）：
1. 缓存匹配机制是基于输入（Inputs）计算 Hash。一个任务的 Input 包括：指定的源文件（glob）、引用的外部依赖（lockfile）、运行时的环境变量（env）、以及声明 of 输出目录（outputs）。任何一个微小的变动都会打破哈希匹配。
2. 工程取舍上，缓存机制需要确保“绝对的安全（不能漏算变更）”和“高度的效能（不能误算无变更）”。为此，必须在配置文件中极为细致地拆分“开发/生产”环境变量，避免将不断变化的时间戳或随机数当做 input 引入。
3. 大厂追问：如何应对含有“不确定性”代码（例如编译时注入 process.env.BUILD_TIME）的 package 缓存配置？应当将此类动态值抽离为单独的全局注入配置，或者在 Turborepo 配置文件中明确声明排除该环境变量，从而保障核心编译逻辑的缓存复用。`),
        single('Changesets 常用于？', ['多包版本和发布管理', '浏览器渲染', '网络代理', '图片裁剪'], 0, `💡 它解决了什么问题：
在 Monorepo 中，如果有数十个相互依赖的包同时发生变更，手动去逐个修改 package.json 的版本号、更新各自的 CHANGELOG.md、并安排先后顺序发布到 npm，不仅极易出错（例如版本号冲突或漏发），更难以进行规范的团队协作。

🔍 核心原理解析（防拷打）：
1. Changesets 的核心工作流是：在开发者提交 PR 时，通过 CLI 引导生成一个包含变更类型（major/minor/patch）和描述的 markdown 临时文件（即 changeset）。CI 会在合并后，消费这些文件并自动计算出依赖图的最佳版本升级路线，统一输出 CHANGELOG。
2. 工程取舍上，Changesets 相比传统自动基于 Git Commit（例如 Semantic Release）更加灵活，它支持交互式的手动确认，但代价是要求团队在每个 PR 提交前均要配合运行 pnpm changeset 命令行工具。
3. 大厂追问：如果 Monorepo 包含一些不对外发布的私有应用（Apps），而只期望发布基础包（Packages），Changesets 是如何防止误发的？需要在对应私有 package.json 中声明 "private": true，并且可在 changesets 配置中将特定的 package 划分为“无发布包（ignored packages）”，确保不会产生 npm 泄密风险。`),
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
        single('微前端最核心解决的问题是？', ['多团队巨型应用的独立开发部署运行', '让页面更花哨', '替代所有后端接口', '减少所有测试'], 0, `💡 它解决了什么问题：
如果不引入微前端，在多团队协作巨型单体前端应用时，极易面临技术栈锁死（无法升级新框架）、编译打包耗时突破天际、发布节奏强绑定（一个团队的代码出 Bug 会导致全局发版被扣留）、以及开发环境极其卡顿的严重痛点。

🔍 核心原理解析（防拷打）：
1. 微前端从根本上是一种解耦运行时的应用拆分架构，它在“组织管理”与“运行时自治”之间进行重构。基于路由分发与动态模块加载器（如 SystemJS 或 Webpack Module Federation），将大型应用解构为独立生命周期、独立构建发布的微应用集合。
2. 工程取舍上，微前端是用“运行时复杂度、体积冗余和加载延迟”换取“团队独立性与研发吞吐量”。如果团队规模小、发布简单，强行引入微前端反而会因为沙箱性能损耗、共享依赖冲突而得不偿失。
3. 大厂追问：如何避免微前端架构的“服务化陷阱”，即多个微应用之间因为频繁共享全局状态（如 Redux）和深度 API 调用，导致解耦失败并面临“分布式单体”的灾难？应该推行“无共享”架构，微应用之间通过声明式的路由参数（Query/Path）进行通信，或者通过标准的 CustomEvent 建立只传递原始值的事件总线，保持单向解耦。`),
        multiple('微前端需要治理哪些边界？', ['路由', '样式', '共享依赖', '跨应用通信'], [0, 1, 2, 3], `💡 它解决了什么问题：
微前端如果不做边界治理，子应用会污染全局 window、重写全局事件监听器、用全局 CSS 覆盖主应用的样式、或者因各个子应用打包相同的 react/vue 产生资源浪费，造成最终集成在同一个浏览器沙盒时出现莫名其妙的样式坍塌与崩溃。

🔍 核心原理解析（防拷打）：
1. 核心治理机制包含：JS 隔离（利用 Proxy 拦截 window 读写，形成 ProxySandbox，或使用 iframe 等原生沙盒）、样式隔离（借助 Shadow DOM、CSS Scoped/Modules 或前缀类名命名空间）、以及运行时模块联调（Module Federation 共享公共库）。
2. 工程取舍上，Shadow DOM 样式隔离最为彻底，但在实际工程中，它会导致子应用内无法正常弹出 Modal（因 Portal 会插入到 Shadow DOM 外部），需要框架层做适配转换；而 CSS Scoped 则依赖构建规范，无法应对运行时的第三方 UI 库注入。
3. 大厂追问：在 ProxySandbox 隔离机制下，如果有第三方 SDK 在全局挂载了不可配置的只读属性（Non-configurable），会导致 Proxy set操作报错崩溃，如何兼容？需要预先在沙箱中设立“白名单过滤（Excludes）”或“逃逸通道（Escape Hatch）”，针对特定全局属性直接路由到真实宿主 window。`),
        judgment('微前端适合所有前端项目，越早引入越好。', 1, `💡 它解决了什么问题：
如果无视项目体量、盲目过早引入微前端，会导致项目的构建流水线、本地测试链、路由维护成本成倍剧增。这解决的是在系统发展的不同生命周期中，过度架构设计（Over-engineering）与业务实际复杂度之间的矛盾。

🔍 核心原理解析（防拷打）：
1. 微前端是系统复杂度和团队规模膨胀到一定阶段的“妥协产物”。其核心价值在于降低巨型组织的沟通与协同阻力，它并不是用来解决单一应用本身的架构问题的，而是用来拆分组织边界。
2. 工程取舍上，宁可先使用“Monorepo + 多路由微单体（Multi-page App）”或“运行时多入口”方案进行低成本拆分，直到面临真正的多团队多技术栈并行且无法合流时，才考虑引入完整的微前端沙箱机制。
3. 大厂追问：面对已经引入微前端但由于组织架构重组需要重新合并为单体的项目，应如何进行优雅降级和回滚？可以在构建层通过 Module Federation 的配置调整，将各 Remote 模块动态加载切换回本地打包（或使用 MonoRepo 的 Workspaces 直接引入源码），逐步收拢运行时路由。`),
        single('子应用资源加载 404 最常见检查项是？', ['publicPath 或资源基础路径', '按钮圆角', '数据库索引', '字体名称'], 0, `💡 它解决了什么问题：
微前端子应用通常独立部署在不同的 CDN 或服务器域名下，如果未正确配置基础路径，主应用在运行时通过 fetch/XHR 动态加载子应用资源（JS/CSS/Image）时，会拼错 URL，引发 404 错误，导致子应用白屏崩溃。

🔍 核心原理解析（防拷打）：
1. 核心原理在于浏览器环境中的资源解析上下文（Resource Context）。当主应用加载子应用时，所有图片的相对路径或动态 import 的路径，都会默认以主应用的 Location（主域名）为基准进行拼接。因此，必须在构建时或运行时强制重写子应用的 __webpack_public_path__（或 Vite 对应的 base path）为子应用自身的绝对 URL 域名。
2. 在工程取舍上，如果将 publicPath 强行写死为绝对域名，会导致多环境（开发/测试/生产）部署时构建产物无法复用。因此，通常采用“运行时动态注入 publicPath”的策略，在子应用入口执行第一行代码时，动态获取当前 JS 文件的加载源。
3. 大厂追问：在使用 Vite 作为构建工具的 ESM 子应用中，由于 Vite 缺乏像 Webpack 一样可以在运行时动态修改的全局 __webpack_public_path__，应如何治理资源 404？需利用 ESM 的 import.meta.url 特性，在运行时通过构建插件（如 @originjs/vite-plugin-federation）介入，动态重写 ES Module 的 base URL 解析规则。`),
        multiple('样式隔离可关注？', ['CSS Modules/Scoped CSS', 'Shadow DOM', '命名空间约束', '全局 reset 随意覆盖'], [0, 1, 2], `💡 它解决了什么问题：
如果不做样式隔离，在微前端共存的环境中，子应用 B 可能会定义 .btn { color: red }，从而覆盖主应用或子应用 A 的相同类名样式，造成 UI 出现灾难性的坍塌、错位或不可控的主题污染。

🔍 核心原理解析（防拷打）：
1. 隔离原理解析：Shadow DOM 通过浏览器原生支持的 Encapsulation，把子应用节点封锁在独立的 Shadow Root 下，具有天然的样式物理墙；Scoped CSS/Modules 则是通过构建时在类名后添加唯一的 Hash 后缀进行隔离；命名空间（Prefixing）则通过 PostCSS 插件在编译期自动为所有选择器加上特定的前缀类名包裹。
2. 在工程取舍上，Shadow DOM 样式隔离最为彻底，但在实际工程中，它会导致子应用内无法正常弹出 Modal（因 Portal 会插入到 Shadow DOM 外部），需要框架层做适配转换；而 CSS Scoped/命名空间不需要侵入 DOM 结构，但若子应用使用了 !important 或者是直接修改 body 的全局样式，仍有可能击穿隔离带。
3. 大厂追问：如何优雅地隔离挂载在子应用外部（通常在 document.body 下）的 Portal 浮层样式？可以配置子应用所引用的 UI 库（如 Ant Design 的 ConfigProvider），强制为所有浮层包裹统一的 class 容器前缀，并利用 postcss 插件将对应的全局样式局部化（Localize）。`),
        single('跨应用通信设计原则是？', ['少而稳定，像 API 一样管理契约', '共享所有内部 store', '用任意全局变量', '每次随机事件名'], 0, `💡 它解决了什么问题：
如果微应用之间可以任意读取对方 decorate/Pinia 状态、直接调用对方的私有函数，微前端便失去了其团队自治的意义。任何一处的代码重构都会导致其他应用协同瘫痪，将开发调试成本推向灾难级。

🔍 核心原理解析（防拷打）：
1. 跨应用通信核心架构应当是事件驱动（Event-Driven）的发布订阅模式或声明式路由传递。应用之间不应共享引用类型的复杂对象，而是应当通过只读的、扁平序列化的 JSON Payload 做数据交换。这符合“高内聚、低耦合”的微服务设计规范。
2. 工程取舍上，直接挂载全局 EventBus 简单直接，但难以进行版本追踪和数据变更溯源。更好的做法是采用浏览器原生的 CustomEvent 作为底层通路，同时在应用接入层设计严格的 API TypeScript Schema，在编译期约束通信报文。
3. 大厂追问：当在微前端环境下需要同步大规模全局状态（例如当前用户的组织架构树、全局系统配置）时，如果事件总线导致高频重绘，该如何治理？应当推行“拉取式数据流（Pull-based Data Flow）”，主应用只发布一个“版本标识变更”的轻量通知，具体的繁重数据由子应用通过自身的请求缓存（SWR / React Query）在需要时就近拉取。`),
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
      references: [
        { title: 'SemVer 官方规范（中文）', url: 'https://semver.org/lang/zh-CN/' },
        { title: 'TypeScript Declaration Files', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html' },
        { title: 'WAI-ARIA Authoring Practices', url: 'https://www.w3.org/WAI/ARIA/apg/' },
        { title: 'Playwright：视觉对比测试', url: 'https://playwright.dev/docs/screenshots' },
      ],
      quiz: [
        single('组件库公开契约不包括以下哪种？', ['完全私有且未暴露的内部变量名', '组件 props', '导出路径', '主题 token'], 0, `💡 它解决了什么问题：
如果组件库的升级肆意修改公开行为（如重命名 API、擅自改动 CSS Class 层次结构、或者更改导出的 TS 类型），会导致消费方（业务系统）每次升级组件库都会面临大面积的编译报错或样式失控，阻碍底层设施的平滑升级与架构治理。

🔍 核心原理解析（防拷打）：
1. 组件库的公开契约包含：组件属性（Props）、TS 类型签名（TypeScript declaration）、可感知的样式变量（CSS Variables/Theme Tokens）、DOM 类名结构、以及可访问性语义（WAI-ARIA）。根据 Semantic Versioning（语义化版本）规范，任何这些契约的非向下兼容修改，都必须作为 Major 主版本号升级。
2. 工程取舍上，为了确保内部重构的自由度，组件库设计者应当通过 export 限制导出边界，只暴露明确要维护的接口，隐式内部实现（如私有 CSS 变量、内层 DOM 嵌套）不应当作为契约向外承诺，防止“过度承诺导致尾大不掉”。
3. 大厂追问：当消费方业务利用 querySelector 强行绑定了组件库内部未公开的 CSS 类名（如 .ant-btn-circle），在组件库重构后发生样式破裂，架构师该如何划定责任并规避？应当在组件开发规范中明文规定“仅允许自定义 className 或指定公开的主题 Token 进行微调”，并可以通过在测试环境使用随机混淆的类名（类似于 CSS Modules）来断绝业务方乱引私有类名的后路。`),
        multiple('组件库升级验证可包括？', ['类型测试', '视觉回归', '业务 fixture', 'E2E'], [0, 1, 2, 3], `💡 它解决了什么问题：
组件库迭代时，仅凭开发者的手动回归，很容易漏掉某个冷门属性在特定状态下的布局崩塌，或是因为修改了泛型定义导致消费方的 TS 项目无法编译通过。它解决的是在海量消费场景中“如何零漏网之鱼地验证组件健壮性”的工程痛点。

🔍 核心原理解析（防拷打）：
1. 验证矩阵包含：视觉回归测试（Visual Regression Testing）（利用 Puppeteer/Playwright 截图与像素比对，捕获微小的样式偏移）、类型测试（使用 tsd 或 dtslint 校验类型定义的向后兼容）、以及业务 Fixture 模拟（构建典型业务用例，模拟老版本 API 升级）。
2. 在工程取舍上，全量的 UI 自动化验证极其消耗 CI 时间，且视觉回归测试经常因为系统渲染字体（Anti-aliasing）微小差异产生假阳性（False Positives）。因此，通常需要规范测试环境（统一用 Linux Docker 执行截图）并允许一定的像素容差（Threshold）。
3. 大厂追问：在组件库更新频繁时，如何在大大规模业务群中执行“暗度陈仓式”的 Canary 发布以验证兼容性？可以在 CI 中将新包发布为带 tag 的预发版（如 beta 或者是 canary），并编写自动化脚本在影子仓库（Shadow Repos）中拉取业务的代表性子仓，将其依赖一键替换并运行该业务的原本单元测试，确认不破裂后再推送到主站。`),
        judgment('组件库的 ARIA 和键盘交互也属于用户可感知契约。', 0, `💡 它解决了什么问题：
如果组件库在重构时随意丢弃了 aria-expanded、role="dialog" 或者是键盘 Tab/Enter 的聚焦处理，虽然视觉上完全看不出变化，但会导致屏幕阅读器等辅助技术用户完全无法使用该组件，或者导致基于 ARIA 语义进行定位的端到端自动化测试用例（如 Testing Library 查找按钮）大面积报错瘫痪。

🔍 核心原理解析（防拷打）：
1. ARIA (Accessible Rich Internet Applications) 和键盘交互契约构成了组件的隐性行为契约（Behavioral Contract）。它们在浏览器的 AOM（Accessibility Object Model）中注册，并为辅助工具（Screen Readers）提供可信赖的语义映射，其变更会直接引发交互语义断裂。
2. 工程取舍上，适配完善 of ARIA（如规范处理 Dialog 的焦点捕获 Focus Trap）会带来开发成本的上升，并要求设计复杂的测试断言。然而，它是现代一流组件库从“能用”跃迁到“专业”的必经之路，能保障产品在国际化法规合规与自动化测试中的高稳定性。
3. 大厂追问：如何在 CI 中自动化测试组件库的可访问性契约？可接入开源检测工具（如 axe-core 或者是 eslint-plugin-jsx-a11y 插件）进行静态代码扫描，并结合 Playwright 进行自动化键盘焦点流转（Focus Traversal）断言测试。`),
        single('删除高频 API 前更合理的做法是？', ['弃用提示、迁移指南、major 版本移除', '静默删除', '不发 changelog', '让业务自己猜'], 0, `💡 它解决了什么问题：
如果组件库在 minor 或 patch 版本中静默删除或重命名了某些常用 API，会导致上游业务在日常更新依赖时突然面临应用崩溃，极大地阻碍业务方的技术升级动力，造成业务方为了“保平安”而将组件库版本锁死在历史陈旧版本中。

🔍 核心原理解析（防拷打）：
1. 核心原理解析是：执行渐进式废弃（Graceful Deprecation）策略。首先利用 @deprecated JSDoc 注解提供编辑器级的置灰与波浪线警示，同时在运行时对使用弃用 API 的入口打印有指向性文档的 console 提示，给开发者预留足够的缓冲期，最后在下一个主版本（Major Version）中实施彻底删除。
2. 工程取舍上，保留废弃 API 会在一定时间内让组件库的内部代码库留存冗余的“兼容垫片（Polyfills/Wrappers）”，增大代码复杂度。但这一代价对于维护上下游良好的生态一致性，换取业务平滑升级至关重要。
3. 大厂追问：如果业务有数千个地方使用了老版 API，如何防范“开发人员手动改到崩溃”的情况？组件库团队应配套输出基于 AST 解析和转换的 Codemod 自动化迁移工具（例如基于 jscodeshift 编写的脚本），让业务开发只需执行一行 CLI 命令，即可自动重构并升级所有破裂的 API。`),
        multiple('业务依赖私有 DOM 结构可能导致？', ['升级后样式失效', '测试选择器失效', '埋点失效', '接口自动加速'], [0, 1, 2], `💡 它解决了什么问题：
业务开发为了强行定制某些微小的视觉样式，常常使用深入组件底层的 DOM 选择器（例如 .dialog-container > div:nth-child(2) > span）。一旦组件库由于重构改变了 HTML 的层级（比如加了一个包裹层），就会导致业务样式失效、甚至导致基于 DOM 结构触发的自动化测试选择器和数据埋点统计点瞬间失灵。

🔍 核心原理解析（防拷打）：
1. 监听私有结构是典型的隐式依赖耦合破裂（Implicit Coupling Failure）。在组件库架构设计中，外层 DOM 结构、类名（Class Name）和 DOM 树的父子层级关系通常是内部实现的黑盒，不承诺稳定。业务直接将其与局部样式强绑定，违背了软件工程中“面向接口编程而非面向实现”的基本隔离规范。
2. 工程取舍上，如果将 DOM 结构全部锁定不准变更，组件库将无法引入 Flex/Grid 升级或新布局重构。正确的架构设计是：在组件库层提供丰富的 Props（如 styles / classNames 对应子节点插槽），并在业务层改用 data 属性（如 data-testid）或稳定的公开 Class 做埋点和测试选择。
3. 大厂追问：如何有效阻止业务团队在样式中书写深度穿透的选择器（如 /deep/ 或者是 ::v-deep）去定制私有 DOM 结构？可以通过制定严格的 Stylelint 规则，在 CI/CD 中阻断带有深层私有类名拼接的样式提交，同时设计组件的 Design Token 和主题机制，主动且受控地释放样式定制能力。`),
        single('codemod 的主要用途是？', ['自动迁移大规模 API 使用', '压缩图片', '管理 Cookie', '提高 DNS 速度'], 0, `💡 它解决了什么问题：
当面临重大的 API 重构（如 API 参数结构从扁平变为扁平外包裹对象）时，如果要求数百个业务模块的开发者手动查找、修改并重构代码，不仅效率极低，还极易引入手误 Bug。它解决了超大型应用在架构升级过程中所面临的“人力劳动瓶颈”。

🔍 核心原理解析（防拷打）：
1. Codemod 工作的技术栈通常是基于 AST（抽象语法树）重构。它使用解析器（如 recast/babel）将业务 JS/TS 源码转换为 AST，利用规则遍历匹配到旧的 API 调用模式，然后在 AST 级别进行节点修改、重命名或重组，最后重新输出为格式化后的源码，实现了“可编程的代码重构”。
2. 工程取舍上，开发 Codemod 脚本需要针对多种代码写法（如解构赋值、变量重命名、别名导入）编写复杂的 AST 转换逻辑，前期开发成本较高。只有当影响的业务线多、重写工作量庞大时，Codemod 才能取得最佳的 ROI（投资回报率）。
3. 大厂追问：如何测试和确保 Codemod 脚本在大规模、格式各异的业务代码上执行后，不会生成语法错乱的代码（如括号缺失、缩进错乱）？应当引入全面的 Fixture 单元测试（测试输入代码片段与转换后的预期输出代码），并且在执行转换时使用如 prettier 进行一次全局格式化，同时强烈建议消费方在干净的 Git 工作区运行，并结合本地单元测试运行结果进行核验。`),
      ],
    }),
  ],
};
