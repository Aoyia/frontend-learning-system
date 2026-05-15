const CONTENT = {
  modules: [
    {
      id: 'cicd',
      name: 'CI/CD',
      icon: '🚀',
      desc: '持续集成与持续交付，从提交代码到上线发布。',
      docs: [
        {
          title: '手动部署之痛：为什么需要 CI/CD？',
          difficulty: '入门',
          content: `
## 1. 真实问题：上线靠人工，稳定性靠运气

在很多团队早期，发布流程是这样的：

1. 本地打包
2. 手动上传服务器
3. SSH 登录重启服务
4. 口头通知测试或产品

这套流程最大的问题不是“慢”，而是**不可重复**。同样一次发布，A 同学和 B 同学执行出来的结果可能不一样。

## 2. CI/CD 解决的核心不是“自动化”，而是“交付确定性”

CI/CD 的目标可以概括为一句话：

> 把“人肉步骤”变成“可审计、可回放、可复用”的流水线步骤。

你会得到三类收益：

- 质量前移：问题尽量在合并前暴露
- 发布提速：降低发布的人力消耗
- 风险可控：每次发布都能追踪到 commit、构建产物和执行日志

## 3. 最小可用 CI/CD 链路

一个前端项目常见的最小链路是：

\`git push\` → 安装依赖 → 单测/Lint → 构建 → 产物上传 → 发布通知

其中每一步都可以失败并阻断后续流程，这叫 **fail fast**。

## 4. 常见误区

- 误区 1：把 CI/CD 当成“上线脚本”
- 误区 2：流程很全，但没人维护，失败了就手动跳过
- 误区 3：只自动构建，不自动校验质量

## 5. 小结

CI/CD 不是工具名，而是工程能力。Jenkins、GitLab CI、GitHub Actions 只是载体。

下一篇我们会拆开 CI：代码提交后到底发生了什么。`,
          quiz: [
            {
              type: 'single',
              question: 'CI/CD 的核心价值更接近下面哪项？',
              options: ['把所有事情自动化', '提升交付确定性与可追踪性', '减少服务器数量', '替代测试人员'],
              answer: 1,
              explain: '核心是可重复、可审计、可回放的交付过程。'
            },
            {
              type: 'multiple',
              question: '手动部署常见风险有哪些？',
              options: ['步骤不可重复', '依赖个人记忆', '发布日志缺失', '天然支持回滚'],
              answer: [0,1,2],
              explain: '手动发布通常缺乏标准化和审计能力。'
            },
            {
              type: 'judgment',
              question: 'CI/CD 只要能自动部署，就算成功落地。',
              options: ['对', '错'],
              answer: 1,
              explain: '还需要质量门禁、可追踪和治理能力。'
            },
            {
              type: 'single',
              question: 'fail fast 在流水线中的含义是？',
              options: ['失败后继续执行', '尽早暴露问题并阻断后续步骤', '失败自动重试无限次', '只在生产环境失败'],
              answer: 1,
              explain: '前置失败能减少无效执行和风险扩散。'
            },
            {
              type: 'single',
              question: '下面哪项最符合 CI/CD 的“可审计”特征？',
              options: ['每次发布都靠口头同步', '关键步骤都有日志与责任链路', '仅保留最终构建包', '由一个人负责全部发布'],
              answer: 1,
              explain: '可审计强调可追溯，包括谁在何时执行了什么。'
            }
          ]
        },
        {
          title: 'CI 是什么：代码提交后发生了什么？',
          difficulty: '入门',
          content: `
## 1. CI 的目标：降低集成成本

持续集成（Continuous Integration）强调的是：**频繁合并 + 自动验证**。

如果团队每周才合一次代码，冲突和回归会集中爆发，排查成本极高。

## 2. 一个典型 CI 流程

前端仓库中，CI 常见顺序：

1. 拉取代码
2. 安装依赖（可命中缓存）
3. 执行 \`lint\`
4. 执行 \`test\`
5. 执行 \`build\`
6. 上传构建产物（artifact）

## 3. 质量门禁（Quality Gate）

CI 的“门禁”意味着：

- 没通过 Lint，不允许合并
- 测试失败，不允许进入部署阶段
- 安全扫描未通过，不允许发布

这让“上线质量”变成“合并质量”。

## 4. CI 里的缓存策略

例如 Node 项目可以缓存：

- npm/pnpm 包缓存
- 构建缓存（如 Turborepo、Nx、Vite cache）

缓存不是必须项，但对大仓库提效显著。

## 5. 小结

CI 解决的是“代码能不能稳定合并”，CD 解决的是“能不能稳定发布”。`,
          quiz: [
            {
              type: 'single',
              question: 'CI 的主要目标是？',
              options: ['减少开发人数', '降低代码集成风险', '替代代码评审', '减少需求变更'],
              answer: 1,
              explain: 'CI 通过频繁合并和自动验证降低集成成本。'
            },
            {
              type: 'multiple',
              question: '下列哪些步骤常见于前端 CI？',
              options: ['lint', 'test', 'build', '手动 SSH 发布'],
              answer: [0,1,2],
              explain: 'SSH 手动发布通常属于传统流程，不是 CI 必备步骤。'
            },
            {
              type: 'judgment',
              question: '质量门禁意味着不通过测试也可以先合并后修复。',
              options: ['对', '错'],
              answer: 1,
              explain: '门禁的本质是阻断不合格变更进入主干。'
            },
            {
              type: 'single',
              question: 'artifact 在 CI/CD 中通常指什么？',
              options: ['Git 分支', '构建产物', '运行日志', '代码注释'],
              answer: 1,
              explain: 'artifact 通常是可部署或可复用的构建结果。'
            },
            {
              type: 'single',
              question: '为什么要做依赖缓存？',
              options: ['提升流水线执行速度', '提高代码可读性', '减少分支数量', '避免代码冲突'],
              answer: 0,
              explain: '缓存主要收益在于减少重复下载与重复构建。'
            }
          ]
        },
        {
          title: 'CD 是什么：从构建产物到线上环境',
          difficulty: '入门',
          content: `
## 1. CD 有两种语义

- Continuous Delivery（持续交付）：产物随时可发布，但通常需要人工确认
- Continuous Deployment（持续部署）：通过门禁后自动发布到目标环境

团队选哪种取决于风险偏好与治理成熟度。

## 2. 前端 CD 常见路径

1. 构建静态资源
2. 上传对象存储（OSS/S3）
3. 刷新 CDN 缓存
4. 发布版本标记与通知

## 3. 产物不可变原则

一次构建出的产物要在多个环境复用，避免“同一 commit 在不同环境二次构建不一致”。

## 4. 发布前检查

- 配置注入是否正确
- 回源路径与 CDN 规则是否生效
- 监控告警阈值是否开启

## 5. 小结

CD 本质是把“可运行代码”稳定转化为“线上可用服务”。`,
          quiz: [
            {
              type: 'single',
              question: '持续交付与持续部署的主要差异是？',
              options: ['是否写测试', '是否自动上线到目标环境', '是否使用容器', '是否使用 Git'],
              answer: 1,
              explain: '持续部署通常在门禁通过后自动发布。'
            },
            {
              type: 'multiple',
              question: '前端 CD 常见动作包括哪些？',
              options: ['上传静态资源', 'CDN 刷新', '发布通知', '删除仓库历史'],
              answer: [0,1,2],
              explain: '删除仓库历史与 CD 无关。'
            },
            {
              type: 'judgment',
              question: '同一 commit 在不同环境重新构建通常没有风险。',
              options: ['对', '错'],
              answer: 1,
              explain: '二次构建可能引入不一致，推荐产物不可变复用。'
            },
            {
              type: 'single',
              question: '“产物不可变”最直接的收益是？',
              options: ['减少文件大小', '降低环境间差异风险', '减少需求数量', '提升 UI 效果'],
              answer: 1,
              explain: '同一产物跨环境复用更可控。'
            },
            {
              type: 'single',
              question: 'CD 的核心是？',
              options: ['把可运行代码稳定变成线上服务', '自动生成需求文档', '替代运维岗位', '减少代码提交频率'],
              answer: 0,
              explain: 'CD 关注交付链路的稳定与可控。'
            }
          ]
        },
        {
          title: 'Pipeline 设计：stages、jobs 与并行',
          difficulty: '进阶',
          content: `
## 1. 为什么流水线设计很关键

同样是 CI/CD，设计差的 Pipeline 会导致：

- 排队时间长
- 反馈慢
- 失败定位困难

## 2. stages 与 jobs 的关系

- stage：流程阶段（例如 test、build、deploy）
- job：阶段内具体任务

通常同 stage 内的多个 job 可以并行，stage 之间按顺序。

## 3. 前端常见并行点

- Lint 与 Unit Test 并行
- 多 Node 版本矩阵并行
- 多子应用并行构建（微前端场景）

## 4. 设计原则

1. 先快后慢：快速失败任务前置
2. 先小后大：先跑低成本校验
3. 结果可观测：每个 job 有独立日志与产物

## 5. 小结

好的 Pipeline 让团队在最短时间得到最有价值的反馈。`,
          quiz: [
            {
              type: 'single',
              question: 'stage 与 job 的关系通常是？',
              options: ['job 包含多个 stage', 'stage 是阶段，job 是任务', '二者完全等价', '只能二选一使用'],
              answer: 1,
              explain: 'stage 是流程层级，job 是执行单元。'
            },
            {
              type: 'multiple',
              question: '下面哪些是合理的并行策略？',
              options: ['Lint 与 Unit Test 并行', '多 Node 版本并行', '所有步骤严格串行', '多子应用并行构建'],
              answer: [0,1,3],
              explain: '并行可以缩短总时长，严格串行通常效率较低。'
            },
            {
              type: 'judgment',
              question: '应将耗时最长但价值最低的任务放在最前面。',
              options: ['对', '错'],
              answer: 1,
              explain: '应优先前置快速失败任务，减少浪费。'
            },
            {
              type: 'single',
              question: '“先快后慢”设计原则主要为了？',
              options: ['增加日志数量', '尽快发现明显问题', '减少分支命名冲突', '缩短代码行数'],
              answer: 1,
              explain: '快速反馈有助于降低修复成本。'
            },
            {
              type: 'single',
              question: 'Pipeline 可观测性的直接体现是？',
              options: ['每个 job 都有独立日志', '所有日志写在一个文件', '失败时不输出错误', '不保留任何产物'],
              answer: 0,
              explain: '可观测性依赖可分解、可定位的运行信息。'
            }
          ]
        },
        {
          title: '环境管理：dev / staging / prod 如何隔离？',
          difficulty: '进阶',
          content: `
## 1. 多环境为什么容易出事故

典型事故：测试配置误发生产、测试密钥泄露、接口地址串环境。

根因通常是“环境与配置管理混乱”。

## 2. 环境隔离的三层

1. 资源隔离：不同环境独立存储与服务
2. 配置隔离：不同环境独立变量与密钥
3. 权限隔离：发布权限分级（例如生产环境需审批）

## 3. 前端项目常见做法

- 使用环境变量文件或配置中心
- 构建时注入环境标识
- 生产发布增加人工确认或审批节点

## 4. 最小安全策略

- 禁止在仓库明文存储密钥
- 生产发布必须可追踪到责任人
- 关键变量变更需审计

## 5. 小结

环境治理不是“多写几个 .env 文件”，而是交付治理的一部分。`,
          quiz: [
            {
              type: 'single',
              question: '多环境管理最常见的高风险问题是？',
              options: ['页面字体不一致', '测试配置误发生产', '提交信息不规范', '开发机磁盘不足'],
              answer: 1,
              explain: '环境串用会直接带来生产事故。'
            },
            {
              type: 'multiple',
              question: '环境隔离应包含哪些层面？',
              options: ['资源隔离', '配置隔离', '权限隔离', '只隔离 UI 主题'],
              answer: [0,1,2],
              explain: '隔离应覆盖资源、配置、权限等关键环节。'
            },
            {
              type: 'judgment',
              question: '将生产密钥明文放在仓库里，只要仓库是私有就安全。',
              options: ['对', '错'],
              answer: 1,
              explain: '密钥管理应使用安全凭证系统，不应明文入库。'
            },
            {
              type: 'single',
              question: '生产发布增加审批节点主要是为了？',
              options: ['增加流程复杂度', '降低误发布风险', '减少测试数量', '减少日志输出'],
              answer: 1,
              explain: '高风险环境需要更严格的变更控制。'
            },
            {
              type: 'single',
              question: '下列哪项最符合“环境治理”理念？',
              options: ['只维护 dev 环境', '将环境管理纳入交付治理', '上线时临时改配置', '每次发布手动改脚本'],
              answer: 1,
              explain: '环境治理是工程治理的一部分，不是临时操作。'
            }
          ]
        },
        {
          title: '回滚策略：出了问题如何快速恢复？',
          difficulty: '进阶',
          content: `
## 1. 为什么必须设计回滚

没有回滚能力的发布，就是把业务稳定性押在“本次发布不会出错”上。

## 2. 前端回滚常见方案

- 静态资源版本化（保留历史版本）
- CDN 回切到上一个稳定版本
- 配置开关降级（关闭有问题功能）

## 3. 回滚设计原则

1. 回滚路径要预演
2. 回滚耗时要可度量（例如 5 分钟内）
3. 回滚后要有验证动作（监控、核心链路检查）

## 4. 回滚不是失败，而是韧性

成熟团队把“可快速恢复”作为发布能力的一部分，不把回滚视为羞耻。

## 5. 小结

上线策略 = 发布能力 + 监控能力 + 回滚能力。`,
          quiz: [
            {
              type: 'single',
              question: '回滚策略的核心作用是？',
              options: ['提升代码体积', '在故障时快速恢复业务', '避免写测试', '减少上线频率'],
              answer: 1,
              explain: '回滚用于降低故障影响时长。'
            },
            {
              type: 'multiple',
              question: '常见前端回滚手段有？',
              options: ['静态资源版本化', 'CDN 回切稳定版本', '功能开关降级', '删除所有历史版本'],
              answer: [0,1,2],
              explain: '删除历史版本会让回滚失效。'
            },
            {
              type: 'judgment',
              question: '回滚路径不需要预演，线上出问题再说。',
              options: ['对', '错'],
              answer: 1,
              explain: '未预演的回滚往往在关键时刻不可用。'
            },
            {
              type: 'single',
              question: '“回滚后验证”通常不包括哪项？',
              options: ['监控指标恢复检查', '核心链路可用性检查', '随机改数据库结构', '错误率对比'],
              answer: 2,
              explain: '回滚后应做风险收敛验证，不应引入新变更。'
            },
            {
              type: 'single',
              question: '成熟发布体系通常包含？',
              options: ['只要发布成功即可', '发布+监控+回滚', '只做监控', '只做灰度'],
              answer: 1,
              explain: '三者组合才能形成完整韧性。'
            }
          ]
        }
      ]
    },
    {
      id: 'devops',
      name: 'DevOps',
      icon: '🛠️',
      desc: '研发与运维协同，从流程到平台化能力建设。',
      docs: [
        {
          title: '开发与运维的墙：DevOps 从何而来？',
          difficulty: '入门',
          content: `
## 1. 问题背景

传统模式下，开发关注“功能上线”，运维关注“系统稳定”。目标错位导致协作摩擦。

## 2. DevOps 的本质

DevOps 不是岗位合并，而是：

- 共享目标（交付速度 + 稳定性）
- 自动化流程
- 可观测反馈闭环

## 3. DORA 指标（简版）

常用来评估交付能力：

- 部署频率
- 变更前置时间
- 变更失败率
- 故障恢复时间

## 4. 小结

DevOps 的价值在于缩短“从需求到价值”的路径，并降低风险。`,
          quiz: [
            { type: 'single', question: 'DevOps 更接近下面哪项？', options: ['新编程语言', '研发与运维协同方法论', '容器引擎', '监控系统'], answer: 1, explain: 'DevOps 是协作与交付理念。' },
            { type: 'multiple', question: 'DevOps 关键特征包括？', options: ['共享目标', '自动化流程', '反馈闭环', '拒绝监控'], answer: [0,1,2], explain: '监控和反馈是核心环节。' },
            { type: 'judgment', question: 'DevOps 等于让开发兼任运维值班。', options: ['对', '错'], answer: 1, explain: '并非简单岗位叠加。' },
            { type: 'single', question: '下列哪项属于 DORA 指标？', options: ['页面 FPS', '变更失败率', '代码注释率', '接口命名风格'], answer: 1, explain: '变更失败率是核心交付质量指标。' },
            { type: 'single', question: 'DevOps 追求的平衡是？', options: ['速度与稳定性', '功能与字体', '成本与像素', '语法与缩进'], answer: 0, explain: '目标是更快且更稳地交付。' }
          ]
        },
        {
          title: '基础设施即代码（IaC）：告别手动配置服务器',
          difficulty: '进阶',
          content: `
## 1. 为什么需要 IaC

手动配置服务器会导致“同名环境，不同行为”。

## 2. IaC 核心思想

把基础设施声明成代码，并纳入版本管理：

- 可评审
- 可回滚
- 可复现

## 3. 常见工具

- Terraform
- Pulumi
- CloudFormation

## 4. 前端团队相关场景

- CDN 域名与缓存规则
- 对象存储桶权限
- 构建产物分发策略

## 5. 小结

IaC 让基础设施管理从“手工工单”升级为“工程流程”。`,
          quiz: [
            { type: 'single', question: 'IaC 的关键价值是？', options: ['减少需求数量', '基础设施可版本化与可复现', '替代 Git', '降低代码行数'], answer: 1, explain: 'IaC 的核心是用代码管理基础设施。' },
            { type: 'multiple', question: 'IaC 的优势包括？', options: ['可评审', '可回滚', '可复现', '必须手动点击控制台'], answer: [0,1,2], explain: 'IaC 目的是减少手工操作。' },
            { type: 'judgment', question: 'IaC 与前端团队无关。', options: ['对', '错'], answer: 1, explain: '前端也会涉及 CDN、存储、域名等基础设施。' },
            { type: 'single', question: '下面哪项是 IaC 常见工具？', options: ['Terraform', 'Photoshop', 'Nginx', 'Redis'], answer: 0, explain: 'Terraform 是主流 IaC 工具。' },
            { type: 'single', question: 'IaC 最能避免哪类问题？', options: ['同名环境配置漂移', '浏览器兼容', 'UI 色差', '接口文档缺失'], answer: 0, explain: 'IaC 能显著降低环境漂移。' }
          ]
        },
        {
          title: '容器化基础：Docker 解决了什么问题？',
          difficulty: '入门',
          content: `
## 1. 经典痛点

“在我电脑上能跑”是团队协作里最常见的无效沟通。

## 2. Docker 的核心贡献

通过镜像封装运行环境，实现“构建一次，到处运行”。

## 3. 前端场景

- 本地 Node 版本统一
- CI 环境一致
- 构建过程可移植

## 4. 注意事项

- 镜像分层要精简
- 不在镜像中硬编码密钥
- 构建与运行镜像可分离（multi-stage build）

## 5. 小结

Docker 不是为了炫技，而是降低环境差异带来的成本。`,
          quiz: [
            { type: 'single', question: 'Docker 主要解决什么问题？', options: ['代码格式化', '环境一致性', '产品设计', '需求评审'], answer: 1, explain: '核心是减少环境差异。' },
            { type: 'multiple', question: '前端团队使用 Docker 的收益有？', options: ['统一 Node 版本', '统一 CI 环境', '可移植构建', '自动生成需求'], answer: [0,1,2], explain: 'Docker 关注运行环境与交付一致性。' },
            { type: 'judgment', question: '把密钥写进镜像是推荐做法。', options: ['对', '错'], answer: 1, explain: '密钥应走安全注入，不应硬编码进镜像。' },
            { type: 'single', question: 'multi-stage build 主要用于？', options: ['增加镜像层数', '减少最终镜像体积并隔离构建依赖', '替代 CI', '避免写 Dockerfile'], answer: 1, explain: '多阶段构建常用于瘦身与分层隔离。' },
            { type: 'single', question: '“在我电脑能跑”问题本质是？', options: ['功能太多', '环境不一致', '代码注释少', '网速慢'], answer: 1, explain: '环境一致性是协作基础。' }
          ]
        },
        {
          title: '监控与可观测性：系统出问题怎么第一时间知道？',
          difficulty: '进阶',
          content: `
## 1. 没有监控，稳定性只是主观感觉

上线后如果没有观测手段，问题只能靠用户投诉发现。

## 2. 可观测性三件套

- Metrics（指标）
- Logs（日志）
- Traces（链路追踪）

## 3. 前端关键指标

- 错误率（JS Error）
- 核心性能指标（LCP/INP/CLS）
- API 成功率与耗时

## 4. 告警治理

告警要“可行动”：

- 阈值合理
- 降噪聚合
- 明确 owner

## 5. 小结

没有监控的发布，不算真正完成交付。`,
          quiz: [
            { type: 'single', question: '可观测性三件套不包括？', options: ['Metrics', 'Logs', 'Traces', 'Storybook'], answer: 3, explain: 'Storybook 属于组件开发工具，不是观测三件套。' },
            { type: 'multiple', question: '前端常见线上观测指标有？', options: ['JS 错误率', 'LCP/INP/CLS', 'API 成功率', '工位亮度'], answer: [0,1,2], explain: '可观测指标应直接反映质量与性能。' },
            { type: 'judgment', question: '告警越多越好，说明覆盖更全面。', options: ['对', '错'], answer: 1, explain: '告警应可行动，噪声过多会导致疲劳。' },
            { type: 'single', question: '“可行动告警”强调什么？', options: ['数量多', '触发后能明确处理动作与责任人', '只发群消息', '只在白天触发'], answer: 1, explain: '可行动性是告警治理核心。' },
            { type: 'single', question: '为什么说没有监控不算完成交付？', options: ['因为监控更酷', '无法及时发现与定位线上问题', '会影响代码行数', '无法写单测'], answer: 1, explain: '交付闭环需要上线后的持续反馈。' }
          ]
        },
        {
          title: '前端 DevOps 实践：从代码到 CDN 的完整链路',
          difficulty: '进阶',
          content: `
## 1. 端到端链路视角

前端交付链路常见节点：

需求实现 → PR 审查 → CI 校验 → 构建产物 → 发布到 CDN → 监控反馈

## 2. 关键工程动作

- 分支策略与保护规则
- 质量门禁（Lint/Test/SAST）
- 版本号与变更日志
- 灰度发布与回滚预案

## 3. 一条“够用”的前端发布规范

1. 主干必须通过全部门禁
2. 产物必须可追溯 commit
3. 发布必须有负责人
4. 发布后 30 分钟重点观测

## 4. 小结

前端 DevOps 的重点不是“工具齐全”，而是流程闭环。`,
          quiz: [
            { type: 'single', question: '前端 DevOps 的重点更偏向？', options: ['工具越多越好', '从开发到线上的流程闭环', '只优化本地开发体验', '只看构建速度'], answer: 1, explain: '核心在端到端交付闭环。' },
            { type: 'multiple', question: '发布规范通常包含哪些要求？', options: ['主干门禁通过', '产物可追溯 commit', '发布负责人明确', '上线后不看监控'], answer: [0,1,2], explain: '上线后监控同样重要。' },
            { type: 'judgment', question: '只要构建快，流程治理可以忽略。', options: ['对', '错'], answer: 1, explain: '速度与治理都需要，缺一不可。' },
            { type: 'single', question: '“发布后 30 分钟重点观测”主要目的？', options: ['凑流程', '快速识别发布引入的问题', '减少日志量', '统计工时'], answer: 1, explain: '发布后短期是故障高发窗口。' },
            { type: 'single', question: '端到端链路中，下列哪项顺序更合理？', options: ['发布到 CDN → PR 审查', 'PR 审查 → CI 校验 → 构建发布', '先线上发布再测试', '先删分支再构建'], answer: 1, explain: '先审查与验证，再进入发布流程。' }
          ]
        }
      ]
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      icon: '🤖',
      desc: 'Pipeline as Code 与插件生态，构建企业级 CI/CD 流程。',
      docs: [
        {
          title: 'Jenkins 是什么：一台不知疲倦的自动化工人',
          difficulty: '入门',
          content: `
## 1. Jenkins 的定位

Jenkins 是可扩展的自动化服务器，常用于实现 CI/CD 流水线。

## 2. 为什么企业常用 Jenkins

- 自托管可控
- 插件生态丰富
- 支持复杂企业流程

## 3. Jenkins 基本概念

- Controller / Agent
- Job / Pipeline
- Workspace

## 4. 小结

Jenkins 不是“按钮工具”，而是可编排的自动化平台。`,
          quiz: [
            { type: 'single', question: 'Jenkins 的核心定位是？', options: ['代码编辑器', '自动化服务器', '数据库中间件', '容器运行时'], answer: 1, explain: 'Jenkins 主要用于自动化构建与交付。' },
            { type: 'multiple', question: '企业使用 Jenkins 的常见原因有？', options: ['自托管可控', '插件丰富', '支持复杂流程', '只能做前端构建'], answer: [0,1,2], explain: 'Jenkins 不局限某一语言或前端场景。' },
            { type: 'judgment', question: 'Jenkins 只能通过界面点按钮使用，无法代码化。', options: ['对', '错'], answer: 1, explain: 'Jenkins 支持 Jenkinsfile 的 Pipeline as Code。' },
            { type: 'single', question: 'Jenkins 中执行任务的节点通常是？', options: ['Agent', 'Git Tag', 'Issue', 'PR'], answer: 0, explain: 'Agent 负责实际执行流水线任务。' },
            { type: 'single', question: 'Jenkins 最贴近下面哪种能力？', options: ['自动化编排能力', '图像处理能力', '数据库备份能力', '代码托管能力'], answer: 0, explain: 'Jenkins 强项是自动化流程编排。' }
          ]
        },
        {
          title: '第一条 Pipeline：用 Jenkinsfile 描述流水线',
          difficulty: '入门',
          content: `
## 1. Pipeline as Code

把流水线写成 Jenkinsfile，和业务代码一起版本管理。

## 2. 一个最小 Jenkinsfile

\`\`\`groovy
pipeline {
  agent any
  stages {
    stage('Install') { steps { sh 'pnpm i --frozen-lockfile' } }
    stage('Test') { steps { sh 'pnpm test' } }
    stage('Build') { steps { sh 'pnpm build' } }
  }
}
\`\`\`

## 3. 价值

- 变更可评审
- 流程可复用
- 历史可追溯

## 4. 小结

Jenkinsfile 是团队交付流程的“单一事实来源”。`,
          quiz: [
            { type: 'single', question: 'Jenkinsfile 的主要作用是？', options: ['存放 UI 组件', '声明流水线流程', '记录接口文档', '管理数据库表'], answer: 1, explain: 'Jenkinsfile 用于描述 pipeline 执行逻辑。' },
            { type: 'multiple', question: 'Pipeline as Code 的好处有？', options: ['可评审', '可复用', '可追溯', '无法版本管理'], answer: [0,1,2], explain: '其核心收益就是工程化管理。' },
            { type: 'judgment', question: 'Jenkinsfile 应该与业务代码分离，避免版本关联。', options: ['对', '错'], answer: 1, explain: '通常建议放在仓库内并随代码演进。' },
            { type: 'single', question: '下面哪项更符合“单一事实来源”？', options: ['口头约定流水线步骤', '在 Jenkinsfile 中声明并版本化', '每个人本地脚本不同', '上线前临时修改命令'], answer: 1, explain: '流程应收敛到代码化配置。' },
            { type: 'single', question: 'Jenkinsfile 使用的常见 DSL 语言是？', options: ['Groovy 风格 DSL', 'SQL', 'CSS', 'YAML-only'], answer: 0, explain: 'Jenkins Pipeline 常基于 Groovy DSL。' }
          ]
        },
        {
          title: '插件生态：Jenkins 如何与各种工具集成？',
          difficulty: '进阶',
          content: `
## 1. 插件是 Jenkins 的扩展能力来源

常见集成对象：Git、Docker、SonarQube、Slack、Kubernetes。

## 2. 插件治理的风险

- 插件版本过旧
- 插件冲突
- 权限面扩大

## 3. 实践建议

- 控制插件数量
- 定期升级并验证
- 关键插件做变更评审

## 4. 小结

插件生态强大，但治理不到位会成为稳定性风险源。`,
          quiz: [
            { type: 'single', question: 'Jenkins 插件的主要作用是？', options: ['替代 Git', '扩展与外部系统集成能力', '替代数据库', '替代浏览器'], answer: 1, explain: '插件用于扩展 Jenkins 原生能力。' },
            { type: 'multiple', question: '插件治理应关注哪些风险？', options: ['版本过旧', '插件冲突', '权限扩大', '字体样式不一致'], answer: [0,1,2], explain: '前三项是常见治理风险。' },
            { type: 'judgment', question: '插件越多越好，说明平台能力越强。', options: ['对', '错'], answer: 1, explain: '过多插件会增加维护复杂度与风险。' },
            { type: 'single', question: '下列哪项是更稳妥的插件策略？', options: ['控制数量并定期升级验证', '任何人随时安装', '长期不升级', '出现问题再临时排查'], answer: 0, explain: '治理核心是可控与可验证。' },
            { type: 'single', question: 'Jenkins 与 SonarQube 集成主要服务于？', options: ['代码质量分析', '图片压缩', '域名解析', '系统重装'], answer: 0, explain: 'SonarQube 常用于质量门禁。' }
          ]
        },
        {
          title: '凭证管理：密钥和敏感信息怎么安全存储？',
          difficulty: '进阶',
          content: `
## 1. 反模式

在 Jenkinsfile 明文写 AK/SK、Token、密码，是高风险做法。

## 2. Jenkins Credentials

常见凭证类型：

- Secret text
- Username/Password
- SSH key

并通过 \`withCredentials\` 在运行时注入。

## 3. 最小权限原则

- 账号按环境隔离
- 凭证按任务最小授权
- 定期轮换

## 4. 小结

凭证管理能力，决定了自动化平台的安全上限。`,
          quiz: [
            { type: 'single', question: 'Jenkinsfile 中明文写密钥属于？', options: ['推荐实践', '高风险反模式', '性能优化手段', '兼容性策略'], answer: 1, explain: '明文密钥容易泄露且难审计。' },
            { type: 'multiple', question: 'Jenkins 常见凭证类型有？', options: ['Secret text', 'Username/Password', 'SSH key', 'JPEG image'], answer: [0,1,2], explain: '前三项是凭证系统常见类型。' },
            { type: 'judgment', question: '凭证可以在多个环境混用，方便维护。', options: ['对', '错'], answer: 1, explain: '应按环境隔离，降低横向风险。' },
            { type: 'single', question: 'withCredentials 的主要用途是？', options: ['运行时安全注入凭证', '格式化代码', '创建分支', '提升打包速度'], answer: 0, explain: '用于在步骤中临时注入并使用密钥。' },
            { type: 'single', question: '最小权限原则强调？', options: ['能访问全部资源最好', '只授予完成任务所需权限', '所有账号同权限', '凭证永久有效'], answer: 1, explain: '最小授权有助于降低安全面。' }
          ]
        },
        {
          title: '多分支与多环境：一个 Jenkinsfile 管理所有分支',
          difficulty: '进阶',
          content: `
## 1. 典型诉求

- feature 分支只跑快速校验
- main 分支跑完整发布链路
- release 分支触发预发布环境部署

## 2. 分支条件控制

Jenkinsfile 中可通过 \`when\`、环境变量、分支命名规则控制执行路径。

## 3. 设计建议

- 把分支策略写成清晰规则
- 避免在脚本里散落硬编码
- 对生产分支加审批或保护

## 4. 小结

多分支策略的目标是“不同风险等级，匹配不同流程成本”。`,
          quiz: [
            { type: 'single', question: '多分支流水线设计的主要目标是？', options: ['让所有分支执行完全相同流程', '按风险等级匹配不同流程', '减少仓库数量', '跳过质量门禁'], answer: 1, explain: '分支差异化可平衡效率与风险。' },
            { type: 'multiple', question: '下列哪些是常见分支策略？', options: ['feature 跑快速校验', 'main 跑完整链路', 'release 触发预发布', '所有分支直接发生产'], answer: [0,1,2], explain: '生产发布通常需要更严格控制。' },
            { type: 'judgment', question: '分支规则写在脚本各处硬编码是推荐实践。', options: ['对', '错'], answer: 1, explain: '应集中治理，降低维护复杂度。' },
            { type: 'single', question: 'Jenkinsfile 中控制分支执行路径常用？', options: ['when 条件', 'CSS 变量', 'SQL 触发器', 'HTTP 状态码'], answer: 0, explain: 'Pipeline DSL 提供 when 等条件控制。' },
            { type: 'single', question: '生产分支通常需要额外什么机制？', options: ['更少日志', '审批或保护策略', '跳过测试', '禁止监控'], answer: 1, explain: '高风险环境应增加变更控制。' }
          ]
        }
      ]
    }
  ]
};
