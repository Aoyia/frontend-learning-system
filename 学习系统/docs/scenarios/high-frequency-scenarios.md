---
title: 高频手写题与场景设计（腾讯面试/大厂拷打）
difficulty: 进阶
tags: [scenarios, debounce, promise, virtual-list, deep-clone, event-emitter, permissions, concurrent, 腾讯面试, 大厂拷打]
module: scenarios
order: 1
---

# 高频手写题与场景设计

## 一、防抖与节流

### 完整防抖（支持立即执行）

```javascript
function debounce(fn, delay, immediate = false) {
  let timer = null

  const debounced = function(...args) {
    const callNow = immediate && !timer
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (!immediate) fn.apply(this, args)
    }, delay)
    if (callNow) fn.apply(this, args)
  }

  debounced.cancel = function() {
    clearTimeout(timer)
    timer = null
  }

  return debounced
}
```

### 完整节流（时间戳 + 定时器结合版）

```javascript
// 结合版：首次立即执行，最后一次也会执行
function throttle(fn, interval) {
  let lastTime = 0
  let timer = null

  return function(...args) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}
```

## 二、Promise 系列实现

### Promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('promises must be an array'))
    }
    const results = []
    let resolved = 0
    const len = promises.length

    if (len === 0) return resolve([])

    promises.forEach((p, i) => {
      Promise.resolve(p).then(val => {
        results[i] = val
        resolved++
        if (resolved === len) resolve(results)
      }).catch(reject)
    })
  })
}
```

### Promise.allSettled

```javascript
function promiseAllSettled(promises) {
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p)
        .then(value => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected', reason }))
    )
  )
}
```

### Promise.race

```javascript
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    for (const p of promises) {
      Promise.resolve(p).then(resolve).catch(reject)
    }
  })
}
```

### 并发控制（Limit Concurrency）

```javascript
/**
 * 控制 Promise 并发数量
 * @param {Function[]} tasks - 返回 Promise 的函数数组
 * @param {number} limit - 最大并发数
 */
async function runWithConcurrencyLimit(tasks, limit) {
  const results = []
  const pool = new Set()

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const p = Promise.resolve().then(() => task()).then(val => {
      results[i] = val
      pool.delete(p)
    })
    pool.add(p)

    if (pool.size >= limit) {
      await Promise.race(pool)  // 等待池中最先完成的任务
    }
  }

  await Promise.all(pool)  // 等待剩余任务
  return results
}

// 使用示例
const tasks = Array.from({ length: 10 }, (_, i) =>
  () => new Promise(res => setTimeout(() => res(i), Math.random() * 1000))
)
runWithConcurrencyLimit(tasks, 3).then(console.log)
```

## 三、深克隆

```javascript
function deepClone(value, cache = new WeakMap()) {
  // 基本类型
  if (value === null || typeof value !== 'object') return value

  // 处理循环引用
  if (cache.has(value)) return cache.get(value)

  // 处理特殊对象类型
  if (value instanceof Date) return new Date(value)
  if (value instanceof RegExp) return new RegExp(value)
  if (value instanceof Map) {
    const clone = new Map()
    cache.set(value, clone)
    value.forEach((v, k) => clone.set(deepClone(k, cache), deepClone(v, cache)))
    return clone
  }
  if (value instanceof Set) {
    const clone = new Set()
    cache.set(value, clone)
    value.forEach(v => clone.add(deepClone(v, cache)))
    return clone
  }

  // 处理普通对象/数组
  const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))
  cache.set(value, clone)

  // 克隆 Symbol 键
  const symbolKeys = Object.getOwnPropertySymbols(value)
  for (const key of symbolKeys) {
    clone[key] = deepClone(value[key], cache)
  }

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      clone[key] = deepClone(value[key], cache)
    }
  }

  return clone
}
```

## 四、发布订阅（EventEmitter）

```javascript
class EventEmitter {
  constructor() {
    this._events = Object.create(null)
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = []
    }
    this._events[event].push(listener)
    return this  // 支持链式调用
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener.apply(this, args)
      this.off(event, wrapper)
    }
    wrapper._original = listener  // 保存原始引用，用于 off
    return this.on(event, wrapper)
  }

  emit(event, ...args) {
    const listeners = this._events[event]
    if (!listeners || listeners.length === 0) return false
    listeners.slice().forEach(fn => fn.apply(this, args))
    return true
  }

  off(event, listener) {
    if (!this._events[event]) return this
    this._events[event] = this._events[event].filter(
      fn => fn !== listener && fn._original !== listener
    )
    return this
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event]
    } else {
      this._events = Object.create(null)
    }
    return this
  }
}
```

## 五、虚拟列表（Fixed Height）

```javascript
class VirtualList {
  constructor({ container, itemHeight, renderItem, total }) {
    this.container = container
    this.itemHeight = itemHeight
    this.renderItem = renderItem
    this.total = total

    this.scrollTop = 0
    this.containerHeight = container.clientHeight

    // 内部滚动容器
    this.phantom = document.createElement('div')
    this.phantom.style.height = `${total * itemHeight}px`
    this.phantom.style.position = 'relative'

    this.list = document.createElement('div')
    this.list.style.position = 'absolute'
    this.list.style.top = '0'
    this.list.style.width = '100%'

    this.phantom.appendChild(this.list)
    container.appendChild(this.phantom)
    container.style.overflow = 'auto'

    container.addEventListener('scroll', () => {
      this.scrollTop = container.scrollTop
      this.render()
    })

    this.render()
  }

  render() {
    const { itemHeight, containerHeight, scrollTop, total } = this
    const bufferCount = 2
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferCount)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + bufferCount * 2
    const endIndex = Math.min(total - 1, startIndex + visibleCount)

    // 更新偏移
    this.list.style.transform = `translateY(${startIndex * itemHeight}px)`

    // 渲染可见节点
    const fragment = document.createDocumentFragment()
    for (let i = startIndex; i <= endIndex; i++) {
      fragment.appendChild(this.renderItem(i))
    }
    this.list.innerHTML = ''
    this.list.appendChild(fragment)
  }
}
```

## 六、前端权限控制设计

### 路由级权限（Vue Router）

```javascript
// 路由元信息声明权限
const routes = [
  {
    path: '/admin',
    component: AdminPage,
    meta: { requiresAuth: true, roles: ['admin', 'superadmin'] }
  }
]

// 路由守卫统一拦截
router.beforeEach((to, from, next) => {
  const { requiresAuth, roles } = to.meta
  if (!requiresAuth) return next()

  const user = store.state.user
  if (!user) return next('/login')

  if (roles && !roles.includes(user.role)) {
    return next('/403')
  }

  next()
})
```

### 按钮级权限（Vue 指令）

```javascript
// v-permission 自定义指令
app.directive('permission', {
  mounted(el, binding) {
    const userPermissions = store.state.permissions  // ['user:edit', 'order:view']
    const required = binding.value  // 'user:delete'

    if (!userPermissions.includes(required)) {
      el.parentNode?.removeChild(el)  // 无权限直接移除 DOM
    }
  }
})
```

```html
<!-- 使用 -->
<button v-permission="'user:delete'">删除用户</button>
```

### 接口权限（RBAC 模型）

```
用户（User）→ 角色（Role）→ 权限（Permission）→ 资源（Resource）

RBAC 核心：将权限分配给角色，用户通过角色获得权限
优势：权限变更时只需修改角色-权限映射，不需要逐个修改用户
```

## 七、LRU 缓存

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map()  // Map 的迭代顺序是插入顺序
  }

  get(key) {
    if (!this.cache.has(key)) return -1
    // 刷新为最近使用：先删后插
    const val = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, val)
    return val
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Map.keys().next().value 是最久未使用的键
      this.cache.delete(this.cache.keys().next().value)
    }
    this.cache.set(key, value)
  }
}
```

---

## 八、大厂中高级前端场景设计与方案取舍（腾讯面试/大厂拷打）

中高级场景题通常不只考 API，而是考你能不能把客户问题拆成：明确现象、先定范围、找证据、分层排查、方案取舍、验证闭环这六步回答框架。

### 1. 首屏慢：用户反馈首页打开很慢

**问题描述**：用户反馈首页打开 5 秒才看到主体内容，你怎么定位？

回答重点：

- 先区分是冷启动慢、弱网慢、某地区慢，还是所有用户都慢。
- 看 RUM 或 CrUX 中的 LCP、FCP、TTFB、资源瀑布。
- 如果 LCP 元素是图片，重点看资源发现时间、加载优先级、图片体积、CDN、缓存。
- 如果 LCP 元素是文本或首屏骨架，重点看 HTML、CSS、JS 阻塞和客户端渲染。
- 不要一上来就说“懒加载图片”，因为首屏 LCP 图片不应该懒加载。

追问：

- LCP 拆成哪几段？
- 为什么 `loading="lazy"` 可能伤害首屏图片？
- SSR 一定能改善 LCP 吗？

### 2. 点击卡顿：用户点击按钮后很久才有反馈

**问题描述**：用户点击筛选按钮后页面卡住，怎么定位？

回答重点：

- 先看 INP 或本地 Performance 录制，确认交互延迟是否来自主线程 Long Task。
- 排查点击回调里是否同步做了大数组过滤、复杂计算、DOM 批量更新、日志序列化。
- 大计算可以拆任务、延迟非关键更新、移到 Worker，或者做服务端分页。
- UI 反馈优先，例如先展示 loading，再执行重任务。

追问：

- Web Worker 能不能操作 DOM？
- `requestIdleCallback` 适合关键交互吗？
- 为什么只做防抖不一定解决 INP？

### 3. 页面突然跳动：用户点错按钮或阅读位置丢失

**问题描述**：页面加载时按钮位置突然变化，用户点错了提交按钮，怎么定位？

回答重点：

- 看 CLS 和 Layout Shift 记录，定位发生位移的元素。
- 常见原因是图片、广告、异步组件、字体、弹窗、错误提示没有预留空间。
- 方案是固定尺寸、使用 `aspect-ratio`、骨架屏预留、字体加载策略、避免在已有内容上方插入。

追问：

- CLS 为什么不是时间指标？
- 骨架屏一定改善体验吗？
- 动态错误提示如何避免挤压布局？

### 4. 长列表卡顿：10 万条数据要展示

**问题描述**：后台列表有 10 万条数据，页面滚动卡顿，怎么设计？

回答重点：

- 优先确认业务是否真的需要一次加载 10 万条，很多场景应该分页、搜索、服务端筛选。
- 真要展示长列表，用虚拟列表，只渲染可视区和少量缓冲区 DOM。
- 固定高度虚拟列表简单，不定高需要预估高度、测量实际高度、维护 offset。
- 曝光埋点、无限加载可以配合 IntersectionObserver。

追问：

- 虚拟列表解决的是数据量还是 DOM 数量？
- 不定高虚拟列表为什么更复杂？
- IntersectionObserver 适合做什么，不适合做什么？

