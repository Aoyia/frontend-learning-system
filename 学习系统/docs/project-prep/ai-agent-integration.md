---
title: AI Agent 前端流式渲染与交互设计（腾讯面试/大厂拷打）
difficulty: 进阶
tags: [AI-Agent, SSE, 流式交互, 腾讯面试, 大厂拷打]
module: project-prep
sourceType: original
order: 3
---

# 🧭 AI Agent 前端流式渲染与交互设计

当前 AI 浪潮下，**“前端如何与 AI Agent/LLM 高效集成”** 已经成为大厂（尤其是腾讯等重度布局大模型业务的团队）面试中最具热度的加分项。传统的“请求-响应”模式已不适应生成式 AI 的交互，**流式输出（Streaming）**与**流式 Markdown 实时解析渲染**成为前端研发的全新标配。

本篇文档针对 AI Agent 前端开发的核心技术栈进行深入剖析，并提炼面试中可能遭遇的底部拷打。

---

## 1. 为什么需要流式渲染？

### 1.1 业务场景
大语言模型（LLM）的生成是逐个 Token 进行的，生成完整的文本可能耗时数十秒。如果采用传统的 HTTP Post 阻塞请求，用户会面临长时间的空白等待（白屏），跳出率极高。
通过流式渲染，前端可以实时接收后端生成的 Token，并以 **“打字机效果（Typewriter Effect）”** 呈献给用户，将用户可感知首字延迟（TTFT - Time to First Token）降至毫秒级。

---

## 2. 核心技术选型：SSE vs WebSocket vs Fetch

流式数据传输主要有三种实现方案：

| 维度 | SSE (Server-Sent Events) | WebSocket | Fetch + ReadableStream |
| :--- | :--- | :--- | :--- |
| **协议基础** | 基于标准 HTTP/HTTPS | 独立二进制协议 (ws/wss) | 基于标准 HTTP/HTTPS |
| **通信方向** | 单向（服务端推送） | 双向（全双工） | 单向（服务端推送） |
| **重连机制** | 浏览器内置自动重连 | 需前端手写重连逻辑 | 需前端手写重连逻辑 |
| **数据格式** | 文本数据（以 `data:` 开头） | 文本及二进制 | 二进制字节流 |
| **面试加分建议** | **AI 生成首选方案**。开发极其简单，走标准 Web 安全端口（80/443），天然兼容企业防火墙。 | 适用于聊天室、实时对战等重度双向高频交互场景，AI 纯文本输出略显过重。 | **最前沿方案**。支持 POST 请求（SSE 原生仅支持 GET，而模型参数往往很大），是现代化 AI 前端最佳实践。 |

---

## 3. 前端流式解析与渲染核心实现

以现代化 `Fetch + ReadableStream` 接收 POST 请求流为例，前端需要解决**流拼接、Buffer 解析、打字机渲染优化**三大痛点。

### 3.1 核心代码：流式读取器 (ReadableStream Reader)
```javascript
async function fetchAIStream(payload) {
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Stream request failed');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;
  let accumulatedText = '';

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      // 1. 将二进制 Uint8Array 块解码为字符串
      const chunkStr = decoder.decode(value, { stream: !done });
      // 2. 解析出 SSE 格式行数据 (例如: data: {"token": "hello"})
      accumulatedText += parseChunk(chunkStr);
      // 3. 驱动页面视图更新
      updateUI(accumulatedText);
    }
  }
}
```

