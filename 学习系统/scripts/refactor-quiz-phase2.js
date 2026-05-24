import fs from 'fs';
import path from 'path';

const securityFilePath = path.resolve('/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/data/security-content.js');
const perfFilePath = path.resolve('/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/data/performance-diagnostics-content.js');

// === 1. 重构安全模块 ===
let securityContent = fs.readFileSync(securityFilePath, 'utf8');
const securityReplacements = [
  {
    old: `single('XSS 的本质是？', ['不可信内容被当作代码执行', '图片太大', '接口太慢', 'CSS 权重太高'], 0,`,
    new: `single('跨站脚本攻击（XSS）的核心安全本质是：', ['浏览器将未经安全净化、不可信的用户输入数据，误作为合法的可执行代码进行解析并执行。', '攻击者利用网络劫持，向客户端静默注入了超过最大体积限制的加密资源包。', '本地 Cookie 凭证未配置相同源策略限制，被第三方站点通过 iframe 强制读取。', '前端打包脚本未能正确执行 Tree Shaking，导致无用的死代码在宿主环境意外运行。'], 0,`
  },
  {
    old: `single('Trusted Types 主要约束什么？', ['危险 DOM sink 的输入', '图片尺寸', 'HTTP 缓存', 'Git 分支'], 0,`,
    new: `single('现代浏览器引入 Trusted Types API，其主要安全防护抓手是约束：', ['导致 DOM XSS 的危险 Sink API（如 innerHTML、eval 等）的参数输入，强制其使用经过校验的类型安全对象。', '前端应用通过 Fetch API 向不受信任的第三方镜像源发起数据请求。', 'HTTP 协议在建立传输握手时，对静态资源强缓存时间策略的拦截行为。', '本地存储（localStorage）在进行跨站隔离时，由宿主环境自动添加的密匙前缀。'], 0,`
  },
  {
    old: `single('富文本安全最不推荐的是？', ['手写正则过滤所有危险 HTML', '使用成熟 sanitizer', '限制允许标签', '限制 URL 协议'], 0,`,
    new: `single('在处理富文本编辑器输出的 HTML 安全清洗时，以下哪种防护方案最不推荐且极易产生漏防？', ['编写自定义的正则表达式来手动过滤和剔除危险标签及属性。', '引入业界成熟的 Sanitizer 清洗库（如 DOMPurify）执行上下文感知清洗。', '采用严格的白名单机制，限制富文本中允许渲染的 HTML 标签种类。', '对富文本内部的 a 标签超链接执行 URL 协议方案（如阻断 javascript:）校验。'], 0,`
  },
  {
    old: `single('CSRF 主要利用浏览器什么行为？', ['自动携带目标站点 Cookie', '自动压缩图片', '自动执行 TS', '自动生成接口'], 0,`,
    new: `single('跨站请求伪造（CSRF）攻击得以成功的根源，主要利用了浏览器的哪项默认行为？', ['跨站发起 HTTP 请求时，浏览器会自动在请求头中携带该目标域名下未过期的 Cookie 凭证。', '浏览器在渲染 DOM 节点时，会自动解压并解析包含脚本段的图片元数据。', '在执行 TypeScript 脚本编译时，浏览器在后台静默开启的自动接口同步机制。', '对包含第三方资源的 iframe 容器执行无视同源策略的安全沙箱豁免。'], 0,`
  },
  {
    old: `single('Secure Cookie 表示？', ['只通过 HTTPS 等安全通道发送', '永不过期', '可被任意 JS 读取', '只能本地使用'], 0,`,
    new: `single('Cookie 的 Secure 属性在网络安全防护中的具体表征是：', ['限制该 Cookie 必须仅在加密信道（如 HTTPS）中才能被浏览器附带并发送给服务端。', '强制设定 Cookie 的过期时间与主应用会话解绑，保证凭证永不过期。', '允许浏览器端脚本（如 document.cookie）直接读取并对其值进行安全加密。', '限制该凭证只能在 localhost 或本地局域网（127.0.0.1）的调试阶段使用。'], 0,`
  },
  {
    old: `single('删除订单这类操作最不应该使用？', ['GET', 'POST/DELETE 并鉴权', 'CSRF Token', 'Origin 校验'], 0,`,
    new: `single('在设计“删除订单”等具有副作用的敏感接口时，以下哪种做法最不安全、最容易遭受 CSRF 攻击？', ['使用无状态且幂等的 GET 请求方法来承载删除操作。', '使用 POST 或 DELETE 方法，并对请求执行二次签名与鉴权校验。', '在请求体或自定义 Header 中附带随机生成的 CSRF Token 进行校验。', '结合 Origin 和 Referer 头部对请求源进行严格的同源策略审查。'], 0,`
  },
  {
    old: `single('为什么不能把服务端密钥放进前端环境变量？', ['前端产物会暴露给用户', '会让 CSS 失效', '会减少题目数量', '会阻止路由'], 0,`,
    new: `single('在前端工程化实践中，严禁将服务端的敏感密钥（如数据库密码、私钥等）配置进前端环境变量，其根本原因在于：', ['前端环境变量在构建打包时会被静态字符串替换，最终产物以明文形式向所有访问用户公开暴露。', '构建工具在做 AST 分析时，引入复杂私钥会导致编译出的 CSS 语法结构大面积失效。', '浏览器运行时会自动对 import.meta.env 中的长字符串变量进行校验，从而强行阻断单页路由跳转。', '私有密匙会直接触发服务端网关的混淆限制，导致 Staging 环境中的 CDN 资源回源超时。'], 0,`
  },
  {
    old: `single('SRI 的主要作用是？', ['校验第三方资源完整性', '提高 TS 编译速度', '替代登录', '压缩图片'], 0,`,
    new: `single('子资源完整性（SRI）在现代 Web 安全架构中的主要作用是：', ['校验加载的第三方托管 CDN 资源是否被恶意篡改或劫持，保障代码加载的真实性。', '利用浏览器多线程特性加速大型 TypeScript 文件在编译阶段的类型解析。', '在用户会话过期时，自动拦截 HTTP 请求以作为无感双 Token 登录续期。', '在图片资源解析阶段通过硬件加速提高各种高分辨率图像的压缩与解码速率。'], 0,`
  },
  {
    old: `single('postinstall 风险来自哪里？', ['安装阶段能执行依赖包脚本', '只能修改 README', '只能压缩 CSS', '不能运行代码'], 0,`,
    new: `single('在 NPM 包管理器生态下，postinstall 等生命周期脚本所带来的供应链安全隐患在于：', ['包在安装阶段被默认执行其自定义脚本，可在本地开发机或 CI 流水线上执行越权恶意命令。', '仅限制于对本地项目的 README.md 文档进行无授权的文字追加与格式篡改。', '打包工具在执行 Tree Shaking 时会自动将其作为无副作用（sideEffects）文件整体过滤。', '它会拦截所有的 npm lifecycle 事件，导致本地项目依赖图谱完全处于不可读取状态。'], 0,`
  }
];

