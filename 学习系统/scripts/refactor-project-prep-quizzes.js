import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/docs/博客文档/项目准备/';

// 1. 10个通用文件（模板选择题）替换规则
const templateReplacements = [
  // Q1
  { old: '直接列 API 和代码文件', new: '直接罗列底层物理 API 属性以及相关代码文件模块结构', option: 'A' },
  { old: '先讲自己写了很多代码', new: '仅以个人开发代码体量和加班时长等纯工作量数据作为开场指标', option: 'C' },
  { old: '先避开结果和风险', new: '避开业务运行产出指标并忽略线上异常链路兜底方案的陈述', option: 'D' },
  // Q2
  { old: '背熟术语', new: '仅在字面上背诵各种高阶技术名词与架构用语', option: 'A' },
  { old: '只强调个人工作量', new: '在表述中仅突出个人承担的物理代码编写工作量', option: 'C' },
  { old: '只说业务很复杂', new: '仅通过空洞口号描述业务复杂度而无法给出具体的数据指标', option: 'D' },
  // Q4
  { old: '个人感觉体验更好', new: '结合 RUM 采样性能指标、状态变更调用栈 Trace 还原与错误日志库聚合', option: 'A' },
  { old: '说大家都觉得不错', new: '通过 Lighthouse CI 门禁检查及生产环境发布前后的灰度指标对比', option: 'C' },
  { old: '重复技术方案细节', new: '在开发机和低端物理设备上对交互响应指标进行多轮基准测试', option: 'D' },
  // Q5
  { old: '变量命名是否统一', new: 'UI 组件树打包时的体积膨胀与 CSS 选择器优先级覆盖冲突', option: 'A' },
  { old: '页面颜色是否统一', new: '在多应用 Monorepo 环境下的物理依赖治理与版本漂移', option: 'C' },
  { old: '是否用了最新框架', new: '静态资源在多节点 CDN 上的缓存失效与发布部署延迟', option: 'D' },
  // Q6
  { old: '按钮文案是否简洁', new: '构建过程中由于 Source Map 文件体积过大导致的内存泄露', option: 'A' },
  { old: '是否能删除所有测试', new: '打包后的单个 JavaScript 脚本在面对大规模模块解析时的冷启动耗时', option: 'C' },
  { old: '是否能完全不改代码', new: '不同团队在进行模块发布时的依赖拓扑与类型推导管理', option: 'D' },
  // Q7
  { old: '我按需求写完了页面', new: '仅在业务层面按照产品交付需求完成全部前端静态页面的编写', option: 'A' },
  { old: '我用了很多组件', new: '仅在项目中引入并拼接了大量的第三方通用 UI 组件库', option: 'C' },
  { old: '我没有参与决策', new: '声明个人并未参与任何系统架构层面的技术选型与取舍决策', option: 'D' },
  // Q8
  { old: '说简单方案一定不好', new: '横向对比轻量化实现与当前架构在可维护性与边界处理上的差异', option: 'A' },
  { old: '回避问题', new: '说明简单设计在应对高并发流式渲染或深层环路依赖时的局限性', option: 'C' },
  { old: '只说领导要求', new: '评估复杂业务规模化扩展时的协作成本与潜在的技术债开销', option: 'D' },
  // Q9
  { old: '无关技术名词', new: '基于 Web Worker 的 CPU 密集型计算迁移与多线程状态同步限制', option: 'A' },
  { old: '个人加班时间', new: '系统可观测性建立、发布回滚策略设计与长期架构演进路线规划', option: 'C' },
  { old: '和项目无关的库推荐', new: '在 CI/CD 阶段实施静态代码安全性扫描与细粒度凭证治理机制', option: 'D' },
  // Q10
  { old: '直接报最大数字', new: '结合性能预算与灰度验证范围进行分阶段数据收集', option: 'A' },
  { old: '避开所有数字', new: '通过线上错误率及首屏时间看板来统计性能变化趋势', option: 'C' },
  { old: '说绝对适用于所有页面', new: '排除网络波动及本地缓存协商干扰后的采样统计', option: 'D' },
  // Q11
  { old: '你用了几个文件', new: '接口响应在发生网络竞态时的时序管理与本地状态覆盖', option: 'A' },
  { old: '你是否会写 CSS', new: '大文件上传过程中对于网络通道占用与并发限制的控制策略', option: 'C' },
  { old: '你喜欢哪个编辑器', new: '页面发生白屏崩溃时的用户路径回放与错误上报归因', option: 'D' },
  // Q12
  { old: '只说自己完全独立，不提依赖', new: '明确组件依赖边界、接口通信协议及多团队协作配合的责任划分', option: 'A' },
  { old: '只说需求很多', new: '阐述与后端、测试和运维在流水线灰度发布期间的安全止血预案', option: 'C' },
  { old: '不提上线过程', new: '描述系统升级时脏数据的向前兼容性及回滚方案的有效性', option: 'D' }
];