### 3.2 难点攻克：流式 Markdown 解析与 DOM 闪烁控制
**痛点**：AI 生成的文本往往包含 Markdown 格式（加粗、列表、代码块）。如果在流式追加过程中，每次拿到一个 Token 都直接全量丢给 `markdown-it` 解析并渲染 DOM，会导致：
1. **CPU 飙升**：频繁的大文本渲染会导致页面严重卡顿甚至假死。
2. **DOM 闪烁与跳跃**：当 Markdown 块（如 ` ```javascript ` 代码块）生成到一半时，解析器可能会将其误判为普通文本渲染，随后闭合标签进来时又突变为代码块布局，造成严重的 CLS（累积布局偏移）和视觉不适。

**应对 Action 方案**：
*   **优化 1：虚拟渲染节点与缓冲队列**
    我们建立一个**打字机平滑队列**。每次收到 Token 先塞入缓存队列，然后启动一个 `requestAnimationFrame` 循环，匀速从队列中弹出字符并更新局部状态，使得文本平滑长出，避免网络包抖动引起的渲染突变。
*   **优化 2：流式闭合补全（Auto-Closing Tags）**
    在将“进行中”的 Markdown 丢给解析器前，前端编写一个轻量级预处理器，自动检测未闭合的 `*`, `**`, ` ``` ` 等标签，并动态补充闭合标记，确保解析器始终能生成结构完整、不易错乱的临时 HTML。

---

## 4. 腾讯中高级前端面试真题拷打

### 🎤 问题 1：SSE 默认只支持 GET 请求，但 AI 提问中模型参数和历史对话很大，如何实现 POST 传参的流式推送？
**腾讯面试官考核点：Web API（Fetch API, ReadableStream）底层深度。**

> **答题套路：**
> 1. **澄清规范局限**：原生的 `EventSource` API 确实仅支持 GET 请求且无法自定义 Header（例如带 JWT 认证），这在大厂鉴权与大请求场景中是无法接受的。
> 2. **现代替代方案**：使用 `Fetch API` + `ReadableStream` 替代 `EventSource`。通过 Fetch 发送 POST 请求，从 `response.body` 获取 `ReadableStream` 对象的 Reader，再以 `reader.read()` 异步循环方式持续读取字节流并解码。这样既能发送无限大小的 POST 实体，也能携带复杂的认证 Header。

---

### 🎤 问题 2：在流式生成中，用户突然点击了“停止生成（Interrupt）”，前端如何优雅地中断网络请求，并避免后端继续算力消耗？
**腾讯面试官考核点：AbortController 机制、连接生命周期管理。**

> **答题套路：**
> 1. **AbortController 优雅取消**：在发起 `fetch` 请求时，必须实例化一个 `AbortController`，并将它的 `signal` 传入请求配置：
>    ```javascript
>    const controller = new AbortController();
>    fetch('/api/agent/chat', { signal: controller.signal });
>    ```
> 2. **中断执行**：当用户点击中断按钮时，触发 `controller.abort()`。浏览器会立即销毁当前的 HTTP TCP 连接。
> 3. **后端算力保护**：此时，如果网关或后端服务（如 Node.js / Python Fast API）监听了该 HTTP 请求的 `close` 事件（或中断信号），就会立即停止模型生成的迭代循环，从而节省了极其昂贵的 GPU 算力。

---

### 🎤 问题 3：在大模型流式输出长文本时，如果用户想要实时看最新的内容，前端如何实现平滑的“自动滚到底部（Auto-scroll）”？怎样避免用户手动往上滚时被强制拉回？
**腾讯面试官考核点：DOM 尺寸监听、用户交互意图判断、滚动体验优化。**

> **答题套路：**
> 1. **防抖滚动逻辑**：在 UI 更新时，计算容器的 `scrollHeight`, `scrollTop` 和 `clientHeight`。
> 2. **临界值意图判断（User Scroll Intent）**：
>    ```javascript
>    const threshold = 50; // 50px 缓冲阈值
>    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
>    ```
>    *   如果 `isAtBottom === true`：说明用户当前就处于底部，此时在打字机追加内容时，前端自动执行 `container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })` 保持滚动。
>    *   如果 `isAtBottom === false`：说明用户正在主动往上翻看历史对话，此时**必须停止自动滚动**，防止视图剧烈抖动打断用户的阅读体验。

---