### 5. 搜索框结果错乱：旧请求覆盖新请求

**问题描述**：用户连续输入关键词，页面偶尔显示旧关键词的搜索结果，怎么处理？

回答重点：

- 本质是并发请求竞态，旧请求后返回覆盖了新状态。
- 方案包括 AbortController 取消旧请求、请求序号只接收最后一次、缓存 key 区分查询条件。
- 还要处理 loading、错误回显、空结果和重复点击。

追问：

- 取消请求和忽略过期响应有什么区别？
- 如果接口不能取消，前端怎么保证状态正确？
- React/Vue 中组件卸载后异步回调还在怎么办？

### 6. 大文件上传：上传失败后不想重传

**问题描述**：用户上传 2GB 视频，中途网络断了，怎么设计体验和技术方案？

回答重点：

- 文件分片、分片 hash、并发上传、失败重试、断点续传、服务端合并。
- 前端需要控制并发数，避免把网络和服务端打满。
- 秒传要基于文件 hash 或服务端已有分片检查。
- 上传进度要区分单分片进度和整体进度。

追问：

- 分片大小怎么定？
- 并发数是不是越大越快？
- 文件 hash 计算会卡主线程怎么办？

### 7. 实时消息：SSE 和 WebSocket 怎么选

**问题描述**：做 AI 流式回答、通知、在线协作，怎么选择实时通信方案？

回答重点：

- SSE 适合服务端向浏览器单向推送，例如 AI 流式文本、通知、进度。
- WebSocket 适合强双向、低延迟、高频通信，例如协同编辑、在线聊天、多人互动。
- 如果需要 POST、自定义 Header、读取流、可中断，可以用 Fetch + ReadableStream 自己解析流式协议。
- 需要考虑断线重连、心跳、幂等消息、重复消息、顺序和降级。

追问：

- EventSource 有哪些限制？
- SSE 的消息边界如何解析？
- 企业网络环境下为什么 HTTP 方案可能更容易穿透？

### 8. 离线可用：弱网或断网仍要能打开

**问题描述**：移动端业务希望断网还能看历史数据，恢复网络后同步，怎么设计？

回答重点：

- 静态资源可用 Service Worker + CacheStorage 做离线缓存。
- 业务数据可用 IndexedDB 保存快照、草稿和待同步队列。
- 需要设计缓存版本、更新提示、冲突解决、过期策略和失败重试。
- 不要把敏感数据无脑长期缓存到本地。

追问：

- Service Worker 更新为什么会有生命周期问题？
- localStorage 为什么不适合大量离线数据？
- 离线提交和服务端数据冲突怎么办？

### 9. 权限越权：按钮隐藏了但接口仍能调用

**问题描述**：用户没有权限却能通过手动请求调用接口，怎么设计权限体系？

回答重点：

- 前端权限只负责体验和入口控制，不能作为安全边界。
- 后端必须做接口鉴权和资源级校验。
- 前端侧可以做路由权限、菜单权限、按钮权限、字段权限、数据脱敏。
- 权限变化后要刷新缓存和路由状态，避免旧权限残留。

追问：

- RBAC 和 ABAC 区别是什么？
- 按钮级权限能不能只用 `display: none`？
- 多租户场景下权限缓存怎么失效？

### 10. 富文本 XSS：评论区支持 HTML

**问题描述**：评论、AI 输出或低代码配置需要渲染富文本，如何防 XSS？

回答重点：

- 不可信输入不能直接进入 `innerHTML`。
- 按上下文做输出编码，富文本使用可信 sanitizer。
- 高风险页面叠加 CSP、Trusted Types、白名单组件渲染。
- 服务端也要校验，前端不是唯一防线。

追问：

- React 默认转义是不是就永远安全？
- CSP 能不能替代输入校验？
- `href="javascript:..."` 属于什么风险？

### 11. 微前端子应用拖垮主应用

**问题描述**：一个子应用加载失败导致主应用白屏，怎么治理？

回答重点：

- 子应用必须有加载超时、错误边界、降级 UI 和重试入口。
- 主应用需要隔离路由、样式、全局变量和共享依赖。
- 共享依赖要治理版本兼容，不能无约束共用。
- 监控要能定位是哪个子应用、哪个版本、哪个资源失败。

追问：

- 微前端和插件化怎么选？
- 样式隔离有哪些方案和成本？
- 共享 React/Vue 版本冲突怎么办？

### 12. SSR 页面首屏有 HTML 但不能点

**问题描述**：SSR 页面首屏内容出现了，但用户点击没有反应，怎么解释？

回答重点：

- HTML 出现不代表 JS 已加载、执行并完成 hydration。
- 需要区分 TTFB、HTML streaming、JS 下载、hydration、可交互时间。
- 可以按路由或组件拆分 JS，减少客户端 hydration 成本。
- 交互强、SEO 弱的后台页面不一定适合全量 SSR。

追问：

- Hydration mismatch 常见原因是什么？
- Streaming SSR 解决什么，不解决什么？
- RSC 为什么能减少客户端 JS？

### 13. 前端监控报警：线上白屏但本地无法复现

**问题描述**：线上报警白屏，本地和测试环境都正常，怎么定位？

回答重点：

- 先看影响范围：版本、浏览器、地区、租户、设备、网络。
- 取证：JS error、unhandledrejection、资源加载失败、接口状态码、用户路径。
- Source Map 要安全上传到监控系统，不一定公开到线上。
- 结合发布记录判断是否新版本引入，必要时灰度回滚。

追问：

- 白屏监控怎么实现？
- Source Map 为什么要控制访问权限？
- 只看错误日志为什么不够？

### 14. 复杂表单：几十个字段互相联动

**问题描述**：审批表单有几十个字段、异步校验、权限控制、草稿保存和重复提交，怎么设计？

回答重点：

- 不要所有逻辑堆在组件里，拆成 schema、字段注册、校验器、联动规则、提交状态。
- 异步校验要处理竞态和取消。
- 字段权限要区分可见、可编辑、可提交。
- 提交要做幂等、loading 锁、错误回显、草稿恢复。

追问：

- 表单 schema 怎么避免变成另一个大泥球？
- 字段联动如何避免循环依赖？
- 异步校验结果过期怎么办？

### 15. 腾讯口径：老项目紧急上线但业务跑不通

**问题描述**：你接手一个老项目，代码不是你写的，业务流程跑不通，但明天必须上线，怎么处理？

回答重点：

- 先冻结风险范围，不做大重构。
- 复现核心路径，明确阻塞上线的最小问题集。
- 从最近发布、接口变更、权限配置、环境变量、缓存和灰度规则开始排查。
- 先做最小修复和兜底方案，再补回归测试和监控。
- 如果风险不可控，要明确向上同步上线风险和回滚方案。

追问：

- 什么时候应该止损回滚，而不是继续修？
- 老项目没有测试，你如何保证不引入新问题？
- 业务方催上线时，前端如何表达技术风险？

### 16. 腾讯口径：PC 应用几百个页面，用户反馈很卡

**问题描述**：一个 PC 后台应用有几百个页面，用户只说“很卡”，不知道具体哪里卡，怎么排查？

回答重点：

- 先通过监控和埋点定位慢页面、慢操作、用户设备和浏览器版本。
- 区分首屏慢、切路由慢、表格滚动卡、输入卡、接口慢。
- 对高频页面做 Performance 录制，结合 Long Task、渲染、网络和内存。
- 建立页面性能基线和慢操作排行，而不是凭感觉优化。

追问：

- 没有前端监控时怎么临时定位？
- 卡顿是 CPU、内存、网络还是框架渲染，怎么分层排除？
- 如何让性能优化变成长期机制？

### 17. 阿里口径：移动端首页白屏时间过长

**问题描述**：移动端 H5 首页在弱网下白屏明显，怎么优化？

回答重点：

- 先定位是 DNS/TLS/TTFB 慢、HTML 慢、JS 包太大、首屏渲染被阻塞，还是接口慢。
- 控制首屏 JS 体积，路由和组件按需加载。
- 关键 CSS 内联或优先加载，首屏数据可缓存或降级。
- 静态资源走 CDN 和缓存，必要时使用离线包或预加载。
- 用 FCP、LCP、TTI/INP、白屏时长埋点验证结果。

追问：

- 离线包解决什么，不解决什么？
- H5 白屏和小程序白屏定位有什么差异？
- 为什么只加 loading 不等于优化白屏？

### 18. 阿里口径：JSBridge 和 Native 通信

**问题描述**：移动端 WebView 里，H5 要调用 Native 扫码、支付、定位，JSBridge 怎么设计？

回答重点：

- 定义协议：方法名、参数、回调 id、超时、错误码、版本兼容。
- H5 调 Native 可通过注入对象、URL scheme、postMessage 等方式，具体看容器能力。
- Native 回调 H5 时要处理一次性回调、重复回调、超时和页面销毁。
- 安全上要做域名白名单、能力白名单、参数校验和权限控制。

追问：

- JSBridge 调用失败如何降级？
- 多版本 Native 能力不一致怎么办？
- 为什么不能让任意页面调用任意 Native 能力？

### 19. 字节口径：扫码登录三方通信流程

**问题描述**：让你设计一个类似微信扫码登录第三方网站的流程，浏览器、手机 App、服务端怎么通信？

回答重点：

- 浏览器向服务端申请临时二维码 token，二维码包含登录会话 id。
- 手机 App 扫码后把 token 发给服务端，服务端校验登录态并让用户确认。
- 浏览器端通过轮询、SSE 或 WebSocket 等方式等待扫码、确认、过期状态。
- token 要短期有效、一次性使用、防重放、防伪造。
- 最终服务端给浏览器建立登录态，而不是让前端自己相信二维码内容。

追问：

- 为什么二维码 token 不能长期有效？
- 浏览器等待确认用轮询、SSE、WebSocket 怎么选？
- 如何防止二维码被截屏后复用？

### 20. 字节口径：信息流页面性能和体验

**问题描述**：信息流页面要无限滚动、图片多、曝光埋点多、弱网也要可用，怎么设计？

回答重点：

- 分页用 cursor，避免 offset 深分页性能和重复数据问题。
- 图片懒加载、占位尺寸、预加载下一屏关键资源。
- 曝光埋点用 IntersectionObserver，批量上报，避免滚动同步计算。
- 长列表使用虚拟列表或分段卸载，控制 DOM 数量。
- 弱网下做重试、降级图、骨架屏和缓存。

追问：

- 信息流去重怎么做？
- 新内容插入顶部如何保持滚动位置？
- 曝光埋点如何避免重复上报？

### 21. 字节口径：Event Loop 与 UI 更新顺序

**问题描述**：面试官给你一段同步、微任务、宏任务、渲染混合代码，让你解释输出和 UI 更新时间，怎么回答？

回答重点：