// 2. 项目证据链与开放方案题专项.md 替换规则
const evidenceReplacements = [
  // Q1
  { old: '只说用了什么技术', new: '仅在陈述中堆砌第三方依赖和库的名称', option: 'A' },
  { old: '只说写了很多代码', new: '仅以个人开发代码体量作为核心衡量指标', option: 'C' },
  { old: '只说团队很忙', new: '避开业务运行产出指标并忽略线上异常链路兜底方案的陈述', option: 'D' },
  // Q2
  { old: '改变按钮颜色', new: '调整全局 UI 主题变量及按钮圆角样式', option: 'B' },
  { old: '删除所有规则', new: '在打包构建阶段剔除所有的规则解析依赖', option: 'C' },
  { old: '让用户手动计算', new: '将动态联动计算退化为用户手动触发的表单校验', option: 'D' },
  // Q3
  { old: '用户投诉后', new: '运行时由异常拦截机制捕获到栈溢出错误后', option: 'B' },
  { old: '线上卡死后', new: '线上由于内存泄露触发页面卡死并崩溃后', option: 'C' },
  { old: '不需要阻断', new: '依赖拓扑图构建过程中忽略环形链路的静态校验', option: 'D' },
  // Q5
  { old: '所有首次加载慢问题', new: '排除网络协商缓存干扰后的首屏首次冷启动白屏问题', option: 'B' },
  { old: '服务端权限问题', new: '解决服务端在多节点分发时的静态文件跨域鉴权受限', option: 'C' },
  { old: 'CSS 选择器冲突', new: 'UI 库在进行微前端隔离时的 CSS 选择器命名冲突', option: 'D' },
  // Q6
  { old: '不能运行 JS', new: '导致主线程运行时完全无法解析 ESM 模块语法', option: 'B' },
  { old: '不能加载图片', new: '静态资源在多节点 CDN 上发生加载超时与响应中断', option: 'C' },
  { old: '会自动删除缓存', new: '宿主容器在运行期自动清除已注册的全局单例状态', option: 'D' },
  // Q7
  { old: '更多形容词', new: '补充表述性能优势 of 抽象非度量形容词', option: 'B' }, // Wait, 这里使用“的”
  { old: '更夸张的数字', new: '提供未经过灰度采样的局部高并发峰值数字', option: 'C' },
  { old: '不用解释', new: '仅陈述技术重构带来的工程自豪感而不提供度量数据', option: 'D' },
  // Q8
  { old: '保证随手能做', new: '承诺在下一阶段通过简单的依赖升级即可无缝达成', option: 'A' },
  { old: '说不用优化', new: '声明受限于当前底层硬件设备性能而无需进行任何处理', option: 'C' },
  { old: '只改 loading', new: '仅调整客户端交互时的 CSS Loading 动画展现时长', option: 'D' },
  // Q9
  { old: '直接写代码', new: '立即编写核心计算模块的底层 AST 解析逻辑', option: 'B' },
  { old: '先说自己不会', new: '坦白个人在复杂场景下的技术实现经验缺失', option: 'C' },
  { old: '只列技术名词', new: '罗列主流的第三方依赖包名称而不进行架构设计', option: 'D' },
  // Q10
  { old: '任一失败就刷新页面', new: '捕获到单个操作异常后直接中断主线程并执行页面重载', option: 'B' },
  { old: '所有任务同步执行', new: '将所有文件的移动任务强制约束在同步阻塞队列中顺序执行', option: 'C' },
  { old: '不记录失败原因', new: '丢弃所有的错误上下文信息且不记录任何异常状态', option: 'D' },
  // Q11
  { old: '每次全量刷新页面', new: '在每次切换索引时强行触发前端路由重载与页面全量刷新', option: 'B' },
  { old: '只用 alert', new: '通过阻塞式的运行时提示框中断用户的交互过程', option: 'C' },
  { old: '禁止用户切换', new: '在 CSS 动画执行期间利用事件拦截完全阻断用户的切换操作', option: 'D' },
  // Q12
  { old: '让 CSS 更快', new: '优化首屏 CSS 的关键渲染路径以加速 DOM 构建', option: 'B' },
  { old: '替代服务端合并', new: '替代服务端的文件合并与大文件分片组装逻辑', option: 'C' },
  { old: '跳过文件校验', new: '绕过客户端对于文件的强协商校验与安全性检查', option: 'D' },
  // Q13
  { old: '只重启本地服务', new: '仅在开发环境中重复启动本地代理与热更新服务', option: 'B' },
  { old: '只删除 node_modules', new: '彻底清除本地 node_modules 目录并重新执行包管理器安装', option: 'C' },
  { old: '只改背景色', new: '调整全局的 CSS 主体背景样式色值以期望获得视觉反馈', option: 'D' },
  // Q14
  { old: '永远公开给所有用户', new: '随构建产物一同部署并无限制公开于生产环境 CDN 节点', option: 'B' },
  { old: '完全不需要', new: '在构建脚本中彻底禁用 Source Map 文件的生成', option: 'C' },
  { old: '只能用于 CSS', new: '仅生成并使用针对 CSS 样式的源映射文件', option: 'D' },
  // Q15
  { old: '个人感觉', new: '凭开发人员的个人主观感受与开发机调试表现', option: 'A' },
  { old: '说大家觉得可以', new: '强调团队成员在内部评审时的口头认可度', option: 'C' },
  { old: '只重复方案', new: '重复阐述该项技术方案的底层实现细节与架构设计', option: 'D' },
  // Q16
  { old: '说简单方案一定不好', new: '坚称轻量级架构无法满足任何高并发高可靠性业务场景', option: 'B' },
  { old: '回避问题', new: '规避对两套方案性能指标及实施难度的对比', option: 'C' },
  { old: '说领导要求', new: '说明此方案为上级行政命令要求而无需进行技术论证', option: 'D' }
];

