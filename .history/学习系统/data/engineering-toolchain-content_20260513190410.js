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
        single('依赖可复现最核心的资产是什么？', ['README', 'lockfile', '页面截图', 'CSS reset'], 1, 'lockfile 记录实际解析出的依赖树，是不同环境安装一致的基础。'),
        multiple('排查 CI 安装结果和本地不一致时，应优先检查哪些项？', ['lockfile 是否一致', 'Node 和包管理器版本', 'registry 来源', '按钮交互动画'], [0, 1, 2], '依赖解析受 lockfile、运行时、包管理器和 registry 影响。'),
        judgment('package.json 中写了 ^1.2.0，就能保证所有机器永远安装 1.2.0。', 1, '版本范围允许解析到兼容新版本，必须依赖 lockfile 锁定实际结果。'),
        single('组件库把 React 放入 peerDependencies 的主要原因是？', ['避免宿主出现多份 React 或版本冲突', '让 CSS 自动隔离', '减少 HTML 文件', '提升 DNS 命中率'], 0, 'React/Vue 这类宿主框架通常应由业务项目提供。'),
        multiple('CI 中更稳的依赖安装策略包括？', ['提交 lockfile', '使用 frozen install', '固定包管理器版本', '每次自动升级所有依赖'], [0, 1, 2], '自动升级依赖会引入不可控变化。'),
        single('install scripts 的风险更接近什么？', ['安装阶段执行第三方代码，可能影响构建和安全', '只能修改字体', '只能删除图片', '不会影响任何结果'], 0, '安装脚本有执行能力，应纳入供应链治理。'),
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
        { term: 'dev server', desc: '开发期服务器，服务源码模块、HMR、静态资源和 fallback。' },
        { term: 'HMR', desc: '热模块替换，文件变化后局部更新页面。' },
        { term: 'proxy', desc: '本地接口转发能力，用于开发期联调，但不等于线上链路。' },
        { term: 'Origin', desc: '浏览器安全模型里判断跨源请求的重要请求头。' },
        { term: 'Cookie Domain', desc: '决定 Cookie 可发送到哪些域名，代理配置常掩盖其问题。' },
        { term: 'history fallback', desc: 'SPA 刷新子路由时回退到 index.html 的机制。' },
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
      references: ['Vite Server Options 官方文档', 'MDN CORS 文档', 'MDN Set-Cookie 文档', 'HTTP Origin 相关规范'],
      quiz: [
        single('dev proxy 最大的认知风险是？', ['掩盖真实跨域、Cookie 和网关行为', '让 HTML 不能渲染', '让 CSS 无法加载', '让 JS 不能执行'], 0, '代理让本地联调方便，但可能隐藏真实链路差异。'),
        multiple('本地正常线上登录态异常，应检查？', ['Cookie Domain', 'SameSite/Secure', '真实 Origin', '按钮颜色'], [0, 1, 2], '登录态常受 Cookie 和跨源策略影响。'),
        judgment('只要 dev server 代理请求成功，就说明线上请求链路一定没问题。', 1, '线上还会经过真实域名、HTTPS、CDN、网关和 Cookie 策略。'),
        single('SPA 刷新子路由 404 通常和什么有关？', ['history fallback 未正确配置', '数组方法不可用', 'React 版本太新', '图片尺寸太大'], 0, 'SPA 子路由刷新需要服务端或 CDN 回退到入口 HTML。'),
        multiple('dev server 常见职责包括？', ['服务源码模块', 'HMR', '静态资源', '替代生产监控'], [0, 1, 2], '生产监控不是 dev server 的职责。'),
        single('changeOrigin 会影响什么？', ['转发请求时 Host/Origin 相关语义', 'TypeScript 类型推导', 'DOM 节点数量', '图片压缩率'], 0, 'changeOrigin 会改变代理请求头，可能与真实浏览器请求不同。'),
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
        { term: 'native ESM', desc: '开发期按需加载模块的基础。' },
        { term: 'dependency pre-bundling', desc: '把第三方依赖预处理成更适合浏览器开发加载的形式。' },
        { term: 'base', desc: '构建产物静态资源 URL 的基础路径。' },
        { term: 'import.meta.env', desc: 'Vite 环境变量入口，生产构建时会被静态替换。' },
        { term: 'chunk', desc: '构建拆分出的代码块，常见于动态导入和公共依赖。' },
        { term: 'sourcemap', desc: '线上错误定位源码的重要映射文件，需要配合权限和上传策略。' },
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
      references: ['Vite Why Vite 官方文档', 'Vite Dependency Pre-Bundling 官方文档', 'Vite Building for Production 官方文档', 'Rollup Output 官方文档'],
      quiz: [
        single('Vite dev 和 build 最大的差异是？', ['dev 按需服务源码，build 生成生产产物', 'dev 不运行 JS', 'build 不处理依赖', '两者完全一样'], 0, '开发期和生产期目标不同，链路也不同。'),
        multiple('生产白屏且 chunk 404，应检查？', ['base 配置', '部署子路径', 'CDN 缓存', '动态导入产物'], [0, 1, 2, 3], 'chunk 404 常来自路径、缓存和部署一致性问题。'),
        judgment('本地 vite dev 正常，就可以证明生产构建一定安全。', 1, '必须跑 build/preview 或类生产环境验证。'),
        single('import.meta.env 的重要风险是？', ['构建期注入到前端产物，不能放真正密钥', '只能用于 CSS', '会阻止 HMR', '无法在 Vite 中使用'], 0, '前端产物可被用户读取。'),
        multiple('构建阶段通常会做？', ['代码分割', '压缩', '资源 hash', 'HMR 局部更新'], [0, 1, 2], 'HMR 是开发阶段能力。'),
        single('依赖中使用 Node-only API 导致线上失败，属于哪类问题？', ['浏览器产物兼容性问题', '设计稿问题', '数据库索引问题', 'Cookie 过期问题'], 0, '浏览器包不能直接使用 Node-only API。'),
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
        { term: 'exports', desc: 'package.json 中声明可导入入口和条件产物的字段。' },
        { term: 'sideEffects', desc: '告诉构建器哪些文件有副作用，影响 tree shaking。' },
        { term: 'types', desc: '类型声明入口，让消费方获得正确编辑器提示和编译检查。' },
        { term: 'peerDependencies', desc: '让宿主提供框架依赖，避免多实例。' },
        { term: 'semver', desc: '通过版本号表达兼容风险和升级预期。' },
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
      references: ['Node.js Packages exports 官方文档', 'Rollup Library Mode 文档', 'Vite Library Mode 文档', 'TypeScript Declaration Files 文档'],
      quiz: [
        single('组件库 public API 的核心价值是？', ['给消费方稳定契约', '隐藏所有代码', '替代测试', '删除类型系统'], 0, 'public API 是消费者可依赖的边界。'),
        multiple('组件库产物设计要关注？', ['exports', 'types', 'peerDependencies', 'sideEffects'], [0, 1, 2, 3], '这些共同决定解析、类型、依赖和 tree shaking。'),
        judgment('业务项目大量导入组件库内部路径是稳定做法。', 1, '内部路径不是公开契约，库重构会破坏业务。'),
        single('React 组件库把 React 打进 dependencies 的风险是？', ['可能出现多份 React 实例', '无法写 CSS', '接口不能请求', 'HTML 不能解析'], 0, '框架多实例会造成 Hooks、Context 等异常。'),
        multiple('组件库升级治理应包含？', ['语义化版本', '变更日志', '迁移指南', '静默破坏性变更'], [0, 1, 2], '破坏性变更需要明确声明和迁移路径。'),
        single('sideEffects 配置错误最可能导致？', ['样式被误摇掉或无用代码无法摇掉', '数据库死锁', 'Cookie 失效', 'DNS 解析失败'], 0, 'sideEffects 直接影响构建器的摇树判断。'),
      ],
    }),
  ],
};