- 先分同步任务、微任务、宏任务，再说明浏览器可能在任务之间进行渲染。
- Promise 回调属于微任务，setTimeout 属于宏任务。
- UI 渲染要等当前任务和微任务队列清空后才有机会执行。
- 不要只背输出，要解释为什么这个顺序会导致某些 loading 不显示。

追问：

- 为什么 `setState` 后不一定马上看到 DOM 更新？
- 微任务过多会不会阻塞渲染？
- loading 设置后立刻同步大循环，为什么用户看不到 loading？

### 22. 大厂通用：技术选型，Vue 和 React 怎么选

**问题描述**：面试官问 Vue 和 React 让你做技术选型，你会考虑哪些因素？

回答重点：

- 不要简单说谁更好，要看团队经验、业务复杂度、生态、招聘、历史包袱、组件库、状态管理、SSR/跨端需求。
- Vue 上手和约束较强，适合模板驱动和中后台提效。
- React 更偏组合和生态开放，复杂工程可塑性强，但约束要靠团队规范补。
- 如果是已有项目，迁移成本和存量资产比框架偏好更重要。

追问：

- 技术选型如何量化？
- 如果团队一半 Vue 一半 React，怎么统一工程能力？
- 什么时候不应该重构到新框架？

## 📝 面试题自测

### Q1 [single]
在前端交互开发中，防抖（Debounce）最适合的使用场景是？
A. 页面滚动位置同步（需要实时更新）
B. 搜索框输入联想（停止输入后才发请求）
C. 按钮防重复点击（立即执行且有间隔）
D. 鼠标移动轨迹记录
答案：B
解析：
💡 它解决了什么问题：
如果不对高频触发事件（如用户连续快速输入）进行延迟拦截，系统会为每次按键立即向服务器发送 HTTP 请求，或者触发繁重的 DOM 重绘，导致服务端面临流量压力，同时导致前端页面严重掉帧、卡顿，体验急剧退化。

🔍 核心原理解析（防拷打）：
1. 核心原理是使用定时器延迟闭包机制。在每次事件触发时，强制重置并清除（clearTimeout）前一次未执行的延迟器。只有在用户动作停止且维持指定的 delay 间隔之后，才真正触发回调函数的执行。
2. 在工程取舍上，防抖机制会导致事件执行存在固有的滞后性。对于需要立即响应而又需要控制频率的场景，则应当结合使用支持 immediate: true（立即执行一次，随后进入冷却）的防抖，或者使用能够保障高频下均匀调度的“节流”。
3. 大厂追问：如果在防抖触发的异步过程中，组件发生了卸载（Unmount），如何防范待触发防抖回调执行导致的“在已销毁组件上操作状态（Memory Leak）”？需在防抖函数上暴露出 cancel 方法，在组件生命周期卸载钩子中主动执行 cancel() 以销毁闭包内的定时器引用。

### Q2 [single]
在 JavaScript 异步编程中，`Promise.all` 和 `Promise.allSettled` 最关键的区别是？
A. all 更快，allSettled 更准确
B. all 任一 rejected 就整体 rejected；allSettled 等所有完成，每个结果都有 status 字段
C. allSettled 不支持 async/await
D. all 只接受 Promise 数组，allSettled 也接受普通值
答案：B
解析：
💡 它解决了什么问题：
如果只使用 Promise.all，一旦任何一个接口或异步操作发生失败（Rejected），整个操作流会立即中断并抛出异常，导致其它已经成功返回的数据被无情抛弃，无法在部分请求失败的场景下展示可用数据，也无法在批量任务中搜集所有子任务的状态。

🔍 核心原原理析（防拷打）：
1. Promise.all 采用的是 Fail-Fast（快速失败）机制，内部任意一个 Promise 失败即立刻调用外层 Promise 的 reject；而 Promise.allSettled 内部则将每一个传入的 Promise 都包裹一层安全兜底拦截，无论其成功还是失败，均会捕获其结果并重塑为 { status: 'fulfilled', value } 或 { status: 'rejected', reason } 的标准结构，最终以 Resolved 状态输出。
2. 工程取舍上，Promise.all 适合强关联的串联事务（如必须同时获取用户信息和权限配置才能渲染页面）；而 Promise.allSettled 适合弱关联的批量任务（如批量下载文件列表、仪表盘加载多个独立的统计卡片），极大增强了页面的容灾韧性（Resilience）。
3. 大厂追问：在不支持 Promise.allSettled 的旧版浏览器环境下，如何仅使用 Promise.all 优雅地模拟出 allSettled 的行为？可通过对传入的 Promise 数组进行 .map(p => Promise.resolve(p).then(val => ({ status: 'fulfilled', value: val }), err => ({ status: 'rejected', reason: err }))) 的方式进行结构包裹，然后再传入 Promise.all 即可。

### Q3 [judgment]
在手写 JavaScript 深拷贝（深克隆）函数时，使用 `WeakMap` 记录已拷贝对象是为了防止函数调用栈溢出。
答案：错
解析：
💡 它解决了什么问题：
如果不处理循环引用（例如对象 A 引用了对象 B，而对象 B 的属性又指回 A），深拷贝函数在深度优先递归（DFS）时将陷入无止境的死循环，最终耗尽 JavaScript 的引擎调用栈，抛出致命的 Maximum call stack size exceeded 内存溢出错误。

🔍 核心原原理析（防拷打）：
1. 核心原理是使用哈希映射缓存表（Graph Visited Table）。在开始拷贝对象前，先检查该对象是否已经记录在 WeakMap 中。若已存在，直接返回其之前创建的克隆对象指针，从而打破深度优先搜索的图回路（Cycles）。
2. 为什么选用 WeakMap 而不是普通的 Map？因为 WeakMap 的 Key 对对象是弱引用（Weak Reference），不会干扰垃圾回收器（Garbage Collector）对被克隆对象的正常回收。如果使用强引用的 Map，一旦克隆了巨型数据，这些数据将被拷贝函数内的缓存一直占用，极易造成严重的内存泄漏。
3. 大厂追问：如果克隆的对象极深且层级达到数千层（非循环引用），仅仅依赖 WeakMap 能防止栈溢出吗？不能，因为本质上它依然是通过递归调用栈工作的。要彻底杜绝这类极端边界下的调用栈溢出，必须改用迭代模拟栈（DFS/BFS Loop with Manual Queue/Stack），在堆内存中维护一个待拷贝的任务队列，将隐式的调用栈转换为显式的数据结构。

### Q4 [multiple]
在手写 JavaScript 发布订阅模式中的 `EventEmitter.once()` 监听器时，有哪些关键实现点？
A. 使用 wrapper 函数包裹原始监听器
B. 在 wrapper 执行完原始监听器后，调用 off 移除 wrapper 自身
C. 在 wrapper 上挂载 `_original` 属性，保存原始函数引用，以便 off 时匹配
D. 必须使用 Symbol 作为事件名
答案：ABC
解析：
💡 它解决了什么问题：
如果不引入 once 的专属解绑逻辑，针对那些仅需执行一次的特定动作（如首屏初始化加载、一次性的网关握手），开发人员需要在业务监听器内部手动编写繁琐的 off 销毁代码，极易因为报错分支未执行而导致监听器常驻内存，引发内存泄漏与高频重复回调。

🔍 核心原原理析（防拷打）：
1. 核心设计模式是代理/包装模式（Decorator/Wrapper Pattern）。once 函数并不直接将原始监听器（Listener）注册到事件队列中，而是生成一个包装函数（Wrapper）。该包装函数在被 emit 触发时，首先执行原始监听器，随后立即执行 this.off() 将自身从队列中踢出，确保只被调用一次。
2. 工程取舍上，为了确保当消费方在外部手动调用 emitter.off(event, originalListener) 时也能正常将对应的包装函数解绑，必须在包装函数上挂载一个属性（如 wrapper._original = originalListener），以便在执行过滤匹配时能识别出真实身份。
3. 大厂追问：如果在 once 包裹的监听器内部又同步触发了 emit 该事件，会导致什么结果？这可能导致监听器在被 off 之前发生重入。为了保证鲁棒性，在 emit 触发遍历时，应当使用 listeners.slice() 克隆一份当前快照进行调用，从而防止在迭代执行过程中由于动态增删订阅队列导致的选择性跳过或死循环。

### Q5 [single]
在前端长列表渲染性能优化中，虚拟列表（Virtual List）的核心收益来自哪里？
A. 减少了 JavaScript 计算量
B. 使用了 CSS GPU 加速
C. 将 DOM 节点数量控制在固定范围内（视口内），不随数据量增长
D. 使用了 Web Worker 在后台渲染
答案：C
解析：
💡 它解决了什么问题：
如果直接在 DOM 树中渲染十万条列表数据，浏览器会因为要创建海量的 DOM 节点而耗尽内存。更致命的是，每一次轻微的滚动都会触发重排与重绘（Reflow & Repaint），使得 FPS 瞬间掉到个位数，导致页面完全卡死。

🔍 核心原原理析（防拷打）：
1. 核心原理是：基于视口计算的 DOM 复用机制。在运行时，虚拟列表并不一次性把所有数据灌入 DOM 树，而是通过监听外部容器的滚动事件（scrollTop），计算出当前可见区域（Viewport）的首尾索引值（startIndex 和 endIndex），仅仅渲染该区间及其前后缓冲区（Buffer）内的 DOM 元素。
2. 在工程取舍上，虚拟列表虽然极大削减了渲染层面的 CPU 与内存占用，但它给浏览器无障碍访问（屏幕阅读器无法读取视口外的数据）以及页面的内置搜索（Command + F 无法查找到未渲染内容）带来了局限。因此，通常需要合理控制可视区缓冲区的大小（如预渲染两屏的数据）。
3. 大厂追问：当列表子项的高度是不固定的（动态高度，受内容文字行数影响），如何精准计算滚动偏移量与定位可视区？必须引入“估算高度 + 动态测量（Dynamic Profiling & Skeleton）”策略。预先假设一个平均高度进行占位，在列表项实际渲染到 DOM 后，利用 ResizeObserver 或是读取 offsetHeight 动态修正该项的高度缓存与 Phantom 滚动容器的总高，并利用二分查找快速修正后续项的 transform: translateY 偏移定位。

### Q6 [judgment]
在 JavaScript 的 `Promise.race()` 竞态机制中，如果最快完成的 Promise 是 rejected，则整体 race 的结果就是 rejected。
答案：对
解析：
💡 它解决了什么问题：
在网络超时控制、竞态请求等高并发时序敏感的场景中，如果不引入快速判定机制，系统就无法立即知道哪个请求或操作“最先完成（无论其是成是败）”，导致后续依赖首个响应的逻辑陷入停滞，浪费用户等待时间。

