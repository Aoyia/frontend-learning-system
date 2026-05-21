---
title: JS 与 Web API 精确表达专项
module: scenarios
difficulty: 困难
tags: [javascript, web-api, promise, event-loop, interview, precise-expression]
sourceType: original
sourceTitle: 基于面试复盘、常见程序员博客面经与 MDN 官方资料扩展的 JS / Web API 精确表达专项
sourceUrl:
sourceAuthor:
originalPath:
order: 3
created: 2026-05-20
updated: 2026-05-20
---

# JS 与 Web API 精确表达专项

这篇解决一个非常具体的问题：**面试时不是不知道，而是表达不够精确**。

前端中高级面试里，JS 基础题通常不是为了考背诵，而是在验证你做复杂项目时是否真的能把边界讲清楚。尤其是对象属性判断、类型判断、Promise 失败收敛、事件循环和 Web API，一旦答得含糊，面试官会怀疑你的项目深度。

## 0. 题目来源口径

这批题目的“题型方向”参考了常见程序员博客和面经站点，例如掘金、CSDN、博客园、面试官系列、牛客公开面经中反复出现的 JS / ES6 / 事件循环 / Promise / Web API 高频问题。

但最终技术结论不以博客为准，而是用 MDN、ECMAScript 语义和浏览器官方资料校准。原因是博客适合发现“面试常问什么”，官方资料适合确认“到底怎么说才准确”。

| 来源类型 | 用途 | 使用方式 |
| --- | --- | --- |
| 掘金 / CSDN / 博客园 / 面试官系列 | 归纳高频题型、常见追问、候选人容易答错的点 | 作为题目方向来源 |
| 牛客公开面经 | 归纳公司和岗位口径 | 作为面试场景来源 |
| MDN / 官方文档 | 校准 API 语义、兼容性和边界 | 作为最终结论依据 |

## 1. 它解决什么问题？

它解决的是“知道大概，但追问时不稳”的问题。

典型错误：

- 把 `in` 和 `Object.hasOwn()` 混成一类。
- 说 `Object.prototype.toString.call()` 永远可靠，却忘了 `Symbol.toStringTag`。
- 只知道 `Promise.all`，不会说明批量任务如何收集局部失败。
- 只会背“微任务先于宏任务”，但解释不了 loading 为什么不显示。
- 知道 `requestIdleCallback`，但不知道它不适合关键任务，也不是所有主流环境都稳定可用。

## 2. 对象属性判断

面试版回答：

> 判断 key 是否存在，先区分是否要查原型链。`key in obj` 会查对象自身和原型链；`Object.hasOwn(obj, key)` 只查自身属性；兼容老环境可以用 `Object.prototype.hasOwnProperty.call(obj, key)`。如果要完整拿到字符串 key 和 Symbol key，可以用 `Reflect.ownKeys(obj)`。

### 最小案例

```js
const proto = { inherited: 1 }
const obj = Object.create(proto)
obj.own = 2

'inherited' in obj // true
Object.hasOwn(obj, 'inherited') // false
Object.hasOwn(obj, 'own') // true
```

### 常见追问

| 追问 | 稳定回答 |
| --- | --- |
| 为什么不用 `obj.hasOwnProperty(key)`？ | 对象可能没有这个方法，或者该方法被覆盖。更稳的是 `Object.hasOwn(obj, key)` 或 `hasOwnProperty.call`。 |
| Symbol key 怎么处理？ | `Object.keys` 拿不到 Symbol key，完整自有 key 用 `Reflect.ownKeys`。 |
| `in` 有没有价值？ | 有。如果业务语义就是“对象或原型链上能访问到”，`in` 是正确选择。 |

## 3. 类型判断

面试版回答：

> 类型判断要按场景选工具。基础类型用 `typeof`，数组用 `Array.isArray`，类实例用 `instanceof`，内置对象常用 `Object.prototype.toString.call`。但 `toString` 标签会受 `Symbol.toStringTag` 影响，所以公共类型工具要说明可信边界。

### 最小案例