### 🎤 问题 4：当 AI 输出复杂交互组件（如图表、表格或表单）时，如何兼顾动态渲染灵活性与防范 XSS 漏洞的注入风险？
**腾讯面试官考核点：白名单组件注册、Zod 运行时 Schema 校验、DOMPurify 清洗、Shadow DOM 隔离。**

> **答题套路：**
> 1. **不可控输出的安全隐患**：AI 模型的生成结果是不可预测的。如果为了支持动态渲染，直接允许将模型输出的 HTML 字符串通过 `innerHTML` 或 `v-html` 渲染，会带来灾难性的 XSS 注入风险（如 `<img src=x onerror=evil()>` 或原型污染攻击）。
> 2. **第一层防御：白名单组件注册与 DSL 设计**：
>    - 我们设计了专用的 DSL（例如 `:::dxf-bar-chart props={"title":"A", "data":[]}:::`）来代表图表等复杂组件，避免在 Markdown 中混入裸 HTML。
>    - 前端维护一个受信任的**白名单组件 Registry Map**（如 `dxf-bar-chart`, `dxf-basic-table`），在解析时，只有在白名单内注册过的标签才会被实例化，未注册的标签会被当作纯文本丢弃。
> 3. **第二层防御：Zod 运行时 Schema 强类型校验**：
>    - 每个白名单组件都绑定了一个 Zod 数据校验 Schema。在实例化前，组件接收到的 `rawProps` 会通过 `schema.safeParse(rawProps)` 进行运行时检测。
>    - 如果存在非法参数、超大恶意数据或原型污染链，校验将立刻失败，拒绝渲染组件，并回退到错误占位符。这有效防御了通过 Prompt 注入绕过前置过滤的攻击。
> 4. **第三层防御：DOMPurify 清洗与 Shadow DOM 样式隔离**：
>    - 文本渲染部分使用 `DOMPurify.sanitize` 限制允许的 HTML 标签（如 `strong`, `em`, `a`）和属性（如 `href`，且强制限制 `protocol` 必须是 HTTP/HTTPS）。
>    - 动态渲染的自定义 Web Components 启用 `Shadow DOM` 模式（`mode: 'closed'`），将样式和事件域强隔离在沙箱内，防止恶意组件修改宿主的全局样式或劫持 DOM 事件。

---

### 🎤 问题 5：AI Agent 的流式输出不仅包含文本，还交织着工具调用（ToolUse）等中间态，如何在前端维护复杂的流式状态机并实现“工具调用去重”？
**腾讯面试官考核点：流式状态机设计、ToolUse 去重合并、RequestAnimationFrame 性能优化。**

> **答题套路：**
> 1. **状态机与分段渲染**：大模型的输出是一个混合流，包含文本、`thinking` 思考过程、`tool_use`（调用搜索引擎、数据库或第三方 API）、以及 `tool_result` 结果。我们设计了一个四层状态机（`idle` -> `thinking` -> `tool_using` -> `streaming_text`）来驱动 UI 状态分段更新。
> 2. **ToolUse 的去重与状态合并**：
>    - 在流式接收中，由于 SSE 推送的细碎性，同一个工具调用可能被多次推送（例如：`chunk1: { toolId: 't_1', status: 'PROCESSING' }`，`chunk2` 也是相同的 `PROCESSING`，最后 `chunk3` 才是 `COMPLETE`）。
>    - 如果每次收到就操作 DOM，会导致严重的列表抖动和多余节点渲染。我们通过在 Message 组件层维护一个以 `toolId` 为键的 Map，来记录工具调用的激活状态。
>    - 当首次接收到某 `toolId` 时创建工具渲染 Tag；对于后续到达的重复 `PROCESSING` 状态直接予以忽略；仅当收到最终状态（`COMPLETE` 或 `ERROR`）时，才触发 UI 的更新和结果展开，实现高效去重。
> 3. **RequestAnimationFrame (rAF) 批量渲染优化**：
>    - AI 输出速度极快（可达 100+ tokens/s），频繁触发 Markdown 解析和重绘会导致低配设备 CPU 飙升掉帧。
>    - 我们的优化方案是：每次收到 Token 不立刻渲染，而是塞入缓冲队列中。通过 `requestAnimationFrame` 以 16.7ms（即浏览器一帧）为周期，在帧回调中合并队列中的 Token 并执行一次增量 Markdown 解析与 DOM 更新，将 FPS 稳定维持在 55 帧以上。