🔍 核心原原理析（防拷打）：
1. Promise.race 的底层原理是为传入的 Promise 列表中的每一个实例，挂载同一个外层 Promise 的 resolve 和 reject 作为其回调。这意味着一旦其中第一个实例进入了 Settled 状态（不管是 Fulfilled 还是 Rejected），它便会抢先触发外层控制器的状态转移，使后发或慢速的 Promise 实例的状态改变动作永久失效。
2. 工程取舍上，Promise.race 无法得知落败的 Promise 究竟是成功还是失败，且无法中途强行中断那些已经发出去的异步操作（例如已经发出的 HTTP 请求仍会继续传输，耗费带宽），它仅能在代码逻辑层面“忽略”其后续行为。
3. 大厂追问：在执行 Promise.race 模拟接口请求超时时，如何防止超时 reject 后，原本的 Fetch 请求依然占用 HTTP 连接通道导致浏览器最大并发数被占满？必须配合 AbortController 信号。当超时计时器的 Promise 率先胜出时，不仅 reject，更应当在 Catch 块中调用 controller.abort() 主动阻断底层网络请求的 I/O。

### Q7 [single]
在 JavaScript 中手写实现 LRU（最近最少使用）缓存时，使用 `Map` 替代普通 Object 的关键优势是利用了 Map 的什么特性？
A. Map 的键可以是任意类型，避开了对键的强制字符串序列化转换
B. Map 的迭代顺序与插入顺序一致，可以通过 keys().next().value 获取最久未使用的键
C. Map 的 delete 删键操作不会导致 V8 引擎内部发生隐藏类（Hidden Class）降级或字典模式退化
D. Map 底层哈希表在发生碰撞时能够通过红黑树结构实现 O(1) 的常数级查找性能
答案：B
解析：
💡 它解决了什么问题：
如果使用传统的 Object 作为 LRU 缓存的哈希表，由于 Object 的键值迭代是无序的（受数字键等规则影响），若要查找“最久未被访问的键”以腾出缓存空间，必须去遍历整个对象并维护访问时间戳，使得淘汰操作的时间复杂度劣化为 O(N)，导致高频缓存失效时性能暴跌。

🔍 核心原原理析（防拷打）：
1. 核心原理是利用 ES6 Map 具有“保序性”的链表式底层设计。在 Map 中，键的迭代顺序开发等同于其被插入的先后顺序（Insertion Order）。因此，LRU 的“刷新访问状态”操作可以优雅地表达为“先 delete 键，紧接着重新 set 该键”，使得最常用的数据逐步推到 Map 尾部，而 map.keys().next().value 就能以 O(1) 的时间复杂度稳定获取到处于头部、最久未被访问的键。
2. 在工程取舍上，虽然直接用 Map 能够用极简的代码实现功能，但 Map 底层依旧是由 JS 引擎黑盒管理的。如果在内存极度受限、或是超大规模缓存（百万级）场景下，更彻底的选型是手写“双向链表 + 哈希表”结构，以便更精准地控制每个节点的指针和内存分配。
3. 大厂追问：如果 LRU 缓存中的某些数据是异步获取的，当同一个 Key 在缓存未命中的瞬间被并发请求了多次，如何避免缓存击穿引发的重复网络请求？可以采用“缓存 Promise 实例”的策略。在 Map 的 Value 中不存实际结果，而是直接存放该数据的请求 Promise，所有并发调用方共享这同一个 Promise，待其 resolve 后缓存自然生效。

### Q8 [multiple]
在 JavaScript 异步并发控制（如限制网络请求最大并发数）中，以下哪些说法是正确的？
A. 核心思路是维护一个"任务池"，池满时等待最先完成的任务
B. 使用 `Promise.race(pool)` 可以等待池中最先完成的任务
C. 并发控制可以防止同时发出过多网络请求导致服务器压力过大
D. 并发数越大，总耗时一定越短
答案：ABC
解析：
💡 它解决了什么问题：
如果不引入并发控制机制，当面临海量异步任务（如大文件切片上传、大批量图片预加载）时，系统会瞬间向浏览器和服务器发送数十甚至上百个并发网络请求。这会导致浏览器网络线程池（通常限制同一域名最大并发 6 个）产生严重的队头阻塞、TCP 连接耗尽，同时可能击垮服务端网关，甚至导致浏览器页面因内存溢出（OOM）或请求丢包而崩溃。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用“任务队列（Task Queue）”与“滑动窗口（Sliding Window）”机制来实现并发控制。内部维护一个运行中的 Promise 集合（即任务池）以及一个等待执行的任务队列，初始化时启动至多 limit 个并发任务。每当任务池中的任意一个任务完成（无论是 Resolve 还是 Reject），都通过 Promise 链式回调触发下一个排队任务的执行，以此维持稳定的并发饱和度。
2. 工程取舍上，虽然可以使用 Promise.race 动态监控正在执行的 Promise 数组以提取最先完成者，但在大型项目或高频调用中，直接使用辅助变量（如 runningCount 计数器）在每个 Promise 的 finally 中递归自调用，能避免频繁创建和销毁 Promise.race 产生的 GC 压力，具备更高的执行效能。
3. 进一步拓展大厂面试追问：当并发池中的某个请求发生网络抖动而无限挂起时，如何防范它永久占用并发插槽导致整体队列“假死”？必须为并发池中的每个任务配备一个带有超时竞态（AbortController）的熔断器。当某个任务在规定时间内未完成，立即通过 abort 终止网络请求，并将其从并发池中移出，同时记录失败日志并触发重试机制（指数退避重试）。

### Q9 [single]
在前端权限控制架构中，典型的 RBAC（基于角色的访问控制）模型里权限被分配给谁？
A. 直接分配给每个用户
B. 分配给角色，用户通过角色间接获得权限
C. 分配给接口 URL
D. 分配给前端路由路径
答案：B
解析：
💡 它解决了什么问题：
如果不引入 RBAC（基于角色的访问控制）模型，而将权限（如“导出报表”、“修改价格”）直接平铺分配给具体的用户个体，会导致用户数量膨胀时授权链路极其臃肿。当员工离职、入职或岗位调动时，管理员需要对数百个独立的权限点进行逐一配置，这极易引发“权限遗留”等重大系统安全合规隐患（例如离职员工依然拥有敏感数据的下载权限）。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用了三层实体映射的设计模式（用户 -> 角色 -> 权限），即“多对多”的双向解耦。在数据库和权限引擎中，角色（Role）作为中介阻断了用户（User）和细粒度权限（Permission）的直接绑定。用户只要被指派了某个角色，便能动态继承该角色关联的全部权限集合，从而实现“一次修改，全局生效”。
2. 在工程取舍上，RBAC 虽然解决了授权效率，但对于诸如“只允许修改自己创建的订单”这类依赖上下文属性的动态权限（ABAC，基于属性 of 访问控制），单纯的 RBAC 就会失效。在前端工程中，常常采用 RBAC 配合拦截函数（Policy），把用户角色、组织架构以及业务资源的所有权作为综合变量进行判断。
3. 进一步拓展大厂面试追问：在超大型组织中，由于角色数量过多（如数千个业务线角色）导致用户登录时下发的权限列表（Token）过大，如何避免前端频繁请求导致的 HTTP 头溢出（Header Too Large）？可采用前端缓存策略配合渐进式菜单加载，在用户初次访问特定子系统时才按需向权限网关换取局部细粒度操作权限的鉴权结果。

### Q10 [judgment]
在 Vue 的权限管理实践中，自定义指令 `v-permission` 通过 CSS `display: none` 隐藏无权限元素被视为最佳安全实践。
答案：错
解析：
💡 它解决了什么问题：
如果不将无权限的敏感 UI 元素（如“后台管理”按钮、“敏感金额”输入框）从 DOM 树中彻底剥离，而仅仅通过 CSS（如 display: none 或者是 visibility: hidden）进行隐藏，黑客或有心用户可以通过浏览器开发者工具（DevTools）直接修改 CSS 属性或注入 JS 来使元素复现，甚至能直接调用绑定在 DOM 节点上的 click 事件，从而造成应用安全防线的全面崩溃和敏感越权操作。

🔍 核心原理解析（防拷打）：
1. 核心原理是：基于 DOM 树物理隔离的防御式设计。在 MVVM 框架中，真正的权限控制必须借助运行时指令（如 Vue 中的 v-if 或自定义指令在 mounted/inserted 阶段利用 removeChild 物理移除）或编译期条件渲染，使得无权限节点根本不生成对应的 AST 或者是虚拟 DOM（VNode），从而阻断敏感数据的下发与事件交互的入口。
2. 工程取舍上，通过自定义指令（如 v-permission）在 DOM 渲染后进行 removeChild 移除，虽然使用简单，但其存在短暂的“回流闪烁”问题（元素会先生成再被移除）；因此，对于极度敏感的操作区，最佳实践应当是使用函数式组件、路由级懒加载守卫或直接使用 v-if 条件渲染，在 vnode 挂载前就完成拦截。
3. 进一步拓展大厂面试追问：仅仅在前端执行 DOM 移除，就能确保系统绝对安全吗？不能。前端的所有控制都属于 UI 层面的交互辅助（Obfuscation）。大厂架构中必须遵循“前端权限决定视觉呈现，后端权限决定数据安全”的原则。前端移除 DOM 的同时，必须在 API 网关和微服务拦截器中对对应的 HTTP 接口进行严格的 Session/JWT 角色与操作权（Resource-Action）的双重校验。

### Q11 [single]
在 JavaScript 的各种深拷贝（深克隆）方案中，哪种常用方案完全无法克隆函数和 undefined 值？
A. 手写递归深克隆
B. `JSON.parse(JSON.stringify(obj))`
C. `structuredClone(obj)`
D. lodash 的 `_.cloneDeep`
答案：B
解析：
💡 它解决了什么问题：
如果在一个复杂的业务系统（如富文本编辑器数据源、复杂的图表配置对象）中盲目使用 `JSON.parse(JSON.stringify(obj))` 进行数据克隆，会导致函数（Function）、undefined、Symbol 属性静默丢失，Date 对象退化为 ISO 字符串，Map/Set 沦为空对象，循环引用直接导致抛错白屏。这会导致在后续的数据流转中由于方法缺失或类型破裂而发生致命的运行时故障。

🔍 核心原理解析（防拷打）：
1. JSON 序列化底层是基于 JSON 规范的数据类型子集设计。在执行 stringify 时，非 JSON 规范的值（如函数、undefined、Symbol）在对象属性中会被静默忽略，在数组中会被转换为 null，而在单独调用时返回 undefined。同时它也无法重建复杂的原型链与对象引用网络。
2. 工程取舍上，`JSON.parse(JSON.stringify(obj))` 的唯一优势在于执行速度极快（由引擎层 C++ 原生实现，且无需考虑复杂的自定义类和循环引用）。因此，在确认克隆对象只包含纯 JSON 安全的数据类型（如常规 API 响应数据）时，它是性价比最高的深拷贝选型。
3. 进一步拓展大厂面试追问：原生的 `structuredClone()` 已经能解决大部分问题，但它为什么依然不能作为全能深拷贝方案？因为 `structuredClone` 依然无法克隆 Function、Symbol、RegExp 以及 DOM 节点，并且不支持自定义原型的克隆。在需要保留复杂类实例（含有构造器和方法）的业务场景中，必须使用手写深度优先遍历（DFS）并配合 WeakMap 或引入 Lodash 的 cloneDeep。

