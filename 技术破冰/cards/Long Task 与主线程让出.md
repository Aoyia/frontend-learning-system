---
title: Long Task 与主线程让出
category: 前端性能优化
tags:
  - frontend
  - performance
  - long-task
  - inp
  - scheduler
  - main-thread
difficulty: hard
status: draft
created: 2026-04-27
updated: 2026-04-27
---

# Long Task 与主线程让出

## 1. 它属于哪个知识板块？

```txt
前端工程化
→ 前端性能优化
→ 交互响应（INP）
→ Long Task / 主线程让出
```

==它**不是“把代码写得更短”**。Long Task 与主线程让出真正回答的是：**点击之后为什么没反应？**——以及把“一次干完”的同步逻辑改成“**分批让出主线程**”的工程手段。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**Long Task 与主线程让出**解决的是“**用户操作了，但页面要等很久才响应**”的问题。==

INP 差的根因几乎都是：用户点击或输入的瞬间，主线程正在跑一段不能被打断的同步任务（解析大 JSON、渲染大列表、复杂计算、第三方脚本初始化、框架同步更新一大片组件）。这段任务期间，浏览器既不能执行事件回调，也不能完成下一帧绘制。

==所以解法的核心**不是“让代码跑得更快”**，而是把**长任务切成多个短任务**，主动**让出主线程**，给浏览器机会处理 input、layout 和 paint。==

### 2.2 核心流程

```txt
打开 Performance 面板录制交互
→ 找到红色长任务（>50ms）
→ 看是 JS 执行 / 框架渲染 / 第三方脚本 哪一类
→ 拆分长任务：分批 / 让出 / 移到 worker
→ 优先在用户输入到来时让出
→ 验证 INP 是否下降
→ 持续监控线上 INP
```

### 2.3 关键词清单

1. long task：主线程上耗时超过 **50ms** 的任务，会阻塞输入响应和渲染。
2. INP：Interaction to Next Paint，从用户交互到下一次绘制的时间，建议小于 200ms。
3. main thread：主线程，承担 JS 执行、布局、绘制、事件处理。
4. yield to main：让出主线程，把后续工作放到下一轮事件循环再继续。
5. `scheduler.yield()`：现代浏览器提供的让出 API，调用后会让浏览器先处理输入、渲染等高优先级任务。
6. `scheduler.postTask(callback, { priority })`：原生任务调度 API，支持 user-blocking / user-visible / background 三档优先级。
7. `navigator.scheduling.isInputPending()`：用于判断是否有待处理的输入事件，属于实验性能力；现在更推荐优先考虑 `scheduler.yield()` / `scheduler.postTask()`。
8. `requestIdleCallback`：在浏览器空闲时执行回调，**不适合**响应用户交互，适合后台预处理。
9. `requestAnimationFrame`：与渲染对齐的回调，常用来批量执行 DOM 写入。
10. microtask vs macrotask：微任务紧贴当前任务执行，宏任务才会被浏览器插入渲染机会。Promise 链不会让出主线程。
11. Web Worker：把重计算移到独立线程，主线程只做调度和 UI。
12. concurrent rendering：React Concurrent / Vue 调度器在内部已经做了任务切片与让出，但**业务自己写的同步逻辑不会被自动切片**。
13. layout thrashing：同步读取布局属性后立刻写入，会强制浏览器多次布局，常被误认为长任务。

### 2.4 一句面试版

==解决 Long Task 的核心是把**一次干完**的同步逻辑改成**分批 + 让出主线程**：优先用 **`scheduler.yield()` / `scheduler.postTask()`** 把控制权还给浏览器，让 input、layout、paint 有机会插队；必要时再用实验性的 **`navigator.scheduling.isInputPending()`** 判断是否已有输入等待处理，从而把 **INP** 降到目标范围；重计算则进一步迁移到 **Web Worker**。==

### 2.5 最小 demo / 最小案例

#### yieldToMain：最简单可用的让出模式

```ts
async function yieldToMain(): Promise<void> {
  if ('scheduler' in window && 'yield' in (window as any).scheduler) {
    return (window as any).scheduler.yield()
  }
  return new Promise(resolve => setTimeout(resolve, 0))
}
```

把一段长任务拆成多片：

```ts
async function processInChunks<T>(items: T[], handle: (item: T) => void) {
  for (const item of items) {
    handle(item)

    const scheduling = (navigator as any).scheduling

    if (
      typeof scheduling?.isInputPending === 'function' &&
      scheduling.isInputPending()
    ) {
      await yieldToMain()
    }
  }
}
```

含义：

1. 默认连续执行，不做无谓让出，避免性能损耗。
2. 一旦检测到有未处理的输入事件，立刻让出主线程，浏览器先响应用户。
3. `navigator.scheduling.isInputPending()` 不是所有浏览器都稳定支持；没有它时，可以改为每 N 项强制让出一次，或者直接优先使用 `scheduler.yield()`。

#### 用 scheduler.postTask 给后台任务降优先级