---

### 🎤 问题 6：在 AI 智能体应用中，经常需要将外部应用（如 aPaaS 表单或配置页面）通过 iframe 嵌入，如何安全高效地实现宿主与 iframe 之间的跨域通信？
**腾讯面试官考核点：PostMessage 协议设计、Origin 来源校验、Token/requestId 双向握手安全防线。**

> **答题套路：**
> 1. **跨域通信挑战**：AI Agent 处于主域名 `agent.domain.com`，而被嵌入配置页出于 `apaas.domain.com`。由于浏览器的同源策略，它们无法直接互调 DOM 或变量，必须依赖 `window.postMessage` 进行跨文档通信。
> 2. **PostMessage 统一协议设计**：
>    - 避免散乱的通信，我们设计了标准化的消息协议载荷（Payload），包含：`type`（消息类型枚举，如设置表单值、桥接就绪）、`payload`（数据包）、`timestamp`（时间戳用于防重放）以及 `requestId`（唯一请求 ID，用于像 HTTP 请求一样支持 Response 配对）。
> 3. **三道安全防线（防冒充与劫持）**：
>    - **Origin 源白名单校验**：在 `window.addEventListener('message')` 回调中，必须首先进行 `event.origin` 校验，只有来自白名单域名的消息才允许被消费，杜绝任何外部恶意域名的伪造请求：
>      ```javascript
>      if (event.origin !== TRUSTED_ORIGIN) return;
>      ```
>    - **发送端指定目标源**：调用 `postMessage` 时，严禁使用通配符 `*`，必须指定明确的目标 Origin，防止消息在传输过程中被重定向的恶意 iframe 截获。
>    - **双向 Ready 握手确认**：在 iframe 启动时，发送 `IFRAME_BRIDGE:READY` 信号，宿主接收后回传 SessionToken。后续所有表单操作（如自动填值）必须携带该 SessionToken 并在有效时间内进行校验，防止由于中间人替换 iframe 引起的非受信控制。

---

## 5. STAR 技术亮点表达

*   **Situation (背景)**: 在公司的 AI Copilot 系统中，AI Agent 的生成过程长达 20 秒，传统的 HTTP Post 阻塞响应导致长达 10s+ 的空白等待期，TTFT（首字延迟）指标极差，且在连续生成时，频繁的 Markdown 渲染导致低配设备 CPU 满载掉帧。
*   **Task (任务)**: 将交互升级为流式生成，降低首字延迟至 150ms 内，且在长文渲染时保证流畅交互、不闪烁。
*   **Action (行动)**:
    1.  放弃原生的 `EventSource`（仅支持 GET），改用 **`Fetch API + ReadableStream + AbortController`** 架构搭建 POST 流式读取通道。
    2.  设计了一套**打字机双向队列缓冲算法**，利用 `requestAnimationFrame` 调度字符输出，消除网络数据包积压带来的渲染卡顿。
    3.  编写流式 Markdown 标签自闭合检测算法，确保半截代码块与强调标签不会导致 DOM 大范围坍塌与闪烁。
    4.  通过容器高度的脏检查（Dirty check），智能辨别用户手动滚动与自动滚动意图，防止强制滚动劫持用户操作。
*   **Result (结果)**: 用户感知首字延迟（TTFT）由 **12 秒缩短至 150 毫秒**；Markdown 流式生成时的 CPU 峰值占用下降了 **65%**，完全消除了渲染闪烁和布局跳跃。

---

## ## 📝 面试题自测