### Q12 [multiple]
在开发前端搜索框自动补全（Autocomplete）联动功能时，以下哪些是必须考虑和处理的问题？
A. 使用防抖减少请求频率
B. 处理竞态条件（后发的请求先返回覆盖了正确结果）
C. 使用节流保证实时响应
D. 取消上一次未完成的请求（AbortController）
答案：ABD
解析：
💡 它解决了什么问题：
如果在开发搜索联动、模糊查询等交互功能时，直接将输入框的 input 事件绑定到网络请求，会产生两重致命缺陷：一是高频的网络请求会耗尽系统资源；二是由于网络传输的波动，先发出的请求可能因为阻塞而后返回，从而覆盖了后发请求的正确结果（即异步竞态冲突），导致搜索框展示出错误的、与当前输入内容不匹配的陈旧联想结果。

🔍 核心原理解析（防拷打）：
1. 核心原理是采用“时序隔离”与“连接中断”的设计模式。防抖（Debounce）负责在交互入口处限流，仅在用户停止输入指定时间后才发起请求；而 AbortController 或“版本递增标记（Version Tagging）”则用于解决网络竞态问题，每当新的请求发起时，主动调用上一次请求 of abort() 方法使旧请求废弃，确保只有最后一次触发的 Promise 结果被渲染到 UI。
2. 工程取舍上，相比直接 abort 掉底层网络连接，使用“请求版本标识（Request Index）”在 JS 内存中忽略落后请求虽然实现成本更低，但它无法为浏览器腾出 HTTP 通道。因此，在 HTTP/1.1 等仍受连接数限制的场景下，结合 AbortController 才是最优解。
3. 进一步拓展大厂面试追问：当用户在网络极差的情况下高频打字，频繁的 abort 请求是否会导致浏览器或网关层的额外性能开销？是的。在极度高频且对性能敏感的场景下，可以引入基于 Trie 树（前缀树）的本地内存缓存（如 React Query/SWR 的数据缓存机制）。对于已经请求过的前缀词（如“react”），直接从缓存读取，避免发起无效的 abort 链路。

### Q13 [single]
在手写实现一个支持 `cancel()` 注销方法的防抖函数时，该 `cancel` 函数的核心作用是？
A. 清除当前计时器，阻止待执行的函数运行
B. 立即执行待执行的函数
C. 将防抖延迟重置为默认值
D. 取消事件监听
答案：A
解析：
💡 它解决了什么问题：
当防抖函数在异步延迟（如 500ms）等待执行时，如果触发了组件的卸载（Unmount）、路由跳转或页面切换，闭包内定时器引用的回调函数依然会在到期后强行执行。这不仅会尝试修改已销毁组件的状态从而导致 React/Vue 抛出内存泄漏与无意义报错，而且可能会触发已经失效的业务逻辑（如在非当前页弹出提示框），造成应用行为混乱。

🔍 核心原理解析（防拷打）：
1. 核心设计是闭包生命周期与垃圾回收（Garbage Collection）的手动干预。cancel 函数的核心工作原理是通过外部暴露的钩子，主动执行 clearTimeout(timer) 销毁闭包内维持的定时器标识符，并将 timer 变量置为 null，解除定时器对回调函数及其周围上下文环境的闭包强引用，使其能被垃圾回收器顺利回收。
2. 在工程取舍上，防抖的 cancel 函数对于防止内存泄漏至关重要。但很多开发者只在组件内使用 debounce，却漏掉了在销毁钩子（如 Vue 的 beforeUnmount、React 的 useEffect return cleanup）中调用 cancel，这就让架构层面的防抖保护效果大打折扣。
3. 进一步拓展大厂面试追问：除了 cancel 之外，如何实现一个能在触发紧急业务时“立即强制执行（Flush）”的防抖函数？可以为防抖函数挂载一个 flush 方法：如果定时器存在，则立即清除定时器，并以当前缓存的 arguments 同步调用原始回调函数，从而实现“从异步延迟到同步立即结算”的平滑切换。

### Q14 [judgment]
在 JavaScript 中，`Promise.allSettled` 返回的 Promise 本身永远不会被 reject，而是总是走向 fulfilled。
答案：对
解析：
💡 它解决了什么问题：
如果在处理多路并行的异构任务（如同时请求推荐列表、广告、以及天气卡片）时使用 Promise.all，若其中一个非核心的“天气卡片”请求由于接口报错被 Reject，整个 Promise 链会瞬间断裂抛错，导致其它核心卡片的数据也无法渲染。allSettled 解决了全局容灾问题，保障系统不因局部的失败而整体瘫痪。

🔍 核心原理解析（防拷打）：
1. 核心原理是状态容器的重新封装。Promise.allSettled 内部建立了一个统一的拦截器，它会拦截每个子 Promise 的 catch 链路。无论子 Promise 最终是 Fulfilled 还是 Rejected，均会统一转换为 Resolved 状态，并将其各自 of status、value 或 reason 封装到一个标准的结果对象中，以此确保外层容器 Promise 的执行链路永远走向 then 而非 catch。
2. 工程取舍上，使用 allSettled 会使调用方必须写额外的遍历代码去筛选和校验每个结果的 status（如 result.status === 'fulfilled'）。如果是针对强依赖关系的任务（如获取 Token 和拉取用户信息），依然应当使用 Promise.all 让其快速失败以减少后续无效的网络开销。
3. 进一步拓展大厂面试追问：如何基于 Promise.allSettled 实现一个“部分容错（M out of N）”的并发机制（如发出 5 个请求，只要成功 3 个即可立即 resolve，否则全部失败才 reject）？需要借助计数器逻辑。在每一个 Promise 的 resolve/reject 回调中动态累加成功和失败计数，当成功数达到阈值时提前 resolve 外层 Promise，否则在所有任务结束仍未达标时整体 reject。

### Q15 [multiple]
在手写 JavaScript 深拷贝（深克隆）函数时，需要特殊处理哪些引用类型以确保正确克隆而不是丢失其原型或属性？
A. Date 对象（new Date(value) 重建）
B. RegExp 对象（new RegExp(value) 重建）
C. Map 和 Set（递归克隆每个键值）
D. null（视为普通对象递归）
答案：ABC
解析：
💡 它解决了什么问题：
如果深拷贝函数对所有对象均采用统一的“创建空对象，然后 for...in 循环递归”方案，会导致 Date 对象丢失时间戳退化为普通的空 Object，RegExp 的正则规则与修饰符（如 global, ignoreCase）全部丢失，Map/Set 内的数据结构被彻底擦除，甚至会因为 null 对象的 typeof 为 'object' 导致递归报错，最终导致克隆后的复杂业务数据实体直接失效。

🔍 核心原理解析（防拷打）：
1. 核心原理是利用类型分流（Type Dispatching）与原型链继承的重建。在克隆前，通过 Object.prototype.toString.call(value) 精准检测出其实际内置类型。针对 Date 使用 new Date(value.getTime())，针对 RegExp 使用 new RegExp(value.source, value.flags)，针对 Map/Set 则分别通过 new Map() 和 new Set() 实例化新容器，并递归克隆其中的键和值。
2. 工程取舍上，对于复杂的引用对象（如 DOM 元素、Window 对象、或者含有内部闭包状态的对象），深拷贝很难在保持完整功能的前提下进行完美复制（因为无法克隆事件监听器或闭包环境）。在架构设计上，应当通过“不可变数据（Immutability）”或仅克隆纯数据实体来规避对这类复杂系统级对象进行深拷贝。
3. 进一步拓展大厂面试追问：如何处理带有自定义原型链（Prototype）的对象克隆，以确保克隆后的对象依然是同一个自定义类的实例（能够调用原型链上的方法）？应当利用 Object.create(Object.getPrototypeOf(source)) 创建一个继承了源对象原型的新对象，在此基础上再结合 Object.assign 或递归复制其自身的属性，从而保障原型链（Prototype Chain）不发生断裂。

### Q16 [single]
在手写 JavaScript 节流（Throttle）函数时，以下哪种常见方式能实现“首次调用立即执行，之后按间隔节流”的效果？
A. 普通节流（时间戳版）
B. 普通防抖
C. 防抖的 `immediate: true` 模式
D. 节流的时间戳 + 定时器结合版
答案：A
解析：
💡 它解决了什么问题：
如果不使用时间戳来实现节流，而单纯使用定时器（setTimeout）延时触发，会导致事件首次触发时也必须等待 delay 的延迟时间（例如点击后过了 300ms 才有反应）。这对于用户高频交互（如点击发帖按钮、滑动菜单展开）会产生明显的视觉卡顿感，极大地破坏了应用的即时交互响应体验。

🔍 核心原理解析（防拷打）：
1. 核心原理是基于系统绝对时钟的计算。时间戳版本节流的核心公式为 `now - lastTime >= interval`。在初始化时，`lastTime` 被赋予 0。当用户首次调用时，`now - 0` 必然远大于指定的 `interval`，因而触发了条件分支，使得回调函数被立即同步执行。随后将 `lastTime` 更新为当前的 `now`，后续调用则进入等待冷却。
2. 工程取舍上，单纯的时间戳版本在停止高频调用后，最后一次触发的动作会因为不满足 `now - lastTime >= interval` 而被静默丢弃（无尾随执行）；而单纯的定时器版则无法首次立即执行（无首发执行）。因此，在实际工业级交互（如拖拽调整大小、滚动吸顶）中，最完美的设计是结合“时间戳 + 定时器”，既保证首次立即触发，又保证最后一次输入会被尾随定时器补发执行（Trailing）。
3. 进一步拓展大厂面试追问：在多端开发中（如小程序或 Hybrid WebView 容器），如果客户端系统的绝对时间戳由于网络对时被意外篡改（或用户手动修改了手机系统时间），基于时间戳的节流函数可能会面临“永久锁死（lastTime 大于 now）”或“节流失效”的 Bug，该如何治理？应当引入高精度时间 API（如浏览器环境下的 performance.now()），它返回一个自页面加载后以恒定速率增长的单调时间戳（Monotonic Clock），不受系统本地时间校准的干扰。

### Q17 [single]
在腾讯中高级前端场景题面试中，用户反馈首页打开很慢。作为中高级前端，第一步最合理的处理方式是什么？
A. 直接把所有图片都加上 lazy loading
B. 先确认影响范围，并用 LCP、FCP、TTFB、资源瀑布取证
C. 直接改成 SSR
D. 删除所有动画
答案：B
解析：
- 结论：本题选择 B。场景题要先定范围和证据。首屏慢可能来自服务端、网络、资源发现、资源加载、客户端渲染等多个环节。
- 逐项拆解：
  - A：直接把所有图片都加上 lazy loading不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：先确认影响范围，并用 LCP、FCP、TTFB、资源瀑布取证应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：直接改成 SSR不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：删除所有动画不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q18 [single]