let securityApplied = 0;
for (const replacement of securityReplacements) {
  if (securityContent.includes(replacement.old)) {
    securityContent = securityContent.replace(replacement.old, replacement.new);
    securityApplied++;
  } else {
    console.warn(`[WARN] 安全模块未匹配项: ${replacement.old}`);
  }
}

if (securityApplied > 0) {
  fs.writeFileSync(securityFilePath, securityContent, 'utf8');
  console.log(`[SUCCESS] 安全模块成功替换了 ${securityApplied}/${securityReplacements.length} 个题目。`);
}

// === 2. 重构性能诊断模块 ===
let perfContent = fs.readFileSync(perfFilePath, 'utf8');
const perfReplacements = [
  {
    old: `single('性能优化最正确的起手式是？', ['先采集指标并定位瓶颈', '先重写所有代码', '先删除所有图片', '只问开发电脑是否流畅'], 0,`,
    new: `single('在对大型 Web 应用进行性能优化治理时，以下哪项作为“起手式”最科学？', ['通过性能分析工具收集真实用户体验指标（RUM），结合性能瀑布图定位核心瓶颈。', '立即将整个旧业务项目推倒，采用最新的框架 and 组件库进行全量重构。', '采用批量无损压缩的方式，将首屏渲染所需的所有关键静态图像文件强制删除。', '仅在开发环境以开发本机的执行帧率是否流畅作为线上用户体验的唯一标准。'], 0,`
  },
  {
    old: `single('INP 主要衡量什么？', ['交互后的响应和下一次绘制', '首屏最大内容出现', '页面是否乱跳', '接口字段命名'], 0,`,
    new: `single('核心 Web 指标（Core Web Vitals）中的 INP（互动到下次绘制）主要衡量：', ['用户在页面生命周期内发生的所有交互操作后，到浏览器下一次重绘之间的最大延迟时间。', '页面首屏加载过程中，视口内可见的最大图像或文本块被渲染并完整呈现的时间点。', '由于异步资源（如无宽高的广告图）加载导致的页面视觉元素非预期位移。', '客户端与服务端进行数据交互时，接口字段命名规范所带来的本地反序列化开销。'], 0,`
  },
  {
    old: `single('p75 的价值是？', ['关注大多数用户而不是少数极端或平均掩秘', '替代所有监控', '只用于后端 CPU', '用于 CSS 命名'], 0,`,
    new: `single('在衡量 Core Web Vitals 性能数据时，推荐关注第 75 百分位数（p75）指标的主要价值在于：', ['能够真实代表绝大多数用户的实际访问体验，同时过滤掉极端网络环境下的噪音数据。', '能够完全替代生产环境中所有的全链路主动拨测与性能异常告警机制。', '该数据段专门用于评估后端服务在分布式网关层所面临的 CPU 算力分配负载。', '用于评估 CSS 自定义命名规范在复杂组件样式加载中的冲突概率。'], 0,`
  },
  {
    old: `single('优化 LCP 第一步应该做什么？', ['确认 LCP 元素和阶段', '盲目压缩所有 JS', '删除所有 CSS', '重命名组件'], 0,`,
    new: `single('针对 Largest Contentful Paint (LCP) 指标退化的问题进行性能专项优化时，第一步应当：', ['确定引发 LCP 的具体 DOM 元素，并拆分出加载延迟、渲染延迟等核心渲染阶段。', '盲目调高构建工具的压缩率配置，对项目中引入的所有 JS 库做无差别二次重压缩。', '将整个应用的全局外置 CSS 样式文件强制移除以缩短关键渲染路径。', '通过全局修改组件的 PascalCase 命名规则来降低浏览器解析模板的语法树开销。'], 0,`
  },
  {
    old: `single('TTFB 高更可能指向哪类问题？', ['服务端、CDN、网关或缓存', '按钮文案', 'DOM class 名称', '图片 alt 文案'], 0,`,
    new: `single('当监控数据显示某个页面的 TTFB（首字节到达时间）显著偏高时，通常意味着瓶颈存在于：', ['后端接口处理逻辑缓慢、CDN 回源率过高、网关路由开销大或缓存策略失效。', '浏览器在渲染阶段解析过长的 DOM class 类名或 HTML 按钮文本内容所带来的 CPU 负载。', '前端图片资源缺少 alt 描述属性，导致浏览器无法利用加速通道对其进行网络预解析。', '本地 Service Worker 在处理离线缓存数据时，因为内存溢出触发了路由兜底机制。'], 0,`
  },
  {
    old: `single('fetchpriority="high" 更适合用于？', ['真正关键的首屏 LCP 图片', '所有非首屏图片', '所有接口请求', '所有 CSS 文件'], 0,`,
    new: `single('在图像或静态资源标签上配置 fetchpriority="high" 属性，最推荐的工程实践场景是：', ['优先应用于对页面首屏 Largest Contentful Paint (LCP) 起决定性作用的英雄大图。', '强制应用到位于视口之外的所有非关键的轮播图或底部装饰性背景图像。', '对单页应用中发生的所有异步 API 接口请求进行拦截并提升其连接复用权重。', '强制作用于项目中所有的第三方外链 CSS 样式表以提升浏览器样式解析优先级。'], 0,`
  },
  {
    old: `single('虚拟列表主要解决什么？', ['大量 DOM 渲染和更新成本', 'Cookie 丢失', 'DNS 慢', '图片格式错误'], 0,`,
    new: `single('在中高级前端架构设计中，引入“虚拟列表（Virtual List）”优化方案的核心价值是：', ['限制只渲染视口内可见的 DOM 节点，大幅降低海量数据下的渲染计算与更新成本。', '解决跨域单点登录时，浏览器同源策略所导致的 Cookie 写入丢失故障。', '对大型局域网的域名解析过程进行加速，以消除静态资源在 DNS 握手阶段的延迟。', '自动识别并纠正本地上传组件在解析各种非标准压缩图片格式时的解码异常。'], 0,`
  },
  {
    old: `single('性能预算的核心价值是？', ['让性能退化可见并可治理', '替代产品需求', '删除所有图片', '禁止发布'], 0,`,
    new: `single('在前端研发流程中引入“性能预算（Performance Budget）”机制，其最核心的工程价值是：', ['建立量化的可观测性基线，使每次迭代引入的性能退化可见、可阻断并可协同治理。', '彻底替代业务端产品团队提出的核心交互原型以及各类产品发布需求。', '在构建打包阶段自动将所有静态图片资源从物理包体中完全剔除。', '限制全部日常的紧急发布热更新，以保持服务器运行状态的绝对平稳。'], 0,`
  },
  {
    old: `single('Retainers 的主要用途是？', ['找对象为什么仍然被引用', '压缩图片', '修改接口路径', '生成类型声明'], 0,`,
    new: `single('在利用 Chrome DevTools 对 JavaScript 内存泄漏进行排查时，Heap Profiler 中的 Retainers 树主要用于：', ['追踪并展示堆内存中的某个对象是如何被引用链根节点（GC Roots）保持关联而无法被垃圾回收的。', '执行本地图像资源的多核异步无损压缩以释放物理内存空间。', '对由于路由切换导致失效 of API 接口重试路径进行动态修复与域名映射。', '分析现有模块的导出字段并自动生成 TypeScript 的命名空间声明文件。'], 0,`
  }
];

let perfApplied = 0;
for (const replacement of perfReplacements) {
  if (perfContent.includes(replacement.old)) {
    perfContent = perfContent.replace(replacement.old, replacement.new);
    perfApplied++;
  } else {
    console.warn(`[WARN] 性能模块未匹配项: ${replacement.old}`);
  }
}

if (perfApplied > 0) {
  fs.writeFileSync(perfFilePath, perfContent, 'utf8');
  console.log(`[SUCCESS] 性能模块成功替换了 ${perfApplied}/${perfReplacements.length} 个题目。`);
}
