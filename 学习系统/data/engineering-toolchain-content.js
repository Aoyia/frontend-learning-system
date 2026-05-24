import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const ENGINEERING_TOOLCHAIN_CONTENT = {
  id: 'engineering-toolchain',
  name: '深度长文：工程化工具链',
  icon: '🧰',
  desc: '沿着技术破冰的工程化主干，深入依赖、开发服务器、Vite 构建和内部库发布。',
  sourceCards: ['前端工程化', '包管理器', '开发服务器', '构建工具', 'Vite', '内部 NPM 包与库模式构建'],
  docs: [
    makeLongformDoc({
      title: '依赖可复现：为什么同一份代码在不同机器会炸',
      sourceCards: ['前端工程化', '包管理器'],
      problem: '它解决的是团队协作里“我这里能跑，你那里构建失败”的问题。中高级前端要把依赖安装看成一条可验证链路：package.json 只是声明依赖范围，lockfile 才记录本次解析出来的完整依赖图；Node 版本、包管理器版本、registry、workspace、peerDependencies 和 install scripts 都会影响最终结果。',
      customerCase: '客户交付项目在开发机正常，CI 里突然报某个子依赖语法不兼容。排查后发现 package.json 使用了宽松版本范围，lockfile 没有被严格使用，CI 安装时解析到了新补丁版本。真正要修的不是业务代码，而是依赖可复现机制。',
      flow: [
        '固定 Node 版本和包管理器版本，避免运行时与解析器漂移。',
        '提交 lockfile，并在 CI 使用 [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci)、[pnpm --frozen-lockfile](https://pnpm.io/cli/install#--frozen-lockfile) 或等价 frozen install。',
        '审查 package.json 中 dependencies、devDependencies、peerDependencies 的边界。',
        '检查 workspace 依赖提升、软链和包间版本约束。',
        '控制 install scripts、registry 来源和私有包权限。',
        '升级依赖时走 PR、变更说明、构建验证和回滚预案。',
      ],
      keywords: [
        { term: 'semver range', desc: '版本范围，例如 ^1.2.0 允许解析到兼容的新版本，不等于锁死版本。[→ SemVer 规范](https://semver.org/lang/zh-CN/)' },
        { term: 'lockfile', desc: '记录完整依赖树和实际版本，是可复现安装的核心资产。[→ package-lock.json 文档](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json)' },
        { term: 'frozen install', desc: 'CI 中禁止自动改 lockfile，发现不一致直接失败。[→ pnpm --frozen-lockfile](https://pnpm.io/cli/install#--frozen-lockfile)' },
        { term: 'peerDependencies', desc: '表达"宿主项目应该提供这个依赖"，常见于 React、Vue、插件和组件库。[→ npm peerDependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies)' },
        { term: 'workspace', desc: '把多个 package 放在一个依赖图里管理，提升联调效率，也带来依赖提升和发布边界问题。[→ pnpm Workspaces](https://pnpm.io/workspaces)' },
        { term: 'install scripts', desc: '依赖安装阶段执行的脚本，既可能用于编译，也可能带来供应链风险。[→ npm lifecycle scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts)' },
      ],
      interview: '依赖可复现的核心是把“安装结果”从隐式行为变成显式资产：固定运行环境，提交 lockfile，CI 使用 frozen install，正确声明 peer 依赖，并把依赖升级纳入评审和验证流程。',
      demo: `最小 CI 安装策略：

\`\`\`yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version-file: .nvmrc
      cache: pnpm
  - run: corepack enable
  - run: pnpm install --frozen-lockfile
  - run: pnpm build
\`\`\`

最小 package 边界：

\`\`\`json
{
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20" },
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0"
  }
}
\`\`\``,
      diagnosis: [
        '先对比 lockfile 是否一致，以及 CI 是否使用 frozen install。',
        '再看 Node、npm/pnpm/Yarn 版本，确认是否由解析策略差异造成。',
        '检查失败依赖是否通过宽松 semver 被解析到新版本。',
        '检查 peerDependencies 是否重复安装或版本不兼容。',
        '检查私有 registry、镜像源、postinstall 和 workspace 软链。',
        '最后再定位业务构建错误，避免把依赖漂移误判成代码问题。',
      ],
      followups: [
        '为什么组件库通常把 React 放在 peerDependencies？',
        'lockfile 冲突能不能直接删除重新生成？风险是什么？',
        'pnpm 的严格依赖结构相比 npm 扁平提升有什么好处？',
        '依赖升级如何设计灰度和回滚？',
      ],
      deepDive: '值得深入。大厂中高级前端经常要负责多人、多仓、多包和 CI 环境，依赖问题会直接影响交付稳定性。深入顺序是 semver、lockfile、peerDependencies、workspace、CI frozen install、依赖审计和供应链安全。',
      references: [
        { title: 'npm package.json 配置文档', url: 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json' },
        { title: 'pnpm install --frozen-lockfile', url: 'https://pnpm.io/cli/install#--frozen-lockfile' },
        { title: 'npm ci 命令文档', url: 'https://docs.npmjs.com/cli/v10/commands/npm-ci' },
        { title: 'Node.js Corepack 文档', url: 'https://nodejs.org/api/corepack.html' },
        { title: 'SemVer 语义化版本规范', url: 'https://semver.org/lang/zh-CN/' },
      ],
      quiz: [
        single('为了根治在团队协作与 CI 构建中因“版本漂移”导致的依赖异常，以下哪项机制是最核心的？', ['在 package.json 中写死所有直接依赖的精确版本号。', '将包管理器生成的锁文件（lockfile）提交至版本库，并在 CI 中强制启用冷冻安装（Frozen Install）。', '在 README 中声明项目开发推荐的包管理器版本。', '定期清除本地 node_modules 目录并重新安装。'], 1, `💡 它解决了什么问题：
解决了在团队协作与持续集成(CI)中，因 package.json 声明的语义化版本范围（SemVer range，如 \`^\`、\`~\`）导致的“版本漂移”问题。若不锁定并提交 lockfile，不同环境拉取依赖会导致最终解析出的物理依赖版本不一致，从而引发“本地运行正常，CI 构建失败”的诡异缺陷。

🔍 核心原理解析（防拷打）：
1. 依赖树拓扑锁死：lockfile 记录了包含所有直接依赖和深度嵌套子依赖的完整拓扑结构，以及确切的版本号、下载源（Resolved URL）和完整性校验值（Integrity hash）。
2. 避免重复解析：包管理器再次安装时，若存在 lockfile，可直接对照拓扑关系下载解压包，而无需重新向 Registry 发起网络请求来计算约束关系。
3. 校验防篡改：通过 integrity hash（如 sha512），保证在不同网络环境和机器上下载的包内容完全一致，防止私有源或公共源的包内容被恶意篡改或投毒。`),
        multiple('排查 CI 依赖安装结果和本地不一致时，应优先检查哪些项？', ['本地与 CI 的 lockfile 是否完全一致', '两端运行的 Node.js 和包管理器版本', '配置的 registry 镜像源与权限凭证', '构建脚本是否启用了并行编译机制'], [0, 1, 2], `💡 它解决了什么问题：
解决了依赖安装链路中由于物理环境、网络源、版本控制差异造成的“本地开发正常，CI/CD 构建失败”或产物异常的问题，避免盲目排查业务代码本身。

🔍 核心原理解析（防拷打）：
1. 解析引擎算法版本差异：不同版本的 Node.js 和包管理器（如 npm 9 对比 npm 10，或 pnpm 8 对比 pnpm 9）其内部依赖提升算法（Hoisting）、peerDependencies 的自动安装策略存在重大变更，导致解析出的 node_modules 结构截然不同。
2. 镜像源数据延迟同步：不同 Registry（如 npm 官方源、淘宝镜像源、企业私有源）对于新版本的同步时间存在延迟，若本地与 CI 配置的 \`.npmrc\` 不同，会导致解析失败或拉到过时版本。
3. 锁文件未严格执行：若本地修改了 package.json 但未提交最新的 lockfile，或者 CI 运行时未强制要求使用 frozen-lockfile 安装，会导致两端解析图谱产生实质性分裂。`),
        judgment('package.json 中将依赖声明为 ^1.2.0，即可确保所有协作机器安装完全一致的物理版本。', 1, `💡 它解决了什么问题：
解决了对 SemVer 语义化版本范围规范的认知误区。如果误认为 \`^\` 字符能锁定版本，会使得开发人员忽略 lockfile 的提交与维护，导致下游依赖悄无声息地升级到含有 Bug 的小版本或补丁包。

🔍 核心原理解析（防拷打）：
1. SemVer 匹配规则：\`^1.2.0\` 代表的版本区间为 \`[1.2.0, 2.0.0)\`，包管理器在没有 lockfile 约束时，会自动向 Registry 查询符合此区间的最新的、稳定的发布版本（例如 1.9.0）。
2. 声明与状态的分离：package.json 表达的是一种“意图声明（Intent Declaration）”，指明了项目对依赖版本的要求范围；而 lockfile 则是“状态快照（State Snapshot）”，只有后者才能确保所有环境均安装同一物理版本的包。
3. 边界场景（Monorepo workspace 协议）：在 pnpm-workspace 架构下，若使用本地子包引用（如 \`workspace:^\`），发布时会被转换为具体的远程 SemVer 区间，如果消费端没有 lockfile，仍会发生版本漂移。`),
        single('组件库通常把 React 放入 peerDependencies 的主要原因是？', ['限制主应用只存在单份 React 运行时，防范多实例 Hooks 错乱和打包体积暴涨。', '使组件库样式能够自动与宿主应用进行命名空间隔离。', '强制构建工具在打包时对 React 依赖进行预构建优化。', '自动继承主应用的 TypeScript 类型定义以减少类型声明文件。'], 0, `💡 它解决了什么问题：
解决了底层组件库在被打包和消费时引起的“宿主环境多实例问题”。如果在组件库的 dependencies 中声明宿主框架（如 React/Vue），会导致消费端应用中安装了多套运行时副本，引发 React Hooks 状态丢失、Context 隔离断裂、打包体积暴涨等工程灾害。

🔍 核心原理解析（防拷打）：
1. 依赖提升扁平化失效：若组件库的 dependencies 声明了 react 且版本与主应用不完全兼容，包管理器会在组件库的局部 node_modules 下安装新版 React，破坏其 Singleton 模式。
2. peerDependencies 强提示约束：它明确向宿主系统声明：“本组件库需要运行在 React 环境下，但我自己不提供这个依赖，请在宿主中确保安装它，且满足声明的版本范围。”
3. 现代包管理器表现差异：在 npm 7+ 中，默认会自动安装 peerDependencies。但在 pnpm 模式下，默认不会自动安装，若没有宿主依赖会报 Peer Dependency Conflict 警告，这强力保障了依赖的唯一实例。`),
        multiple('在 CI 持续集成流水线中，更稳妥的依赖安装策略包括？', ['提交锁文件以确保依赖树拓扑被版本库记录', '在安装命令中添加 frozen install 标识（如 --frozen-lockfile）', '通过 packageManager 字段和 Corepack 固定包管理器版本', '每次构建前通过指令强制将所有次要依赖升级到最新版本'], [0, 1, 2], `💡 它解决了什么问题：
解决了持续集成流水线中，由于网络波动、依赖自动升级、临时解析策略变动带来的流水线不可靠和不可预测性。

🔍 核心原理解析（防拷打）：
1. Frozen Lockfile 机制：CI 执行 \`pnpm install --frozen-lockfile\`（或 \`npm ci\`、\`yarn install --immutable\`）时，如果发现 package.json 和 lockfile 不一致，直接抛错退出，而不是自动静默更新 lockfile。这能完全避免 CI 阶段产生任何隐式的物理版本变化。
2. 包管理器运行时固定：通过在 package.json 中配置 \`packageManager\` 字段（如 \`"packageManager": "pnpm@9.15.0"\`）并结合 Node.js 的 \`Corepack\` 机制，强制 CI 使用相同版本的包管理器。
3. 缓存关联：CI 流水线通常会对依赖进行缓存。使用 lockfile 的 md5/sha256 hash 作为缓存 key，只有当 lockfile 发生变化时才更新 CI 依赖缓存，既保证了可复现性，又缩短了构建链路时长。`),
        single('在包管理中，允许 install scripts 自动运行所带来的主要安全隐患是？', ['第三方包可在安装阶段执行任意 shell 命令，造成供应链投毒或敏感环境变量泄露。', '会强制篡改构建工具的缓存目录，导致后续的 CSS代码分割失效。', '由于网络协议不一致，会导致主应用的 package.json 结构产生语法损坏。', '会导致 Staging 环境的 Staging 容器发生内存泄漏，从而降低 CI 性能。'], 0, `💡 它解决了什么问题：
解决了前端工程化链路中的“供应链安全隐患（Supply Chain Security Risk）”。若不加防护地执行依赖包在安装阶段自动运行的生命周期脚本（如 postinstall），会使得恶意包在本地或 CI 服务器执行越权操作、窃取环境变量或注入恶意后门。

🔍 核心原理解析（防拷打）：
1. 生命周期脚本劫持：npm/pnpm 在解析安装包时，会自动检测其 package.json 中的 \`preinstall\`、\`install\`、\`postinstall\` 脚本并使用 shell 执行。这常被黑客利用进行“投毒”（如窃取 \`.env\` 中的密钥并发送至收集服务器）。
2. 沙箱逃逸与执行权限：由于大部分开发者在本地或 CI 执行安装时使用的是无沙箱的主机环境，这些脚本可以读取 system 文件、环境变量、修改系统 host 或发起网络连接。
3. 安全防御策略与取舍：大厂通常推荐使用 \`--ignore-scripts\` 阻断生命周期脚本。但会导致需要本地编译底层 native 模块依赖（如 esbuild、node-sass）无法正常工作，需要通过配置 \`trustedDependencies\` 或 patch 包管理（如 \`pnpm patch\`）进行细粒度授权。`),
      ],
    }),
    makeLongformDoc({
      title: '开发服务器与代理：本地正常不代表链路真实',
      sourceCards: ['前端工程化', '开发服务器', '请求-响应全链路'],
      problem: '它解决的是本地开发体验和真实线上链路之间的差异问题。dev server 提供模块服务、HMR、静态资源、history fallback 和接口代理，但代理会隐藏跨域、Cookie、Origin、缓存、HTTPS 和网关行为。',
      customerCase: '某业务本地通过 /api 代理访问后端一切正常，部署到测试环境后登录态丢失。原因是本地代理绕过了真实域名、SameSite Cookie 和 HTTPS 策略，导致开发阶段没有暴露跨站凭证问题。',
      flow: [
        '浏览器请求本地 dev server。',
        'dev server 返回 HTML、ESM 模块和静态资源。',
        '源码变化时触发 HMR，尽量局部更新。',
        '接口请求命中 proxy，被转发到后端或 BFF。',
        '代理可能改写 path、host、origin、cookie domain 和 header。',
        '上线后请求进入真实 CDN、网关、BFF 和后端链路。',
      ],
      keywords: [
        { term: 'dev server', desc: '开发期服务器，服务源码模块、HMR、静态资源和 fallback。[→ Vite server 配置](https://cn.vitejs.dev/config/server-options)' },
        { term: 'HMR', desc: '热模块替换，文件变化后局部更新页面。[→ Vite HMR API](https://cn.vitejs.dev/guide/api-hmr)' },
        { term: 'proxy', desc: '本地接口转发能力，用于开发期联调，但不等于线上链路。[→ Vite server.proxy](https://cn.vitejs.dev/config/server-options#server-proxy)' },
        { term: 'Origin', desc: '浏览器安全模型里判断跨源请求的重要请求头。[→ MDN Origin 头部](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Origin)' },
        { term: 'Cookie Domain', desc: '决定 Cookie 可发送到哪些域名，代理配置常掩盖其问题。[→ MDN Set-Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie)' },
        { term: 'history fallback', desc: 'SPA 刷新子路由时回退到 index.html 的机制。[→ MDN History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)' },
      ],
      interview: '开发服务器是提升本地反馈速度的工具，代理是联调便利手段；中高级前端必须知道 dev proxy 和真实线上链路不同，涉及跨域、Cookie、HTTPS、缓存、网关和错误语义的问题要在类生产环境验证。',
      demo: `一个容易误导的代理配置：

\`\`\`ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.example.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\\/api/, '')
      }
    }
  }
}
\`\`\`

它能让本地请求成功，但也可能隐藏真实 Origin、Cookie Domain、CORS 和网关路径问题。上线前必须在真实域名或类生产环境复测登录态和写操作。`,
      diagnosis: [
        '本地正常线上异常时，先确认是否只有 dev proxy 环境能复现。',
        '对比本地请求和线上请求的 URL、Origin、Cookie、Header、状态码。',
        '检查 Cookie 的 Domain、Path、SameSite、Secure 和 HttpOnly。',
        '检查网关是否有 path rewrite、鉴权、限流或 CORS 规则。',
        'SPA 刷新 404 时检查 history fallback、CDN 和服务端路由回退。',
        'HMR 异常时检查框架插件、路径大小写、缓存和 workspace 依赖预构建。',
      ],
      followups: [
        '为什么 changeOrigin 可能让本地和线上行为不一致？',
        '怎么在开发期尽量接近真实登录态链路？',
        'SPA history fallback 应该配置在 dev server、Nginx 还是 CDN？',
        'HMR 不生效和生产构建失败为什么是两类问题？',
      ],
      deepDive: '值得深入。开发服务器是工程化主干的一部分，但它的便利性会制造错觉。深入时要把 dev server、浏览器安全模型、HTTP Cookie、CORS、网关和部署链路一起看。',
      references: [
        { title: 'Vite：server.proxy 配置文档', url: 'https://cn.vitejs.dev/config/server-options#server-proxy' },
        { title: 'MDN：HTTP CORS 跨源资源共享', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS' },
        { title: 'MDN：Set-Cookie 响应头详解', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie' },
        { title: 'MDN：Origin 请求头说明', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Origin' },
        { title: 'Vite HMR API', url: 'https://cn.vitejs.dev/guide/api-hmr' },
      ],
      quiz: [
        single('本地开发通过 dev proxy 正常登录和请求，但上线后却出现 CORS 报错或登录态丢失。其主要隐患在于本地代理：', ['基于服务端转发绕过了浏览器同源策略，掩盖了生产环境网关对 CORS 和 Cookie 安全属性（SameSite/Secure）的真实限制。', '在打包时会强行篡改环境变量（import.meta.env），破坏了浏览器的安全机制。', '仅支持 HTTP 协议转发，导致线上 HTTPS 环境下由于 Mixed Content 限制阻断了 JS 的加载。', '在转发时会修改所有的请求路径参数格式，进而引发微服务网关路由寻址失败。'], 0, `💡 它解决了什么问题：
解决了开发环境便利度与真实生产链路不一致导致的“带病上线”风险。如果过度依赖 dev server 的本地代理来绕过浏览器同源策略，会掩盖 Cookie 的 SameSite、Secure 限制，以及生产网关的跨域阻碍。

🔍 核心原理解析（防拷打）：
1. 同源策略规避的本地幻觉：dev proxy 实际上是在本地 dev server 侧通过 Node.js（使用 http-proxy 等）发起中转。因为同源策略（SOP）只作用于浏览器与服务器之间，服务器与服务器之间的通信不受此限制，从而完全绕过了浏览器的 CORS 拦截。
2. Cookie 校验机制失效：真实场景下，跨域请求携带 Cookie 受到 Domain、Path 和现代浏览器 Strict/Lax SameSite 机制的严格限制。通过 proxy 转发后，浏览器认为请求目标仍是本地开发机的 localhost，故而能顺利携带本地 Cookie，但在上线部署为不同域名后，这些凭证往往无法携带或发送，导致登录态丢失。
3. 生产链路追问：线上通常需要经过 CDN、WAF（Web 应用防火墙）、Nginx 反向代理、BFF 以及最终 the 微服务网关。dev proxy 的配置仅属于一种便捷的“伪联调方案方案”，上线前必须在具备相同网关路由和 HTTPS 安全凭证的 Staging/UAT 环境进行实测。`),
        multiple('本地开发代理正常但线上环境登录态异常（如 Cookie 未能正确携带或写入），应排查？', ['响应头中 Set-Cookie 的 Domain 和 Path 范围约束是否合理', 'Cookie 属性中的 SameSite、Secure 标记以及传输通道是否为 HTTPS', '真实请求中 Origin 头部是否通过了生产网关的 CORS 白名单校验', '客户端本地存储（localStorage）的跨域隔离策略是否被限制'], [0, 1, 2], `💡 它解决了什么问题：
解决了由于 Cookie 安全模型和跨源资源共享（CORS）规范在本地开发和生产环境的环境差异，导致用户登录态丢失、状态写入失败的排查痛点。

🔍 核心原理解析（防拷打）：
1. Cookie Domain 与 Path 约束：Cookie 的 Domain 属性决定了哪些域名可以写入和读取。如果本地通过代理将其写在 \`localhost\`，但线上使用了二级子域名，且没有正确设置 Domain 为主域名（例如 \`.company.com\`），会导致子域名间无法共享 Cookie 凭证。
2. SameSite 与 Secure 属性：现代浏览器为了防范 CSRF 攻击，默认将 SameSite 设为 \`Lax\`。若请求为跨站，Cookie 不会被发送，必须设置 \`SameSite=None; Secure\`。然而，\`Secure\` 属性要求整个通信信道必须是 HTTPS。本地开发多为非加密的 HTTP，往往忽略了此约束。
3. Origin & CORS 验证：BFF 或网关通常对 \`Origin\` 头进行严格的安全白名单核验。dev proxy 在代理转发时可能会修改 Origin（如未配置 \`changeOrigin: true\`，或配置后破坏了后端的校验逻辑），而生产中真实的 Origin 与后端允许的 CORS 白名单不一致，就会直接造成凭证写入失败。`),
        judgment('本地开发服务器（dev server）代理接口请求成功，即可保证生产环境下的 API 链路也一定畅通。', 1, `💡 它解决了什么问题：
解决了开发者在联调阶段因“代理成功”产生的盲目自信。若忽视本地代理与线上 CDN、Web 服务端（如 Nginx、网关）在路由转发、跨域配置、HTTPS 握手和鉴权机制上的实质差异，会导致上线即崩溃的重大生产事故。

🔍 核心原理解析（防拷打）：
1. 物理网络拓扑差异：本地代理是单机转发，直接访问后端 IP 或开发环境域名；生产环境的请求会依次经过 DNS 解析、CDN 缓存、网关限流、WAF 防护、以及反向代理负载均衡。每一个节点都可能因为 Headers 大小限制、超时时间、Keep-Alive 策略等导致请求失败。
2. 网关重写与路由不一致：在 dev server 中配置的 \`rewrite\` 规则（如把 \`/api\` 去掉）是纯前端构建工具的逻辑。若生产环境的 Nginx 或 API 网关没有同步配置等价的路径重写规则，会导致接口返回 404 或者是网关层路由异常。
3. HTTPS 阻断与协议问题：开发机通常跑在 HTTP 协议下，生产环境则全量强制 HTTPS。许多关于 Mixed Content（混合内容安全警告，即 HTTPS 页面发起 HTTP 接口请求）的问题，以及 http2 多路复用在开发期的表现，都无法在简单的 dev server 中显现。`),
        single('SPA 采用 History 模式上线后，刷新子路由报 Nginx 404，通常与以下哪个原因关系最密切？', ['浏览器发起子路径的物理资源请求，但 Nginx/CDN 未配置 fallback 重定向到 index.html。', 'Nginx 协商缓存策略配置不合理，导致静态资源请求在网关层被强制阻断。', '路由库未能正确将子路由映射关系注册到浏览器的 History 历史栈中。', '构建出的 JS/CSS 代码体积超限，触发了 Web 应用防火墙（WAF）的安全丢包。'], 0, `💡 它解决了什么问题：
解决了单页面应用（SPA）采用 HTML5 History 路由模式时，页面刷新或直接输入子路径 URL 导致页面加载失败（报 404）的架构缺陷。

🔍 核心原理解析（防拷打）：
1. History 路由的工作原理：SPA 的 History 路由（如使用 \`history.pushState\`）是在前端通过 JS 操纵浏览器历史记录栈来更新页面 URL，此时浏览器并未向服务器发起真实的 HTTP Get 请求。
2. 资源请求的回退机制（Fallback）：当用户在浏览器中刷新 \`/dashboard/users\`，浏览器会向服务器发起针对该具体子路径的物理资源请求。物理文件 \`index.html\` 存在于根目录，不存在该子路径对应的静态目录，若无后端干预，就会直接返回 404。
3. 大厂面试追问（工程配置取舍）：在本地开发时，Vite/Webpack 通过 \`connect-history-api-fallback\` 中间件拦截所有未命中静态资源的 GET 请求，并重定向到主 \`index.html\`。但在生产环境，必须由 Nginx 配置 \`try_files $uri $uri/ /index.html\`，或在 CDN、BFF 网关配置对非静态资源路径的通用回退，才能确保刷新不报 404。`),
        multiple('本地开发服务器（dev server）在日常开发流程中常见职责包括？', ['拦截资源请求并对源码模块（如 SFC/TS）进行即时编译与格式转换', '监听文件变更并通过 WebSocket 向浏览器推送热替换（HMR）信号', '托管本地静态资源并在 History 路由模式下处理 Fallback 回退服务', '在本地直接压缩混淆 JS 产物以完全模拟生产环境的白屏行为'], [0, 1, 2], `💡 它解决了什么问题：
解决了本地开发流中反馈效率低下的问题。通过向前端开发者提供近乎实时的模块按需编译服务、热替换链路以及静态文件代理，极大地缩短了从编写代码到页面更新的反馈回路。

🔍 核心原理解析（防拷打）：
1. 源码编译与转换（Transform 流）：在开发期，dev server 作为 HTTP 服务器拦截所有的 JS/TS/CSS 请求，利用内置编译链（如 Vite 使用 esbuild，Webpack 使用 loader）将这些源文件动态转换为浏览器可读取 of 规范格式（例如把 SFC 转化为标准的 ESM）。
2. 实时模块图维护与 HMR 链路：server 维护着整个运行态的模块依赖图谱（Module Graph）。当文件发生修改，server 使用文件监听（如 chokidar）捕获变更，计算出最小更新边界，通过 Websocket 向浏览器推送热替换信号，避免昂贵的全页刷新。
3. 宿主静态服务与 fallback：提供类似 nginx 的功能，托管开发所需的 public 静态资源，并在配置了 HTML5 History 路由时，作为 fallback 中间件拦截 404 请求，重定向到主入口。`),
        single('在配置 dev server 代理的 changeOrigin 选项时，它主要会影响？', ['转发请求时 Host 请求头部的伪装，使其与 target 域名保持一致。', '打包器在做 Tree Shaking 时对 CSS 副作用文件的剔除策略。', 'TypeScript 在编译期对代理请求响应结构的类型推导。', '代理在响应头中自动将 Set-Cookie 的 Domain 转换为 localhost 的逻辑。'], 0, `💡 它解决了什么问题：
解决了本地开发代理向后端转发请求时，后端服务器因 Host 头部校验不匹配或 Origin 不合规而拒绝服务的问题。

🔍 核心原理解析（防拷打）：
1. Host 请求头的篡改与伪装：默认情况下，当浏览器请求 \`localhost:3000/api\` 并通过代理转发到 \`backend.com\` 时，如果不配置 \`changeOrigin: true\`，转发给后端的 Host 头依然是 \`localhost:3000\`。部分后端框架或安全网关会校验 Host 是否与自身域名一致，若不一致则直接拒绝访问。配置后，代理会将 Host 改写为目标域名 \`backend.com\`。
2. Origin 与 CORS 的联动关系：在跨域请求中，浏览器会自动附带 \`Origin: http://localhost:3000\`。虽然 Host 被改写了，但通常 \`Origin\` 头不会被 changeOrigin 强制抹除，这有利于后端做精细化的 CORS 跨源白名单校验。
3. 边界场景与 Cookie 篡改：仅仅修改 Host 往往不够。如果后端接口在响应头中下发了 \`Set-Cookie\`，且其 \`Domain\` 属性限制为 \`.backend.com\`，浏览器仍会拒绝写入本地的 \`localhost\`。此时通常还需要配合 \`cookieDomainRewrite\` 属性，在代理层拦截响应，将 Set-Cookie 中的 Domain 属性动态改写为 \`localhost\` 或 \`127.0.0.1\`。`),
      ],
    }),
    makeLongformDoc({
      title: 'Vite dev/build 差异：为什么本地能跑，生产白屏',
      sourceCards: ['构建工具', 'Vite'],
      problem: '它解决的是开发链路和生产构建链路不一致导致的线上故障。Vite 开发期基于原生 ESM 按需转换源码，生产期通过 Rollup 构建、压缩、拆分、静态替换和资源处理。两条链路目标不同，不能用“dev 能跑”证明“build 一定安全”。',
      customerCase: '某页面本地 dev 正常，线上白屏且控制台显示 chunk 404。排查发现部署在子路径下但 base 仍为 /，动态导入 chunk 路径生成错误。问题不在组件，而在构建产物路径和部署环境不一致。',
      flow: [
        '开发期读取 index.html，浏览器按 ESM 请求源码模块。',
        'Vite 按需 transform 源码，并对依赖做预构建缓存。',
        'HMR 只更新受影响模块。',
        '生产期从入口构建完整依赖图。',
        '插件流水线处理 transform、代码分割、压缩、资源 hash 和 base。',
        '部署后由 CDN 或静态服务器按生成路径提供资源。',
      ],
      keywords: [
        { term: 'native ESM', desc: '开发期按需加载模块的基础。[→ MDN ES Modules](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)' },
        { term: 'dependency pre-bundling', desc: '把第三方依赖预处理成更适合浏览器开发加载的形式。[→ Vite 依赖预构建](https://cn.vitejs.dev/guide/dep-pre-bundling)' },
        { term: 'base', desc: '构建产物静态资源 URL 的基础路径。[→ Vite base 配置](https://cn.vitejs.dev/config/shared-options#base)' },
        { term: 'import.meta.env', desc: 'Vite 环境变量入口，生产构建时会被静态替换。[→ Vite 环境变量与模式](https://cn.vitejs.dev/guide/env-and-mode)' },
        { term: 'chunk', desc: '构建拆分出的代码块，常见于动态导入和公共依赖。[→ Rollup Code Splitting](https://cn.rollupjs.org/tutorial/#code-splitting)' },
        { term: 'sourcemap', desc: '线上错误定位源码的重要映射文件，需要配合权限和上传策略。[→ Vite build.sourcemap](https://cn.vitejs.dev/config/build-options#build-sourcemap)' },
      ],
      interview: 'Vite 的开发快来自 ESM 按需服务和依赖预构建，但生产仍然是完整构建链路；排查本地正常线上白屏，要从 base、环境变量、构建目标、动态导入、资源缓存、chunk 404 和 sourcemap 定位。',
      demo: `典型 base 问题：

\`\`\`ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/admin/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
})
\`\`\`

如果应用部署在 \`/admin/\`，但 base 配成 \`/\`，HTML 中生成的资源路径会指向站点根目录，子路径部署下容易 chunk 404。`,
      diagnosis: [
        '先用 npm run build 和 preview 复现生产构建，不只看 dev。',
        '检查控制台是否有 chunk 404、MIME type、CORS、语法兼容错误。',
        '检查 base、部署子路径、CDN 前缀和 public 资源引用方式。',
        '检查 import.meta.env 是否在构建时被正确注入，且没有暴露密钥。',
        '检查依赖是否混用 CJS/ESM、Node-only API 是否进入浏览器包。',
        '检查旧 HTML 引用新旧 chunk 的缓存一致性。',
      ],
      followups: [
        '为什么 vite preview 不能替代完整测试环境？',
        '环境变量为什么不能放服务端密钥？',
        'chunk 404 的根因通常有哪些？',
        'Vite 插件在 dev 和 build 阶段行为可能有什么差异？',
      ],
      deepDive: '非常值得深入。Vite 已是现代前端主流工具，但中高级能力不止会配置插件，而是能解释 dev/build 双链路、构建产物、部署路径、缓存和线上错误定位。',
      references: [
        { title: 'Vite：为什么使用 Vite（Why Vite）', url: 'https://cn.vitejs.dev/guide/why' },
        { title: 'Vite：依赖预构建（Dep Pre-Bundling）', url: 'https://cn.vitejs.dev/guide/dep-pre-bundling' },
        { title: 'Vite：构建生产版本', url: 'https://cn.vitejs.dev/guide/build' },
        { title: 'Vite：环境变量与模式', url: 'https://cn.vitejs.dev/guide/env-and-mode' },
        { title: 'Rollup：Output Options 配置', url: 'https://cn.rollupjs.org/configuration-options/#output-chunkfilenames' },
      ],
      quiz: [
        single('关于 Vite 的本地开发阶段（dev）与生产打包阶段（build）最大的差异，以下表述最准确的是？', ['dev 阶段基于 Native ESM 提供按需的源码转换，build 阶段由 Rollup 执行打包压缩。', 'dev 阶段不执行任何 JavaScript 逻辑，build 阶段在前端容器内运行 SSR 编译。', 'dev 阶段只解析第三方依赖，build 阶段不处理静态资源哈希。', 'Vite 仅在本地开发时起作用，生产构建时完全交由 Webpack 执行编译。'], 0, `💡 它解决了什么问题：
解决了在保证极快开发反馈速度的同时，如何确保线上生产包具备最高运行性能与最小体积的工程冲突。开发期如果引入打包，会导致庞大项目的等待时间以分钟计，而生产包若不打包，会导致千百个 ESM 文件引发网络请求瀑布流堵塞浏览器。

🔍 核心原理解析（防拷打）：
1. 开发期（No-Bundler + Native ESM）：Vite 在开发环境无需将代码合并打包，而是直接利用现代浏览器的 ESM 模块加载能力。浏览器解析到 \`import\` 时自动向 Vite 发起网络请求，Vite 只针对当前请求的文件进行即时转换（On-demand compilation），从而做到反馈速度与项目总体积解耦。
2. 生产期（Bundler + Rollup）：生产构建时，为了极大地减少 HTTP 往返时间（RTT）和加载开销，仍然需要对代码进行物理合并。Vite 选用 Rollup 进行打包，经历复杂的依赖分析、代码混淆压缩、CSS 提取、Tree Shaking 以及 Polyfill 注入等静态流水线。
3. 双链路架构的潜在隐患：例如某些第三方包含有非标准 ESM 导出（如只支持 CJS 的包），在开发期通过 esbuild 的依赖预构建（Pre-bundling）做了格式转换，但在生产构建时由 Rollup 插件处理却可能因为解析配置不同而报错。因此，开发后期使用 \`vite preview\` 进行模拟构建预测试至关重要。`),
        multiple('SPA 应用部署上线后出现白屏，且控制台报某些异步 JS chunk 加载 404 错误，排查时应检查？', ['Vite 配置中的 base（公共基础路径）是否与实际部署 of 子路径一致', '新旧版本交替部署时，CDN 是否存在旧 HTML 文件的强缓存', '新版本发布后，旧的静态资源 chunk 文件是否被静态服务器彻底删除', '路由动态导入（Dynamic Import）打包出的 chunk 资源路径是否正确生成'], [0, 1, 2, 3], `💡 它解决了什么问题：
解决了前端应用在发布上线后，因静态资源路径解析错误或缓存失效，导致线上应用完全无法加载（白屏）的致命故障。

🔍 核心原理解析（防拷打）：
1. 公共路径（Base/PublicPath）机制：\`base\` 属性决定了打包后 HTML 内部引入 JS/CSS 文件的绝对或相对路径起点。若应用部署在子路径（例如 \`https://site.com/app/\`），而 base 依然配为默认的 \`/\`，浏览器会向根路径 \`https://site.com/assets/...\` 发起请求，从而直接触发 404。
2. Chunk 缓存哈希与部署漂移：当新版本发布时，由于代码变更，生成的 chunk 文件 hash 会改变。如果用户在发布瞬间访问了旧的 HTML，或者静态服务器/CDN 没有同步清理 HTML 的强缓存，HTML 会继续尝试加载已经在线上被删除 of 旧 chunk，最终导致 chunk 404 进而引发白屏。
3. 路由降级与运行时捕获：现代单页应用在路由动态导入失败时，可以通过注册 \`window.addEventListener('error', ...)\`，或者配置路由器的 \`onError\` 回调，捕获到加载失败的 chunk 404 异常，并强制全量刷新页面以获取最新的 HTML，实现优雅的防白屏灾备。`),
        judgment('由于 Vite 在开发期和生产期使用相同的插件容器，因此本地开发运行正常即可确保生产构建及样式完全一致。', 1, `💡 它解决了什么问题：
打破了对本地开发环境的过度信任。由于开发期与生产期的编译器、打包器、执行环境和代码转换规则存在巨大差异，本地测试通过并不能规避线上白屏、打包崩塌或兼容性报错。

🔍 核心原理解析（防拷打）：
1. 工具链的分裂（esbuild vs Rollup）：开发期，Vite 在底层利用 Go 编写的 \`esbuild\` 快速进行依赖解析与模块转换；而生产期，Vite 选用 \`Rollup\` 进行打包。两者的 AST 解析器、对非标准 CJS/ESM 混用模块的容错度存在差异，导致有些代码在 esbuild 下能通过，在 Rollup 中却直接抛出语法或构建解析错误。
2. 环境变量静态替换差异：\`import.meta.env\` 中的变量在开发期是通过运行时注入对象提供，但在生产打包时，Rollup 插件会采用类似 DefinePlugin 的 AST 静态字符串替换。如果代码中存在动态插值引用环境变量，生产构建时可能直接退化为 \`undefined\` 或语法报错。
3. CSS 注入与压缩细节：开发期 CSS 通常是以 \`<style>\` 标签形式通过 JS 动态注入到 DOM 中以支持快速 HMR，而生产期 Rollup 会使用 \`cssCodeSplit\` 将样式物理抽取为独立的 \`.css\` 文件。这会导致组件样式的加载顺序、样式覆盖优先级（CSS Order）在开发期和生产期截然不同，从而产生线上样式错乱。`),
        single('在使用 Vite 提供的 import.meta.env 环境变量机制时，最核心的安全风险是？', ['变量在构建期被静态替换并明文硬编码至 JS 产物中，绝对不能存放私有密钥。', '环境变量只能在 JS 中静态引入，在 CSS 的 CSS-in-JS 或预处理器中引入会导致 HMR 阻断。', '该机制仅在开发阶段有用，一旦执行打包编译，所有模式变量都会自动失效。', '会在打包阶段对 AST 造成破坏，导致低版本浏览器解析 polyfill 报错。'], 0, `💡 它解决了什么问题：
解决了前端工程化中的“敏感密钥泄露（Secrets Leakage）”安全漏洞。如果把敏感 API Key、数据库密码、内网凭证等直接通过 Vite 环境变量导入前端代码，打包后这些数据会以明文形式暴露在 JS 产物中。

🔍 核心原理解析（防拷打）：
1. 构建期静态求值与字符串替换：Vite 提供的 \`import.meta.env.VITE_XXX\` 并非是在浏览器运行时动态读取服务器操作系统的 \`process.env\`，而是在编译构建阶段由打包器读取本地系统的环境变量，并对源码中的 AST 节点进行硬编码替换。
2. 产物体积与明文暴露：替换后的 JS 代码最终会输出为类似于 \`const API_KEY = "sk_prod_12345"\` 的静态字符串。即便代码经过混淆、压缩，或者放置在条件分支中，攻击者只需下载该前端包并全局搜索关键字，即可秒级提取出敏感凭证。
3. 安全边界设计：在安全的工程设计中，前端应用只能访问不敏感的公有变量（通常带有 \`VITE_\` 前缀作为过滤标记）。若需要依赖敏感密钥进行接口交互，应当通过 BFF（Backend For Frontend）进行中转鉴权，或者在容器部署阶段通过动态挂载的 \`config.json\` 或 SSR 运行时代替，从而避免将密钥打包进静态产物。`),
        multiple('现代前端构建工具在生产打包阶段（build）通常会执行哪些优化操作？', ['对应用进行代码分割（Code Splitting）以减少首屏加载体积', '使用混淆压缩工具清除冗余代码（DCE）并精简脚本体积', '在输出文件名中注入基于内容哈希（Content Hash）的唯一标识', '建立基于 WebSocket 的热替换链路以支持组件级别的无刷新更新'], [0, 1, 2], `💡 它解决了什么问题：
解决了原始源码文件体积过大、网络传输效率低下、缓存无法有效控制以及加载耗时过长等影响生产性能的核心痛点。

🔍 核心原理解析（防拷打）：
1. 代码分割（Code Splitting）减小首屏开销：通过分析模块拓扑图，将应用划分为多个物理 Bundle（如公共依赖 vendor.js、异步导入路由模块 page.js）。这使浏览器能够并发下载资源，并且只加载当前路由所需的最小代码子集。
2. 资源 Hash 驱动精确缓存：在输出文件名中注入基于文件内容计算的 hash 值。当文件内容未变时，hash 保持一致，浏览器可强制读取本地强缓存；一旦代码更新，hash 变更，立即可突破缓存获取最新资源。
3. 压缩精简产物体积：借助压缩工具进行死代码删除（DCE）、变量与函数名极简化混淆（Mangle）、常量折叠以及冗余空白符剔除，将 JS/CSS 的传输大小缩减至原代码的 20%~40%。`),
        single('引入包含 Node-only API（如 fs、path）的依赖导致线上运行时报 process is not defined 错误，这属于？', ['运行时环境隔离不彻底导致的浏览器兼容性与垫片（polyfill）缺失问题。', '由于开发环境 CDN 节点尚未同步资源导致的缓存漂移缺陷。', '前端跨源共享（CORS）配置错误引发的跨域安全拦截故障。', '因开发服务器 http-proxy 设置不当导致的数据解析异常。'], 0, `💡 它解决了什么问题：
解决了由于运行时（Runtime）环境隔离不彻底，误将面向 Node.js 服务端设计的 API（如 \`fs\`、\`path\`、\`process\`）打包进前端浏览器代码，导致线上运行时报 \`process is not defined\` 等崩溃问题。

🔍 核心原理解析（防拷打）：
1. 运行时 API 孤岛与差异：Node.js 拥有系统级 API（如文件系统、操作系统、网络套接字等），而浏览器端是在严格防沙箱的安全容器中运行，仅提供 DOM、BOM 及标准 Web API（如 fetch、crypto）。
2. 开发期 Mock 幻觉：很多历史悠久的 npm 包是为 Node.js 编写的，或者在底层对 Node API 有弱依赖。在本地开发时，Vite 的依赖预构建或部分 Node-polyfill 插件可能悄悄在内存中模拟了这些 API，使得本地运行时不会报错。但在生产构建中，如果 Rollup 未配置 polyfill 或者是宿主环境彻底去除了模拟，就会直接报错。
3. 彻底根治与排除：针对此类依赖，应当在构建配置中通过 \`resolve.alias\` 将特定的 Node 模块重定向到空对象（如 \`path-browserify\` 或空垫片文件），或者在 package.json 的 \`browser\` 字段声明替换逻辑。更优雅的做法是，在选型第三方库时，严格审查其 target 属性是否包含 browser。`),
      ],
    }),
    makeLongformDoc({
      title: '组件库产物设计：为什么升级一个包会拖垮业务',
      sourceCards: ['内部 NPM 包与库模式构建', '组件库设计', 'TypeScript 进阶'],
      problem: '它解决的是“业务里能跑的代码”和“给多个项目长期使用的库”之间的差距。内部库必须设计 public API、exports、产物格式、类型声明、peer 依赖、样式边界和版本策略，否则一次升级会扩散到所有业务线。',
      customerCase: '客户的内部组件库升级后，多个业务包体积暴涨，部分页面 React Hooks 报错。排查发现组件库把 React 打进 dependencies，且产物只输出 CJS，业务构建器无法有效 tree shaking，还出现多份 React 实例。',
      flow: [
        '先定义 public API，只承诺稳定入口，不暴露内部文件路径。',
        '设计 package.json exports，明确 ESM、CJS、types 和样式入口。',
        '把 React/Vue 等宿主框架放入 peerDependencies。',
        '输出 ESM 产物并正确声明 sideEffects，保留 tree shaking 条件。',
        '生成类型声明，确保泛型、组件 props、事件和主题 token 可推导。',
        '用语义化版本、变更日志、迁移指南和真实业务验证管理升级风险。',
      ],
      keywords: [
        { term: 'public API', desc: '消费方可依赖的稳定契约，包括函数、组件、props、样式 token 和入口。' },
        { term: 'exports', desc: 'package.json 中声明可导入入口和条件产物的字段。[→ Node.js exports 文档](https://nodejs.org/api/packages.html#exports)' },
        { term: 'sideEffects', desc: '告诉构建器哪些文件有副作用，影响 tree shaking。[→ webpack sideEffects 说明](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)' },
        { term: 'types', desc: '类型声明入口，让消费方获得正确编辑器提示和编译检查。[→ TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)' },
        { term: 'peerDependencies', desc: '让宿主提供框架依赖，避免多实例。[→ npm peerDependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies)' },
        { term: 'semver', desc: '通过版本号表达兼容风险和升级预期。[→ SemVer 规范](https://semver.org/lang/zh-CN/)' },
      ],
      interview: '组件库产物设计的核心是让消费方在不同构建器、框架版本和运行环境下都能正确解析、按需引入、获得类型并稳定升级；关键抓手是 public API、exports、peerDependencies、sideEffects、types 和语义化版本。',
      demo: `最小 package.json 产物契约：

\`\`\`json
{
  "name": "@company/ui",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./button": {
      "types": "./dist/button.d.ts",
      "import": "./dist/button.js"
    },
    "./style.css": "./dist/style.css"
  },
  "sideEffects": ["**/*.css"],
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0"
  }
}
\`\`\`

这个配置表达了三个边界：允许导入什么、类型在哪里、哪些副作用不能被摇掉。`,
      diagnosis: [
        '升级后包体积暴涨，先看 ESM 产物、sideEffects 和导入路径。',
        'Hooks 报错或上下文失效，先检查是否出现多份 React/Vue。',
        '类型丢失，检查 types、exports 条件和 declaration 产物。',
        '样式污染，检查全局选择器、CSS 注入顺序、主题 token 和样式隔离。',
        '业务依赖内部路径失败，检查 public API 是否被绕过。',
        '升级风险大，检查 changelog、迁移指南和 semver 是否可信。',
      ],
      followups: [
        'exports 会如何影响深路径导入？',
        'sideEffects: false 为什么可能误删 CSS？',
        '组件库如何设计主题 token 才不绑死业务？',
        '如何用真实业务 fixture 验证库发布？',
      ],
      deepDive: '值得深入。组件库是前端平台能力的核心载体，中高级前端必须把“功能实现”提升到“对外契约设计”。深入顺序是模块产物、exports、types、tree shaking、peer 依赖、样式系统、版本治理。',
      references: [
        { title: 'Node.js：Package exports 字段详解', url: 'https://nodejs.org/api/packages.html#exports' },
        { title: 'Vite：Library Mode 库模式构建', url: 'https://cn.vitejs.dev/guide/build#library-mode' },
        { title: 'Rollup：Tutorial 入门指南', url: 'https://cn.rollupjs.org/tutorial/' },
        { title: 'TypeScript：Declaration Files 指南', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html' },
        { title: 'npm peerDependencies 说明', url: 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies' },
      ],
      quiz: [
        single('在组件库的设计中，明确界定 public API 的最核心价值是？', ['为消费端应用提供稳定的契约，允许库内部重构的同时保障向后兼容。', '完全对外界隐藏所有内部组件的物理实现以保障库的代码安全性。', '能够自动替代单元测试，强制阻断消费端对私有属性的类型依赖。', '在构建阶段减少 TypeScript 的类型解析开销以缩短业务编译时间。'], 0, `💡 它解决了什么问题：
解决了组件库随着业务迭代频繁重构内部实现时，导致消费端项目由于强耦合库内私有文件而大面积崩塌（Breaking Changes 扩散）的问题。

🔍 核心原理解析（防拷打）：
1. 💡 黑盒化与信息隐藏：组件库应当隐藏内部目录结构（如组件的辅助函数、底层的原子组件等），只通过统一 of 入口文件（如 \`index.ts\`）导出明确支持和承诺长期稳定的公共 API（如组件 Props 定义、特定工具函数等）。
2. 🔍 演进自由度与向后兼容：一旦确立了 public API 契约，库开发者可以在不通知消费者的情况下，完全重写库的内部逻辑、重命名私有文件夹，只要导出的 API 签名和语义不变，消费端在无感升级时就不会出现编译报错。
3. ⚡ 构建器摇树优化的通道：清晰的 public API 也是构建工具进行依赖图追踪的根节点。如果业务方绕过公共入口，直接去引入内部私有文件路径，不仅破坏了封装，也让构建器在做模块依赖去重和 tree shaking 时无从下手。`),
        multiple('为了确保公共或内部组件库能被不同的业务项目高效且安全地消费，产物设计应关注？', ['配置条件导出（exports）以定义跨构建环境的入口加载规则', '输出完整的 TypeScript 类型声明文件（.d.ts）', '声明 peerDependencies 以保障底层依赖框架的唯一单例', '配置 sideEffects 字段以保留 Tree Shaking 优化时的样式边界'], [0, 1, 2, 3], `💡 它解决了什么问题：
解决了公共组件库在被不同宿主环境（CJS/ESM 项目、TypeScript 项目、不同框架版本）消费时，出现的无法加载、类型失效、包体积失控、双包危机或多框架实例冲突等工程灾难。

🔍 核心原理解析（防拷打）：
1. 💡 条件导出（Exports Map）的多入口解析：在 package.json 中配置 \`exports\` 字段，不仅指明了类型的指向，还能根据宿主环境（\`import\` 用于 ESM，\`require\` 用于 CommonJS）定向加载最适合的编译产物，防止传统 main/module 声明在混合模式下的混淆。
2. 🔍 无残留摇树（sideEffects 标记）：显式配置 \`"sideEffects": false\`，告知打包器该组件库中的 JS 文件均无副作用，若消费端未使用某些组件，可以直接从最终产物中剔除。
3. ⚡ 单例保障（peerDependencies）：声明对基础框架（如 react、vue）的版本要求，避免重复打包 React 运行时，确保状态管理器和 UI 框架的单例性。`),
        judgment('业务项目为了实现按需引入，直接深路径导入组件库内部物理文件是长期稳定的工程实践。', 1, `💡 它解决了什么问题：
避免了业务项目过度耦合第三方或内部组件库的内部具体实现结构，防止组件库小版本迭代重构时，业务代码因为物理路径变更而发生编译级报错。

🔍 核心原理解析（防拷打）：
1. 💡 物理路径非契约保障：组件库的内部路径（如 \`lib/es/components/button/button.js\`）往往是构建产物阶段由工具链动态生成的中间体，属于“实现细节”，并不在库的版本兼容承诺内。
2. 🔍 现代 Exports 条件封锁：在现代 package.json 规范中，如果组件库正确声明了 \`exports\` 字段，且只导出了 \`.\` 和 \`./css\` 等主入口，任何尝试引入内部路径的行为，都会在 Node.js 解析或构建打包时被强制阻断。
3. ⚡ 安全升级治理：应当通过组件库的 Public 入口进行聚合导入。若某些子模块确实有独立按需引入需求，组件库开发者应通过 exports 明确对外暴露，以维持契约的清晰性。`),
        single('React 组件库若错误地将 react 声明在 dependencies 中，其带来的最大工程风险是？', ['可能在 node_modules 下安装多份 React 物理实例，导致运行时 Hooks 错乱与体积暴涨。', '导致主应用与组件库的全局 CSS 样式表发生命名冲突并彻底崩塌。', '会阻断打包工具的 Tree Shaking 流水线，使得业务项目无法使用任何图片资源。', '在部署上线后，会导致主应用在协商缓存失效时频繁抛出 404 错误。'], 0, `💡 它解决了什么问题：
解决了由于组件库依赖声明失当引入的多实例危机。这会直接导致业务运行时出现“Hooks can only be called inside the body of a function component”报错、React Context 上下文跨组件丢失、以及打包产物体积重复累加等致命痛点。

🔍 核心原理解析（防拷打）：
1. 💡 物理隔离与实例重叠：当库的 package.json 错误地将 react 列在 dependencies 中，如果主应用 and 该组件库对 React 版本的要求不一致，包管理器会在组件库的 node_modules 内物理安装另一份 React 代码。
2. 🔍 React 全局上下文的分裂：React 依赖内部的全局变量（如 currentDispatcher）来定位当前正在执行的组件上下文以支撑 Hooks 工作。当两个不同的 React 实例在同一个页面中交替执行，全局调度器就会发生错乱，直接抛出 Hooks 报错。
3. ⚡ 单实例强制约束：对于此类核心运行时框架，组件库必须将其声明在 peerDependencies 中。宿主应用在安装时会负责提供唯一的 React 实例。如果本地开发联调时因为软链导致仍存在双实例，必须在主应用的构建配置中配置 \`resolve.alias\`，强制将 \`react\` 指向主应用 node_modules 下的唯一物理路径。`),
        multiple('对于内部的大型组件库，为了降低业务升级版本的风险，库的治理规范应包含？', ['严格遵循语义化版本（SemVer）规则以约束更新边界', '基于语义化 Commit 自动生成详尽的变更日志（Changelog）', '在重大废弃或破坏性变更发布时提供升级迁移指南与 Codemod 脚本', '在 Patch 版本中静默发布破坏性变更以倒逼业务团队及时跟进升级'], [0, 1, 2], `💡 它解决了什么问题：
解决了内部或公共组件库在版本迭代升级时，因信息不对称、变更范围模糊导致消费端项目不敢升级、或者升级后产生未知回归缺陷的“版本升级焦虑”与协同壁垒。

🔍 核心原理解析（防拷打）：
1. 💡 语义化版本（SemVer）的严苛遵循：严格按照 \`Major.Minor.Patch\` 规律递增。涉及到公开 API 的废弃必须递增 Major，新增功能递增 Minor，修复 Bug 且无破坏性变更递增 Patch，从而建立可预测的契约关系。
2. 🔍 自动化变更日志与语义 commit：利用 \`conventional-changelog\` 和 Husky + commitlint 等工具，强制使用 \`feat/fix/chore/docs\` 等提交前缀，并在发布时自动基于 Git Commit 历史生成精确的 Changelog，明确告知消费者本次升级改动了什么。
3. ⚡ 迁移指南与 Codemod：在大厂大型组件库的升级实践中，当面临重大破坏性变更时，仅仅写一份迁移文档并不够，通常需要开发配套的 Codemod 工具（基于 AST 的自动代码转换脚本，例如使用 \`jscodeshift\`），帮助消费端业务团队一键自动重构旧代码中不兼容的 API，极大地降低升级成本与故障率。`),
        single('在组件库的 package.json 中，若将 sideEffects 属性配置错误，最容易导致的线上故障是？', ['页面引用的 CSS 样式表在生产打包时被 Tree Shaking 误摇掉导致样式白屏。', '接口请求在转发时丢失 Host 信息，触发安全网关的 CORS 跨域阻断。', '打包工具会强行将敏感环境变量硬编码至最终产物中并导致内存溢出。', '业务应用在加载动态子路由时会频繁遭遇 CDN chunk 物理资源 404 报错。'], 0, `💡 它解决了什么问题：
解决了前端构建优化中 Tree Shaking（摇树优化）的过度剪枝与死代码残留问题。若错误地将包含全局副作用的代码（如全局样式 CSS 导入、Polyfill）配置为无副作用，会导致页面样式完全丢失或基础环境环境功能失效。

🔍 核心原理解析（防拷打）：
1. 💡 Tree Shaking 的保守假设：打包工具在遇到未被显式引用的模块时，由于无法在编译期确定其是否在全局产生了影响，默认不敢将其删除。
2. 🔍 sideEffects 声明的干预机制：若在 package.json 中配置 \`"sideEffects": false\`，即对打包器做出“安全承诺”：该库中的所有文件，如果没有被业务代码显式 import 引用，就可以被 100% 摇掉。这通常能显著减少打包体积。
3. ⚡ 样式与全局逻辑的吞噬边界：当我们在组件中引入 \`import './style.css'\`，对打包器而言，这个 CSS 模块并没有任何导出的变量被 JS 使用。如果 \`sideEffects\` 被错误地设置为 \`false\`且没有额外排除该样式，打包工具会认为该 CSS 模块完全无用，在生产构建阶段会将其直接移除，造成页面样式彻底白屏。因此，正确的配置应当为 \`"sideEffects": ["*.css", "*.scss"]\`，以确保 JS 被安全 Tree Shake 的同时，样式被正确保留。`),
      ],
    }),
  ],
};
