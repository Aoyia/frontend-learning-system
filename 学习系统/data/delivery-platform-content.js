import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const DELIVERY_PLATFORM_CONTENT = {
  id: 'delivery-platform',
  name: '深度长文：交付与平台',
  icon: '🚢',
  desc: '沿着 CI/CD、DevOps、发布策略、请求链路、REST、Docker 和 K8s 深入交付可靠性。',
  sourceCards: ['CI-CD', 'Jenkins', 'DevOps', '发布策略', '请求-响应全链路', 'REST 与接口设计', 'Docker 与容器化', 'K8s 与容器编排'],
  docs: [
    makeLongformDoc({
      title: 'CI/CD 质量门禁：流水线不是把命令串起来',
      sourceCards: ['CI-CD', 'Jenkins', 'DevOps'],
      problem: '它解决的是代码从提交到上线之间缺少自动质量保障的问题。中高级前端要把 CI/CD 看成风险控制系统：安装、lint、类型、测试、构建、制品、扫描、预览环境、审批和发布记录共同组成门禁。',
      customerCase: '客户项目每次上线都靠人工本地 build，某次开发漏提交 lockfile，线上出现依赖差异。建立 CI 后，frozen install、typecheck、测试和 build 在合并前阻断问题，发布产物也能追溯到 commit。',
      flow: [
        '代码提交触发 CI。',
        '固定环境安装依赖，确保可复现。',
        '运行 lint、typecheck、unit/component/E2E 等分层检查。',
        '构建生产产物并保存 artifact。',
        '对 artifact 做体积、漏洞、sourcemap、许可证等检查。',
        '通过审批和发布策略进入 CD，并记录版本与回滚点。',
      ],
      keywords: [
        { term: 'pipeline', desc: '由多个阶段和任务组成的自动化流程。' },
        { term: 'quality gate', desc: '阻断风险进入主干或生产环境的检查。' },
        { term: 'artifact', desc: '构建后可发布、可追溯的制品。' },
        { term: 'preview environment', desc: '每个 PR 或分支对应的临时预览环境。' },
        { term: 'credentials', desc: '流水线访问仓库、registry、云资源的敏感凭证。' },
        { term: 'DORA metrics', desc: '衡量交付效能的指标，如部署频率、变更失败率和恢复时间。' },
      ],
      interview: 'CI/CD 的价值不是自动执行命令，而是把质量检查、构建制品、权限凭证、发布审批、版本追踪和回滚点标准化，让每次变更都能被验证、发布和恢复。',
      demo: `最小前端质量门禁：

\`\`\`yaml
jobs:
  check:
    steps:
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: dist
\`\`\`

关键点是后续发布使用这份 artifact，而不是在发布阶段重新随机构建一次。`,
      diagnosis: [
        '流水线偶发失败时先区分代码问题、环境问题、网络问题和测试 flake。',
        '本地成功 CI 失败时检查 Node、包管理器、lockfile、环境变量。',
        '发布产物不可追溯时检查 artifact 和 release 记录。',
        '凭证泄漏风险时检查权限最小化、日志脱敏和有效期。',
        '测试很慢时按测试金字塔下沉，控制 E2E 数量。',
        '门禁过松时用线上事故倒推缺失检查。',
      ],
      followups: [
        '为什么发布应使用 CI artifact 而不是重新 build？',
        '质量门禁太严格影响效率怎么办？',
        'Jenkinsfile 里为什么不适合写复杂业务逻辑？',
        '流水线凭证如何做最小权限？',
      ],
      deepDive: '值得深入。CI/CD 是工程质量和交付效率的主干。深入顺序是 pipeline、artifact、质量门禁、缓存、凭证、安全扫描、预览环境和 DORA 指标。',
      references: ['GitHub Actions Workflow 文档', 'Jenkins Pipeline 文档', 'DORA Metrics 官方资料', 'OWASP CI/CD Security Cheat Sheet'],
      quiz: [
        single('CI/CD 质量门禁的核心价值是？', ['在合并或发布前自动发现风险', '替代所有代码评审', '让页面更好看', '删除测试'], 0, '门禁用于提前发现质量和交付风险。'),
        multiple('前端 CI 可包含？', ['frozen install', 'typecheck', 'test', 'build'], [0, 1, 2, 3], '这些是常见质量检查。'),
        judgment('发布阶段最好重新 build 一次，这样 artifact 是否可追溯无所谓。', 1, '应发布已验证 artifact，保证可追溯和一致。'),
        single('credentials 在流水线里应遵循什么原则？', ['最小权限和日志脱敏', '硬编码到仓库', '打印到日志方便排查', '长期不过期'], 0, '凭证必须安全治理。'),
        multiple('流水线 flake 可排查？', ['测试等待策略', '测试数据稳定性', '外部服务依赖', '代码缩进风格'], [0, 1, 2], 'flake（不稳定测试）的三大根源：① 时序问题——测试假设某操作立即完成，但实际存在异步延迟，需用 auto-waiting 或显式等待而非固定 sleep；② 测试数据污染——多测试共享数据库/状态导致互相干扰，需隔离或每次重置测试数据；③ 外部服务不稳定——依赖真实第三方 API 时网络抖动或限流导致偶发失败，应通过 Mock/Stub 消除不可控依赖。代码缩进风格与运行时行为无关，不会导致 flake。'),
        single('artifact 指什么？', ['构建后可发布可追溯的制品', '需求文档标题', '浏览器缓存', '开发者电脑'], 0, 'artifact 是发布一致性的关键。'),
      ],
    }),
    makeLongformDoc({
      title: '渐进式发布与回滚：上线如何快速止血',
      sourceCards: ['发布策略', 'DevOps', 'K8s 与容器编排'],
      problem: '它解决的是上线风险不可控的问题。发布不是把 dist 上传完，而是控制新版本暴露范围、监控健康指标、按策略放量，并在异常时快速暂停、降级或回滚。',
      customerCase: '一个新结算页只灰度 5% 用户，但错误率和支付转化异常。因为有灰度健康指标，系统自动暂停放量并回滚，事故没有扩散到全量用户。',
      flow: [
        '构建不可变 artifact，并记录版本。',
        '先部署到小流量或白名单人群。',
        '监控技术指标和业务指标。',
        '健康则按批次放量，不健康则暂停或回滚。',
        '回滚时确认 HTML、静态资源、接口兼容和缓存。',
        '事故后复盘门禁、监控和回滚速度。',
      ],
      keywords: [
        { term: 'canary', desc: '金丝雀发布，先让少量用户使用新版本。' },
        { term: 'blue-green', desc: '蓝绿发布，两套环境切换流量。' },
        { term: 'rolling update', desc: '滚动替换实例，常见于 K8s。' },
        { term: 'feature flag', desc: '用开关控制功能暴露范围。' },
        { term: 'SLI/SLO', desc: '服务健康指标和目标，用于判断是否继续放量。' },
        { term: 'rollback', desc: '回到上一个可用版本或关闭有问题能力。' },
      ],
      interview: '成熟发布是“渐进暴露 + 健康指标 + 自动止损 + 可回滚产物”的组合；前端还要额外处理 HTML 与 hash 资源缓存一致性、旧版本 chunk 保留和接口兼容。',
      demo: `前端发布顺序：

\`\`\`txt
上传 hash 静态资源
→ 保留旧版本资源
→ 切换 HTML 或路由配置
→ 小流量灰度
→ 观察白屏率、错误率、接口失败率、转化
→ 放量或回滚
\`\`\`

不要先删旧资源。旧 HTML 可能仍在用户浏览器或 CDN 中引用旧 chunk。`,
      diagnosis: [
        '灰度异常时先看新旧版本对照，而不是全站平均。',
        '白屏率升高时检查 JS 错误、chunk 404、资源缓存和 HTML 版本。',
        '业务指标下降时检查关键漏斗和接口错误。',
        '回滚失败时检查数据库/接口兼容、CDN 缓存和旧资源保留。',
        'Feature Flag 失控时检查 owner、过期时间和配置审计。',
        '事故复盘时关注为什么没提前发现和为什么止血慢。',
      ],
      followups: [
        '金丝雀、蓝绿、滚动发布怎么选？',
        '前端为什么需要保留历史静态资源？',
        'Feature Flag 和发布策略有什么区别？',
        '业务指标能不能作为自动回滚条件？',
      ],
      deepDive: '必须深入。发布是客户影响最大的工程环节。深入顺序是 artifact、灰度、Feature Flag、健康指标、CDN 缓存、回滚、事故复盘。',
      references: ['Kubernetes Deployment Rollout 文档', 'Google SRE SLI/SLO 资料', 'LaunchDarkly Feature Flag 资料', 'web.dev Cache 文档'],
      quiz: [
        single('渐进式发布的核心目的是什么？', ['控制故障暴露范围并快速止血', '让构建更慢', '删除监控', '绕过测试'], 0, '灰度和回滚用于控制客户影响。'),
        multiple('前端灰度健康指标可包含？', ['白屏率', 'JS 错误率', '接口失败率', '转化漏斗'], [0, 1, 2, 3], '技术和业务指标都重要。'),
        judgment('发布新版本前可以删除所有旧 hash 资源。', 1, '旧 HTML 可能仍引用旧资源，删除会导致 chunk 404。'),
        single('Feature Flag 最需要治理什么？', ['owner、生命周期和审计', '字体大小', '图片格式', '变量名长度'], 0, '长期无主开关会制造复杂度。'),
        multiple('回滚要考虑？', ['HTML', '静态资源', '接口兼容', 'CDN 缓存'], [0, 1, 2, 3], '回滚是全链路动作。'),
        single('灰度组错误率异常时第一优先级是？', ['暂停放量或回滚', '继续全量发布', '删除告警', '忽略样本'], 0, '先止血，再定位。'),
      ],
    }),
    makeLongformDoc({
      title: '请求链路定位：fetch 之后到底慢在哪里',
      sourceCards: ['请求-响应全链路', 'REST 与接口设计'],
      problem: '它解决的是前端只看到 fetch 两端，却不知道请求在 DNS、TCP、TLS、CDN、网关、BFF、服务、数据库和响应回传中哪一段慢或失败的问题。',
      customerCase: '客户说提交慢，后端日志显示 handler 只有 120ms。前端 Performance 里总耗时 3 秒，最终发现请求在网关排队和 TLS 重连上耗时巨大。单看后端 handler 会误判。',
      flow: [
        '浏览器解析 URL。',
        'DNS 查找 IP。',
        '建立 TCP 和 TLS 连接。',
        '发送 HTTP 请求到 CDN、网关或反向代理。',
        '进入 BFF 或后端 handler。',
        '访问数据库、缓存或外部服务。',
        '响应返回浏览器并被 JS 消费和渲染。',
      ],
      keywords: [
        { term: 'DNS', desc: '域名解析阶段。' },
        { term: 'TCP/TLS', desc: '连接和安全握手阶段。' },
        { term: 'gateway', desc: '网关层，可能做鉴权、限流、路由和日志。' },
        { term: 'BFF', desc: '面向前端体验的接口聚合层。' },
        { term: 'status code', desc: 'HTTP 状态码，用于表达结果类别。' },
        { term: 'trace id', desc: '跨前后端串联请求链路的标识。' },
      ],
      interview: '一次请求慢要拆链路：浏览器排队、DNS、TCP、TLS、请求发送、网关、BFF、后端、数据库、响应下载和前端处理都可能是瓶颈；只看 fetch 总耗时或后端 handler 日志都不够。',
      demo: `前端传递 Trace ID：

\`\`\`ts
const traceId = crypto.randomUUID()

await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-trace-id': traceId
  },
  body: JSON.stringify(payload)
})
\`\`\`

更标准的链路追踪会使用 W3C Trace Context 的 traceparent。关键是前端、BFF、后端日志能按同一个请求关联。`,
      diagnosis: [
        '先看 Network Timing，拆 DNS、连接、等待、下载。',
        '后端 handler 快但总耗时慢时，检查网关、排队、连接复用和网络。',
        '只有部分地域慢时，检查 CDN、DNS 和跨区链路。',
        '401/403 查登录态、权限、Cookie 和网关鉴权。',
        'CORS 问题查预检请求、Origin、credentials 和响应头。',
        '需要跨系统定位时用 trace id 串联前端、BFF、后端日志。',
      ],
      followups: [
        'Timing 面板里 Waiting/TTFB 高说明什么？',
        'CORS 预检为什么会让请求多一次？',
        'Trace ID 和业务埋点有什么区别？',
        '为什么接口快但页面仍然慢？',
      ],
      deepDive: '必须深入。请求链路是前端解决客户问题的基础。深入顺序是 HTTP、浏览器 Network Timing、CORS/Cookie、网关/BFF、Trace、缓存和接口设计。',
      references: ['MDN Fetch API', 'MDN Resource Timing API', 'W3C Trace Context', 'MDN HTTP Status Codes'],
      quiz: [
        single('后端 handler 日志 120ms，但用户等 3 秒，说明什么？', ['慢点可能在网关、网络或前端处理等其他阶段', '用户一定撒谎', '浏览器不能请求接口', 'CSS 有问题'], 0, '端到端耗时不等于后端 handler 耗时。'),
        multiple('请求链路可能经过？', ['DNS', 'TLS', '网关/BFF', '数据库或外部服务'], [0, 1, 2, 3], '这些都是常见链路环节。'),
        judgment('fetch 总耗时慢时，只看业务 handler 日志就足够定位。', 1, '还要看网络、网关、排队、下载和前端处理。'),
        single('Trace ID 的价值是？', ['跨系统关联同一次请求', '压缩 JS', '生成 CSS', '替代鉴权'], 0, 'Trace ID 帮助串联日志和链路。'),
        multiple('CORS 问题应检查？', ['Origin', '预检请求', 'credentials', '响应头'], [0, 1, 2, 3], 'CORS 由浏览器安全模型和服务端响应头共同决定。'),
        single('部分地域慢更可能优先看？', ['CDN、DNS 和跨区链路', '按钮组件', 'TypeScript 泛型', 'README'], 0, '地域差异常来自网络和边缘节点。'),
      ],
    }),
    makeLongformDoc({
      title: 'REST 契约演进：接口怎么改才不炸前端',
      sourceCards: ['REST 与接口设计', '请求-响应全链路'],
      problem: '它解决的是接口字段、错误结构、分页和版本策略随意变化导致前端大面积故障的问题。REST 不只是路径风格，它是把资源、方法、状态码、响应体、错误结构和版本演进变成稳定契约。',
      customerCase: '后端新增订单状态 REFUNDING，前端状态机没有默认分支，订单列表出现空白。接口没有破坏字段，但枚举扩展仍然破坏了前端假设。',
      flow: [
        '把 URL 设计成资源定位，而不是动词命令。',
        '用 HTTP method 表达操作语义。',
        '用 status code 表达结果类别。',
        '统一错误结构，便于客户端封装。',
        '列表分页、排序、筛选协议保持稳定。',
        '破坏性变更走版本、兼容期、迁移说明和消费方影响评估。',
      ],
      keywords: [
        { term: 'resource', desc: 'REST 中 URL 代表资源。' },
        { term: 'method semantics', desc: 'GET、POST、PUT、PATCH、DELETE 的操作语义。' },
        { term: 'status code', desc: '用协议层结果分类表达成功、客户端错误和服务端错误。' },
        { term: 'error shape', desc: '统一错误响应结构。' },
        { term: 'pagination', desc: '分页协议，可基于页码或游标。' },
        { term: 'versioning', desc: '接口版本化和兼容策略。' },
      ],
      interview: 'REST 契约的核心是用 URL 表达资源、method 表达操作、status code 表达结果、body 表达载荷，并配合统一错误结构、稳定分页协议和版本演进策略，避免接口变化靠口头同步。',
      demo: `统一错误结构：

\`\`\`json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "订单不存在",
    "requestId": "req_123"
  }
}
\`\`\`

不要所有失败都返回 200 + code。客户端需要通过 HTTP 状态码先判断结果类别，再读业务错误。`,
      diagnosis: [
        '字段缺失时检查是否是破坏性变更或可选字段未处理。',
        '枚举新增时检查前端是否有默认分支和监控。',
        '错误处理混乱时检查状态码和错误结构是否统一。',
        '分页错乱时检查游标、排序字段和数据一致性。',
        '缓存异常时检查 method 语义和 Cache-Control。',
        '版本升级时检查兼容期、迁移文档和消费方列表。',
      ],
      followups: [
        '为什么 200 + code 不是好的错误设计？',
        '游标分页和页码分页怎么取舍？',
        '新增字段和删除字段哪个更危险？',
        '枚举新增算不算兼容变更？',
      ],
      deepDive: '值得深入。接口契约是前后端协作最常见的故障源。深入顺序是 HTTP 语义、REST 资源建模、错误结构、分页、版本化、OpenAPI 和契约测试。',
      references: ['MDN HTTP Methods', 'MDN HTTP Status Codes', 'OpenAPI Specification', 'Microsoft REST API Guidelines'],
      quiz: [
        single('REST 中 URL 更应该表达什么？', ['资源', '随机动词', '按钮颜色', '组件名称'], 0, 'URL 应定位资源，method 表达动作。'),
        multiple('稳定接口契约应包含？', ['请求参数', '响应字段', '错误结构', '分页协议'], [0, 1, 2, 3], '这些都会影响前端消费。'),
        judgment('删除已有响应字段通常是安全兼容变更。', 1, '已有消费方可能依赖该字段。'),
        single('所有错误都返回 200 的问题是？', ['破坏 HTTP 结果语义，客户端封装困难', '让接口更安全', '提升 CDN 命中', '减少字段数量'], 0, '状态码应表达结果类别。'),
        multiple('枚举新增可能导致？', ['状态机遗漏', '文案缺失', '分支渲染异常', 'DNS 变慢'], [0, 1, 2], '前端需要处理未知枚举。'),
        single('破坏性接口变更应提供？', ['版本和迁移路径', '静默上线', '只口头通知', '不保留兼容期'], 0, '契约演进需要可控迁移。'),
      ],
    }),
    makeLongformDoc({
      title: '容器与 K8s 运行问题：前端服务为什么间歇 502',
      sourceCards: ['Docker 与容器化', 'K8s 与容器编排', 'DevOps'],
      problem: '它解决的是前端进入 BFF、SSR、Node 服务后，必须理解线上运行环境的问题。间歇 502、Pod 重启、滚动发布失败、探针误判、资源不足和配置差异，都不是只看页面代码能解决的。',
      customerCase: 'SSR 服务促销时大量 502。业务代码没报错，但 K8s 事件显示 Pod 因内存超限被 OOMKilled，readiness 还没就绪就接流量。修复需要资源配置、探针、缓存和扩容策略一起改。',
      flow: [
        '应用被构建成镜像。',
        'Deployment 声明期望副本数和更新策略。',
        'K8s 调度 Pod 到节点。',
        'readiness 决定 Pod 是否接流量。',
        'liveness 决定异常时是否重启。',
        'Service 和 Ingress 暴露访问入口。',
        '监控资源、重启、延迟和错误率，并支持滚动更新和回滚。',
      ],
      keywords: [
        { term: 'image', desc: '包含应用和运行依赖的可分发包。' },
        { term: 'container', desc: '镜像的运行实例。' },
        { term: 'Pod', desc: 'K8s 调度的基本单元。' },
        { term: 'readiness probe', desc: '判断实例是否可以接收流量。' },
        { term: 'liveness probe', desc: '判断实例是否需要重启。' },
        { term: 'requests/limits', desc: '资源申请和限制，影响调度与稳定性。' },
      ],
      interview: '当前端负责 BFF 或 SSR 时，必须理解容器和 K8s：镜像、Pod、Deployment、Service、Ingress、探针、资源限制和滚动发布共同决定服务是否稳定；502 要从网关、Pod 状态、探针、重启和资源指标排查。',
      demo: `最小 readiness/liveness 思路：

\`\`\`yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
livenessProbe:
  httpGet:
    path: /livez
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 20
\`\`\`

readiness 和 liveness 不应随便共用一个复杂接口。readiness 关注能否接流量，liveness 关注是否需要重启。`,
      diagnosis: [
        '间歇 502 先看网关日志和 Pod 是否 ready。',
        '服务重启看 Pod events、exit code、OOMKilled 和 liveness probe。',
        '发布期间异常看 Deployment rollout、maxUnavailable、maxSurge。',
        '高峰变慢看 CPU、Memory、event loop delay、下游耗时。',
        '配置不一致看 ConfigMap、Secret、环境变量和镜像 tag。',
        '回滚无效时检查接口兼容、数据库迁移和缓存状态。',
      ],
      followups: [
        'readiness 和 liveness 为什么不能混用？',
        'requests 和 limits 配置不当会造成什么？',
        '滚动发布为什么需要 maxUnavailable/maxSurge？',
        'SSR 服务扩容为什么不只看 Pod 数量？',
      ],
      deepDive: '值得深入。中高级前端如果负责 Node/BFF/SSR，就必须能和平台、后端一起定位运行问题。深入顺序是 Dockerfile、镜像、Pod、Deployment、Service、Ingress、探针、资源和 rollout。',
      references: ['Docker 官方文档', 'Kubernetes Deployment 文档', 'Kubernetes Probes 文档', 'Kubernetes Resource Management 文档'],
      quiz: [
        single('readiness probe 主要决定什么？', ['Pod 是否接收流量', 'Pod 是否删除源码', 'CSS 是否加载', '接口字段命名'], 0, 'readiness 未通过不应接流量。'),
        multiple('间歇 502 可排查？', ['Pod readiness', '网关日志', 'Pod 重启事件', '资源限制'], [0, 1, 2, 3], '502 常来自入口和实例可用性问题。'),
        judgment('前端只要负责 BFF/SSR，就完全不需要了解容器和 K8s。', 1, '服务端运行问题会直接影响客户体验。'),
        single('OOMKilled 通常说明什么？', ['容器超出内存限制被杀', '图片尺寸不对', 'Cookie 过期', '类型错误'], 0, 'OOMKilled 是内存限制相关事件。'),
        multiple('K8s Deployment 关注？', ['副本数', '滚动更新', '回滚', '浏览器 DOM'], [0, 1, 2], 'Deployment 管理应用副本和发布。'),
        single('liveness probe 配置过激可能导致？', ['实例被频繁误重启', '构建体积变小', '接口自动缓存', 'DNS 变快'], 0, '误重启会造成可用性问题。'),
      ],
    }),
  ],
};
