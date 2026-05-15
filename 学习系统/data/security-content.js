import { judgment, makeLongformDoc, multiple, single } from './longform-utils.js';

export const SECURITY_CONTENT = {
  id: 'frontend-security-longform',
  name: '深度长文：前端安全',
  icon: '🛡️',
  desc: '补齐技术破冰待补的前端安全主线，覆盖 XSS/CSP、CSRF/Cookie 和供应链安全。',
  sourceCards: ['工程化主干待补：前端安全', '请求-响应全链路', 'REST 与接口设计'],
  docs: [
    makeLongformDoc({
      title: 'XSS、CSP 与 Trusted Types：用户输入到 DOM 的安全边界',
      sourceCards: ['工程化主干待补：前端安全'],
      problem: '它解决的是不可信内容进入可执行上下文的问题。XSS 的本质不是“输入框危险”，而是攻击者让字符串变成脚本、事件处理器、URL 或危险 DOM sink 的输入。',
      customerCase: '客户反馈评论区出现异常跳转。排查发现富文本内容经过后端存储后，前端用 innerHTML 直接渲染，攻击者插入了带事件处理器的 HTML。修复需要 sanitizer、CSP 和危险 API 治理，而不是只过滤某几个关键词。',
      flow: [
        '识别不可信输入来源：用户输入、URL、富文本、低代码配置、第三方脚本。',
        '默认使用文本渲染，不把字符串当 HTML。',
        '富文本必须经过可信 sanitizer。',
        '限制 innerHTML、outerHTML、insertAdjacentHTML 等危险 sink。',
        '配置 CSP 限制脚本来源、内联执行和上报违规。',
        '高风险应用引入 Trusted Types，把危险 sink 的输入类型化。',
      ],
      keywords: [
        { term: 'XSS', desc: '不可信内容被当作代码在浏览器执行。' },
        { term: 'DOM sink', desc: '可能把字符串解释成 HTML/脚本的 DOM API。' },
        { term: 'sanitizer', desc: '清理富文本中危险标签、属性和 URL 的工具。' },
        { term: 'CSP', desc: '内容安全策略，通过响应头限制资源来源和脚本执行。' },
        { term: 'nonce/hash', desc: 'CSP 中允许特定内联脚本的机制。' },
        { term: 'Trusted Types', desc: '限制危险 DOM sink 只能接收可信类型。' },
      ],
      interview: 'XSS 防护要分层：默认转义、富文本 sanitizer、避免危险 DOM API、CSP 限制脚本执行、第三方脚本治理，以及高风险场景用 Trusted Types 约束 DOM sink。',
      demo: `危险写法：

\`\`\`ts
preview.innerHTML = userInput
\`\`\`

更安全的方向：

\`\`\`ts
preview.textContent = userInput
\`\`\`

如果必须渲染富文本，应使用经过维护的 sanitizer，并在服务端和前端共同治理允许的标签、属性和协议。`,
      diagnosis: [
        '发现页面被插入脚本时，先定位输入来源、存储链路和渲染点。',
        '检查是否使用 dangerouslySetInnerHTML、innerHTML、模板拼接或低代码渲染。',
        '检查富文本 sanitizer 是否允许 javascript: URL、事件属性或危险标签。',
        '检查 CSP 是否过宽，例如 unsafe-inline、任意第三方脚本。',
        '检查第三方脚本是否有白名单、SRI、权限和加载位置治理。',
        '上线修复后看 CSP report 和安全监控是否仍有违规。',
      ],
      followups: [
        'React 默认转义为什么不等于没有 XSS？',
        'CSP 中 nonce 和 hash 怎么选？',
        'Trusted Types 解决的是哪类问题？',
        '富文本 sanitizer 为什么不能自己随便写？',
      ],
      deepDive: '必须深入。前端安全是客户信任和合规底线。深入顺序是浏览器执行上下文、输出编码、DOM XSS、CSP、Trusted Types、第三方脚本和供应链。',
      references: ['OWASP XSS Prevention Cheat Sheet', 'MDN Content Security Policy', 'MDN Trusted Types API', 'DOMPurify 官方文档'],
      quiz: [
        single('XSS 的本质是？', ['不可信内容被当作代码执行', '图片太大', '接口太慢', 'CSS 权重太高'], 0, 'XSS 关键在于进入可执行上下文。'),
        multiple('降低 XSS 风险的措施包括？', ['输出转义', '可信 sanitizer', 'CSP', '直接信任所有富文本'], [0, 1, 2], '富文本必须经过安全处理。'),
        judgment('React 默认转义文本，因此 dangerouslySetInnerHTML 任何时候都安全。', 1, 'dangerouslySetInnerHTML 绕过默认转义，必须额外治理。'),
        single('Trusted Types 主要约束什么？', ['危险 DOM sink 的输入', '图片尺寸', 'HTTP 缓存', 'Git 分支'], 0, 'Trusted Types 让危险 sink 只能接收可信类型。'),
        multiple('CSP 可以帮助限制？', ['脚本来源', '内联脚本执行', '违规上报', '数据库索引'], [0, 1, 2], 'CSP 是浏览器安全策略。'),
        single('富文本安全最不推荐的是？', ['手写正则过滤所有危险 HTML', '使用成熟 sanitizer', '限制允许标签', '限制 URL 协议'], 0, 'HTML 解析复杂，手写正则容易绕过。'),
      ],
    }),
    makeLongformDoc({
      title: 'CSRF、Cookie 与登录态：浏览器自动携带凭证的风险',
      sourceCards: ['工程化主干待补：前端安全', '请求-响应全链路'],
      problem: '它解决的是跨站请求利用浏览器自动携带 Cookie 的问题。CSRF 不是读取用户数据，而是诱导已登录浏览器向目标站点发起有副作用请求。',
      customerCase: '客户后台用户访问第三方页面后，账号资料被修改。原因是修改资料接口接受 Cookie 登录态，且没有 CSRF token、SameSite 和 Origin 校验；攻击页构造表单自动提交到了目标站点。',
      flow: [
        '区分认证凭证存储位置：Cookie、内存、localStorage。',
        '理解 Cookie 会按 Domain、Path、SameSite、Secure 自动发送。',
        '写操作禁止使用 GET，并要求服务端鉴权。',
        '使用 SameSite Cookie 降低跨站携带凭证风险。',
        '关键写操作使用 CSRF token 或双重提交 Cookie。',
        '校验 Origin/Referer，并对敏感操作二次确认或重新认证。',
      ],
      keywords: [
        { term: 'CSRF', desc: '跨站请求伪造，利用浏览器自动携带凭证。' },
        { term: 'SameSite', desc: '控制跨站请求是否携带 Cookie。' },
        { term: 'HttpOnly', desc: '禁止 JS 读取 Cookie，但不阻止自动发送。' },
        { term: 'Secure', desc: 'Cookie 只通过 HTTPS 发送。' },
        { term: 'CSRF token', desc: '服务端生成并验证的防伪令牌。' },
        { term: 'Origin check', desc: '校验请求来源是否可信。' },
      ],
      interview: 'CSRF 的关键是浏览器会自动携带目标站点 Cookie；防护要结合 SameSite、CSRF Token、Origin/Referer 校验、正确 HTTP 语义和敏感操作二次确认，HttpOnly 只能防脚本读取 Cookie，不能防 CSRF。',
      demo: `Cookie 属性示例：

\`\`\`http
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax; Path=/
\`\`\`

这降低了脚本读取和部分跨站请求携带风险，但关键写操作仍应配合 CSRF token 或 Origin 校验。`,
      diagnosis: [
        '怀疑 CSRF 时先确认接口是否依赖 Cookie 登录态。',
        '检查有副作用操作是否错误使用 GET。',
        '检查 Cookie 的 SameSite、Secure、Domain、Path。',
        '检查服务端是否校验 CSRF token 或 Origin/Referer。',
        '检查 CORS 是否错误允许任意来源携带 credentials。',
        '敏感操作检查是否有二次确认、验证码或重新认证。',
      ],
      followups: [
        'HttpOnly 能不能防 CSRF？为什么？',
        'SameSite=Lax 和 Strict 怎么取舍？',
        '把 token 放 localStorage 能解决所有安全问题吗？',
        'CORS 和 CSRF 是同一个问题吗？',
      ],
      deepDive: '值得深入。登录态安全牵涉浏览器、服务端、网关和产品交互。深入顺序是 Cookie 属性、CSRF、CORS、Token 存储、会话续期和敏感操作保护。',
      references: ['OWASP CSRF Prevention Cheat Sheet', 'MDN Set-Cookie', 'MDN SameSite Cookies', 'MDN CORS'],
      quiz: [
        single('CSRF 主要利用浏览器什么行为？', ['自动携带目标站点 Cookie', '自动压缩图片', '自动执行 TS', '自动生成接口'], 0, '已登录 Cookie 被自动带上是关键。'),
        multiple('CSRF 防护手段包括？', ['SameSite Cookie', 'CSRF Token', 'Origin 校验', '用 GET 做删除操作'], [0, 1, 2], 'GET 不应承载有副作用操作。'),
        judgment('HttpOnly 可以阻止浏览器在请求中自动携带 Cookie。', 1, 'HttpOnly 只防 JS 读取，不阻止自动发送。'),
        single('Secure Cookie 表示？', ['只通过 HTTPS 等安全通道发送', '永不过期', '可被任意 JS 读取', '只能本地使用'], 0, 'Secure 限制传输通道。'),
        multiple('Cookie 发送范围相关属性包括？', ['Domain', 'Path', 'SameSite', 'font-weight'], [0, 1, 2], '前三者影响 Cookie 发送范围或跨站行为。'),
        single('删除订单这类操作最不应该使用？', ['GET', 'POST/DELETE 并鉴权', 'CSRF Token', 'Origin 校验'], 0, 'GET 应保持安全和幂等语义。'),
      ],
    }),
    makeLongformDoc({
      title: '供应链安全：依赖、构建、发布和前端密钥',
      sourceCards: ['工程化主干待补：前端安全', '包管理器', 'CI-CD'],
      problem: '它解决的是前端安全不只发生在浏览器页面里的问题。依赖包、postinstall、CI token、私有 registry、构建脚本、第三方 CDN、sourcemap 和前端环境变量都可能成为攻击入口。',
      customerCase: '某项目把地图服务 secret 放进 Vite 环境变量，构建产物上线后被用户在 JS bundle 中直接看到。另一个项目依赖包被投毒，通过 postinstall 窃取 CI token。两者都不是传统 XSS，但都是前端供应链问题。',
      flow: [
        '锁定依赖和包管理器，使用 frozen install。',
        '定期审计依赖漏洞和许可证风险。',
        '限制 install scripts 和高风险依赖来源。',
        'CI 凭证最小权限、短周期、日志脱敏。',
        '前端产物不放真正服务端密钥。',
        '第三方脚本使用白名单、SRI、CSP 和加载权限治理。',
      ],
      keywords: [
        { term: 'supply chain', desc: '从依赖、构建、CI 到发布的完整软件供应链。' },
        { term: 'lockfile', desc: '锁定依赖解析结果，降低漂移和投毒风险。' },
        { term: 'postinstall', desc: '安装阶段执行脚本，可能带来安全风险。' },
        { term: 'least privilege', desc: '凭证只拥有完成任务所需的最小权限。' },
        { term: 'SRI', desc: 'Subresource Integrity，用哈希校验第三方资源完整性。' },
        { term: 'source map', desc: '源码映射文件，需控制上传和访问权限。' },
      ],
      interview: '前端供应链安全要覆盖依赖、安装脚本、CI 凭证、私有 registry、构建产物、第三方脚本和密钥治理；真正的服务端密钥不能进入前端 bundle，发布凭证必须最小权限和可轮换。',
      demo: `前端环境变量的错误认知：

\`\`\`ts
// 错误：这会进入前端产物
const secret = import.meta.env.VITE_SERVER_SECRET
\`\`\`

凡是进入浏览器的变量，都应被视为公开信息。前端可以持有 public key、client id 或短期受限 token，但不能持有服务端 secret。`,
      diagnosis: [
        '发现密钥泄漏时，先吊销和轮换，不只删除代码。',
        '检查构建产物、sourcemap、日志和历史提交是否仍含敏感信息。',
        '依赖异常时检查 lockfile diff、install scripts 和新引入包。',
        'CI token 泄漏时检查权限范围、有效期、日志和环境变量暴露。',
        '第三方脚本异常时检查来源、SRI、CSP 和加载时机。',
        '私有包风险时检查 registry 权限、发布审批和包名抢注。',
      ],
      followups: [
        '为什么 VITE_ 变量不能放 secret？',
        'lockfile 能防所有供应链攻击吗？',
        '第三方 CDN 脚本如何做完整性校验？',
        'sourcemap 应该公开部署吗？',
      ],
      deepDive: '必须深入。供应链安全直接影响公司资产和客户数据。深入顺序是依赖治理、CI 凭证、环境变量、第三方脚本、sourcemap、SRI、SBOM 和发布权限。',
      references: ['OWASP Software Supply Chain Security', 'npm audit 文档', 'MDN Subresource Integrity', 'Vite Env Variables 文档'],
      quiz: [
        single('为什么不能把服务端密钥放进前端环境变量？', ['前端产物会暴露给用户', '会让 CSS 失效', '会减少题目数量', '会阻止路由'], 0, '浏览器里的代码和变量都可被用户获取。'),
        multiple('供应链安全范围包括？', ['依赖包', 'CI 凭证', '第三方脚本', '构建产物'], [0, 1, 2, 3], '这些都是前端供应链的一部分。'),
        judgment('删除泄漏密钥的代码后，不需要轮换密钥。', 1, '密钥一旦泄漏，应立即吊销和轮换。'),
        single('SRI 的主要作用是？', ['校验第三方资源完整性', '提高 TS 编译速度', '替代登录', '压缩图片'], 0, 'SRI 用哈希验证资源未被篡改。'),
        multiple('CI 凭证治理应包括？', ['最小权限', '短周期或可轮换', '日志脱敏', '永久管理员权限'], [0, 1, 2], '永久高权限凭证风险很高。'),
        single('postinstall 风险来自哪里？', ['安装阶段能执行依赖包脚本', '只能修改 README', '只能压缩 CSS', '不能运行代码'], 0, '安装脚本具备执行能力。'),
      ],
    }),
  ],
};