```js
typeof null // 'object'
Array.isArray([]) // true

Object.prototype.toString.call(new Date()) // '[object Date]'

const fake = {
  [Symbol.toStringTag]: 'Date'
}
Object.prototype.toString.call(fake) // '[object Date]'
```

### 常见追问

- `typeof null` 为什么是 `object`？这是 JS 早期历史遗留。
- `instanceof` 的边界是什么？它依赖原型链，跨 realm 或 iframe 场景可能不符合预期。
- `Array.isArray` 为什么比 `instanceof Array` 更稳？它能更可靠判断真正的 Array。

## 4. Promise 失败收敛

面试版回答：

> `Promise.all` 是 fail-fast，只要一个 reject，整体就 reject；`Promise.allSettled` 会等待全部任务完成，并返回每个任务的 fulfilled/rejected 状态。批量文件移动这类场景，如果要“单个失败不影响整批状态收集”，可以让每个任务内部 catch，统一 resolve 成 `{ status, value, reason }` 结构，再用 `Promise.all` 汇总。

### 最小案例

```js
function wrapTask(task) {
  return Promise.resolve()
    .then(task)
    .then(value => ({ status: 'fulfilled', value }))
    .catch(reason => ({ status: 'rejected', reason }))
}

async function runBatch(tasks) {
  const results = await Promise.all(tasks.map(wrapTask))
  const failed = results.filter(item => item.status === 'rejected')
  return { results, failed }
}
```

### 适用场景

| API / 方案 | 适合场景 |
| --- | --- |
| `Promise.all` | 任何一个失败就整体失败，例如多个强依赖接口 |
| `Promise.allSettled` | 必须收集所有任务结果，例如批量上传、批量移动 |
| 单任务内部 catch | 想继续用 `Promise.all`，但不让单个 reject 打断整批 |
| 限制并发 | 大量任务避免压垮浏览器连接、后端或主线程 |

## 5. 事件循环和渲染时机

面试版回答：

> 浏览器先执行当前同步任务，然后清空微任务队列，再进入渲染机会，之后再取下一个宏任务。`Promise.then` 是微任务，`setTimeout` 是宏任务。UI 更新不是状态一变就立刻绘制，必须等当前 JS 执行权释放，浏览器才有机会渲染。

### loading 不显示的典型原因

```js
setLoading(true)

// 同步长任务阻塞主线程，浏览器没机会绘制 loading
for (let i = 0; i < 1e9; i++) {}
```

稳定答法：

> loading 状态被设置了，但当前同步任务没有结束，浏览器没有机会绘制。要么先让出主线程，要么把重任务拆片，要么放到 Worker。

## 6. `requestAnimationFrame` / `requestIdleCallback`

面试版回答：

> `requestAnimationFrame` 适合在下一次重绘前执行动画相关 DOM 更新；`requestIdleCallback` 适合低优先级后台任务，让浏览器空闲时执行，但不适合关键交互，而且兼容性和调度时机要说明边界，必要任务要设置 timeout 或降级。

| API | 适合 | 不适合 |
| --- | --- | --- |
| `requestAnimationFrame` | 动画、读写布局协调、下一帧更新 | 大量后台数据处理 |
| `requestIdleCallback` | 低优先级预计算、非关键上报、缓存清理 | 关键交互、必须立刻完成的任务 |
| `setTimeout` 分片 | 简单任务切片和兼容兜底 | 精确帧同步 |
| Web Worker | CPU 重计算 | 直接操作 DOM |

## 7. IntersectionObserver

面试版回答：

> IntersectionObserver 用来异步观察目标元素和视口或指定容器的交叉变化，适合图片懒加载、曝光埋点、无限滚动触发。它不是所有滚动逻辑的替代品，如果需要逐像素动画或精确滚动位置，仍要结合 scroll 事件或其他方案。

### 最小案例

```js
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      reportExposure(entry.target.dataset.id)
      observer.unobserve(entry.target)
    }
  }
})

document.querySelectorAll('[data-id]').forEach(el => observer.observe(el))
```

## 8. AbortController 与请求竞态

面试版回答：

