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
        single('XSS 的本质是？', ['不可信内容被当作代码执行', '图片太大', '接口太慢', 'CSS 权重太高'], 0, `💡 它解决了什么问题：
解决了前端安全防护中“只在输入端过滤”的被动缺陷。如果不明白XSS是数据进入可执行上下文导致的，开发者会陷入“手写正则过滤特殊字符”的死胡同，攻击者可以通过多重编码、非预期字符集绕过，导致严重的身份盗用与恶意脚本执行。

🔍 核心原理解析（防拷打）：
1. XSS的核心是“不可信输入被当成代码执行”。XSS分为反射型（URL参数直出）、存储型（后端数据库持久化）和DOM型（JS接收源并写入危险Sink）。
2. 在工程上，只做“输入过滤”是不可靠的，因为同一份输入在HTML、JS变量、CSS或URL属性等不同上下文中，其转义规则完全不同。因此，防护必须遵循“输出编码（Context-aware Output Encoding）”原则。
3. 进一步拓展大厂面试追问：在React/Vue中什么场景仍会有DOM型XSS风险？在使用 dangerouslySetInnerHTML 或 v-html 渲染富文本时；以及直接操作 href 属性接收 javascript: 协议链接时，默认的XSS转义机制将失效，必须配合成熟的 HTML Sanitizer（如 DOMPurify）过滤危险 sink。`),
        multiple('降低 XSS 风险的措施包括？', ['输出转义', '可信 sanitizer', 'CSP', '直接信任所有富文本'], [0, 1, 2], `💡 它解决了什么问题：
解决了在单点安全防线（如纯前端转义）失效时，攻击脚本能瞬间窃取用户Cookie、调用敏感API并彻底接管页面的灾难性后果。通过实施多层防御，能够在一个防线被突破后，依旧保护用户资产。

🔍 核心原理解析（防拷打）：
1. 纵深防御机制：首先在输出层执行上下文转义或使用 DOMPurify 等 Sanitizer 清理富文本；其次，利用内容安全策略（CSP）限制外域脚本加载及内联脚本运行。
2. 权限隔离与防护：在登录态Cookie上标记 HttpOnly，使得JS无法通过 document.cookie 获取Token，直接切断XSS盗取身份的关键途径。
3. 进一步拓展大厂面试追问：若富文本中有业务必须要用的内联样式或脚本，如何在不开启 'unsafe-inline' 的情况下配置 CSP？可以为该内联脚本生成 SHA-256 哈希值，或在服务端为每次请求生成唯一的 nonce 随机值，并在 CSP Header 及 script 标签上匹配该 nonce 值，浏览器即会允许其执行，在合规与安全之间取得平衡。`),
        judgment('React 默认转义文本，因此 dangerouslySetInnerHTML 任何时候都安全。', 1, `💡 它解决了什么问题：
纠正了对 React 框架安全性的盲目信任，防止开发人员将不可信的第三方 HTML 字符串直接传递给 dangerouslySetInnerHTML，从而彻底绕过了虚拟 DOM 的安全防御门禁，导致富文本编辑器或评论区成为 XSS 投毒的重灾区。

🔍 核心原理解析（防拷打）：
1. React 的安全设计：在普通 JSX 渲染中，React 默认会将动态字符串作为 textContent 处理，阻断了 HTML 标签的解析与执行。
2. 危险的隐门：dangerouslySetInnerHTML 的底层是原生 innerHTML。React 对此不进行任何默认转义，如果直接将后端或未处理的输入赋值给它，浏览器就会解析并执行其中的 script 或事件属性（如 <img src=x onerror=...>），引发严重的 DOM XSS。
3. 进一步拓展大厂面试追问：如果业务必须要用 dangerouslySetInnerHTML 渲染富文本，应如何做防护？必须在将 HTML 字符串传递给 React 之前，使用 DOMPurify 执行过滤，并结合配置 Trusted Types（可信类型）限制原生 DOM sink 只能接收经 Sanitizer 审查过的可信对象，拒绝任何普通字符串输入。`),
        single('Trusted Types 主要约束什么？', ['危险 DOM sink 的输入', '图片尺寸', 'HTTP 缓存', 'Git 分支'], 0, `💡 它解决了什么问题：
解决了通过传统代码评审和静态分析（ESLint）极难防御“DOM 型 XSS 漏洞”的痛点。Trusted Types 强制从浏览器引擎底层规范可写入危险 DOM Sink（如 innerHTML、eval）的参数类型，杜绝了无意的危险赋值。

🔍 核心原理解析（防拷打）：
1. 机制解析：传统的 DOM Sink 允许接收任意字符串，这使得像 element.innerHTML = userInput 这样的代码极易被注入攻击脚本。
2. Trusted Types 从底层限制了这些 API，只允许它们接收经过审查生成的 TrustedHTML、TrustedScript 或 TrustedScriptURL 类型对象。直接传入普通字符串会触发浏览器抛出运行时异常，彻底杜绝了数据注入。
3. 进一步拓展大厂面试追问：如果项目中有些第三方库（如旧版 jQuery）频繁直接对 innerHTML 赋字符串，开启 Trusted Types 导致大面积报错，如何平滑过渡？可以配置一个“Default Policy”（默认策略），当向 Sink 传入字符串时，浏览器会自动调用该默认策略进行过滤，以向后兼容不受控的代码库。`),
        multiple('CSP 可以帮助限制？', ['脚本来源', '内联脚本执行', '违规上报', '数据库索引'], [0, 1, 2], `💡 它解决了什么问题：
解决了当应用存在 XSS 漏洞时，攻击者可以通过内联脚本运行并向自己的黑客服务器发送用户 Token 的“失控”痛点。CSP 作为浏览器的沙箱防御，强行限制了脚本的执行权限和网络请求的发送范围。

🔍 核心原理解析（防拷打）：
1. 原理剖析：内容安全策略（CSP）是由服务端在响应头中下发的安全指令集（如 Content-Security-Policy: default-src 'self'）。
2. 浏览器加载页面后，会严格拦截不符合策略的资源加载与脚本执行。例如，默认禁止执行 eval()、禁止执行内联的 script、并且禁止从策略外定义的域名下载静态资源。
3. 进一步拓展大厂面试追问：如果应用本身有大量历史遗留内联脚本，无法在慢速迭代中完全改造成外部 JS 文件，应当如何在不设置 'unsafe-inline' 的情况下安全放行？可以使用 'strict-dynamic' 配合 nonce 的 CSP 策略。在每次渲染页面时，服务端动态生成一串随机的 Cryptographic Nonce 传给合法的内联脚本，并限制只有携带相同 nonce 属性的脚本才能被运行。`),
        single('富文本安全最不推荐的是？', ['手写正则过滤所有危险 HTML', '使用成熟 sanitizer', '限制允许标签', '限制 URL 协议'], 0, `💡 它解决了什么问题：
解决了团队出于炫技或嫌麻烦而尝试手写正则表达式去过滤 HTML 中危险标签的愚蠢做法。由于 HTML 语法的极端复杂性、容错机制以及浏览器的兼容特性，手写正则会带来大量容易被绕过的漏洞，给系统安全留下致命隐患。

🔍 核心原理解析（防拷打）：
1. 原理简析：HTML 不属于正则语言，无法用简单的状态机精确匹配所有的嵌套闭合、畸形标签、嵌套编码。攻击者可以使用畸形标签（如 <img/src=""/onerror=...）轻松规避正则过滤。
2. 现代防御依赖于真正的 HTML 解析器（如 DOMPurify），它首先利用浏览器的 DOMParser 将 HTML 串解析为真实的内存 DOM 树，然后遍历节点树，根据安全的白名单保留受信任的标签和属性，丢弃危险的节点，最后将其重新序列化为干净的 HTML。
3. 进一步拓展大厂面试追问：如果使用 DOMPurify 在客户端做过滤，如何防范“DOM Clobbering”（DOM 劫持）攻击？DOMPurify 默认自带防范 Clobbering 的白名单控制。它会过滤掉 <form>、<input> 等标签上可能通过 name 属性劫持 window 全局变量命名的漏洞，防止恶意脚本通过劫持配置对象或公共方法从而破坏应用逻辑。`),
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
        single('CSRF 主要利用浏览器什么行为？', ['自动携带目标站点 Cookie', '自动压缩图片', '自动执行 TS', '自动生成接口'], 0, `💡 它解决了什么问题：
解决了在没有进行跨站防护时，黑客钓鱼网站能诱导已登录用户发起“越权恶意操作”的隐性安全漏洞。它揭示了浏览器管理凭证的天然信任机制在跨站环境下可能成为攻击武器的问题。

🔍 核心原理解析（防拷打）：
1. 机制解析：当用户在 A 网站完成登录后，浏览器会在本地缓存其 Session Cookie。当用户接着访问恶意的 B 网站时，B 网站通过 <form> 自动提交、Fetch 等方式向 A 网站接口发起操作请求。
2. 由于请求的目的地是 A 网站，浏览器在发送请求时，会按照机制自动将属于 A 网站的 Cookie 附加在请求头中发送。服务端接收到带有 Cookie 的请求，误以为是用户的自主操作并执行，导致越权发生。
3. 进一步拓展大厂面试追问：如果一个网站的登录凭证没有存在 Cookie 而是存在 localStorage 中，黑客钓鱼网站还能实施 CSRF 攻击吗？不能。因为 localStorage 在跨站环境（B 网站）下具有同源策略（SOP）的物理隔离，B 网站发送请求时无法获取 A 网站的 localStorage，且浏览器不会像 Cookie 那样自动发送它，但要注意此模式依然极易受到 XSS 窃取。`),
        multiple('CSRF 防护手段包括？', ['SameSite Cookie', 'CSRF Token', 'Origin 校验', '用 GET 做删除操作'], [0, 1, 2], `💡 它解决了什么问题：
解决了在单点会话 Cookie 管理下，无法区分布望的“跨站伪造请求”与用户自发的“本站正规请求”的技术盲区，保护账户安全。

🔍 核心原理解析（防拷打）：
1. 原理解析：SameSite 限制了第三方域名请求中 Cookie 的携带行为。CSRF Token 则通过“双因子校验”——不仅需要浏览器自动携带的 Cookie，还需要前端在请求体或自定义 Header（如 X-CSRF-Token）中显式上传一个服务端生成的防伪随机令牌。由于第三方钓鱼站点无法跨域读取该 Token，因此无法伪造合法请求。
2. 此外，Origin 和 Referer 提供了请求发起方的域名校验，在网关层即可拒绝来自非白名单域名的写请求。
3. 进一步拓展大厂面试追问：如果项目使用“双重 Cookie 校验（Double Submit Cookie）”防范 CSRF，为什么能免去服务端存储 Token 的压力？其安全性弱点是什么？其原理是前端读取一个名为 csrf_cookie 的 Cookie，并把其值作为 Header 带上。服务端只比对 Cookie 值和 Header 是否一致。这种设计无需在 Redis 存 Token，但其致命弱点是：如果同一个主域下的任意子域名存在 XSS 漏洞，攻击者就能伪造并改写 csrf_cookie，从而攻破防护。`),
        judgment('HttpOnly 可以阻止浏览器在请求中自动携带 Cookie。', 1, `💡 它解决了什么问题：
纠正了对 HttpOnly Cookie 职责定位的本质误解。HttpOnly 仅用于规避 XSS 劫持敏感凭证的路径，但并不破坏浏览器在网络传输中对 Cookie 的自动附带逻辑，帮助开发者构建清晰的网络防御分层。

🔍 核心原理解析（防拷打）：
1. 功能职责：HttpOnly 是 Cookie 的一个安全标志。标记后，浏览器会切断 JS 的 'document.cookie' 对该字段的读取与修改权限。
2. 但它并未改变浏览器的请求发送机制：只要用户发起属于该 Domain 的 HTTP 请求，浏览器依然会忠实地把该 HttpOnly Cookie 填入 Header 中。因此，虽然 XSS 无法读取它，但跨站页面发起的 CSRF 请求依然能够携带它。
3. 进一步拓展大厂面试追问：在大厂多系统协作中，如果一个子域的子应用确实需要读取 Cookie 中的某些非敏感用户信息（如用户名），但又想保护 SessionID 不被窃取，如何设计？应采用“Cookie 分轨治理”。将 SessionID 存在带有 HttpOnly; Secure; SameSite=Lax 的敏感 Cookie 中；而将非敏感的用户昵称、偏好存放在另一个不带 HttpOnly 的普通 Cookie 中。`),
        single('Secure Cookie 表示？', ['只通过 HTTPS 等安全通道发送', '永不过期', '可被任意 JS 读取', '只能本地使用'], 0, `💡 它解决了什么问题：
解决了敏感会话凭证（如 Session Cookie）在非加密的 HTTP 信道中传输时，容易被中间人（MITM）进行网络监听和嗅探（Packet Sniffing）而导致身份被轻易窃取的致命安全隐患。

🔍 核心原理解析（防拷打）：
1. 机制解析：在正常的网络传输中，如果 Cookie 未标记 Secure，即使它在 HTTPS 下生成，一旦用户无意中访问了该站点的 http:// 页面，浏览器依然会将该 Cookie 在未加密信道中发送，导致数据在明文传输中暴露。
2. 标记 Secure 后，浏览器会做硬性拦截，只有当请求协议为 https:// 或 wss:// 时，才会允许将其附带在请求中，确保凭证永远处于 TLS 加密通道中传输。
3. 进一步拓展大厂面试追问：如果应用配置了 HSTS（HTTP Strict Transport Security），为什么能进一步加固 Secure 属性？HSTS 会指示浏览器在本地强制把所有指向该网站的 HTTP 链接重定向为 HTTPS 链接，直接从客户端源头消除了任何发起明文 HTTP 请求的可能性，防止在首次重定向中发生凭证泄漏。`),
        multiple('Cookie 发送范围相关属性包括？', ['Domain', 'Path', 'SameSite', 'font-weight'], [0, 1, 2], `💡 它解决了什么问题：
解决了 Cookie 在无限制域（如过宽的 Domain）和无约束跨站策略（如默认发送）下引起的“凭据乱飞”和“无辜带 Cookie”造成的跨站安全风险与性能浪费，实现作用域精细控制。

🔍 核心原理解析（防拷打）：
1. 作用域解析：'Domain' 决定了 Cookie 可以在哪些域名下访问（如设置为 .domain.com 可用于所有子域名，若省略则只适用于当前精确域名）。
2. 'Path' 控制在域名的哪些路由路径下生效（如 /api）。'SameSite' 控制跨站请求（Cross-site）时的携带逻辑（Strict/Lax/None），切断不必要的跨站凭证流通。
3. 进一步拓展大厂面试追问：如果一个网站的 domain 被误设为公共后缀（Public Suffix，如 .com 或 .co.uk），会发生什么？浏览器会直接拒绝写入该 Cookie，以防止任何不相关的站点窃取或伪造同后缀下的共享会话。在配置 Domain 时，前端与网关必须严格限制为项目的精确根域名。`),
        single('删除订单这类操作最不应该使用？', ['GET', 'POST/DELETE 并鉴权', 'CSRF Token', 'Origin 校验'], 0, `💡 它解决了什么问题：
解决了在 Web 语义设计不规范时带来的破坏性风险。如果使用 GET 承载有副作用的写/删操作，不仅会导致攻击者通过一个简单的 img 标签（如 <img src="delete-api">）触发 CSRF，还会导致网络爬虫、预加载引擎在无意抓取中把用户数据删光的灾难。

🔍 核心原理解析（防拷打）：
1. 规范约束：在 RESTful 契约与 HTTP 规范中，GET 请求被定义为“安全（Safe）”且“幂等（Idempotent）”的只读操作，不应对服务器资源状态产生任何副作用。
2. 从安全防范上看，浏览器和网关对 GET 请求是不设防的：它们会自动预加载、自动做 CDN 缓存，并且SameSite=Lax 也会无条件在所有跨站 GET 链接中带上 Cookie。如果删除接口用 GET，就会失去最基础的安全防御条件。
3. 进一步拓展大厂面试追问：如果在写操作上坚持使用 POST 并在 Header 中要求校验自定义属性，但由于 CORS 预检请求（Preflight）导致每次操作多了一次 OPTIONS 网络开销，从架构上如何进行取舍优化？应当评估写操作的敏感度。对于非核心的高频写操作（如打点统计），可以通过控制 Access-Control-Max-Age 缓存预检结果，或将其改写为 Simple Request（简单请求）从而免去预检开销，但敏感写操作绝不能妥协。`),
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
        single('为什么不能把服务端密钥放进前端环境变量？', ['前端产物会暴露给用户', '会让 CSS 失效', '会减少题目数量', '会阻止路由'], 0, `💡 它解决了什么问题：
纠正了对构建时“环境变量”的认知盲区，防止团队把包含微信支付 Secret、私有部署 Token 等真正的服务器敏感密钥硬编码到 Vite/Webpack 环境变量中，导致构建产物发布后，任何用户通过浏览器调试面板即可轻松提取密钥并盗取公司资产。

🔍 核心原理解析（防拷打）：
1. 构建机制：前端打包工具（如 Vite）中以 VITE_ 开头的环境变量，是在编译打包阶段（Compile Time）直接将代码中的环境变量占位符静态替换为对应的字面量。
2. 这些值最终会物理嵌入到生成的 JS bundle 纯文本中。浏览器下载并运行该代码，因此任何能在客户端运行的变量对于用户来说均是完全明文、公开的。
3. 进一步拓展大厂面试追问：如果前端确实需要调用某个受保护的第三方云服务 API（如云存储），但又绝不能泄露 Master Key，架构上如何设计？应该引入“临时凭证机制”。前端请求己方的 BFF 或后端服务，由后端使用 Master Key 向第三方云服务换取一个具有“限时失效、权限极其受限”的短期 STS Token（临时密钥），再分发给前端使用，从而彻底规避主密钥泄漏风险。`),
        multiple('供应链安全范围包括？', ['依赖包', 'CI 凭证', '第三方脚本', '构建产物'], [0, 1, 2, 3], `💡 它解决了什么问题：
解决了“代码本身安全，但运行环境与上下游依赖被污染”的立体化工程盲区。前端项目极其依赖庞大的开源包生态，供应链上的任一脆弱点（如被投毒的依赖包、CI凭证泄漏）都会导致生产产物被篡改。

🔍 核心原理解析（防拷打）：
1. 供应链是一个完整的生命周期链条：依赖包获取 -> 本地执行（postinstall）-> CI/CD 流水线构建（环境变量与证书）-> 静态制品生成 -> 浏览器第三方 CDN 脚本加载。
2. 在这个链条中，黑客可以通过抢注包名（Typosquatting）、劫持开源作者账号发布含恶意代码的新版本包、或者入侵第三方 CDN 篡改托管的 JS 文件来进行静默渗透。
3. 进一步拓展大厂面试追问：如果项目发布后使用的是公共 CDN（如 unpkg/cdnjs）上的 JS 依赖，如何防范 CDN 服务商被入侵后脚本被恶意注入？必须在 script 标签中启用 SRI（Subresource Integrity，子资源完整性校验），并配置 'integrity' 属性。浏览器在下载资源后，只有在其哈希值与 integrity 属性完全匹配时才允许执行，否则直接拦截加载。`),
        judgment('删除泄漏密钥的代码后，不需要轮换密钥。', 1, `💡 它解决了什么问题：
纠正了对代码托管仓库（如 Git）工作机制的致命误解。如果将泄漏的密钥仅通过“新提交删除”来处理，黑客可以使用自动化爬虫扫描 Git commit 历史记录，在几秒钟内提取出历史快照中的密钥，导致系统继续暴露在威胁中。

🔍 核心原理解析（防拷打）：
1. 机制解析：Git 是一个分布式版本控制系统，其设计的核心在于记录每一次变更的完整历史（History Commit）。
2. 在最新的 commit 里删除一行代码，该密钥依然明文保存在上一个 commit 的对象中。只要黑客克隆仓库或通过 API 查看历史 commit，就能轻松还原密钥。
3. 进一步拓展大厂面试追问：如果密钥已经不小心推送到公共 GitHub 仓库中，除了轮换密钥外，在 Git 仓库侧应该如何做物理清除？需要使用特殊的强力清理工具（如 git-filter-repo 或 BFG Repo-Cleaner）改写整个 Git 的树形历史，物理擦除包含敏感信息的历史 commit，并执行强制推（git push --force）覆盖远程仓库，但首要工作依然是立即在服务提供商侧吊销并轮换密钥。`),
        single('SRI 的主要作用是？', ['校验第三方资源完整性', '提高 TS 编译速度', '替代登录', '压缩图片'], 0, `💡 它解决了什么问题：
解决了在使用第三方 CDN 托管静态脚本时，由于 CDN 边缘节点、缓存服务器或源站被入侵修改而导致客户端在无感知中加载运行“篡改后的投毒 JS 脚本”的严重安全事故。

🔍 核心原理解析（防拷打）：
1. 原理解析：SRI（子资源完整性）利用了密码学哈希校验。在 HTML 引入脚本时，在 script 标签中标记 'integrity="sha384-...""'。
2. 浏览器下载该 JS 文件后，在执行前会用指定的哈希算法（如 SHA-384）对下载的纯文本计算哈希值，并与 integrity 中的值进行比对。只要哈希值有任何一个字符的偏差，浏览器就会拒绝执行并抛出加载网络异常。
3. 进一步拓展大厂面试追问：如果 CDN 静态资源在部署时由于开启了 Gzip/Brotli 动态压缩，导致浏览器下载的内容哈希与前端 integrity 不一致，该怎么排查？SRI 校验针对的是解压后的“原始数据纯文本”，与传输层的压缩编码无关。若出现不一致，应检查是否在发布过程中第三方 CDN 修改了 JS 内容本身（如动态注入打点脚本或时间戳），此时应立刻终止加载。`),
        multiple('CI 凭证治理应包括？', ['最小权限', '短周期或可轮换', '日志脱敏', '永久管理员权限'], [0, 1, 2], `💡 它解决了什么问题：
解决了在自动化流水线（CI/CD）中，由于凭证配置不当导致的“一处泄漏，全家遭殃”问题。如果 CI 拥有过大权限，一旦某个 PR 流水线漏洞被突破，黑客便能顺藤摸瓜获取公司的云控制台权限或删除数据库。

🔍 核心原理解析（防拷打）：
1. 权限治理体系：首要原则是“最小权限原则（Principle of Least Privilege）”，CI 凭证应只能读写其负责的特定仓库和制品库，绝不配置全局 Admin 权限。
2. 其次，CI/CD 系统必须配置自动化的日志脱敏（Log Masking），防止由于调试日志输出或异常抛出导致凭证被打印到公开的流水线面板中。
3. 进一步拓展大厂面试追问：在 GitHub Actions 等公共 CI 平台中，如何防范恶意 PR 修改了 workflow 配置文件从而把 secrets 打印出来的供应链风险？应该限制“来自 Fork 的 PR”在默认情况下没有写权限，并在合并到主干前，workflow 的修改必须通过管理员的人工审核。`),
        single('postinstall 风险来自哪里？', ['安装阶段能执行依赖包脚本', '只能修改 README', '只能压缩 CSS', '不能运行代码'], 0, `💡 它解决了什么问题：
解决了在依赖包安装阶段，由于对 npm 脚本生命周期的无感知，导致本地开发机或构建服务器在执行 npm install 时自动运行恶意投毒脚本、窃取环境变量与本地代码的工程隐患。

🔍 核心原理解析（防拷打）：
1. 生命周期机制：npm 提供了丰富的生命周期钩子脚本，'postinstall' 在依赖包下载解压完成后由包管理器自动在后台调用执行。
2. 由于 postinstall 运行在本地 Node 进程中，它拥有访问本地文件系统、读取环境变量以及发起网络请求的完整特权。投毒的包可以通过写一个恶意的 postinstall.js 直接将你本地的 .env 文件内容发送到指定的收集服务器。
3. 进一步拓展大厂面试追问：在公司内部的前端构建服务器上，应该如何防御恶意的 postinstall 脚本运行？可以通过在安装命令中指定参数全局关闭脚本执行，如使用 'npm install --ignore-scripts' 或在 pnpm 中配置 ignore-scripts 规则，只对经过防线认证的包放开脚本运行权限。`),
      ],
    }),
  ],
};