```ts
declare const scheduler: {
  postTask: <T>(cb: () => T, opts?: { priority?: 'user-blocking' | 'user-visible' | 'background' }) => Promise<T>
}

scheduler.postTask(() => prefetchNextRoute(), { priority: 'background' })
```

`background` 优先级会主动让位给用户交互和渲染。

#### 把重计算搬到 Web Worker

```ts
const worker = new Worker(new URL('./parser.worker.ts', import.meta.url), { type: 'module' })

worker.postMessage(largePayload)
worker.onmessage = e => {
  applyResult(e.data)
}
```

主线程只负责把数据丢出去和接结果，不再阻塞用户。

### 2.6 几个常见误区

==**Promise 链 / `await` 本身不会让出主线程。**==

```ts
async function bad() {
  for (const item of bigList) {
    await heavy(item)
  }
}
```

如果 `heavy` 是同步代码，整段循环仍然在一个长任务里。微任务紧贴当前任务执行，浏览器不会插入渲染。

==**`requestIdleCallback` 不是 INP 的解药。**==

它是给“反正不急”的工作用的。响应用户交互应该用 `scheduler.yield()` 或 `scheduler.postTask({ priority: 'user-blocking' })`。

==**框架自带的并发调度不等于业务代码自动切片。**==

React Concurrent、Vue 调度器只能把它**自己产生的渲染工作**切片。业务里写的 `for` 循环、JSON 解析、`renderToString`、复杂表单计算仍然是同步的。

==**虚拟列表不能解决“一次性渲染全量数据”的问题。**==

虚拟列表减少 DOM 节点数，但如果在打开页面时同步处理几万条数据，主线程仍然会被阻塞。处理与渲染要分开拆。

### 2.7 排查 INP 差的固定动作

```txt
打开 Performance 面板录制一次差的交互
→ 找出主线程上最长的红色块
→ 看 Bottom-Up，按耗时函数定位代码
→ 区分是业务 JS / 框架渲染 / 第三方脚本 / 浏览器内部
→ 优先处理在交互瞬间执行的同步代码
→ 把重计算前移到 idle、后移到 background、或迁移到 worker
→ 在交互回调里第一时间响应（更新 UI 提示），把真正的工作 yield 出去
```

### 2.8 是否值得深入？

值得深入，特别是做大表格、低代码、可视化、表单引擎、富文本编辑器、长列表后台时。优先顺序：

1. 先掌握 INP、long task 的定义和阈值。
2. 再学会用 Performance 面板定位交互瓶颈。
3. 然后掌握 `scheduler.yield`、`scheduler.postTask`、`navigator.scheduling.isInputPending` 的使用场景和兼容边界。
4. 接着掌握 Web Worker 的边界（结构化克隆、Transferable、MessageChannel）。
5. 最后再深入框架并发调度与业务代码切片的协作。

优先看官方资料：Web Vitals INP、Chrome DevTools Performance、Scheduler API、Web Workers、`requestIdleCallback`。

## 3. 选择题自测

### Q1

下面哪一项最准确描述了 long task？

A. 任意 JS 函数
B. 主线程上耗时超过 50ms 的任务，会阻塞输入响应与渲染
C. 一次网络请求
D. CSS 文件加载

答案：B

解析：long task 的边界是主线程上单个任务超过 50ms。

### Q2

下面哪种写法**不会**真正让出主线程？

A. 在循环里 `await scheduler.yield()`
B. 在循环里 `await Promise.resolve()` 或 `await someResolvedPromise`
C. 把工作放到 `scheduler.postTask({ priority: 'background' })`
D. 把工作放到 Web Worker

答案：B

解析：微任务紧贴当前任务执行，浏览器不会插入渲染机会，等价于没让出。

### Q3

`requestIdleCallback` 最适合用来做什么？

A. 立刻响应用户点击
B. 在浏览器空闲时做不紧急的后台预处理，例如预取数据、统计上报
C. 做关键交互
D. 替代 setTimeout 0

答案：B

解析：idle callback 用于不紧急的工作，关键交互应使用更高优先级的调度方式。

### Q4

INP 差时，下面哪种做法更合适？

A. 在事件回调一开始就先做 UI 反馈，把重活拆批并配合 `navigator.scheduling.isInputPending()` / `scheduler.yield()` 让出
B. 整段同步执行所有工作直到完成
C. 把所有工作丢到 microtask
D. 让用户多点几下试试

答案：A

解析：先给用户反馈再切片让出，可以显著降低 INP。

### Q5

关于 Web Worker 与主线程的关系，下面哪种说法更准确？

A. Worker 可以直接访问 DOM
B. Worker 与主线程通过消息通信，可承接重计算，但要考虑序列化和数据传输成本
C. Worker 比主线程慢
D. 用了 Worker 就不需要再做 long task 治理

答案：B

解析：Worker 是独立线程，不能直接操作 DOM，但能把 CPU 密集任务从主线程剥离。