### Q1 [single]
关于 EventSource API 与 Fetch + ReadableStream 实现流式数据推送的对比，下列说法中错误的是？
A. EventSource 原生支持自动重连，而 Fetch 流需要开发者手动处理重连
B. EventSource 仅支持发送 GET 请求，不能在请求体（Body）中携带大数据
C. EventSource 能够直接发送二进制 Byte 数据，而 Fetch 读取出的流必须手动用 TextDecoder 解码
D. Fetch + ReadableStream 允许在发起流式请求时携带自定义请求头（Headers），如 JWT 认证 Token
答案：C
解析：EventSource 原生只支持文本数据流格式（且限定以 `data:` 开头），不支持传输原生的二进制字节。而 Fetch 的 `response.body.getReader()` 读取出的是 `Uint8Array` 的二进制字节数组，必须通过 `TextDecoder` 解码为字符串，因此 C 的表述是错误的。

### Q2 [multiple]
为了在 AI 生成长篇大论时，既能实时展示最新文字，又不会打扰用户翻看前面的历史，前端的自动滚动（Auto-scroll）逻辑应当满足哪些条件？
A. 在每次 UI 数据追加时，先判断当前滚动条位置是否接近底部（例如距离底部在 50px 以内）
B. 如果用户已经手动往上滚动了较远距离，应立刻停止自动滚动，允许用户阅读历史
C. 每隔 1 秒，无条件调用 scrollIntoView 将视口强制滚动到最底部的输入组件上
D. 当用户重新将滚动条拉回最底部时，应重新激活自动滚动机制
答案：ABD
解析：自动滚动逻辑的核心在于“尊重用户的操作意图”。A、B、D 选项合理地判断了用户是处于底部（继续看新生成的词）还是在翻看历史（不应打扰）。而 C 选项无视用户操作意图强制滚动，会导致极差的体验（即“滚动劫持”），是绝对不可采用的。

### Q3 [judgment]
为了防止 AI 实时输出过程中 Markdown 渲染导致的排版剧烈闪烁（例如代码块生成到一半时被错译为普通段落），可以通过在渲染前用正则表达式检测未闭合的 Markdown 标签并自动补充闭合标记来解决。
答案：对
解析：在生成流中，大模型经常在生成 ` ```javascript ` 后，需要隔几秒才输出对应的 ` ``` ` 闭合标记。在此期间直接解析会造成结构破坏。通过在前端进行预处理，补充未闭合的代码块或粗体标签，能让 HTML Parser 始终渲染出稳定的视图，有效防止排版闪烁与抖动。

### Q4 [multiple]
当 AI Agent 生成的内容包含需要渲染的自定义图表组件（如 dxf-bar-chart）时，为了防范 XSS 漏洞与恶意注入，以下哪些安全设计是合理且必要的？
A. 采用白名单组件注册机制，非白名单内的标签拒绝解析和实例化
B. 在组件挂载前，使用 Zod Schema 对 AI 输出的 props 进行运行时类型与格式校验
C. 将自定义组件置于 Shadow DOM 中渲染，隔离 CSS 样式和 DOM 事件作用域
D. 使用 innerHTML 直接把模型生成的完整 HTML 代码片段插入页面中以提升渲染性能
答案：ABC
解析：直接使用 innerHTML 渲染模型生成的裸 HTML 片段会带来极大的 XSS 注入风险，因此 D 选项是极不安全的。A、B、C 选项通过白名单限制、Schema 强类型校验、DOMPurify 清洗以及 Shadow DOM 沙箱隔离，构成了纵深防御的安全闭环，是动态组件渲染的最佳实践。

