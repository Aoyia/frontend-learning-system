import fs from 'fs';
import path from 'path';

const filePath = path.resolve('/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/data/engineering-toolchain-content.js');

let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // === 模块一：依赖可复现 ===
  {
    old: `single('依赖可复现最核心的资产是什么？', ['README', 'lockfile', '页面截图', 'CSS reset'], 1,`,
    new: `single('为了根治在团队协作与 CI 构建中因“版本漂移”导致的依赖异常，以下哪项机制是最核心的？', ['在 package.json 中写死所有直接依赖的精确版本号。', '将包管理器生成的锁文件（lockfile）提交至版本库，并在 CI 中强制启用冷冻安装（Frozen Install）。', '在 README 中声明项目开发推荐的包管理器版本。', '定期清除本地 node_modules 目录并重新安装。'], 1,`
  },
  {
    old: `multiple('排查 CI 安装结果和本地不一致时，应优先检查哪些项？', ['lockfile 是否一致', 'Node 和包管理器版本', 'registry 来源', '按钮交互动画'], [0, 1, 2],`,
    new: `multiple('排查 CI 依赖安装结果和本地不一致时，应优先检查哪些项？', ['本地与 CI 的 lockfile 是否完全一致', '两端运行的 Node.js 和包管理器版本', '配置的 registry 镜像源与权限凭证', '构建脚本是否启用了并行编译机制'], [0, 1, 2],`
  },
  {
    old: `judgment('package.json 中写了 ^1.2.0，就能保证所有机器永远安装 1.2.0。', 1,`,
    new: `judgment('package.json 中将依赖声明为 ^1.2.0，即可确保所有协作机器安装完全一致的物理版本。', 1,`
  },
  {
    old: `single('组件库把 React 放入 peerDependencies 的主要原因是？', ['避免宿主出现多份 React 或版本冲突', '让 CSS 自动隔离', '减少 HTML 文件', '提升 DNS 命中率'], 0,`,
    new: `single('组件库通常把 React 放入 peerDependencies 的主要原因是？', ['限制主应用只存在单份 React 运行时，防范多实例 Hooks 错乱和打包体积暴涨。', '使组件库样式能够自动与宿主应用进行命名空间隔离。', '强制构建工具在打包时对 React 依赖进行预构建优化。', '自动继承主应用的 TypeScript 类型定义以减少类型声明文件。'], 0,`
  },
  {
    old: `multiple('CI 中更稳的依赖安装策略包括？', ['提交 lockfile', '使用 frozen install', '固定包管理器版本', '每次自动升级所有依赖'], [0, 1, 2],`,
    new: `multiple('在 CI 持续集成流水线中，更稳妥的依赖安装策略包括？', ['提交锁文件以确保依赖树拓扑被版本库记录', '在安装命令中添加 frozen install 标识（如 --frozen-lockfile）', '通过 packageManager 字段和 Corepack 固定包管理器版本', '每次构建前通过指令强制将所有次要依赖升级到最新版本'], [0, 1, 2],`
  },
  {
    old: `single('install scripts 的风险更接近什么？', ['安装阶段执行第三方代码，可能影响构建 and 安全', '只能修改字体', '只能删除图片', '不会影响任何结果'], 0,`,
    new: `single('在包管理中，允许 install scripts 自动运行所带来的主要安全隐患是？', ['第三方包可在安装阶段执行任意 shell 命令，造成供应链投毒或敏感环境变量泄露。', '会强制篡改构建工具的缓存目录，导致后续的 CSS代码分割失效。', '由于网络协议不一致，会导致主应用的 package.json 结构产生语法损坏。', '会导致 Staging 环境的 Staging 容器发生内存泄漏，从而降低 CI 性能。'], 0,`
  },

  // === 模块二：开发服务器与代理 ===
  {
    old: `single('dev proxy 最大的认知风险是？', ['掩盖真实跨域、Cookie 和网关行为', '让 HTML 不能渲染', '让 CSS 无法加载', '让 JS 不能执行'], 0,`,
    new: `single('本地开发通过 dev proxy 正常登录和请求，但上线后却出现 CORS 报错或登录态丢失。其主要隐患在于本地代理：', ['基于服务端转发绕过了浏览器同源策略，掩盖了生产环境网关对 CORS 和 Cookie 安全属性（SameSite/Secure）的真实限制。', '在打包时会强行篡改环境变量（import.meta.env），破坏了浏览器的安全机制。', '仅支持 HTTP 协议转发，导致线上 HTTPS 环境下由于 Mixed Content 限制阻断了 JS 的加载。', '在转发时会修改所有的请求路径参数格式，进而引发微服务网关路由寻址失败。'], 0,`
  },
  {
    old: `multiple('本地正常线上登录态异常，应检查？', ['Cookie Domain', 'SameSite/Secure', '真实 Origin', '按钮颜色'], [0, 1, 2],`,
    new: `multiple('本地开发代理正常但线上环境登录态异常（如 Cookie 未能正确携带或写入），应排查？', ['响应头中 Set-Cookie 的 Domain 和 Path 范围约束是否合理', 'Cookie 属性中的 SameSite、Secure 标记以及传输通道是否为 HTTPS', '真实请求中 Origin 头部是否通过了生产网关的 CORS 白名单校验', '客户端本地存储（localStorage）的跨域隔离策略是否被限制'], [0, 1, 2],`
  },
  {
    old: `judgment('只要 dev server 代理请求成功，就说明线上请求链路一定没问题。', 1,`,
    new: `judgment('本地开发服务器（dev server）代理接口请求成功，即可保证生产环境下的 API 链路也一定畅通。', 1,`
  },
  {
    old: `single('SPA 刷新子路由 404 通常和什么有关？', ['history fallback 未正确配置', '数组方法不可用', 'React 版本太新', '图片尺寸太大'], 0,`,
    new: `single('SPA 采用 History 模式上线后，刷新子路由报 Nginx 404，通常与以下哪个原因关系最密切？', ['浏览器发起子路径的物理资源请求，但 Nginx/CDN 未配置 fallback 重定向到 index.html。', 'Nginx 协商缓存策略配置不合理，导致静态资源请求在网关层被强制阻断。', '路由库未能正确将子路由映射关系注册到浏览器的 History 历史栈中。', '构建出的 JS/CSS 代码体积超限，触发了 Web 应用防火墙（WAF）的安全丢包。'], 0,`
  },
  {
    old: `multiple('dev server 常见职责包括？', ['服务源码模块', 'HMR', '静态资源', '替代生产监控'], [0, 1, 2],`,
    new: `multiple('本地开发服务器（dev server）在日常开发流程中常见职责包括？', ['拦截资源请求并对源码模块（如 SFC/TS）进行即时编译与格式转换', '监听文件变更并通过 WebSocket 向浏览器推送热替换（HMR）信号', '托管本地静态资源并在 History 路由模式下处理 Fallback 回退服务', '在本地直接压缩混淆 JS 产物以完全模拟生产环境的白屏行为'], [0, 1, 2],`
  },
  {
    old: `single('changeOrigin 会影响什么？', ['转发请求时 Host/Origin 相关语义', 'TypeScript 类型推导', 'DOM 节点数量', '图片压缩率'], 0,`,
    new: `single('在配置 dev server 代理的 changeOrigin 选项时，它主要会影响？', ['转发请求时 Host 请求头部的伪装，使其与 target 域名保持一致。', '打包器在做 Tree Shaking 时对 CSS 副作用文件的剔除策略。', 'TypeScript 在编译期对代理请求响应结构的类型推导。', '代理在响应头中自动将 Set-Cookie 的 Domain 转换为 localhost 的逻辑。'], 0,`
  },

  // === 模块三：Vite dev/build 差异 ===
  {
    old: `single('Vite dev 和 build 最大的差异是？', ['dev 按需服务源码，build 生成生产产物', 'dev 不运行 JS', 'build 不处理依赖', '两者完全一样'], 0,`,
    new: `single('关于 Vite 的本地开发阶段（dev）与生产打包阶段（build）最大的差异，以下表述最准确的是？', ['dev 阶段基于 Native ESM 提供按需的源码转换，build 阶段由 Rollup 执行打包压缩。', 'dev 阶段不执行任何 JavaScript 逻辑，build 阶段在前端容器内运行 SSR 编译。', 'dev 阶段只解析第三方依赖，build 阶段不处理静态资源哈希。', 'Vite 仅在本地开发时起作用，生产构建时完全交由 Webpack 执行编译。'], 0,`
  },
  {
    old: `multiple('生产白屏且 chunk 404，应检查？', ['base 配置', '部署子路径', 'CDN 缓存', '动态导入产物'], [0, 1, 2, 3],`,
    new: `multiple('SPA 应用部署上线后出现白屏，且控制台报某些异步 JS chunk 加载 404 错误，排查时应检查？', ['Vite 配置中的 base（公共基础路径）是否与实际部署 of 子路径一致', '新旧版本交替部署时，CDN 是否存在旧 HTML 文件的强缓存', '新版本发布后，旧的静态资源 chunk 文件是否被静态服务器彻底删除', '路由动态导入（Dynamic Import）打包出的 chunk 资源路径是否正确生成'], [0, 1, 2, 3],`
  },
  {
    old: `judgment('本地 vite dev 正常，就可以证明生产构建一定安全。', 1,`,
    new: `judgment('由于 Vite 在开发期和生产期使用相同的插件容器，因此本地开发运行正常即可确保生产构建及样式完全一致。', 1,`
  },
  {
    old: `single('import.meta.env 的重要风险是？', ['构建期注入到前端产物，不能放真正密钥', '只能用于 CSS', '会阻止 HMR', '无法在 Vite 中使用'], 0,`,
    new: `single('在使用 Vite 提供的 import.meta.env 环境变量机制时，最核心的安全风险是？', ['变量在构建期被静态替换并明文硬编码至 JS 产物中，绝对不能存放私有密钥。', '环境变量只能在 JS 中静态引入，在 CSS 的 CSS-in-JS 或预处理器中引入会导致 HMR 阻断。', '该机制仅在开发阶段有用，一旦执行打包编译，所有模式变量都会自动失效。', '会在打包阶段对 AST 造成破坏，导致低版本浏览器解析 polyfill 报错。'], 0,`
  },
  {
    old: `multiple('构建阶段通常会做？', ['代码分割', '压缩', '资源 hash', 'HMR 局部更新'], [0, 1, 2],`,
    new: `multiple('现代前端构建工具在生产打包阶段（build）通常会执行哪些优化操作？', ['对应用进行代码分割（Code Splitting）以减少首屏加载体积', '使用混淆压缩工具清除冗余代码（DCE）并精简脚本体积', '在输出文件名中注入基于内容哈希（Content Hash）的唯一标识', '建立基于 WebSocket 的热替换链路以支持组件级别的无刷新更新'], [0, 1, 2],`
  },
  {
    old: `single('依赖中使用 Node-only API 导致线上失败，属于哪类问题？', ['浏览器产物兼容性问题', '设计稿问题', '数据库索引问题', 'Cookie 过期问题'], 0,`,
    new: `single('引入包含 Node-only API（如 fs、path）的依赖导致线上运行时报 process is not defined 错误，这属于？', ['运行时环境隔离不彻底导致的浏览器兼容性与垫片（polyfill）缺失问题。', '由于开发环境 CDN 节点尚未同步资源导致的缓存漂移缺陷。', '前端跨源共享（CORS）配置错误引发的跨域安全拦截故障。', '因开发服务器 http-proxy 设置不当导致的数据解析异常。'], 0,`
  },

  // === 模块四：组件库产物设计 ===
  {
    old: `single('组件库 public API 的核心价值是？', ['给消费方稳定契约', '隐藏所有代码', '替代测试', '删除类型系统'], 0,`,
    new: `single('在组件库的设计中，明确界定 public API 的最核心价值是？', ['为消费端应用提供稳定的契约，允许库内部重构的同时保障向后兼容。', '完全对外界隐藏所有内部组件的物理实现以保障库的代码安全性。', '能够自动替代单元测试，强制阻断消费端对私有属性的类型依赖。', '在构建阶段减少 TypeScript 的类型解析开销以缩短业务编译时间。'], 0,`
  },
  {
    old: `multiple('组件库产物设计要关注？', ['exports', 'types', 'peerDependencies', 'sideEffects'], [0, 1, 2, 3],`,
    new: `multiple('为了确保公共或内部组件库能被不同的业务项目高效且安全地消费，产物设计应关注？', ['配置条件导出（exports）以定义跨构建环境的入口加载规则', '输出完整的 TypeScript 类型声明文件（.d.ts）', '声明 peerDependencies 以保障底层依赖框架的唯一单例', '配置 sideEffects 字段以保留 Tree Shaking 优化时的样式边界'], [0, 1, 2, 3],`
  },
  {
    old: `judgment('业务项目大量导入组件库内部路径是稳定做法。', 1,`,
    new: `judgment('业务项目为了实现按需引入，直接深路径导入组件库内部物理文件是长期稳定的工程实践。', 1,`
  },
  {
    old: `single('React 组件库把 React 打进 dependencies 的风险是？', ['可能出现多份 React 实例', '无法写 CSS', '接口不能请求', 'HTML 不能解析'], 0,`,
    new: `single('React 组件库若错误地将 react 声明在 dependencies 中，其带来的最大工程风险是？', ['可能在 node_modules 下安装多份 React 物理实例，导致运行时 Hooks 错乱与体积暴涨。', '导致主应用与组件库的全局 CSS 样式表发生命名冲突并彻底崩塌。', '会阻断打包工具的 Tree Shaking 流水线，使得业务项目无法使用任何图片资源。', '在部署上线后，会导致主应用在协商缓存失效时频繁抛出 404 错误。'], 0,`
  },
  {
    old: `multiple('组件库升级治理应包含？', ['语义化版本', '变更日志', '迁移指南', '静默破坏性变更'], [0, 1, 2],`,
    new: `multiple('对于内部的大型组件库，为了降低业务升级版本的风险，库的治理规范应包含？', ['严格遵循语义化版本（SemVer）规则以约束更新边界', '基于语义化 Commit 自动生成详尽的变更日志（Changelog）', '在重大废弃或破坏性变更发布时提供升级迁移指南与 Codemod 脚本', '在 Patch 版本中静默发布破坏性变更以倒逼业务团队及时跟进升级'], [0, 1, 2],`
  },
  {
    old: `single('sideEffects 配置错误最可能导致？', ['样式被误摇掉或无用代码无法摇掉', '数据库死锁', 'Cookie 失效', 'DNS 解析失败'], 0,`,
    new: `single('在组件库的 package.json 中，若将 sideEffects 属性配置错误，最容易导致的线上故障是？', ['页面引用的 CSS 样式表在生产打包时被 Tree Shaking 误摇掉导致样式白屏。', '接口请求在转发时丢失 Host 信息，触发安全网关的 CORS 跨域阻断。', '打包工具会强行将敏感环境变量硬编码至最终产物中并导致内存溢出。', '业务应用在加载动态子路由时会频繁遭遇 CDN chunk 物理资源 404 报错。'], 0,`
  }
];

let appliedCount = 0;
for (const replacement of replacements) {
  if (content.includes(replacement.old)) {
    content = content.replace(replacement.old, replacement.new);
    appliedCount++;
  } else {
    console.warn(`[WARN] 无法匹配替换项:\n${replacement.old}`);
  }
}

if (appliedCount > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[SUCCESS] 成功替换了 ${appliedCount}/${replacements.length} 个项目。`);
} else {
  console.error('[ERROR] 未能匹配到任何替换项。');
}