// Q7: 修复 "of" 问题
evidenceReplacements[6].new = '补充表述性能优势的抽象非度量形容词';

// 3. 面试复盘报告提升通过率.md 替换规则
const reviewReplacements = [
  // Q1
  { old: '项目完全没有深度', new: '项目在业务支撑与架构复杂度上完全缺失核心价值', option: 'A' },
  { old: '简历没有写任何项目', new: '个人履历中未能提供任何线上运行的业务案例', option: 'C' },
  { old: '只会 CSS', new: '技能栈过于单一且仅能完成基础的静态样式切图工作', option: 'D' },
  // Q2
  { old: '先讲工具名字，再讲自己很忙', new: '直接罗列底层工程打包工具的参数与个人任务量陈述', option: 'A' },
  { old: '只讲代码行数', new: '仅以个人开发代码行数作为核心指标', option: 'C' },
  { old: '先讲薪资预期', new: '避开业务运行产出指标并忽略线上异常链路兜底方案的陈述', option: 'D' },
  // Q3
  { old: '直接说一个库名', new: '直接罗列第三方依赖包名称而不进行架构设计', option: 'B' },
  { old: '只说可以做', new: '仅说明功能可实现而忽略所有降级方案', option: 'C' },
  { old: '先承认不会然后停止回答', new: '坦白个人在复杂场景下的技术实现经验缺失', option: 'D' },
  // Q4
  { old: '只背 UI 库 API', new: '仅在字面上背诵各种高阶技术名词与组件库属性', option: 'A' },
  { old: '只学 CSS 动画', new: '仅学习 CSS 选择器的高频过渡属性', option: 'C' },
  { old: '只看设计稿', new: '忽略底层机制仅根据视觉还原图进行页面排版', option: 'D' },
  // Q5
  { old: '二者完全一样', new: '两个 API 在底层运行时使用完全相同的引用机制', option: 'B' },
  { old: 'Object.hasOwn 只能查数组', new: '限制 Object.hasOwn 仅能用于数组类型实例', option: 'C' },
  { old: 'in 只能查 Symbol', new: '强制规定 in 运算符只能检测 Symbol 类型属性', option: 'D' },
  // Q6
  { old: '不能判断任何对象', new: '导致该工具在面对普通 Plain Object 时完全失效', option: 'B' },
  { old: '只能用于数字', new: '限制该方法的返回类型仅能匹配数字实例', option: 'C' },
  { old: '一定比所有方式都可靠', new: '认为该检测手段能够绝对隔离所有恶意的原型链篡改', option: 'D' },
  // Q7
  { old: '所有任务都不 catch', new: '允许任意子任务的异常直接抛出并中断 Promise 队列', option: 'B' },
  { old: '只使用同步循环', new: '采用同步阻塞的 for...of 循环并在迭代中同步等待', option: 'C' },
  { old: '失败后刷新页面', new: '捕获到单个操作异常后直接中断主线程并执行页面重载', option: 'D' },
  // Q8
  { old: '改按钮颜色', new: '调整全局 UI 主题变量及按钮圆角样式', option: 'B' },
  { old: '删除所有公式', new: '在打包构建阶段剔除所有的规则解析依赖', option: 'C' },
  { old: '全部交给用户手算', new: '将动态联动计算退化为用户手动触发的表单校验', option: 'D' },
  // Q9
  { old: '用户提交之后才随缘发现', new: '允许数据提交到服务端之后通过异常日志捕获', option: 'B' },
  { old: '线上崩溃后', new: '线上由于内存泄露触发页面卡死并崩溃后', option: 'C' },
  { old: '不需要处理', new: '依赖拓扑图构建过程中忽略环形链路的静态校验', option: 'D' },
  // Q10
  { old: '所有首次加载问题', new: '排除网络协商缓存干扰后的首屏首次冷启动白屏问题', option: 'B' },
  { old: '服务端鉴权问题', new: '解决服务端在多节点分发时的静态文件跨域鉴权受限', option: 'C' },
  { old: 'CSS 命名问题', new: 'UI 库在进行微前端隔离时的 CSS 选择器命名冲突', option: 'D' },
  // Q11
  { old: '直接让所有线上资源变小', new: '认为预编译能够直接物理缩减线上构建产物体积', option: 'B' },
  { old: '替代 HTTP 缓存', new: '强制代替客户端浏览器在传输层的强缓存机制', option: 'C' },
  { old: '替代 IndexedDB', new: '替代本地客户端的大容量结构化离线存储', option: 'D' },
  // Q12
  { old: '只是用了 UMD', new: '认为插件系统仅依赖 UMD 产物在全局作用域的挂载', option: 'B' },
  { old: '只是挂到 window 上', new: '仅通过向全局 window 对象注入属性来共享方法', option: 'C' },
  { old: '只是多写了几个页面', new: '认为插件的接入只是在物理上增加几个路由组件页面', option: 'D' },
  // Q13
  { old: '永远全量删除重建', new: '放弃任何节点复用直接将子节点全量销毁并重建', option: 'B' },
  { old: '只比较第一个节点', new: '仅对子节点序列的首个 DOM 节点执行浅层对比', option: 'C' },
  { old: '只用最长递增子序列', new: '仅依赖最长递增子序列算法而不进行双端指针移动', option: 'D' },
  // Q14
  { old: 'localStorage', new: '利用客户端同步的持久化离线缓存 localStorage', option: 'B' },
  { old: 'CSS transition', new: '依靠浏览器自身的 CSS transition 动画帧机制', option: 'C' },
  { old: 'JSON.stringify', new: '对虚拟 DOM 树进行深层的 JSON 序列化字符比对', option: 'D' },
  // Q15
  { old: '直接说不会然后结束', new: '坦白个人在复杂场景下的技术实现经验缺失并结束问答', option: 'B' },
  { old: '硬编线上经验', new: '虚构未经线上验证的伪造数据与高并发处理指标', option: 'C' },
  { old: '转移到无关话题', new: '规避问题并强行转移至与前端架构无关的业务讨论', option: 'D' },
  // Q16
  { old: '只说薪资', new: '仅从个人薪资报酬与福利待遇的角度进行阐述', option: 'A' },
  { old: '只吐槽公司', new: '单方面输出对前雇主在行政或团队管理上的负面评价', option: 'C' },
  { old: '只说 AI 冲击', new: '强调当前岗位完全受到大语言模型等 AI 技术的物理替代', option: 'D' },
  // Q17
  { old: '颜色、字体、图标', new: '仅关注组件的配色、字体声明与静态资源图标', option: 'B' },
  { old: '前端、后端、运维但不讲内容', new: '罗列开发、测试与运维角色分工而不提供技术整合细节', option: 'C' },
  { old: '只说会用聊天工具', new: '仅证明个人会使用大模型聊天工具作为日常辅助', option: 'D' },
  // Q19
  { old: '直接保证一定可以', new: '承诺在下一阶段通过简单的依赖升级即可无缝达成', option: 'A' },
  { old: '说不用优化', new: '声明受限于当前底层硬件设备性能而无需进行任何处理', option: 'C' },
  { old: '只改颜色', new: '仅调整客户端交互时的 CSS Loading 动画展现时长', option: 'D' },
  // Q21
  { old: '因为前端永远比后端安全', new: '基于前端沙箱在执行上下文中的绝对隔离与安全性', option: 'B' },
  { old: '因为后端不能写代码', new: '假定服务端容器完全不具备执行联动公式计算的能力', option: 'C' },
  { old: '因为可以绕过校验', new: '认为将逻辑放在前端可以有效规避网络数据传输校验', option: 'D' },
  // Q22
  { old: '直接 eval 用户输入', new: '允许在浏览器环境中直接使用 eval 函数执行未知输入', option: 'B' },
  { old: '放弃所有校验', new: '彻底放弃客户端及服务端对联动表达式的语法校验', option: 'C' },
  { old: '只靠用户自觉', new: '仅依靠操作人员在输入表达式时的规范性意识', option: 'D' },
  // Q23
  { old: '永远不更新', new: '强制将插件版本与宿主环境在物理上强行绑定且不进行升级', option: 'B' },
  { old: '每次强刷全站', new: '每次检测到版本变更时强制重载整个单页应用的入口 HTML', option: 'C' },
  { old: '让用户手动复制代码', new: '要求用户在界面上物理复制代码块以完成逻辑热插拔', option: 'D' },
  // Q24
  { old: '更多形容词', new: '补充表述性能优势的抽象非度量形容词', option: 'B' },
  { old: '更大的数字', new: '提供未经过灰度采样的局部高并发峰值数字', option: 'C' },
  { old: '不用解释', new: '仅陈述技术重构带来的工程自豪感而不提供度量数据', option: 'D' },
  // Q25
  { old: '同步阻塞主线程', new: '将所有子任务串行化并在 JavaScript 主线程中同步阻塞执行', option: 'B' },
  { old: '一次性创建无限任务', new: '瞬间向事件循环队列中压入无限数量的异步任务实例', option: 'C' },
  { old: '禁用用户输入', new: '在执行长任务期间通过全局遮罩强行拦截用户的所有操作', option: 'D' },
  // Q26
  { old: '适合所有关键任务', new: '将其作为首屏核心骨架屏绘制与关键交互逻辑的载体', option: 'B' },
  { old: '所有浏览器都完全一样', new: '假定所有主流浏览器内核对空闲时间的判定机制完全一致', option: 'C' },
  { old: '可以替代 Promise', new: '期望通过该机制完全替代微任务队列的异步编排能力', option: 'D' },
  // Q27
  { old: '删除 lockfile', new: '强制删除 package-lock.json 以实现每次全新拉取构建', option: 'B' },
  { old: '替代浏览器缓存', new: '替代客户端浏览器在传输层的强缓存及协商缓存机制', option: 'C' },
  { old: '替代 TypeScript', new: '作为类型安全校验方案来替代项目中的编译期静态检查', option: 'D' },
  // Q29
  { old: '只说自己写了很多代码', new: '仅以个人开发代码体量作为核心衡量指标', option: 'A' },
  { old: '只说用了热门技术', new: '罗列开发社区中热门的技术栈名称而不提供架构方案', option: 'C' },
  { old: '只讲页面数量', new: '仅通过物理交付的单页页面数量来论证项目的复杂性', option: 'D' },
  // Q30
  { old: '随便哪里都行', new: '表示对工作地点及个人职业规划无任何主观边界约束', option: 'B' },
  { old: '只看城市不看岗位', new: '强调仅基于特定地理区域选择而完全忽略岗位的技术成长性', option: 'C' },
  { old: '不回答', new: '拒绝在沟通中提供任何关于职业定位与地域倾向的信息', option: 'D' }
];