> 搜索框旧请求覆盖新请求，本质是竞态。能取消就用 AbortController 取消旧请求；不能取消时，用请求序号或时间戳，只接收最后一次结果。React/Vue 组件卸载时也要避免异步回调继续写状态。

```js
let controller

async function search(keyword) {
  controller?.abort()
  controller = new AbortController()

  const res = await fetch(`/api/search?q=${keyword}`, {
    signal: controller.signal,
  })
  return res.json()
}
```

## 9. Web Worker

面试版回答：

> Web Worker 适合把 CPU 重计算放到后台线程，避免阻塞 UI 主线程。它不能直接操作 DOM，和主线程通过消息通信。面试中要说明数据传输成本、结构化克隆、Transferable 对象和任务粒度。

适合：

- 大文件 hash。
- 图片压缩。
- 大数组计算。
- 规则表达式批量计算。

不适合：

- 直接改 DOM。
- 小到通信成本比计算还大的任务。
- 强依赖主线程状态的 UI 逻辑。

## 10. 推荐阅读

- [MDN：Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
- [MDN：Object.prototype.toString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)
- [MDN：Symbol.toStringTag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag)
- [MDN：Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN：AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN：requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN：requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
- [MDN：Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN：Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## 11. 作业

1. 手写一个 `hasOwn` 工具函数，并解释为什么不用 `obj.hasOwnProperty(key)`。
2. 手写一个 `getType` 工具函数，并写出 `Symbol.toStringTag` 伪造案例。
3. 用 `Promise.allSettled` 和“单任务内部 catch + Promise.all”分别实现批量任务结果收集。
4. 写一个并发控制函数，要求支持局部失败收集。
5. 写一段代码复现“loading 不显示”，再用任务切片修复。
6. 写一个 IntersectionObserver 曝光埋点 Demo，要求只上报一次。
7. 写一个搜索框请求竞态 Demo，分别用 AbortController 和请求序号解决。
8. 写一个 Worker 计算大文件 hash 的伪代码，说明主线程和 Worker 的消息协议。
9. 把本篇所有面试版回答录音 3 遍，要求每题 30 秒内讲完。
10. 从错题本里挑 10 道 JS/Web API 题，按“概念不准、API 不熟、边界遗漏、表达不稳”标错因。

## 📝 面试题自测

### Q1 [single]
判断对象是否拥有某个“自身属性”，优先推荐哪个 API？
A. `key in obj`
B. `Object.hasOwn(obj, key)`
C. `obj[key] !== undefined`
D. `for...in`
答案：B
解析：`Object.hasOwn` 只判断自身属性，不查原型链，也不依赖对象自身是否有 `hasOwnProperty` 方法。

### Q2 [single]
`key in obj` 的语义是什么？
A. 只判断自身属性
B. 判断自身属性和原型链属性
C. 只判断 Symbol 属性
D. 只能用于数组
答案：B
解析：`in` 会沿原型链查找属性。

### Q3 [single]
如果要拿到对象所有自有 key，包括字符串 key 和 Symbol key，哪个更合适？
A. `Object.keys`
B. `for...in`
C. `Reflect.ownKeys`
D. `JSON.stringify`
答案：C
解析：`Reflect.ownKeys` 会返回自有字符串 key 和 Symbol key。

### Q4 [single]
`Object.prototype.toString.call(obj)` 的一个重要边界是什么？
A. 不能被任何方式影响
B. 会受 `Symbol.toStringTag` 影响
C. 只能判断数字
D. 只能判断数组
答案：B
解析：对象可以通过 `Symbol.toStringTag` 自定义 toString 标签。

### Q5 [single]
判断数组时，通常最稳的 API 是什么？
A. `typeof arr === 'array'`
B. `Array.isArray(arr)`
C. `arr instanceof Object`
D. `Object.keys(arr)`
答案：B
解析：`Array.isArray` 是专门判断 Array 的标准 API。

### Q6 [single]
`Promise.all` 的失败语义是什么？
A. 等所有任务结束才返回所有状态
B. 任意一个 reject 后整体 reject
C. 永远 fulfill
D. 只执行第一个 Promise
答案：B
解析：`Promise.all` 是 fail-fast。

### Q7 [single]
批量文件移动时，想收集所有文件成功/失败状态，最适合哪个 API？
A. `Promise.allSettled`
B. `Promise.race`
C. `Promise.any`
D. `setInterval`
答案：A
解析：`allSettled` 会等待全部任务完成并返回每个任务状态。

### Q8 [single]
在“单任务内部 catch + Promise.all”方案中，每个任务为什么要返回统一结构？
A. 为了让单个失败不打断整批，并便于汇总成功和失败
B. 为了隐藏所有错误
C. 为了让任务同步执行
D. 为了避免使用数组
答案：A
解析：统一结果结构能让整批 resolve，同时保留失败原因。

### Q9 [single]
浏览器中 `Promise.then` 回调属于什么任务？
A. 同步任务
B. 微任务
C. 宏任务
D. 渲染任务
答案：B
解析：Promise reaction jobs 属于微任务队列。

### Q10 [single]
设置 loading 后立刻执行同步大循环，用户看不到 loading 的主要原因是什么？
A. CSS 不支持 loading
B. 当前 JS 长任务阻塞主线程，浏览器没有渲染机会
C. Promise 不能更新状态
D. 浏览器不能绘制文字
答案：B
解析：浏览器要等当前任务和微任务处理后才有机会渲染。

### Q11 [single]
`requestAnimationFrame` 更适合哪类任务？
A. 动画相关的下一帧 DOM 更新
B. 大文件 hash 计算
C. 永久保存数据
D. 发起所有网络请求
答案：A
解析：rAF 会在下一次重绘前调用回调，适合动画和帧同步。

### Q12 [single]
`requestIdleCallback` 最适合哪类任务？
A. 关键支付点击
B. 低优先级后台任务
C. 必须立即完成的校验
D. 同步 DOM 测量
答案：B
解析：idle callback 适合空闲期低优先级任务，不适合关键交互。

### Q13 [single]
IntersectionObserver 最适合什么场景？
A. 曝光埋点、图片懒加载、无限滚动触发
B. 修改请求头
C. 直接操作数据库
D. 精确替代所有滚动动画
答案：A
解析：它用于观察元素与视口或容器的交叉变化。

### Q14 [single]
搜索框旧请求覆盖新请求，本质是什么问题？
A. 请求竞态
B. CSS 优先级
C. 字体加载
D. 路由命名
答案：A
解析：旧请求后返回覆盖新状态是典型竞态。

### Q15 [single]
AbortController 的主要作用是什么？
A. 中止支持 abort signal 的异步操作，例如 fetch
B. 修改 CSS
C. 判断数组
D. 创建 Web Worker
答案：A
解析：AbortController 可通过 signal 中止 fetch 等支持取消的操作。

### Q16 [single]
Web Worker 最适合优化哪类问题？
A. CPU 重计算阻塞 UI 主线程
B. 按钮颜色错误
C. 路由路径太长
D. 文案不清楚
答案：A
解析：Worker 可以把计算放到后台线程。

### Q17 [single]
Web Worker 的重要限制是什么？
A. 不能直接操作 DOM
B. 不能执行 JavaScript
C. 只能处理 CSS
D. 只能在 Node.js 中运行
答案：A
解析：Worker 与主线程隔离，不能直接访问 DOM。

### Q18 [single]
面试中回答 JS 基础题最应该避免什么？
A. 先区分语义和边界
B. 把多个 API 混在一起说成差不多
C. 给出最小例子
D. 说明适用场景
答案：B
解析：基础题考的正是边界精确性。

### Q19 [multiple]
哪些方式可以判断对象自身属性？
A. `Object.hasOwn(obj, key)`
B. `Object.prototype.hasOwnProperty.call(obj, key)`
C. `key in obj`
D. `Reflect.ownKeys(obj).includes(key)`
答案：ABD
解析：`in` 会包含原型链属性，不是只判断自身属性。

### Q20 [multiple]
类型判断时，哪些说法正确？
A. `typeof null` 是 `'object'`
B. `Array.isArray` 适合判断数组
C. `instanceof` 依赖原型链
D. `Object.prototype.toString.call` 完全不会被影响
答案：ABC
解析：toString 标签会受 `Symbol.toStringTag` 影响。

### Q21 [multiple]
Promise 批量任务失败收敛可以使用哪些方案？
A. `Promise.allSettled`
B. 单任务内部 catch 成统一结果
C. 失败后直接丢弃所有任务状态
D. 限制并发并收集每个任务结果
答案：ABD
解析：C 会丢失局部状态，不适合批量处理。

### Q22 [multiple]
事件循环回答中，需要说明哪些点？
A. 同步任务
B. 微任务
C. 宏任务
D. 浏览器渲染机会
答案：ABCD
解析：只背微任务/宏任务不够，还要解释 UI 绘制时机。

### Q23 [multiple]
哪些操作可能造成主线程 Long Task？
A. 大数组同步计算
B. 大量 DOM 批量更新
C. JSON 大对象同步序列化
D. 把重计算移到 Worker
答案：ABC
解析：D 是缓解主线程阻塞的方式。

### Q24 [multiple]
`requestIdleCallback` 的边界包括哪些？
A. 适合低优先级任务
B. 不适合关键交互
C. 需要考虑兼容和 timeout
D. 能保证马上执行
答案：ABC
解析：idle callback 不能保证立即执行。

### Q25 [multiple]
IntersectionObserver 常见用途包括哪些？
A. 图片懒加载
B. 曝光埋点
C. 无限滚动触发
D. 精确控制每一像素滚动动画
答案：ABC
解析：逐像素动画不是它的主要用途。

### Q26 [multiple]
搜索请求竞态可以怎么处理？
A. AbortController 取消旧请求
B. 请求序号，只接收最后一次
C. query key 区分条件
D. 任意响应都直接覆盖状态
答案：ABC
解析：核心是防止过期响应覆盖最新状态。

### Q27 [multiple]
Web Worker 方案需要考虑哪些成本？
A. 主线程和 Worker 通信成本
B. 结构化克隆成本
C. Transferable 对象
D. 直接操作 DOM 的便利性
答案：ABC
解析：Worker 不能直接操作 DOM，通信和数据传输成本要评估。

### Q28 [multiple]
前端中高级面试里，JS/Web API 基础题考察什么？
A. API 语义是否精确
B. 边界条件是否清楚
C. 能否落到真实场景
D. 是否只会背名词
答案：ABC
解析：基础题会影响面试官对项目深度的信任。

### Q29 [judgment]
`Object.hasOwn(obj, key)` 会沿着原型链查找属性。
答案：错
解析：它只判断对象自身属性。

### Q30 [judgment]
`key in obj` 会判断对象自身和原型链上的属性。
答案：对
解析：这是 `in` 操作符的语义。

### Q31 [judgment]
`Object.prototype.toString.call()` 的结果可能受 `Symbol.toStringTag` 影响。
答案：对
解析：对象可通过 `Symbol.toStringTag` 自定义标签。

### Q32 [judgment]
`Promise.allSettled` 适合收集每个任务的成功和失败状态。
答案：对
解析：它会等待所有 Promise settled 后返回状态数组。

### Q33 [judgment]
微任务过多也可能延迟浏览器渲染。
答案：对
解析：浏览器通常要等微任务队列清空后才有渲染机会。

### Q34 [judgment]
`requestIdleCallback` 适合关键支付按钮的主流程。
答案：错
解析：它适合低优先级空闲任务，关键路径不应依赖它。

### Q35 [judgment]
IntersectionObserver 可以用于曝光埋点，但仍要考虑重复上报控制。
答案：对
解析：通常要上报后 unobserve 或用本地集合去重。

### Q36 [judgment]
AbortController 可以解决所有接口无法取消的问题。
答案：错
解析：它需要底层异步操作支持 signal；不能取消时要忽略过期响应。

### Q37 [judgment]
Web Worker 能直接访问并修改页面 DOM。
答案：错
解析：Worker 不能直接操作 DOM。

### Q38 [judgment]
JS 基础精确表达会影响面试官对复杂项目真实性的判断。
答案：对
解析：基础边界答不稳，会削弱项目深度可信度。