在腾讯中高级前端场景题面试中，首屏最大图片是 LCP 元素时，下面哪种做法最可能伤害 LCP？
A. 给首屏 LCP 图片设置 `loading="lazy"`
B. 压缩图片体积
C. 使用合适的 CDN 缓存
D. 提前发现关键资源
答案：A
解析：
- 结论：本题选择 A。首屏 LCP 图片应该尽早加载，懒加载会推迟资源请求，常导致 LCP 变差。
- 逐项拆解：
  - A：给首屏 LCP 图片设置 `loading="lazy"`应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：压缩图片体积不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：使用合适的 CDN 缓存不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：提前发现关键资源不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q19 [single]
在腾讯中高级前端场景题面试中，用户点击按钮后页面卡住，最应该优先检查什么？
A. CSS 颜色变量是否命名规范
B. 主线程是否存在 Long Task，以及点击回调是否同步做了重计算
C. 图片是否都转成 base64
D. 是否开启了 gzip
答案：B
解析：
- 结论：本题选择 B。点击卡顿通常和主线程被长任务占用有关，要用 Performance 面板、INP、Long Task 方向定位。
- 逐项拆解：
  - A：CSS 颜色变量是否命名规范不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：主线程是否存在 Long Task，以及点击回调是否同步做了重计算应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：图片是否都转成 base64不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：是否开启了 gzip不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q20 [single]
在腾讯中高级前端场景题面试中，10 万条数据的长列表卡顿，虚拟列表的核心收益是什么？
A. 减少接口返回字段数量
B. 只渲染可视区附近的 DOM，降低 DOM 数量和布局成本
C. 自动让所有数据变成响应式
D. 让滚动事件不触发
答案：B
解析：
- 结论：本题选择 B。虚拟列表解决的是 DOM 渲染和操作成本，不是让数据量消失。
- 逐项拆解：
  - A：减少接口返回字段数量不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：只渲染可视区附近的 DOM，降低 DOM 数量和布局成本应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：自动让所有数据变成响应式不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：让滚动事件不触发不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q21 [single]
在腾讯中高级前端场景题面试中，搜索框连续输入导致旧结果覆盖新结果，本质上更接近什么问题？
A. CSS 优先级问题
B. 并发请求竞态问题
C. 图片加载失败
D. 路由配置错误
答案：B
解析：
- 结论：本题选择 B。旧请求后返回覆盖新状态是典型 race condition，可用 AbortController、请求序号、过期响应丢弃等方案。
- 逐项拆解：
  - A：CSS 优先级问题不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：并发请求竞态问题应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：图片加载失败不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：路由配置错误不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q22 [single]
在腾讯中高级前端场景题面试中，大文件上传中，控制上传并发数的主要目的是什么？
A. 让文件名更短
B. 避免同时发出过多请求打满网络、浏览器连接和服务端资源
C. 让 hash 一定更快
D. 避免使用 FormData
答案：B
解析：
- 结论：本题选择 B。并发数不是越大越好，要在吞吐、失败率、服务端压力和浏览器限制之间取平衡。
- 逐项拆解：
  - A：让文件名更短不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：避免同时发出过多请求打满网络、浏览器连接和服务端资源应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：让 hash 一定更快不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：避免使用 FormData不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q23 [single]
在腾讯中高级前端场景题面试中，AI 流式回答主要是“用户发请求，服务端持续返回文本”。优先可考虑哪类方案？
A. SSE 或 Fetch + ReadableStream
B. localStorage 轮询
C. CSS animation
D. JSONP
答案：A
解析：
- 结论：本题选择 A。这类场景是服务端到客户端的流式单向输出，SSE 或 Fetch 读取流更贴近需求。
- 逐项拆解：
  - A：SSE 或 Fetch + ReadableStream应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：localStorage 轮询不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：CSS animation不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：JSONP不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q24 [single]
在腾讯中高级前端场景题面试中，Service Worker 在离线体验中更适合负责什么？
A. 直接操作页面 DOM
B. 拦截请求、管理静态资源或响应缓存
C. 替代后端鉴权
D. 替代数据库事务
答案：B
解析：
- 结论：本题选择 B。Service Worker 位于浏览器和网络之间，可用于缓存、离线和请求拦截，但不能直接操作 DOM。
- 逐项拆解：
  - A：直接操作页面 DOM不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：拦截请求、管理静态资源或响应缓存应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：替代后端鉴权不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：替代数据库事务不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q25 [single]
在腾讯中高级前端场景题面试中，“隐藏无权限按钮”在安全上最大的问题是什么？
A. 页面不够美观
B. 用户仍可能直接调用接口，后端如果不鉴权就会越权
C. 会导致浏览器无法缓存
D. 会导致 CSS 失效
答案：B
解析：
- 结论：本题选择 B。前端权限只是体验控制，真正安全边界必须在服务端接口和资源级鉴权。
- 逐项拆解：
  - A：页面不够美观不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：用户仍可能直接调用接口，后端如果不鉴权就会越权应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：会导致浏览器无法缓存不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：会导致 CSS 失效不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q26 [single]
在腾讯中高级前端场景题面试中，富文本评论区防 XSS 时，最危险的做法是什么？
A. 对不可信 HTML 使用可信 sanitizer
B. 配置 CSP 作为纵深防御
C. 直接把用户输入拼到 `innerHTML`
D. 对 URL 协议做白名单
答案：C
解析：
- 结论：本题选择 C。不可信输入直接进入可执行 HTML 上下文，是 XSS 的高风险入口。
- 逐项拆解：
  - A：对不可信 HTML 使用可信 sanitizer不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：配置 CSP 作为纵深防御不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：直接把用户输入拼到 `innerHTML`应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：对 URL 协议做白名单不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q27 [single]
在腾讯中高级前端场景题面试中，微前端里一个子应用加载失败导致主应用白屏，最直接缺失的治理能力是什么？
A. 错误边界、超时、降级和重试
B. 更复杂的按钮动画
C. 更大的字体
D. 更短的路由路径
答案：A
解析：
- 结论：本题选择 A。子应用必须有故障隔离和降级，否则局部失败会扩大成全站不可用。
- 逐项拆解：
  - A：错误边界、超时、降级和重试应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：更复杂的按钮动画不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：更大的字体不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：更短的路由路径不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q28 [single]
在腾讯中高级前端场景题面试中，SSR 页面首屏 HTML 已经出现但按钮不能点，最合理的解释是什么？
A. CSS 一定没有加载
B. HTML 出现不等于客户端 JS 已加载执行并完成 hydration
C. 浏览器不支持点击事件
D. 服务端一定挂了
答案：B
解析：
- 结论：本题选择 B。SSR 的 HTML 可见和页面可交互之间还有 JS 下载、执行、hydration 等过程。
- 逐项拆解：
  - A：CSS 一定没有加载不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：HTML 出现不等于客户端 JS 已加载执行并完成 hydration应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：浏览器不支持点击事件不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：服务端一定挂了不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q29 [single]
在腾讯中高级前端场景题面试中，线上白屏本地无法复现时，下面哪项最能帮助定位真实原因？
A. 用户影响范围、错误日志、资源加载失败、发布版本和 Source Map
B. 只看自己电脑是否能打开
C. 只重启开发服务器
D. 只清理 node_modules
答案：A
解析：
- 结论：本题选择 A。线上偶发问题需要线上证据链，不能只依赖本地复现。
- 逐项拆解：
  - A：用户影响范围、错误日志、资源加载失败、发布版本和 Source Map应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：只看自己电脑是否能打开不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：只重启开发服务器不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：只清理 node_modules不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q30 [single]
在腾讯中高级前端场景题面试中，复杂表单几十个字段互相联动时，最不推荐的设计是？
A. schema 描述字段和规则
B. 字段注册和校验器分层
C. 所有联动、校验、权限、提交逻辑都堆在一个组件里
D. 提交时做幂等和错误回显
答案：C
解析：
- 结论：本题选择 C。复杂表单需要分层治理，否则会快速变成难维护的大组件。
- 逐项拆解：
  - A：schema 描述字段和规则不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：字段注册和校验器分层不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：所有联动、校验、权限、提交逻辑都堆在一个组件里应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：提交时做幂等和错误回显不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q31 [single]
在腾讯中高级前端场景题面试中，IntersectionObserver 更适合下面哪类场景？
A. 判断元素是否进入视口，用于懒加载、曝光、无限滚动触发
B. 精确替代所有滚动动画逻辑
C. 直接修改网络请求头
D. 直接保证图片不占位
答案：A
解析：
- 结论：本题选择 A。IntersectionObserver 用于异步观察交叉变化，常用于懒加载、曝光和无限滚动触发。
- 逐项拆解：
  - A：判断元素是否进入视口，用于懒加载、曝光、无限滚动触发应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：精确替代所有滚动动画逻辑不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：直接修改网络请求头不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：直接保证图片不占位不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q32 [single]
在腾讯中高级前端场景题面试中，Web Worker 适合优化哪类前端问题？
A. 大计算阻塞主线程导致交互卡顿
B. CSS 选择器命名不一致
C. 图片路径写错
D. 后端接口 500
答案：A
解析：
- 结论：本题选择 A。Worker 可把计算放到后台线程，避免阻塞 UI 主线程，但不能直接操作 DOM。
- 逐项拆解：
  - A：大计算阻塞主线程导致交互卡顿应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：CSS 选择器命名不一致不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：图片路径写错不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：后端接口 500不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q33 [single]
在腾讯中高级前端场景题面试中，Source Map 在线上监控里的正确使用方式更接近哪项？
A. 永远公开给所有用户下载
B. 安全上传到监控平台或受控存储，用于还原压缩代码错误栈
C. 完全不需要
D. 只能用于 CSS
答案：B
解析：
- 结论：本题选择 B。Source Map 对定位线上错误很关键，但可能泄露源码，需要控制访问。
- 逐项拆解：
  - A：永远公开给所有用户下载不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：安全上传到监控平台或受控存储，用于还原压缩代码错误栈应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：完全不需要不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：只能用于 CSS不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q34 [single]
在腾讯中高级前端场景题面试中，腾讯中高级场景题中，回答“我用了某技术”通常还不够，主要还缺什么？
A. 技术名字的英文拼写
B. 业务问题、取舍原因、验证指标和故障预案
C. 更多 emoji
D. 更长的代码块
答案：B
解析：
- 结论：本题选择 B。中高级面试更看重问题抽象、工程取舍和落地结果。
- 逐项拆解：
  - A：技术名字的英文拼写不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：业务问题、取舍原因、验证指标和故障预案应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：更多 emoji不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：更长的代码块不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q35 [multiple]
