import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/data/';

const files = {
  delivery: {
    path: path.join(baseDir, 'delivery-platform-content.js'),
    replacements: [
      {
        old: `multiple('流水线 flake 可排查？', ['测试等待策略', '测试数据稳定性', '外部服务依赖', '代码缩进风格'], [0, 1, 2],`,
        new: `multiple('在排查 CI/CD 自动化流水线偶发性构建失败（Flaky Tests）时，应优先排查哪些项？', ['异步操作的等待与超时重试策略', '测试数据库及模拟（Mock）数据隔离性', '第三方外部 API 的网络连接与兜底策略', '构建脚本在做静态分析时的代码缩进风格'], [0, 1, 2],`
      },
      {
        old: `multiple('回滚要考虑？', ['HTML', '静态资源', '接口兼容', 'CDN 缓存'], [0, 1, 2, 3],`,
        new: `multiple('在对生产发布进行安全回滚时，团队通常需要考虑哪些资源的兼容与失效策略？', ['静态资源及 HTML 强缓存的刷新', '回滚版本与脏数据的向前兼容性', '网关及 CDN 节点缓存的阻断清理', '灰度特性开关（Feature Flag）的强制同步'], [0, 1, 2, 3],`
      },
      {
        old: `multiple('枚举新增可能导致？', ['状态机遗漏', '文案缺失', '分支渲染异常', 'DNS 变慢'], [0, 1, 2],`,
        new: `multiple('在公共组件库或后台 API 中新增枚举字段（Enum）时，如果业务端未同步适配，最可能导致的工程风险是？', ['状态机匹配逻辑遗漏及数据状态失控', '前端界面对应的国际化多语言文案缺失', '条件渲染分支异常导致页面交互阻断', 'TypeScript 类型系统的穷尽性检查失效'], [0, 1, 2],`
      },
      {
        old: `multiple('K8s Deployment 关注？', ['副本数', '滚动更新', '回滚', '浏览器 DOM'], [0, 1, 2],`,
        new: `multiple('在配置 Kubernetes 的 Deployment 制品发布策略时，运维或前端架构通常需要关注的核心指标与操作包括？', ['设定服务副本数（Replicas）以保证高可用与并发负载', '配置滚动更新（Rolling Update）的就绪度与存活度探针', '保障在发生崩溃时的一键回滚（Rollback）与流量降级', '客户端浏览器加载和渲染 DOM 树的解析耗时表现'], [0, 1, 2],`
      }
    ]
  },
  architecture: {
    path: path.join(baseDir, 'frontend-architecture-content.js'),
    replacements: [
      {
        old: `multiple('TypeScript 可用于表达哪些约束？', ['合法参数组合', '返回值推导', '事件名约束', '运行时自动校验所有接口'], [0, 1, 2],`,
        new: `multiple('在 TypeScript 静态类型系统中，开发人员可以有效表达并约束哪些工程契约？', ['基于可辨识联合的合法 Props 参数组合与逻辑互斥', '根据输入参数自动进行推导并约束函数返回值类型', '基于字面量联合或 keyof 声明组件自定义事件名', '对从不可信外部源获取的数据在运行时自动校验并拦截'], [0, 1, 2],`
      },
      {
        old: `multiple('类型检查变慢可排查？', ['深递归条件类型', '巨大 tsconfig', 'project references 是否缺失', '图片宽高'], [0, 1, 2],`,
        new: `multiple('当前端项目规模膨胀，导致 TypeScript 类型编译与 IDE 提示响应极慢时，应优先排查？', ['代码中是否存在深层递归的条件类型（Conditional Types）与重载', 'tsconfig.json 中是否配置了过于宽泛的全局文件扫描范围', '在多包 Monorepo 架构中，项目引用（Project References）是否缺失', '构建打包过程中静态图片资源的宽高属性是否匹配异常'], [0, 1, 2],`
      },
      {
        old: `multiple('Monorepo CI 提速常用手段包括？', ['affected 分析', '远程缓存', '任务依赖图', '每次全量构建所有包'], [0, 1, 2],`,
        new: `multiple('在大型 Monorepo 仓库的多包 CI 提速优化实践中，通常会引入哪些提速手段？', ['基于 Git 变更分析的受影响包分析（Affected Analysis）', '挂载并使用分布式远程构建缓存以跳过已生成产物的包编译', '建立并维护包与包之间的拓扑结构与构建任务依赖图（Task Graph）', '在每次流水线触发时强制全量重新构建并编译所有子项目'], [0, 1, 2],`
      },
      {
        old: `multiple('缓存不命中可检查？', ['outputs 配置', '环境变量', 'lockfile', '组件颜色'], [0, 1, 2],`,
        new: `multiple('在 Monorepo 使用 Turborepo/Nx 等工具执行增量构建时，如果遭遇“本地缓存无法命中”的现象，应检查？', ['配置文件中 outputs 和 inputs 包含的物理资源路径是否正确', '构建命令中是否混入了未声明的环境变量（导致 hash 不一致）', '版本库中 lockfile 依赖文件是否发生实质性变动或发生版本漂移', '组件库内部主题变量定义的选择器名称及组件颜色是否被修改'], [0, 1, 2],`
      },
      {
        old: `multiple('样式隔离可关注？', ['CSS Modules/Scoped CSS', 'Shadow DOM', '命名空间约束', '全局 reset 随意覆盖'], [0, 1, 2],`,
        new: `multiple('在微前端或公共基础库的研发中，为了防止由于组件样式冲突导致的界面错乱，可以采取的样式隔离手段包括？', ['启用 CSS Modules 或框架自带的 Scoped CSS 机制', '使用原生 Web Components 中的 Shadow DOM 物理隔离沙箱', '引入 CSS 命名空间约束（如 BEM 规范）强制实现样式前缀隔离', '在全局范围频繁追加 !important 的 reset 样式以强制覆盖业务优先级'], [0, 1, 2],`
      },
      {
        old: `multiple('业务依赖私有 DOM 结构可能导致？', ['升级后样式失效', '测试选择器失效', '埋点失效', '接口自动加速'], [0, 1, 2],`,
        new: `multiple('如果业务应用强行依赖和解构组件库内部的私有 DOM 节点树结构，可能导致的隐患包括？', ['组件库小版本升级重构时，业务页面的样式布局大面积坍塌', '自动化测试中基于深层 DOM 嵌套的选择器定位失效并阻断 CI', '无埋点监控系统基于 DOM 结构路径计算的点击数据指标失真', '微服务网关在对静态页面进行协商缓存协商时自动提升接口解析时延'], [0, 1, 2],`
      }
    ]
  },
  rendering: {
    path: path.join(baseDir, 'rendering-architecture-content.js'),
    replacements: [
      {
        old: `multiple('SSR 的代价包括？', ['服务端容量', 'Hydration 复杂度', '缓存设计', '完全不需要 JS'], [0, 1, 2],`,
        new: `multiple('在前瞻性架构设计中选择服务端渲染（SSR）方案时，团队通常需要付出的工程代价包括？', ['需要提供并维护更高并发计算负载的服务端 Node.js 容器容量', '需要在浏览器端执行 Hydration 并注入全量的运行时 JS bundle', '需要精心设计服务端接口缓存、HTML 缓存与页面降级防雪崩策略', '不需要在客户端执行任何 JavaScript 逻辑代码即可完成全页渲染'], [0, 1, 2],`
      },
      {
        old: `multiple('SSG 更适合？', ['文档', '博客', '营销页', '每个用户完全不同的实时控制台'], [0, 1, 2],`,
        new: `multiple('静态站点生成（SSG）方案，最适合应用于以下哪些高 SEO 要求且低动态更新的场景？', ['产品设计规范、技术使用文档或帮助中心页面', '新闻资讯、技术博客或更新日志（Changelog）发布页面', '用于广告投放、产品展示的活动页和公共营销页', '需要强登录鉴权且每个用户展示数据完全不同的实时控制台页面'], [0, 1, 2],`
      },
      {
        old: `multiple('优化 Hydration 成本可考虑？', ['减少客户端组件范围', '拆分 JS', '延后非关键脚本', '增加无关依赖'], [0, 1, 2],`,
        new: `multiple('为了优化同构 SSR 应用在首屏加载时的注水（Hydration）开销，可以考虑的优化方向包括？', ['尽量减小客户端组件（Client Component）的作用域范围', '对客户端 JS 进行代码分割（Code Splitting）以减少首屏加载大小', '使用 defer/async 或在 idle 状态下延后执行非关键交互脚本', '在构建打包时将大量不相关的第三方依赖强行合并进公共 entry chunk 中'], [0, 1, 2],`
      },
      {
        old: `multiple('RSC 可帮助改善？', ['客户端 JS 体积', '服务端取数边界', '密钥留在服务端', '所有 INP 问题自动消失'], [0, 1, 2],`,
        new: `multiple('在 React 体系中，引入 React Server Components (RSC) 底层设计的工程红利包括？', ['将纯静态的渲染逻辑留在服务端，有效缩减客户端的 JS Bundle 物理体积', '拉近渲染端与数据源的物理距离，在服务端直接执行高性能数据库取数', '让敏感的接口密钥和私有业务库完全留在 Node 服务端以防范泄露', '能够自动优化和解决客户端交互在点击事件响应时的一切 INP 退化问题'], [0, 1, 2],`
      }
    ]
  },
  quality: {
    path: path.join(baseDir, 'testing-quality-content.js'),
    replacements: [
      {
        old: `multiple('适合单元测试的内容包括？', ['纯函数', '状态计算', '边界条件', '完整支付链路'], [0, 1, 2],`,
        new: `multiple('在分层测试实践中，以下哪些前端研发内容最适合由低成本的单元测试（Unit Test）来覆盖？', ['项目中定义的各种纯算法逻辑、纯工具函数与解析器', '状态管理（Store）在不同 action 触发下的状态状态流转逻辑', '数据解析器在面临各种边缘条件（Edge Cases）或非法输入时的防御表现', '依赖多个分布式服务网关及扫码交互的完整支付购买支付链路'], [0, 1, 2],`
      },
      {
        old: `multiple('降低 E2E flake 的手段包括？', ['稳定 locator', '自动等待', '隔离测试数据', '固定 sleep 所有步骤'], [0, 1, 2],`,
        new: `multiple('在保障持续集成 CI 环境下 E2E 自动化测试用例的高稳定性时，降低偶发性测试失败（Flaky）的有效手段包括？', ['使用基于组件角色或文本的语义化定位器以稳定 locator 查找', '启用测试框架提供的自动等待机制（Auto-waiting）而非强行死等', '为每个测试线程或测试用例准备物理隔离、干净的测试数据环境', '在测试执行步骤的任意位置硬编码固定暂停几秒钟（如 sleep 3s）'], [0, 1, 2],`
      },
      {
        old: `multiple('E2E 测试数据隔离可以避免？', ['并发污染', '历史数据影响', '账号共享冲突', '浏览器不支持 HTML'], [0, 1, 2],`,
        new: `multiple('在 E2E 自动化测试中，对测试用例执行“测试数据隔离”，主要能够防范哪些偶发性的用例报错？', ['在并发测试时，不同执行线程对同一个数据库实体修改所造成的并发污染', '残留的历史测试垃圾数据对后续查询或统计断言逻辑的脏数据影响', '多个测试用例同时共享登录同一个测试账号时触发的强退与会话冲突', '客户端浏览器由于缺少 AST 解析引擎导致无法正常渲染和解析 HTML 骨架'], [0, 1, 2],`
      }
    ]
  },
  state: {
    path: path.join(baseDir, 'state-data-content.js'),
    replacements: [
      {
        old: `multiple('适合 URL state 的内容包括？', ['分页页码', '筛选条件', '搜索关键词', '弹窗内部 hover 状态'], [0, 1, 2],`,
        new: `multiple('在设计单页应用（SPA）的状态管理时，以下哪些类型的页面状态最适合由 URL 参数（Query Parameter）承载？', ['列表页当前的分页页码，以支持用户分享链接时直接定位', '表单筛选组件中，用户当前勾选的分类或过滤条件', '全局或局部搜索框中，用户当前输入的搜索关键词', '页面交互时，用户鼠标悬停在弹窗或悬浮提示上的 hover 状态'], [0, 1, 2],`
      },
      {
        old: `multiple('mutation 成功后可做？', ['更新相关缓存', '失效相关 query', '重新拉取数据', '忽略所有缓存'], [0, 1, 2],`,
        new: `multiple('在使用现代数据获取库（如 React Query）执行 Mutation 写操作成功后，为了保障页面数据的一致性，通常可以执行？', ['通过手动写入（setQueryData）将最新响应数据直接更新进相关缓存', '将所有依赖此数据的查询标记为失效（invalidateQueries）以触发按需刷新', '在后台静默发起网络请求以重新拉取最新的列表或详情数据', '忽略所有的本地缓存结果，强制浏览器触发页面硬刷新以重载全部静态资源'], [0, 1, 2],`
      },
      {
        old: `multiple('并发请求错乱可通过？', ['AbortController', '忽略过期响应', '稳定请求序列', '随机覆盖状态'], [0, 1, 2],`,
        new: `multiple('当前端在输入框中执行高频键入搜索，连续触发多个异步请求并遭遇“网络竞态（Race Conditions，即后发请求先返回导致结果错乱）”时，可以采取？', ['利用 AbortController 在发起新请求时自动取消未完成的旧请求', '在接口回调中通过唯一的时序计数器识别并忽略已过期的响应结果', '借助类似 RxJS 的 switchMap 算子，在底层自动维护单一的请求订阅流', '忽略网络请求的返回顺序，直接将每次到达的响应数据强制覆盖本地状态'], [0, 1, 2],`
      },
      {
        old: `multiple('异步校验需要注意？', ['取消旧请求', '忽略过期响应', 'loading 状态', '永远同步阻塞输入'], [0, 1, 2],`,
        new: `multiple('在对表单字段执行远程接口异步校验（如用户名唯一性）时，前端实现需要注意并处理哪些点？', ['利用取消机制或 AbortController 清理未完成的旧校验请求', '识别网络竞态，避免较慢的旧校验结果覆盖较新的校验响应', '在接口等待期间提供合理的 loading 状态以对用户进行操作指引', '在异步校验进行时，强制以同步阻塞方式锁定输入框以禁止用户继续输入字符'], [0, 1, 2],`
      }
    ]
  },
  security: {
    path: path.join(baseDir, 'security-content.js'),
    replacements: [
      {
        old: `multiple('CSP 可以帮助限制？', ['脚本来源', '内联脚本执行', '违规上报', '数据库索引'], [0, 1, 2],`,
        new: `multiple('在现代 Web 安全体系中，配置内容安全策略（CSP）主要能够帮助防御和限制哪些行为？', ['允许执行的合法脚本、样式及媒体资源的域名来源白名单', '限制或完全禁止内联脚本（inline script）及 eval 函数的执行', '在检测到违规资源加载时，将拦截日志发送到指定的违规上报服务', '在服务端对数据库索引文件的读取权限进行细粒度控制'], [0, 1, 2],`
      },
      {
        old: `multiple('CSRF 防护手段包括？', ['SameSite Cookie', 'CSRF Token', 'Origin 校验', '用 GET 做删除操作'], [0, 1, 2],`,
        new: `multiple('为了有效防御跨站请求伪造（CSRF）漏洞，以下哪些措施属于业界推荐的防护手段？', ['为 Session Cookie 配置 SameSite=Strict 或 Lax 属性以限制跨站携带', '在请求体或自定义 Header 中附带随机生成的 CSRF Token 进行双重校验', '校验请求头中的 Origin 和 Referer 属性，拒绝非白名单的第三方请求源', '在后端接口设计中，强制使用 GET 请求方法来承载所有涉及删除或修改的操作'], [0, 1, 2],`
      },
      {
        old: `multiple('Cookie 发送范围相关属性包括？', ['Domain', 'Path', 'SameSite', 'font-weight'], [0, 1, 2],`,
        new: `multiple('在配置 HTTP 响应头中的 Set-Cookie 时，以下哪些 Cookie 属性直接影响其在浏览器中的发送范围与安全性？', ['设置 Domain 属性以决定 Cookie 能够向哪些子域名或主域名发送', '设置 Path 属性以限制 Cookie 仅在访问特定子路径路由时才被携带', '设置 SameSite 属性以防范在跨站（Cross-site）请求下凭证的自动附带', '设置全局的 font-weight 属性以控制浏览器在解析会话凭证时的字体加粗'], [0, 1, 2],`
      },
      {
        old: `multiple('CI 凭证治理应包括？', ['最小权限', '短周期或可轮换', '日志脱敏', '永久管理员权限'], [0, 1, 2],`,
        new: `multiple('为了保障持续集成与交付（CI/CD）流水线的凭证与密钥安全，CI 凭证治理规范应包括：', ['遵循最小特权原则，仅赋予流水线账号执行构建发布所需的最小权限', '为敏感密钥配置短暂的有效期，或接入自动化的短期可轮换凭证服务', '对流水线控制台打印的所有运行输出日志执行敏感字符与密匙的自动脱敏', '为了简化操作，将具有永久管理员权限的主账号密钥直接托管在 public 脚本中'], [0, 1, 2],`
      }
    ]
  },
  perf: {
    path: path.join(baseDir, 'performance-diagnostics-content.js'),
    replacements: [
      {
        old: `multiple('RUM 数据常见切分维度包括？', ['页面路径', '设备和网络', '浏览器和版本', '开发者姓名笔画'], [0, 1, 2],`,
        new: `multiple('在收集真实用户体验数据（RUM）以指导性能优化时，常见的性能指标切分维度包括？', ['用户当前访问的具体页面路径与路由分类', '用户所使用的物理设备类型与当前的网络吞吐速率', '用户运行的浏览器类型、主版本号以及渲染内核规范', '负责该模块的前端研发团队成员的姓名笔画数量'], [0, 1, 2],`
      },
      {
        old: `multiple('图片 LCP 慢可能检查？', ['图片格式和尺寸', 'preload/fetchpriority', 'CDN 缓存', 'CSS 变量命名'], [0, 1, 2],`,
        new: `multiple('在定位和优化页面中由关键首屏图片引发的 LCP 慢问题时，应重点排查？', ['首屏大图的压缩格式、物理尺寸以及是否包含合理的响应式多图规格', '是否对 LCP 图片配置了 link preload 预加载与 fetchpriority="high"', '图片资源是否成功命中了 CDN 的边缘节点缓存并实现了低时延分发', '页面内部自定义的全局 CSS 主题变量及局部样式属性命名是否规范'], [0, 1, 2],`
      },
      {
        old: `multiple('降低主线程压力的手段包括？', ['拆分长任务', 'Web Worker', '减少渲染范围', '一次渲染 10 万行'], [0, 1, 2],`,
        new: `multiple('当浏览器主线程负载过重导致页面交互无响应时，可以采取哪些优化手段降低主线程压力？', ['将耗时超过 50ms 的 Long Task 拆分为多个使用 scheduler.yield 让出主线程的小任务', '将非 DOM 操作的复杂 CPU 密集型计算（如大数据过滤）移至 Web Worker 中执行', '启用虚拟列表或按需懒加载，缩减单次布局和绘制的 DOM 渲染范围', '将 10 万行大列表数据不加任何优化地一次性全量挂载并渲染至页面中'], [0, 1, 2],`
      },
      {
        old: `multiple('排查 CLS 可使用？', ['DevTools Layout Shifts', 'Lighthouse', 'RUM CLS 数据', 'Git commit message'], [0, 1, 2],`,
        new: `multiple('当监控到页面的累计布局偏移（CLS）指标不达标时，开发者可以使用哪些工具和手段定位并分析偏移来源？', ['利用 Chrome DevTools 中的 Performance 面板过滤并追踪 Layout Shift 节点', '运行 Lighthouse 进行静态性能审计以获取潜在的无宽高布局偏移元素建议', '收集真实用户的 RUM CLS 偏移数据以统计高频发生布局闪烁的组件', '审查团队历史提交日志中的 Git commit message 以推算样式变更的物理时间'], [0, 1, 2],`
      },
      {
        old: `multiple('页面越用越慢可观察？', ['JS Heap', 'DOM 节点数', '事件监听器数量', 'README 字数'], [0, 1, 2],`,
        new: `multiple('当用户反馈某个单页应用在使用几小时后，页面交互响应越来越慢甚至崩溃卡死时，开发者在排查内存泄漏时应重点观察：', ['利用 Chrome DevTools 内存面板观察 JS Heap（堆内存）是否持续攀升而无法回收', '观察当前活跃的 DOM 节点总数是否随着交互操作呈线性无阻挡式上升', '利用 Performance 监视在后台注册的 Active Event Listeners（事件监听器）数量', '审查项目根目录下托管的 README 配置文件在发布后的累计字符数量变化'], [0, 1, 2],`
      }
    ]
  }
};

let totalReplacements = 0;
let totalApplied = 0;

for (const [key, config] of Object.entries(files)) {
  if (!fs.existsSync(config.path)) {
    console.error(`[ERROR] 文件不存在: ${config.path}`);
    continue;
  }
  let content = fs.readFileSync(config.path, 'utf8');
  let fileApplied = 0;

  for (const replacement of config.replacements) {
    totalReplacements++;
    if (content.includes(replacement.old)) {
      content = content.replace(replacement.old, replacement.new);
      fileApplied++;
      totalApplied++;
    } else {
      console.warn(`[WARN] [${key}] 无法匹配项: ${replacement.old}`);
    }
  }

  if (fileApplied > 0) {
    fs.writeFileSync(config.path, content, 'utf8');
    console.log(`[SUCCESS] [${key}] 成功更新了 ${fileApplied}/${config.replacements.length} 个多选题。`);
  }
}

console.log(`[SUMMARY] 整体处理完毕，总共成功匹配并替换 ${totalApplied}/${totalReplacements} 个多选题。`);
