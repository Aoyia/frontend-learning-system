import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const STATE_DATA_CONTENT = {
  id: 'state-data-longform',
  name: '深度长文：状态与数据层',
  icon: '🗃️',
  desc: '补齐技术破冰待补的状态管理与数据层架构，覆盖 Server State、缓存一致性和复杂表单。',
  sourceCards: ['工程化主干待补：状态管理与数据层', 'REST 与接口设计', 'TypeScript 进阶'],
  docs: [
    makeLongformDoc({
      title: 'Server State vs Client State：状态管理不是都塞进 Store',
      sourceCards: ['工程化主干待补：状态管理与数据层'],
      problem: '它解决的是团队把所有状态都放进全局 store 的问题。Server State 来自服务端，关心缓存、同步、失效、重试和并发；Client State 属于浏览器本地交互，关心 UI 状态、草稿、弹窗、选中项和临时配置。',
      customerCase: '客户列表页把接口数据复制到 Redux，再手写 loading、error、分页、重试和刷新逻辑。多标签页切换后数据过期，保存后列表不刷新。改用请求缓存层管理 Server State，全局 store 只保留真正跨页面的客户端状态。',
      flow: [
        '先判断状态来源：服务端、URL、表单、本地 UI、浏览器存储。',
        'Server State 交给请求缓存层管理。',
        'Client State 根据作用域放在组件、本地 store 或 URL。',
        '跨页面可分享状态优先考虑 URL。',
        '服务端数据变更后通过失效、更新缓存或重新拉取保持一致。',
        '避免把服务端响应无脑复制进全局 store。',
      ],
      keywords: [
        { term: 'Server State', desc: '来自服务端、会过期、需要同步的数据。' },
        { term: 'Client State', desc: '浏览器本地 UI 和交互状态。' },
        { term: 'cache invalidation', desc: '数据变化后让缓存失效或更新。' },
        { term: 'stale time', desc: '数据被视为新鲜的时间窗口。' },
        { term: 'URL state', desc: '用查询参数表达可分享、可回放的页面状态。' },
        { term: 'derived state', desc: '可由其他状态计算出的状态，不应重复存储。' },
      ],
      interview: '状态架构第一步是分类：服务端数据用请求缓存层处理缓存、重试、失效和同步；客户端 UI 状态按作用域放组件、URL 或轻量 store；不要把所有状态都塞进全局 store。',
      demo: `状态分类示例：

\`\`\`txt
商品列表数据
→ Server State

筛选条件 ?category=book&page=2
→ URL State

弹窗是否打开
→ Local UI State

购物车数量
→ Server State 或跨端同步状态
\`\`\`

分类清楚后，工具选择才有意义。`,
      diagnosis: [
        '全局 store 臃肿时，先标记哪些其实是 Server State。',
        '保存后列表不刷新时，检查 mutation 后是否失效相关查询。',
        '刷新页面状态丢失时，检查是否应进入 URL。',
        '重复状态不一致时，检查是否存了 derived state。',
        '页面到处 refetch 时，检查 stale time 和缓存 key。',
        '跨标签页不一致时，检查服务端同步和本地缓存策略。',
      ],
      followups: [
        '为什么 Server State 不适合手写全套 loading/error/cache？',
        'URL state 适合哪些状态？',
        'derived state 为什么容易不一致？',
        '什么时候需要全局客户端 store？',
      ],
      deepDive: '必须深入。状态架构是复杂前端稳定性的核心。深入顺序是状态分类、请求缓存、URL state、局部状态、全局 store、数据一致性和离线能力。',
      references: ['TanStack Query Important Defaults', 'Redux Style Guide', 'React State 文档', 'React Router Search Params 文档'],
      quiz: [
        single('Server State 的关键特征是？', ['来自服务端且会过期需要同步', '只存在于按钮里', '永远不变', '不能缓存'], 0, 'Server State 需要缓存和同步策略。'),
        multiple('适合 URL state 的内容包括？', ['分页页码', '筛选条件', '搜索关键词', '弹窗内部 hover 状态'], [0, 1, 2], '可分享可回放状态适合 URL。'),
        judgment('所有接口数据都应该复制进全局 store。', 1, '接口数据更适合由 Server State 缓存层管理。'),
        single('derived state 的风险是？', ['和源状态重复存储后不一致', '不能显示 UI', '无法序列化 JSON', '会删除接口'], 0, '可计算状态重复存储容易漂移。'),
        multiple('Server State 工具通常处理？', ['缓存', '重试', '失效', '请求状态'], [0, 1, 2, 3], '这些是请求缓存层的价值。'),
        single('保存后列表未更新，优先检查？', ['mutation 后缓存失效或更新策略', '按钮是否圆角', 'HTML title', 'README'], 0, '数据变更后要同步相关缓存。'),
      ],
    }),
    makeLongformDoc({
      title: '请求缓存与一致性：列表、详情、编辑如何不互相打架',
      sourceCards: ['工程化主干待补：状态管理与数据层', 'REST 与接口设计'],
      problem: '它解决的是同一份服务端数据在多个页面和组件里展示不一致的问题。列表、详情、编辑、乐观更新、分页、筛选和并发请求都需要稳定的 query key、失效策略和错误回滚。',
      customerCase: '客户编辑用户资料后，详情页更新了，但列表仍显示旧名称。原因是详情和列表缓存 key 无关联，mutation 成功后只更新了详情，没有失效列表。用户以为保存失败。',
      flow: [
        '设计稳定 query key，包含资源、参数、分页和筛选。',
        '区分读取 query 和写入 mutation。',
        'mutation 成功后更新或失效相关 query。',
        '乐观更新必须有失败回滚。',
        '分页和无限滚动要管理游标、去重和顺序。',
        '并发请求要处理取消、过期响应和最后写入策略。',
      ],
      keywords: [
        { term: 'query key', desc: '请求缓存身份，决定数据复用和失效范围。' },
        { term: 'mutation', desc: '会改变服务端状态的写操作。' },
        { term: 'optimistic update', desc: '服务端确认前先更新 UI，失败时回滚。' },
        { term: 'invalidation', desc: '让相关缓存失效并重新获取。' },
        { term: 'pagination cursor', desc: '基于游标的分页位置标识。' },
        { term: 'race condition', desc: '并发请求返回顺序导致状态被旧结果覆盖。' },
      ],
      interview: '请求缓存一致性的核心是 query key 设计和 mutation 后的同步策略：哪些缓存要更新、哪些要失效、乐观更新如何回滚、并发请求如何取消或丢弃过期结果。',
      demo: `query key 设计：

\`\`\`ts
const userKeys = {
  all: ['users'],
  list: filters => ['users', 'list', filters],
  detail: id => ['users', 'detail', id]
}
\`\`\`

保存用户后，可以更新 detail，并失效 list，保证列表与详情最终一致。`,
      diagnosis: [
        '列表和详情不一致时，检查 mutation 后影响了哪些 query。',
        '缓存命中错数据时，检查 query key 是否包含筛选和分页参数。',
        '快速切换条件显示旧结果时，检查请求取消和过期响应丢弃。',
        '乐观更新后数据错乱时，检查失败回滚和服务端最终结果合并。',
        '无限滚动重复项时，检查游标和去重逻辑。',
        '缓存频繁刷新时，检查 stale time、refetchOnWindowFocus 和失效范围。',
      ],
      followups: [
        'query key 里为什么要包含筛选条件？',
        '乐观更新什么时候不适合？',
        '列表页和详情页一致性应该强一致还是最终一致？',
        '如何避免旧请求覆盖新请求？',
      ],
      deepDive: '值得深入。请求缓存是一切中后台、SaaS、CRM 和复杂业务系统的基础。深入顺序是 query key、mutation、失效、乐观更新、分页、并发和离线同步。',
      references: ['TanStack Query Query Keys', 'TanStack Query Invalidations from Mutations', 'TanStack Query Optimistic Updates', 'MDN AbortController'],
      quiz: [
        single('请求缓存身份主要由什么决定？', ['query key', '按钮名称', 'CSS 文件', 'Git 分支'], 0, 'query key 决定缓存复用和失效范围。'),
        multiple('mutation 成功后可做？', ['更新相关缓存', '失效相关 query', '重新拉取数据', '忽略所有缓存'], [0, 1, 2], '写操作后要同步读缓存。'),
        judgment('query key 不需要包含筛选条件，反正接口路径一样。', 1, '不同筛选条件对应不同数据。'),
        single('乐观更新必须配套什么？', ['失败回滚', '删除测试', '隐藏错误', '永久 loading'], 0, '乐观更新失败时要恢复。'),
        multiple('并发请求错乱可通过？', ['AbortController', '忽略过期响应', '稳定请求序列', '随机覆盖状态'], [0, 1, 2], '不能让旧响应覆盖新状态。'),
        single('列表详情不一致最常见原因是？', ['mutation 后未同步相关缓存', '字体太大', 'HTML 注释太多', '路由太短'], 0, '相关 query 需要更新或失效。'),
      ],
    }),
    makeLongformDoc({
      title: '复杂表单架构：字段很多时为什么不能只靠 useState',
      sourceCards: ['工程化主干待补：状态管理与数据层', 'TypeScript 进阶'],
      problem: '它解决的是复杂表单在字段多、联动多、校验多、草稿多时难以维护的问题。企业级表单要处理字段注册、校验时机、异步校验、脏状态、依赖联动、权限、草稿、提交幂等和错误回显。',
      customerCase: '客户 CRM 的客户资料表单有 80 个字段，开发用一个大 useState 管理全部值。每次输入都重渲染整页，联动校验互相覆盖，保存失败后错误定位困难。重构后按字段注册、schema 校验、分区渲染和脏字段提交处理。',
      flow: [
        '定义表单 schema：字段、类型、默认值、校验、权限、依赖。',
        '字段级注册和订阅，避免任意字段变化重渲染整表。',
        '区分即时校验、失焦校验、提交校验和服务端校验。',
        '处理联动字段和派生值，避免循环更新。',
        '记录 dirty/touched/errors/submitting 等元状态。',
        '提交时处理幂等、错误回显、草稿和离开确认。',
      ],
      keywords: [
        { term: 'field registry', desc: '字段注册机制，管理值、校验、错误和订阅。' },
        { term: 'schema validation', desc: '用 schema 描述字段形态和校验规则。' },
        { term: 'dirty', desc: '字段是否被用户修改。' },
        { term: 'touched', desc: '字段是否被访问或失焦。' },
        { term: 'async validation', desc: '需要请求服务端的校验，如用户名唯一性。' },
        { term: 'idempotent submit', desc: '提交接口具备幂等，避免重复创建或重复保存。' },
      ],
      interview: '复杂表单架构的核心是字段级状态和校验模型：用 schema 描述字段，用注册/订阅减少重渲染，分清校验时机，管理 dirty/touched/errors，并把提交幂等、服务端错误回显和草稿纳入设计。',
      demo: `字段状态模型：

\`\`\`ts
type FieldState<T> = {
  value: T
  defaultValue: T
  dirty: boolean
  touched: boolean
  error?: string
  validating: boolean
}
\`\`\`

复杂表单不要只存 values，还要存元状态，否则无法做错误定位、按钮状态、离开确认和增量提交。`,
      diagnosis: [
        '输入卡顿时检查是否整表重渲染。',
        '校验混乱时检查同步、异步、提交校验边界。',
        '联动字段错乱时检查依赖图是否循环。',
        '服务端错误无法定位时检查字段路径和错误结构。',
        '重复提交时检查按钮防重和服务端幂等。',
        '草稿覆盖正式数据时检查版本、时间戳和冲突策略。',
      ],
      followups: [
        '受控表单和非受控表单怎么取舍？',
        '为什么字段级订阅能提升性能？',
        '异步校验如何避免旧响应覆盖新输入？',
        '表单 schema 应该前后端共享吗？',
      ],
      deepDive: '值得深入。复杂表单是中后台和客户系统最高频的复杂 UI。深入顺序是字段模型、schema、订阅性能、异步校验、服务端错误、草稿和提交幂等。',
      references: ['React Hook Form 官方文档', 'Formik 官方文档', 'Zod 官方文档', 'React Input 文档'],
      quiz: [
        single('复杂表单不能只存 values 的原因是？', ['还需要 dirty/touched/errors 等元状态', 'values 不能序列化', 'React 不支持对象', '接口不能提交'], 0, '元状态支撑校验、错误和提交体验。'),
        multiple('复杂表单要处理？', ['字段校验', '异步校验', '联动依赖', '服务端错误回显'], [0, 1, 2, 3], '这些都是企业级表单常见需求。'),
        judgment('80 个字段每次输入都重渲染整页，通常不会有性能问题。', 1, '大表单整页重渲染容易卡顿。'),
        single('字段级订阅的价值是？', ['减少无关字段变化导致的重渲染', '删除接口', '替代鉴权', '压缩图片'], 0, '订阅粒度越小，渲染影响越可控。'),
        multiple('异步校验需要注意？', ['取消旧请求', '忽略过期响应', 'loading 状态', '永远同步阻塞输入'], [0, 1, 2], '不能让旧结果覆盖新输入。'),
        single('重复提交的根本防线是？', ['服务端幂等，前端防重只改善体验', '只禁用按钮即可', '隐藏提交按钮', '不返回结果'], 0, '前端防重不能替代服务端幂等。'),
      ],
    }),
  ],
};