在腾讯中高级前端场景题面试中，定位 LCP 慢时，应该重点关注哪些证据？
A. TTFB
B. LCP 资源发现和加载时机
C. LCP 元素渲染延迟
D. 按钮圆角大小
答案：ABC
解析：
- 结论：本题选择 ABC。LCP 可拆成服务端响应、资源发现、资源加载和元素渲染等阶段。
- 逐项拆解：
  - A：TTFB应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：LCP 资源发现和加载时机应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：LCP 元素渲染延迟应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：按钮圆角大小不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q36 [multiple]
在腾讯中高级前端场景题面试中，点击交互卡顿时，可考虑哪些优化方向？
A. 拆分长任务
B. 把重计算移入 Web Worker
C. 优先给用户即时反馈
D. 在点击回调里同步处理所有大数据
答案：ABC
解析：
- 结论：本题选择 ABC。交互优化要减少主线程阻塞，并让用户尽快看到反馈。
- 逐项拆解：
  - A：拆分长任务应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：把重计算移入 Web Worker应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：优先给用户即时反馈应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：在点击回调里同步处理所有大数据不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q37 [multiple]
在腾讯中高级前端场景题面试中，CLS 异常常见原因包括哪些？
A. 图片或广告没有预留尺寸
B. 异步错误提示插入到已有内容上方
C. 字体加载导致文本尺寸变化
D. 纯函数命名太短
答案：ABC
解析：
- 结论：本题选择 ABC。布局不稳定通常来自资源、异步内容或字体导致的尺寸变化。
- 逐项拆解：
  - A：图片或广告没有预留尺寸应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：异步错误提示插入到已有内容上方应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：字体加载导致文本尺寸变化应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：纯函数命名太短不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q38 [multiple]
在腾讯中高级前端场景题面试中，不定高虚拟列表需要处理哪些问题？
A. 预估高度
B. 渲染后测量实际高度
C. 更新 offset 或高度缓存
D. 删除所有滚动条
答案：ABC
解析：
- 结论：本题选择 ABC。不定高列表要维护高度估算和修正，否则滚动位置会错乱。
- 逐项拆解：
  - A：预估高度应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：渲染后测量实际高度应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：更新 offset 或高度缓存应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：删除所有滚动条不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q39 [multiple]
在腾讯中高级前端场景题面试中，处理请求竞态可以使用哪些策略？
A. AbortController 取消旧请求
B. 请求序号，只接收最后一次结果
C. query key 区分不同查询条件
D. 让所有响应随便覆盖状态
答案：ABC
解析：
- 结论：本题选择 ABC。核心目标是避免过期响应覆盖最新状态。
- 逐项拆解：
  - A：AbortController 取消旧请求应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：请求序号，只接收最后一次结果应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：query key 区分不同查询条件应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：让所有响应随便覆盖状态不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q40 [multiple]
在腾讯中高级前端场景题面试中，大文件上传的完整方案通常包含哪些能力？
A. 文件分片
B. 并发控制
C. 失败重试和断点续传
D. 服务端分片合并和校验
答案：ABCD
解析：
- 结论：本题选择 ABCD。大文件上传是前后端协作问题，前端体验和服务端合并校验都要设计。
- 逐项拆解：
  - A：文件分片应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：并发控制应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：失败重试和断点续传应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：服务端分片合并和校验应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q41 [multiple]
在腾讯中高级前端场景题面试中，SSE 或流式响应场景需要重点处理哪些问题？
A. 断线重连
B. 消息边界解析
C. 重复消息或顺序问题
D. CSS 变量命名
答案：ABC
解析：
- 结论：本题选择 ABC。实时流式场景关键是连接稳定性、协议解析和消息一致性。
- 逐项拆解：
  - A：断线重连应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：消息边界解析应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：重复消息或顺序问题应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：CSS 变量命名不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q42 [multiple]
在腾讯中高级前端场景题面试中，离线可用方案中，哪些说法正确？
A. 静态资源可用 Service Worker 和 CacheStorage
B. 业务草稿可存 IndexedDB
C. 需要考虑缓存版本和数据过期
D. 敏感数据可以无脑永久缓存
答案：ABC
解析：
- 结论：本题选择 ABC。离线能力必须同时考虑缓存、同步、安全和过期策略。
- 逐项拆解：
  - A：静态资源可用 Service Worker 和 CacheStorage应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：业务草稿可存 IndexedDB应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：需要考虑缓存版本和数据过期应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：敏感数据可以无脑永久缓存不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q43 [multiple]
在腾讯中高级前端场景题面试中，权限系统前端侧可以做哪些体验控制？
A. 路由权限
B. 菜单权限
C. 按钮权限
D. 字段可见和可编辑控制
答案：ABCD
解析：
- 结论：本题选择 ABCD。这些都属于前端体验和入口控制，但后端仍必须做安全鉴权。
- 逐项拆解：
  - A：路由权限应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：菜单权限应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：按钮权限应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：字段可见和可编辑控制应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q44 [multiple]
在腾讯中高级前端场景题面试中，富文本 XSS 防护可以包含哪些措施？
A. 上下文相关输出编码
B. 可信 sanitizer
C. CSP 和 Trusted Types
D. 直接信任用户输入
答案：ABC
解析：
- 结论：本题选择 ABC。富文本安全需要多层防御，不能直接信任不可信输入。
- 逐项拆解：
  - A：上下文相关输出编码应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：可信 sanitizer应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：CSP 和 Trusted Types应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：直接信任用户输入不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q45 [multiple]
在腾讯中高级前端场景题面试中，微前端故障隔离要考虑哪些能力？
A. 子应用加载超时
B. 错误边界和降级 UI
C. 共享依赖版本治理
D. 失败监控能定位子应用和版本
答案：ABCD
解析：
- 结论：本题选择 ABCD。微前端拆分后，运行时治理比简单拼页面更重要。
- 逐项拆解：
  - A：子应用加载超时应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：错误边界和降级 UI应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：共享依赖版本治理应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：失败监控能定位子应用和版本应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q46 [multiple]
在腾讯中高级前端场景题面试中，SSR/Hydration 场景下，需要关注哪些阶段？
A. TTFB
B. HTML 到达和 streaming
C. 客户端 JS 下载执行
D. hydration 完成和可交互
答案：ABCD
解析：
- 结论：本题选择 ABCD。SSR 体验不是只看 HTML 出现，还要看 hydration 和交互接管。
- 逐项拆解：
  - A：TTFB应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：HTML 到达和 streaming应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：客户端 JS 下载执行应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：hydration 完成和可交互应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q47 [multiple]
在腾讯中高级前端场景题面试中，线上白屏监控应采集哪些信息？
A. JS error 和 unhandledrejection
B. 静态资源加载失败
C. 接口状态码和关键链路日志
D. 发布版本、浏览器、地区、设备
答案：ABCD
解析：
- 结论：本题选择 ABCD。线上定位需要足够多维度的证据链。
- 逐项拆解：
  - A：JS error 和 unhandledrejection应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：静态资源加载失败应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：接口状态码和关键链路日志应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：发布版本、浏览器、地区、设备应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q48 [multiple]
在腾讯中高级前端场景题面试中，复杂表单架构中，哪些设计能提升可维护性？
A. schema 化字段
B. 校验器和联动规则分层
C. 异步校验竞态处理
D. 提交幂等和错误回显
答案：ABCD
解析：
- 结论：本题选择 ABCD。复杂表单的难点是长期维护、状态一致性和用户体验，不是单个 input。
- 逐项拆解：
  - A：schema 化字段应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：校验器和联动规则分层应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：异步校验竞态处理应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：提交幂等和错误回显应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q49 [judgment]
在腾讯中高级前端场景题面试中，中高级场景题中，先给最终方案比先确认问题范围更专业。
答案：错
解析：
- 结论：本题判断为“错”。没有范围和证据的方案很容易答偏，真实工程问题必须先定位。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q50 [judgment]
在腾讯中高级前端场景题面试中，首屏 LCP 图片通常不应该使用懒加载。
答案：对
解析：
- 结论：本题判断为“对”。首屏关键资源应尽早发现和加载，懒加载会推迟加载时机。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q51 [judgment]
在腾讯中高级前端场景题面试中，Web Worker 可以直接读取和修改页面 DOM。
答案：错
解析：
- 结论：本题判断为“错”。Worker 运行在后台线程，不能直接操作 DOM，需要通过消息和主线程通信。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q52 [judgment]
在腾讯中高级前端场景题面试中，虚拟列表的核心是减少真实 DOM 数量，而不是减少原始数据条数。
答案：对
解析：
- 结论：本题判断为“对”。数据仍然可以很多，但 DOM 只保留可视区附近节点。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q53 [judgment]
在腾讯中高级前端场景题面试中，只要前端隐藏了按钮，后端接口就可以不做权限校验。
答案：错
解析：
- 结论：本题判断为“错”。前端不是安全边界，接口和资源级权限必须在后端校验。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q54 [judgment]
在腾讯中高级前端场景题面试中，CSP 是 XSS 防护的纵深防线，但不能替代输入校验和输出编码。
答案：对
解析：
- 结论：本题判断为“对”。CSP 能降低攻击面，但 XSS 防护仍需上下文编码、sanitizer 和安全渲染。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q55 [judgment]
在腾讯中高级前端场景题面试中，SSE 更适合服务端到客户端的单向推送，WebSocket 更适合强双向通信。
答案：对
解析：
- 结论：本题判断为“对”。两者选型要看通信方向、频率、网络环境、协议复杂度和降级能力。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q56 [judgment]
在腾讯中高级前端场景题面试中，Service Worker 可以提升离线体验，但也会带来缓存版本和更新生命周期问题。
答案：对
解析：
- 结论：本题判断为“对”。Service Worker 能缓存和拦截请求，但更新、缓存失效和多版本并存都需要治理。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q57 [judgment]
在腾讯中高级前端场景题面试中，线上 Source Map 永远应该公开部署到静态服务器，方便任何人调试。
答案：错
解析：
- 结论：本题判断为“错”。Source Map 可能泄露源码，应该受控上传到监控系统或限制访问。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q58 [judgment]
在腾讯中高级前端场景题面试中，项目面试里，能讲清方案的指标、取舍、失败预案和复盘，比只说用了某个框架更接近中高级要求。
答案：对
解析：
- 结论：本题判断为“对”。中高级面试关注真实问题解决能力和工程判断，而不是单纯技术名词堆砌。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q59 [single]
在腾讯中高级前端场景题面试中，腾讯口径的“老项目紧急上线但业务跑不通”场景，最合理的第一步是什么？
A. 直接重构整个项目
B. 冻结风险范围，复现核心路径，找出阻塞上线的最小问题集
C. 先换一个前端框架
D. 删除所有缓存
答案：B
解析：
- 结论：本题选择 B。时间紧急时要先保证核心路径和风险收敛，不能做大范围重构。
- 逐项拆解：
  - A：直接重构整个项目不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：冻结风险范围，复现核心路径，找出阻塞上线的最小问题集应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：先换一个前端框架不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：删除所有缓存不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q60 [single]
