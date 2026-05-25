import fs from 'fs';
import path from 'path';

const projectRoot = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/';

// 12个文件的替换规则配置
const fileReplacements = {
  'docs/博客文档/场景题/中高级前端系统设计开放题.md': [
    { old: '前端按钮隐藏', new: '基于 CSS 选择器在客户端将对应的交互按钮进行物理隐藏', option: 'B' },
    { old: 'CSS display none', new: '在前端运行时将 DOM 节点的 display 样式设为 none', option: 'C' },
    { old: '浏览器路由名称', new: '客户端路由跳转时的 URL 路径字符串标识', option: 'D' },
    { old: '直接无条件覆盖', new: '放弃任何前置校验直接向持久化数据库覆盖最新修改', option: 'B' },
    { old: '禁用所有保存', new: '强制在全局作用域内挂载写操作阻断以禁用所有保存行为', option: 'C' },
    { old: '每次编辑都刷新页面', new: '在触发输入或焦点变更时强行触发前端路由载入及全页面重载', option: 'D' },
    { old: '页面背景色', new: 'UI 组件在各主题下的全局配色方案与背景色配置', option: 'B' },
    { old: 'README 字数', new: '项目仓库中 README.md 配置文件的累计物理字节开销', option: 'C' },
    { old: 'Git 分支名', new: '版本控制系统中的多分支提交流水线命名规约', option: 'D' },
    { old: '浏览器不能渲染 HTML', new: '客户端渲染引擎由于内存消耗过大而无法正常解析骨架 DOM', option: 'B' },
    { old: '接口一定更快', new: '高吞吐量下网关层对大文件分片组装的网络响应效率', option: 'C' },
    { old: '不需要后端参与', new: '声明该鉴权系统设计完全脱离服务端鉴权与网络校验边界', option: 'D' }
  ],
  'docs/博客文档/场景题/JS 与 Web API 精确表达专项.md': [
    { old: '会让代码变短', new: '使得代码逻辑在编译成 AST 时能拥有更少物理节点深度', option: 'B' },
    { old: '方便写注释', new: '作为轻量级元数据自动在编译时注入额外的运行时调试信息', option: 'C' },
    { old: '可以替代 Promise', new: '强制代替 JavaScript 引擎中的微任务队列和事件循环调度机制', option: 'D' },
    { old: 'CSS 优先级', new: '浏览器解析 CSS 时由于选择器权重污染导致的渲染样式覆盖', option: 'B' },
    { old: '常规字体加载', new: '自定义 WebFont 资源在弱网环境下加载超时造成的 FOIT 无样式文本闪烁', option: 'C' }, // Wait, grep输出中写的是“字体加载”
    { old: '字体加载', new: '自定义 WebFont 资源在弱网环境下加载超时造成的 FOIT 无样式文本闪烁', option: 'C' },
    { old: '路由命名', new: '单页路由节点在解析动态 Path 时的路由权重配置冲突', option: 'D' },
    { old: '修改 CSS', new: '调整全局 UI 主题变量及 CSS 选择器的样式覆盖', option: 'B' },
    { old: '判断数组', new: '判断当前运行时的数据实例是否符合特定的数组规范', option: 'C' },
    { old: '创建 Web Worker', new: '在主线程中启动额外的多线程 Web Worker 以分配计算开销', option: 'D' },
    { old: '按钮颜色错误', new: '由于 CSS 选择器冲突引起的全局组件主题样式色值错乱', option: 'B' },
    { old: '路由路径太长', new: '前端路由解析过程中匹配到了过长且包含深层嵌套的动态路径', option: 'C' },
    { old: '文案不清楚', new: '国际化（i18n）多语言配置文件在提取静态字符时发生键值缺失', option: 'D' },
    { old: '不能执行 JavaScript', new: '导致该多线程环境完全无法解析和执行普通的 JavaScript 代码', option: 'B' },
    { old: '只能处理 CSS', new: '将其底层执行逻辑限制在仅能编译和优化样式表文件的范围内', option: 'C' },
    { old: '只能在 Node.js 中运行', new: '将该多线程运行容器物理限制在 Node.js 服务端运行时环境内', option: 'D' }
  ],
  'docs/博客文档/场景题/腾讯中高级前端场景题专项训练.md': [
    { old: '凭借经验预判瓶颈并优先对个人熟悉的简单页面进行局部优化', new: '凭借经验预判瓶颈并优先对个人熟悉的简单页面进行局部优化', option: 'C' }, // 这个无需再改
    { old: '凭感觉先优化一个自己熟悉的页面', new: '凭借经验预判瓶颈并优先对个人熟悉的简单页面进行局部优化', option: 'C' },
    { old: '只放一个更大的 loading', new: '在首屏挂载一个高消耗的复杂 CSS 加载动画', option: 'A' },
    { old: '禁止所有接口请求', new: '强行阻断所有异步网络请求的加载以保证主线程响应', option: 'C' },
    { old: '全部改成同步脚本', new: '将页面中的异步逻辑全部重构为阻塞式的同步脚本执行', option: 'D' },
    { old: '为了让代码更短', new: '缩减 JSBridge 运行时在主线程 of 物理代码体积', option: 'A' },
    { old: '为了让代码更短', new: '缩减 JSBridge 运行时在主线程的物理代码体积', option: 'A' },
    { old: '为了提升 CSS 性能', new: '优化客户端 Webview 在渲染时的 CSS 选择器权重匹配', option: 'C' },
    { old: '为了减少图片体积', new: '压缩多媒体资源在跨端传输过程中的网络传输损耗', option: 'D' },
    { old: '放在 localStorage 永久保存', new: '将 Token 持久化存储于客户端同步的本地离线缓存（LocalStorage）中', option: 'D' },
    { old: 'alert', new: '利用阻塞式的 alert 提示框拦截每一次视口变更', option: 'B' },
    { old: 'document.write', new: '频繁触发 document.write 写入以强行插入埋点 DOM', option: 'C' },
    { old: '同步 while 循环', new: '通过在 JavaScript 主线程中执行同步 while 耗时循环进行阻塞监听', option: 'D' },
    { old: 'loading 文案太短', new: '动态插入的 Loading 组件提示字符长度未达标', option: 'A' },
    { old: 'CSS 不能显示文字', new: '当前浏览器环境未正确支持 CSS 文本渲染规范', option: 'C' },
    { old: 'Promise 不存在', new: '运行时环境中未引入支持异步操作的 Promise 全局对象', option: 'D' },
    { old: '只说自己更喜欢某一个框架', new: '仅凭开发人员的主观编码喜好与个人情感偏向进行框架选择', option: 'C' }
  ],
  'docs/博客文档/工程化/前端可观测性与线上排障闭环.md': [
    { old: '让页面颜色更多', new: '统一前端组件的主题配置样式以改善首屏视觉体验', option: 'B' },
    { old: '替代所有后端日志', new: '在传输层完全截断并替代全部服务端接口异常日志的处理', option: 'C' },
    { old: '取消所有测试', new: '依靠运行时监控完全规避研发阶段的单元测试与回归校验', option: 'D' },
    { old: '减少接口数量', new: '在主线程解析过程中自动合并多路并发的网络数据请求', option: 'B' },
    { old: '增加 CSS 权重', new: '解决多应用 Monorepo 环境下的全局 CSS 选择器优先级覆盖冲突', option: 'C' },
    { old: '自动完成灰度发布', new: '借助服务端代理容器自动执行面向不同流量配比的灰度发布流程', option: 'D' },
    { old: '按钮圆角', new: '交互组件的按钮圆角边框及内边距样式', option: 'B' },
    { old: '文件名长度', new: '文件目录树中的文件名物理字符长度', option: 'C' },
    { old: '图片颜色', new: '静态多媒体资源在多节点 CDN 上的缓存失效色值', option: 'D' },
    { old: '替代用户登录', new: '代替客户端本地浏览器中的 Session 会话及登录凭证持久化', option: 'B' },
    { old: '压缩 JavaScript', new: '在静态编译阶段自动执行 JS 混淆以及文件体积压缩', option: 'C' },
    { old: '修复 CSS', new: '解决动态生成 DOM 时发生的样式冲突与选择器权重污染', option: 'D' }
  ],
  'docs/博客文档/性能优化/复杂页面性能诊断闭环.md': [
    { old: '直接删除所有图片', new: '在构建期强制剔除并阻断项目中全部多媒体静态资源的打包', option: 'B' },
    { old: '直接换框架', new: '采用最先进的重构框架把业务源码全量重写一遍', option: 'C' },
    { old: '只说加缓存', new: '仅通过全量强缓存手段来加速静态资源的传输速率', option: 'D' },
    { old: 'HTML title 太短', new: 'HTML 入口文件的 Title 属性物理字符长度未达标', option: 'B' },
    { old: 'Git commit 太多', new: '代码仓库中由于多分支合并引入了过多的 Git 提交历史记录', option: 'C' },
    { old: '图片 alt 文本太长', new: '首屏渲染时图片元素的 Alt 文本长度超出了浏览器解析边界', option: 'D' },
    { old: 'README 是否太短', new: '项目根目录下的 README 说明文档是否存在信息缺失', option: 'B' },
    { old: '路由名字是否中文', new: '前端单页应用（SPA）中路由节点的命名是否包含非 ASCII 字符', option: 'C' },
    { old: 'CSS 注释数量', new: '样式文件中由于编译打包遗留的 CSS 代码注释字节开销', option: 'D' }
  ],
  'docs/博客文档/Vue/Vue 3 响应式原理源码解析.md': [
    { old: '提高 JSON 序列化速度', new: '优化 JavaScript 引擎对深度嵌套对象执行 JSON 序列化的效率', option: 'A' },
    { old: '让 key 只能是字符串', new: '限制 targetMap 的第一层 Map 容器仅接受字符串类型的 Key 属性', option: 'C' },
    { old: '提升 TypeScript 推导能力', new: '加速编译期对组件 Props 与 Emits 的类型推导过程', option: 'D' },
    { old: 'CSS 动画掉帧', new: '高频交互触发导致的浏览器重绘掉帧与布局闪烁', option: 'A' },
    { old: '图片懒加载闪烁', new: '在弱网环境下静态资源懒加载策略造成的视觉偏移', option: 'C' },
    { old: '路由 Hash 变化', new: '客户端单页路由（SPA）在发生 Hash 变更时的历史栈覆盖', option: 'D' }
  ],
  'docs/博客文档/Vue/defineAsyncComponent 异步组件原理.md': [
    { old: '让组件变成全局组件', new: '强制将组件实例提升至全局应用上下文以避免重复导入', option: 'A' },
    { old: '让组件 props 自动校验', new: '对动态传入的 Props 参数在编译阶段执行严格的静态类型校验', option: 'C' },
    { old: '让组件跳过响应式更新', new: '规避因数据变更触发的依赖追踪以跳过整个组件树的更新', option: 'D' },
    { old: '为了让 chunk 更大', new: '合并相邻 of 异步依赖包以增大单次构建产物的物理体积', option: 'B' },
    { old: '为了让 chunk 更大', new: '合并相邻的异步依赖包以增大单次构建产物的物理体积', option: 'B' },
    { old: '为了禁止错误重试', new: '在加载失败时强制关闭加载器提供的内置错误捕获与重试机制', option: 'C' },
    { old: '为了让 SSR 失效', new: '阻断服务端同构渲染（SSR）在客户端的水合校验链路', option: 'D' },
    { old: '删除所有服务端 HTML', new: '剔除所有服务端渲染（SSR）生成的静态 HTML 文件片段', option: 'B' },
    { old: '禁止动态 import', new: '限制浏览器在客户端完全禁用 import() 等异步模块加载语法', option: 'C' },
    { old: '强制所有组件同步加载', new: '强行将项目中所有的异步拆包组件合并为单一的同步加载 Bundle', option: 'D' }
  ],
  'docs/博客文档/Vue/Vue 3 effect 触发次数与调度器.md': [
    { old: '标记当前是否处于 effect 收集依赖阶段', new: '标记当前全局上下文是否正处于数据流依赖收集链路中', option: 'A' },
    { old: '指示当前副作用监听器 ActiveEffect 实例是否已被物理卸载', new: '指示当前副作用监听器 ActiveEffect 实例是否已被物理卸载', option: 'C' }, // 这个无需再改
    { old: '标记 effect 是否已被销毁', new: '指示当前副作用监听器 ActiveEffect 实例是否已被物理卸载', option: 'C' },
    { old: '控制 effect 的执行优先级', new: '标识调度器中异步任务 Job 在微任务队列中的拓扑执行顺序', option: 'D' }
  ],
  'docs/博客文档/Vue/Vue 3 模板到 Render 函数转换.md': [
    { old: '经过 Minify 压缩的代码', new: '经过 Tree Shaking 剔除未引用运行时逻辑的精简版模块映射表', option: 'C' },
    { old: '虚拟 DOM 节点', new: '能够在浏览器中直接渲染的真实 DOM 节点树片段', option: 'D' },
    { old: '创建一个 Web Worker 执行编译代码', new: '在后台启动 Web Worker 线程以执行高计算开销的静态编译', option: 'A' },
    { old: '将 AST 序列化为 JSON', new: '将当前的 AST 数据结构深层序列化以绕过 V8 隐藏类限制', option: 'C' },
    { old: '注册全局组件', new: '向当前的全局应用实例注册具备动态模板特性的组件引用', option: 'D' }
  ],
  'docs/博客文档/Vue/Vue 3 复杂表单验证与提交.md': [
    { old: 'keep-alive 缓存', new: '"<KeepAlive>" 的生命周期缓存机制与多实例共享状态', option: 'C' },
    { old: 'teleport 挂载', new: '"<Teleport>" 传送门挂载后的 DOM 节点分层与样式隔离', option: 'D' },
    { old: '每个 input 的 placeholder 里', new: '对应表单字段在输入框中定义的占位符（Placeholder）属性内', option: 'A' },
    { old: 'CSS 选择器里', new: 'CSS 样式表的属性选择器或全局样式覆盖机制内', option: 'C' },
    { old: '路由守卫里', new: '路由守卫的导航重定向流程与全局钩子拦截器内', option: 'D' }
  ],
  'docs/博客文档/Vue/Vue 3 Diff 算法整体流程.md': [
    { old: '因为前向遍历语法不支持', new: '现代浏览器引擎在解析反向循环遍历时具有物理寄存器级别的缓存优势', option: 'C' },
    { old: '为了跳过 key 校验', new: '避免在 Diff 过程中由于父节点的 key 映射丢失导致子节点被强行卸载', option: 'D' }
  ],
  'docs/博客文档/React/React 并发渲染与性能取舍.md': [
    { old: '让浏览器 DOM 操作变成多线程：', new: '在主线程空闲时采用多线程 Worker 强行同步虚拟 DOM 树：', option: 'B' },
    { old: '自动消除所有 JS 计算成本：', new: '通过在编译期剔除所有不参与交互的无状态 React 组件以缩减运行时开销：', option: 'C' },
    { old: '自动减少接口请求数量：', new: '限制所有的 HTTP 请求使其在服务端合并后再发往客户端：', option: 'D' },
    { old: '删除所有状态', new: '将页面内的所有交互状态都强制转化为无状态组件以避开 Hook 追踪', option: 'C' },
    { old: '把接口全部改成同步请求', new: '强行阻断所有异步网络请求的加载以保证主线程能优先响应交互', option: 'D' },
    { old: '输入框当前字符显示：', new: '客户端输入框中当前键入字符的物理视觉呈现：', option: 'B' },
    { old: '支付确认按钮禁用状态：', new: '确认支付时提交按钮的即时禁用置灰状态：', option: 'C' },
    { old: '权限校验结果：', new: '阻断当前会话访问的同步鉴权路由跳转：', option: 'D' }
  ]
};

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

let totalFiles = 0;
let totalReplaced = 0;

for (const [relPath, replacements] of Object.entries(fileReplacements)) {
  const filePath = path.join(projectRoot, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] 文件不存在: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 执行替换
  for (const rep of replacements) {
    content = replaceOption(content, rep.old, rep.new, rep.option);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[SUCCESS] 已更新文件: ${relPath}`);
    totalReplaced++;
  } else {
    console.log(`[NO CHANGE] 文件没有发生实际修改: ${relPath}`);
  }
  totalFiles++;
}

console.log(`[SUMMARY] 第十阶段共处理了 ${totalFiles} 个 Markdown 文件，其中 ${totalReplaced} 个文件被更新。`);