### Q5 [single]
在大模型流式输出（100+ tokens/秒）的场景下，为了避免频繁触发 Markdown 解析和重绘导致页面交互掉帧卡顿，下列哪种性能优化策略最为有效？
A. 每次收到 Token 时，立刻调用 window.location.reload() 刷新页面
B. 禁用浏览器的 GPU 加速，全部由 CPU 渲染
C. 使用一个缓冲队列，通过 requestAnimationFrame (rAF) 在浏览器一帧周期内合并收到的 Token 进行批量增量渲染
D. 使用 setTimeout(fn, 0) 来强行打断每一次 token 的渲染
答案：C
解析：大模型高频输出时，如果每个 Token 都单独触发 DOM 重绘，会导致页面频繁 layout 与 paint，触发 Long Task 并掉帧。通过 requestAnimationFrame (rAF) 批量合并 Token，将渲染频率限制在浏览器硬件刷新的每帧（约 16.7ms）一次，是前端合并频繁渲染、保证流畅交互的标准工业级优化方案。

### Q6 [judgment]
为了确保宿主页面与跨域 iframe 之间使用 postMessage 通信的安全，在发送消息时可以安全地将 targetOrigin 设置为通配符 '*'。
答案：错
解析：postMessage 的 targetOrigin 参数用于指定哪些窗口能接收到该消息。若将其设为通配符 '*'，一旦 iframe 页面发生了恶意重定向或被劫持，敏感信息（如 Token、表单数据）就可能会被第三方恶意源捕获。因此为了通信安全，必须指定具体且受信任的 targetOrigin 域名。

### Q92 [expression]
大模型生成图表/表格动态组件的防 XSS 安全渲染与 Zod 强类型校验设计？
*   **适用场景**：AI 生成的图表、表格等未知结构组件在前端动态渲染时，需防止恶意 Prompt 注入或 HTML XSS 攻击风险。
*   **关键词**：[白名单组件注册, Zod 强类型校验, DOMPurify 文本过滤, Shadow DOM 物理隔离]
*   **推荐表达结构**：
    1. **拒绝裸渲染隐患**：大模型生成的结果是不可预测的。直接将模型输出的 HTML 字符串通过 `innerHTML` 或 `v-html` 渲染，会带来灾难性的 XSS 注入风险（如 `<img src=x onerror=evil()>` 等原型污染攻击）。
    2. **白名单组件注册与 DSL 设计**：我们设计了专用的 DSL（例如 `:::dxf-bar-chart props={"title":"A", "data":[]}:::`）来代表复杂图表组件，避免在 Markdown 中混入裸 HTML。前端维护一个受信任的白名单组件 Registry Map。在解析时，只有白名单内注册过的标签才会被实例化，未注册 of 标签会被当作纯文本丢弃。
    3. **Zod 运行时 Schema 强类型校验**：每个白名单组件都绑定了一个 Zod 数据校验 Schema。在实例化前，组件接收到的 `rawProps` 会通过 `schema.safeParse(rawProps)` 进行检测。如果存在非法参数或恶意代码注入，校验将立刻失败，拒绝渲染组件，并回退到错误占位符，从而彻底防御通过 Prompt 注入绕过前置过滤的攻击。
    4. **DOMPurify 清洗与 Shadow DOM 样式隔离**：文本渲染部分使用 `DOMPurify.sanitize` 过滤。动态渲染的自定义组件启用 Shadow DOM 模式（`mode: 'closed'`），将样式和事件域强隔离在沙箱内，防止其污染宿主页面。

### Q93 [expression]
大模型流式输出（SSE）打字机渲染的性能优化与 CLS 闪烁防御？
*   **适用场景**：AI 持续输出长文本或 Markdown 时，高频 Token 触发 DOM 重绘导致 CPU 卡顿，以及未闭合 Markdown 导致页面闪烁抖动。
*   **关键词**：[流式闭合补全, 打字机平滑队列, requestAnimationFrame, 批量合并渲染, CLS 累积布局偏移]
*   **推荐表达结构**：
    1. **卡顿与闪烁成因**：大模型输出频率快（可达 100+ tokens/s），频繁触发 Markdown 解析和重绘会导致 CPU 飙升掉帧。另外，当 Markdown 块（如 ` ```javascript ` 代码块）生成到一半时，解析器会将其误判为普通段落，待闭合标记进来时又突变为代码块布局，造成严重的 CLS（累积布局偏移）和视觉闪烁。
    2. **流式闭合补全**：在临时将未生成完的 Markdown 字符扔给解析器前，前端编写一个轻量级预处理器，自动检测未闭合的 `*`, `**`, ` ``` ` 等标签并动态补充闭合标记，确保解析器始终渲染出稳定的 HTML，防止结构坍塌。
    3. **打字机平滑队列（rAF 合并渲染）**：建立打字机缓冲队列，不直接响应每次网络包推送，而是在 `requestAnimationFrame`（16.7ms）帧回调中，将缓冲队列里的字符批量合并渲染更新，维持高帧率交互。