在腾讯中高级前端场景题面试中，腾讯口径的 PC 多页面应用卡顿排查，最应该避免哪种做法？
A. 建立慢页面和慢操作排行
B. 区分首屏慢、切路由慢、表格滚动卡和输入卡
C. 凭借经验预判瓶颈并优先对个人熟悉的简单页面进行局部优化
D. 用 Performance 录制高频慢操作
答案：C
解析：
- 结论：本题选择 C。大规模应用卡顿需要先定范围和证据，否则优化很容易打偏。
- 逐项拆解：
  - A：建立慢页面和慢操作排行不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：区分首屏慢、切路由慢、表格滚动卡和输入卡不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：凭借经验预判瓶颈并优先对个人熟悉的简单页面进行局部优化应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：用 Performance 录制高频慢操作不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q61 [single]
在腾讯中高级前端场景题面试中，阿里口径的移动端 H5 白屏优化，下面哪项最能体现工程化思维？
A. 在首屏挂载一个高消耗的复杂 CSS 加载动画
B. 拆分首屏资源、控制 JS 体积、接入白屏指标和灰度验证
C. 强行阻断所有异步网络请求的加载以保证主线程响应
D. 将页面中的异步逻辑全部重构为阻塞式的同步脚本执行
答案：B
解析：
- 结论：本题选择 B。白屏优化要从资源、渲染、数据和验证闭环处理。
- 逐项拆解：
  - A：在首屏挂载一个高消耗的复杂 CSS 加载动画不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：拆分首屏资源、控制 JS 体积、接入白屏指标和灰度验证应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：强行阻断所有异步网络请求的加载以保证主线程响应不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：将页面中的异步逻辑全部重构为阻塞式的同步脚本执行不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q62 [single]
在腾讯中高级前端场景题面试中，JSBridge 设计中，为什么需要能力白名单和域名白名单？
A. 缩减 JSBridge 运行时在主线程 of 物理代码体积
B. 防止任意页面调用高危 Native 能力
C. 优化客户端 Webview 在渲染时的 CSS 选择器权重匹配
D. 压缩多媒体资源在跨端传输过程中的网络传输损耗
答案：B
解析：
- 结论：本题选择 B。WebView 能力调用涉及设备能力和用户数据，必须做来源和能力控制。
- 逐项拆解：
  - A：缩减 JSBridge 运行时在主线程 of 物理代码体积不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：防止任意页面调用高危 Native 能力应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：优化客户端 Webview 在渲染时的 CSS 选择器权重匹配不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：压缩多媒体资源在跨端传输过程中的网络传输损耗不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q63 [single]
在腾讯中高级前端场景题面试中，扫码登录流程中，二维码 token 最重要的安全特征是什么？
A. 长期有效
B. 可预测
C. 短期有效、一次性使用、防重放
D. 将 Token 持久化存储于客户端同步的本地离线缓存（LocalStorage）中
答案：C
解析：
- 结论：本题选择 C。扫码登录 token 如果长期有效或可复用，会带来截屏复用和重放风险。
- 逐项拆解：
  - A：长期有效不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：可预测不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：短期有效、一次性使用、防重放应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：将 Token 持久化存储于客户端同步的本地离线缓存（LocalStorage）中不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q64 [single]
在腾讯中高级前端场景题面试中，信息流曝光埋点最适合用哪类能力辅助？
A. IntersectionObserver
B. 利用阻塞式的 alert 提示框拦截每一次视口变更
C. 频繁触发 document.write 写入以强行插入埋点 DOM
D. 通过在 JavaScript 主线程中执行同步 while 耗时循环进行阻塞监听
答案：A
解析：
- 结论：本题选择 A。IntersectionObserver 适合观察元素进入视口，常用于曝光和懒加载。
- 逐项拆解：
  - A：IntersectionObserver应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：利用阻塞式的 alert 提示框拦截每一次视口变更不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：频繁触发 document.write 写入以强行插入埋点 DOM不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：通过在 JavaScript 主线程中执行同步 while 耗时循环进行阻塞监听不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q65 [single]
在腾讯中高级前端场景题面试中，Event Loop 场景里，设置 loading 后立刻执行同步大循环，用户看不到 loading 的主要原因是什么？
A. 动态插入的 Loading 组件提示字符长度未达标
B. 当前任务和微任务未结束前，浏览器没有机会渲染
C. 当前浏览器环境未正确支持 CSS 文本渲染规范
D. 运行时环境中未引入支持异步操作的 Promise 全局对象
答案：B
解析：
- 结论：本题选择 B。同步长任务会阻塞主线程，浏览器无法及时绘制 loading。
- 逐项拆解：
  - A：动态插入的 Loading 组件提示字符长度未达标不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：当前任务和微任务未结束前，浏览器没有机会渲染应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：当前浏览器环境未正确支持 CSS 文本渲染规范不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - D：运行时环境中未引入支持异步操作的 Promise 全局对象不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q66 [single]
在腾讯中高级前端场景题面试中，Vue 和 React 技术选型时，最不专业的回答方式是什么？
A. 分析团队经验和存量资产
B. 分析业务复杂度、生态和招聘
C. 仅凭开发人员的主观编码喜好与个人情感偏向进行框架选择
D. 分析迁移成本和长期维护
答案：C
解析：
- 结论：本题选择 C。中高级选型要围绕业务和团队约束，而不是个人偏好。
- 逐项拆解：
  - A：分析团队经验和存量资产不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - B：分析业务复杂度、生态和招聘不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
  - C：仅凭开发人员的主观编码喜好与个人情感偏向进行框架选择应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：分析迁移成本和长期维护不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q67 [multiple]
在腾讯中高级前端场景题面试中，腾讯公开面经口径中，前端中高级常被追问哪些方向？
A. 跨域、安全和登录态
B. 文件断点续传
C. 老项目线上排障
D. 只问按钮颜色
答案：ABC
解析：
- 结论：本题选择 ABC。腾讯口径更容易把网络、安全、文件、项目排障和计算机基础结合起来问。
- 逐项拆解：
  - A：跨域、安全和登录态应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：文件断点续传应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：老项目线上排障应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：只问按钮颜色不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q68 [multiple]
在腾讯中高级前端场景题面试中，阿里 / 蚂蚁口径中，移动端工程常见追问包括哪些？
A. 首页白屏
B. 离线包
C. JSBridge
D. 移动端缓存和弱网体验
答案：ABCD
解析：
- 结论：本题选择 ABCD。阿里系场景常把移动端体验、工程链路和容器能力结合考察。
- 逐项拆解：
  - A：首页白屏应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：离线包应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：JSBridge应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：移动端缓存和弱网体验应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q69 [multiple]
在腾讯中高级前端场景题面试中，字节 / 抖音口径中，哪些方向更常见？
A. Event Loop 和手写题
B. 性能优化和内存泄漏
C. 扫码登录、实时通信等开放场景
D. 完全不问项目
答案：ABC
解析：
- 结论：本题选择 ABC。字节常同时考基础强度、项目复杂度和开放题表达。
- 逐项拆解：
  - A：Event Loop 和手写题应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：性能优化和内存泄漏应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：扫码登录、实时通信等开放场景应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：完全不问项目不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q70 [multiple]
在腾讯中高级前端场景题面试中，老项目紧急上线前，合理的风险控制动作包括哪些？
A. 只修阻塞核心流程的问题
B. 明确回滚方案
C. 增加关键路径冒烟测试
D. 顺手重构所有历史代码
答案：ABC
解析：
- 结论：本题选择 ABC。紧急上线要收敛变更范围，重构会扩大风险。
- 逐项拆解：
  - A：只修阻塞核心流程的问题应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：明确回滚方案应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：增加关键路径冒烟测试应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：顺手重构所有历史代码不选。它过于片面，不能覆盖真实业务里的范围确认、风险控制、异常处理和长期维护。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q71 [multiple]
在腾讯中高级前端场景题面试中，移动端 H5 白屏定位应该关注哪些阶段？
A. DNS/TLS/TTFB
B. HTML 和关键 CSS
C. 首屏 JS 下载执行
D. 首屏接口和渲染
答案：ABCD
解析：
- 结论：本题选择 ABCD。白屏可能发生在网络、资源、脚本执行和数据渲染任一阶段。
- 逐项拆解：
  - A：DNS/TLS/TTFB应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：HTML 和关键 CSS应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：首屏 JS 下载执行应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：首屏接口和渲染应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q72 [multiple]
在腾讯中高级前端场景题面试中，扫码登录需要处理哪些状态？
A. 待扫码
B. 已扫码待确认
C. 已确认登录
D. 已过期或已取消
答案：ABCD
解析：
- 结论：本题选择 ABCD。扫码登录是状态机问题，浏览器端要能展示完整状态并处理过期。
- 逐项拆解：
  - A：待扫码应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：已扫码待确认应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：已确认登录应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：已过期或已取消应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q73 [multiple]
在腾讯中高级前端场景题面试中，信息流页面要兼顾性能和数据一致性，应该考虑哪些点？
A. cursor 分页和去重
B. 图片懒加载和占位尺寸
C. 曝光埋点批量上报
D. 滚动位置保持
答案：ABCD
解析：
- 结论：本题选择 ABCD。信息流是综合场景，分页、图片、埋点、滚动和弱网都要设计。
- 逐项拆解：
  - A：cursor 分页和去重应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - B：图片懒加载和占位尺寸应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - C：曝光埋点批量上报应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
  - D：滚动位置保持应选。它命中了中高级前端场景题的核心判断：边界、取舍、异常和验证闭环。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q74 [judgment]
在腾讯中高级前端场景题面试中，公开面经可以当成官方题库逐字背诵。
答案：错
解析：
- 结论：本题判断为“错”。公开面经是候选人回忆，只适合归纳考察方向，不能当成官方题库。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q75 [judgment]
在腾讯中高级前端场景题面试中，大厂场景题的核心不是题目本身，而是能否把问题拆成范围、证据、排查、取舍和验证。
答案：对
解析：
- 结论：本题判断为“对”。中高级面试考的是工程判断和真实问题解决能力。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。

### Q76 [judgment]
在腾讯中高级前端场景题面试中，技术选型时，已有项目的迁移成本和团队熟练度通常比“某框架更流行”更重要。
答案：对
解析：
- 结论：本题判断为“对”。选型必须服务业务和团队约束，流行度只能作为参考。
- 判断标准：开放题没有唯一标准答案，但必须体现工程边界、取舍理由和可验证闭环。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：场景题回答要先定边界，再说数据模型、流程、异常、性能、安全、发布和监控。