function replaceOption(content, old, newVal, option) {
  const escapedOld = old.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // 1. 匹配选项: A. xxx
  const optionRegex = new RegExp(`(^|\\n)(${option}\\.\\s*)${escapedOld}(\\s|\\n|$)`, 'g');
  content = content.replace(optionRegex, (match, p1, p2, p3) => {
    return p1 + p2 + newVal + p3;
  });

  // 2. 匹配解析中: - A：xxx 或 - A: xxx
  const descRegex = new RegExp(`(-?\\s*${option}[：:])\\s*${escapedOld}(?=[\\s不选|应选|。|\\n|，|\\.])`, 'g');
  content = content.replace(descRegex, (match, p1) => {
    return p1 + newVal;
  });

  return content;
}

// 遍历目录
const files = fs.readdirSync(baseDir);
let totalFiles = 0;
let totalReplaced = 0;

for (const file of files) {
  if (!file.endsWith('.md')) continue;
  const filePath = path.join(baseDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let replacements = [];
  if (file === '项目证据链与开放方案题专项.md') {
    replacements = evidenceReplacements;
    console.log(`[INFO] 文件 ${file} 使用专项证据链替换规则...`);
  } else if (file === '面试复盘报告提升通过率.md') {
    replacements = reviewReplacements;
    console.log(`[INFO] 文件 ${file} 使用专项面试复盘替换规则...`);
  } else {
    replacements = templateReplacements;
  }

  // 替换
  for (const rep of replacements) {
    content = replaceOption(content, rep.old, rep.new, rep.option);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[SUCCESS] 已更新文件: ${file}`);
    totalReplaced++;
  } else {
    console.log(`[NO CHANGE] 文件未发生更改: ${file}`);
  }
  totalFiles++;
}

console.log(`[SUMMARY] 共处理了 ${totalFiles} 个 Markdown 文件，其中 ${totalReplaced} 个文件被更新。`);