### Q94 [expression]
在 AI Agent 个人任务管理系统中，如何保障大模型 function calling 工具调用修改数据的准确度？
*   **适用场景**：语音或文字交互修改日程/任务、AI 智能体工具调用可靠性设计。
*   **关键词**：[大模型不信任假定, 校验函数反查比对, 混合数据一致性校验, 用户卡片二次确认, tooluse 异常流断点]
*   **推荐表达结构**：
    1. **树立大模型不信任原则**：因为大模型的生成具有不可信、幻觉和不确定性，前端及网关绝对不能直接将大模型生成的 `function calling` 参数透传并修改数据库，必须对其进行严格的反查与校验。
    2. **校验函数反查比对与状态链检测**：当大模型发出“修改日程”的 `tool_use` 时，网关和前端会对大模型解析出的 `taskId` 和 `dateTime` 进行业务反查（如验证该 ID 的日程是否确实存在，时间是否合理）。如果大模型提供的参数偏离上下文，系统会自动捕获并触发 `tooluse` 异常流断点，拒绝执行。
    3. **关键数据双重一致性校验**：对于任务的优先级、状态（如从“未开始”改为“已完成”），在服务端做旧数据的版本一致性比对。
    4. **用户卡片二次确认机制（Human in the loop）**：在前端 UI 层面，任何由 AI 发起的破坏性或重要修改（如删除任务、修改会议时间），不能自动静默完成，而是渲染一个特制的“待确认卡片”。展示大模型拟执行的参数变化，只有在用户点击“确认修改”按钮后，才真正向后端发起写操作接口，用人工审核作为大模型可靠性的最后一环。

### Q95 [expression]
在面临项目代码量大、无注释、难以维护的“屎山”时，你如何用 AI 工具与自动化测试手段稳妥推进重构？
*   **适用场景**：老旧大型项目治理、代码重构策略、自动化测试保障体系。
*   **关键词**：[AI 辅助逻辑梳理, Playwright 端到端自动化回归测试, 模块拆分微服务化, 保底策略/灰度发布, 回归测试覆盖率]
*   **推荐表达结构**：
    1. **AI 辅助逻辑梳理与规范化**：面对无注释的屎山代码，首先使用 AI 工具（如 Copilot 或者是自建的大模型本地微调）对历史遗留的核心逻辑进行“静态分析”，让 AI 生成清晰的代码调用流拓扑图 and 结构化注释，帮研发快速建立整体架构认知。
    2. **Playwright 自动化回归测试（构建安全网）**：在重构前，不要盲目动手改代码。应当使用 `Playwright` 针对高频的核心用户链路（如低代码表单配置、审批提交等）编写详尽的端到端（E2E）自动化测试用例，运行并锁定当下的“预期输出”，构建出稳固的重构安全防护网。
    3. **渐进式重构与模块拆分**：将老旧代码逐步按职责拆分为高内聚、低耦合的模块或子应用。重构后，每次提交代码均自动运行 `Playwright` 自动化用例进行回归测试，确保新代码在千级用例下的表现与屎山完全一致。
    4. **灰度发布与保底策略**：重构后的逻辑采用灰度开关（Feature Flag）逐步释放给小规模用户，并配备清晰的降级/回滚机制。若发生意外能秒级回滚到老逻辑，保证老客户系统绝不崩溃。

