---
title: Vue 3 effect 触发次数、RenderEffect 调度器与合并执行
module: vue
difficulty: 进阶
tags: [vue, effect, scheduler, reactivity, microtask, queueJob]
sourceType: blog
sourceTitle: Vue 3 effect 触发次数、RenderEffect 调度器与合并执行
sourceUrl: 
sourceAuthor: 
originalPath: 学习系统/日常工作学习过程中的看过的文档/vue3这个 effect 执行了多少次.md
order: 4
created: 2026-05-18
updated: 2026-05-18
---

# Vue 3：effect 触发次数、RenderEffect 调度器与合并执行

## 题目

```ts
const state = reactive({ a: 1, b: 2, c: 3 })

effect(() => {
  console.log(state.a + state.b + state.c)
})

// 问题 1：以下操作触发几次 effect？
state.a = 10
state.b = 20
state.c = 30

继续追问：
 1. RenderEffect 里面会有 scheduler 吗
 2. 如果想把上面的代码变成“合并为一次执行”，应该怎么写

⸻

结论速记

问题 1

这 3 次赋值会触发 3 次 effect。

如果把初始化时 effect() 的首次立即执行也算进去，那么总共执行 4 次。

执行过程：
 • 初始化：6
 • state.a = 10 -> 15
 • state.b = 20 -> 33
 • state.c = 30 -> 60

问题 2

RenderEffect 有 scheduler。

组件更新之所以常常表现为“合并执行”，核心不是“所有 effect 天生会合并”，而是：
 • 组件内部的 ReactiveEffect 挂了 scheduler
 • scheduler 会把更新任务放进队列
 • 队列会去重
 • 同一轮同步修改，最后通常只执行一次

问题 3

想让手写的裸 effect 合并执行，需要：
 • 手动传 scheduler
 • 自己做一个任务队列
 • 用微任务统一 flush
 • 队列里对同一个 job 去重

⸻

先把最容易混淆的点说清楚

很多人会混淆这两件事：

1. 裸 effect

effect(() => {
  console.log(state.a)
})

这是响应式层的副作用。

特点：
 • 默认同步执行
 • 依赖一变就重新跑
 • 默认没有组件那套调度队列

2. 组件 RenderEffect

这是运行时里的渲染副作用。

特点：
 • 本质上也是 ReactiveEffect
 • 但内部会挂 scheduler
 • 不是每次变更都立刻重新 render
 • 而是先进队列、去重、再统一执行

⸻

为什么上面的代码会触发 3 次

因为它是裸 effect，不是组件渲染 effect。

state.a = 10
state.b = 20
state.c = 30

这是 3 次独立的 set。

对于默认的裸 effect 来说，每次依赖变了都会重新执行，所以会触发 3 次，而不是 1 次。

⸻

运行过程

const state = reactive({ a: 1, b: 2, c: 3 })

effect(() => {
  console.log(state.a + state.b + state.c)
})

初始化会先执行一次：

6

然后：

state.a = 10 // 15
state.b = 20 // 33
state.c = 30 // 60

所以结论是：
 • 不算初始化：3 次
 • 算初始化：4 次

⸻

RenderEffect 为什么能合并

可以把组件更新流程粗暴记成：

依赖变化
-> 触发 scheduler
-> scheduler 把 job 放进队列
-> 队列去重
-> 本轮同步任务结束后统一执行

也就是它不是直接：

依赖变化 -> 立刻 render

而是：

依赖变化 -> 先排队 -> 最后统一执行


⸻

可以怎么理解组件内部结构

面试时不用背源码细节，但可以记住这个抽象：

const effect = new ReactiveEffect(componentUpdateFn)
const update = effect.run.bind(effect)
const job = effect.runIfDirty.bind(effect)

effect.scheduler = () => queueJob(job)

可以这样理解：
 • effect：真正的响应式副作用对象
 • update：直接执行更新
 • job：真正交给调度器排队的任务
 • scheduler：不直接 run，而是把 job 放进队列

⸻

如果想把裸 effect 改成合并执行，怎么写

核心思路：

不要依赖一变就直接执行，而是把执行动作塞进微任务队列，并对同一个任务去重。

示例

import { reactive, effect } from 'vue'

const state = reactive({ a: 1, b: 2, c: 3 })

const jobQueue = new Set<() => void>()
let isFlushing = false
const resolvedPromise = Promise.resolve()

function queueJob(job: () => void) {
  jobQueue.add(job)

  if (!isFlushing) {
    isFlushing = true
    resolvedPromise.then(() => {
      try {
        jobQueue.forEach(job => job())
      } finally {
        jobQueue.clear()
        isFlushing = false
      }
    })
  }
}

let runner!: () => void

runner = effect(
  () => {
    console.log(state.a + state.b + state.c)
  },
  {
    scheduler: () => {
      queueJob(runner)
    }
  }
)

state.a = 10
state.b = 20
state.c = 30


⸻

这段代码的结果

初始化先执行一次：

6

后面 3 次修改虽然都触发了 scheduler，但入队的是同一个 runner，而且队列是 Set，所以会去重。

最终只会额外执行一次：

60

也就是：
 • 初始化：1 次
 • 后续连续赋值：合并后 1 次

⸻

一句话理解这段改造

默认裸 effect 是：

依赖变了 -> 直接执行

传入 scheduler 后变成：

依赖变了
-> 不直接执行
-> 先交给 scheduler
-> scheduler 放进队列
-> 队列去重
-> 微任务里统一执行


⸻

一句话表达：

手写的裸 effect 默认没有调度器，所以连续三次赋值会触发三次。组件的 RenderEffect 不一样，它内部会挂 scheduler，更新不会立刻执行，而是进入调度队列并去重，所以通常表现为批量合并执行

---

## 作业

1. 分别运行裸 `effect` 和组件渲染更新案例，记录同步修改三次数据时的执行次数。
2. 实现一个微任务队列，用 Set 对 job 去重，让裸 effect 支持合并执行。
3. 解释组件 `RenderEffect` 的 scheduler 和普通响应式 effect 的默认行为差异。
4. 写出 `nextTick`、微任务 flush、组件更新队列三者之间的时序关系。

## 📝 面试题自测

### Q1 [single]
以下代码，`state.a = 10; state.b = 20; state.c = 30` 三次赋值会触发几次 effect（不含初始化）？
A. 1 次（合并执行）
B. 2 次
C. 3 次
D. 0 次（Vue 自动批处理）
答案：C
解析：裸 effect（没有传 scheduler）每次依赖变化都会同步直接执行，3 次赋值触发 3 次，不存在自动合并。

### Q2 [single]
包含初始化执行，以上代码总共输出几次？
A. 3
B. 4
C. 6
D. 1
答案：B
解析：effect 注册时立即执行一次（输出 6），随后 3 次赋值各触发一次（15、33、60），共 4 次。

### Q3 [judgment]
Vue3 组件的 RenderEffect 和裸 effect 一样，依赖变化时都会立即同步执行更新。
答案：错
解析：组件 RenderEffect 的 ReactiveEffect 上挂了 scheduler，依赖变化时调用 scheduler → queueJob → 进入微任务队列去重执行，不是立即同步运行。

### Q4 [multiple]
关于 Vue3 组件更新合并的核心机制，以下哪些说法正确？
A. 组件 RenderEffect 有 scheduler，不直接执行而是把 job 放进队列
B. 队列使用 Set 或去重机制，同一个 job 多次入队只执行一次
C. 队列通过 Promise.then（微任务）统一 flush
D. 所有 effect 包括裸 effect 天生都会合并执行
答案：ABC
解析：D 错误，合并执行是 RenderEffect 的 scheduler 机制赋予的，裸 effect 默认无 scheduler，不会自动合并。

### Q5 [single]
想让裸 effect 实现合并执行，核心需要传入什么参数？
A. lazy: true
B. scheduler 函数，配合任务队列和微任务 flush
C. deep: true
D. flush: 'post'
答案：B
解析：为 effect 传入 scheduler 后，依赖变化时不再直接执行，而是调用 scheduler，由你自己决定何时执行。配合 Set 队列去重 + Promise.resolve().then flush，即可实现合并。

### Q6 [single]
在 queueJob 的手写实现中，队列使用 `Set` 而不是 `Array` 的原因是？
A. Set 的 forEach 更快
B. Set 自动对相同引用的 job 去重，确保同一轮同步中同一个 job 只执行一次
C. Array 不能存放函数
D. Set 支持异步迭代
答案：B
解析：使用 Set 的关键在于去重语义：同一个 runner 函数引用多次 add 只会存在一份，天然实现了 job 去重。

### Q7 [judgment]
`Promise.resolve().then(flush)` 实现的是宏任务（macro task）批处理。
答案：错
解析：Promise.then 是微任务（microtask），在当前同步代码全部执行完毕后、浏览器渲染前立即执行，不是宏任务（setTimeout/setInterval）。

### Q8 [multiple]
以下关于 Vue3 组件内部 effect 结构的描述，哪些正确？
A. `instance.effect` 是一个 ReactiveEffect 实例
B. effect.scheduler 被赋值为 `() => queueJob(job)`，而非直接执行更新
C. job 是 `effect.runIfDirty` 的绑定函数，只在 dirty 时才真正执行
D. 每次数据变化组件都会立即同步重新 render
答案：ABC
解析：D 错误。组件有 scheduler，数据变化时触发 scheduler 入队，在微任务中统一执行，不是同步立即 render。

### Q9 [single]
手写调度器实现中，`isFlushing` 标志位的作用是？
A. 标记当前是否处于 effect 收集依赖阶段
B. 防止在 flush 期间重复创建多个 Promise.then 回调，保证只有一个微任务在等待执行
C. 标记 effect 是否已被销毁
D. 控制 effect 的执行优先级
答案：B
解析：当第一个 job 入队时将 isFlushing 设为 true，并创建一个 Promise.then 等待执行。后续同轮的 job 入队时发现 isFlushing 已为 true，不再重复创建新的微任务，避免 flush 函数被调用多次。

### Q10 [judgment]
裸 effect 在传入 scheduler 后，初始化时依然会执行一次（同步）。
答案：对
解析：scheduler 只影响"依赖变化后的重新执行"时机，不影响 effect 注册时的首次执行。首次执行始终是同步的，用于完成依赖收集。

### Q11 [single]
在手写的 queueJob + flush 方案中，连续赋值 state.a = 10; state.b = 20; state.c = 30 后，最终额外输出几次？
A. 3 次（15、33、60）
B. 2 次
C. 1 次（60）
D. 0 次（全部合并取消）
答案：C
解析：3 次赋值都调用了 scheduler → queueJob，但 runner 同一个引用在 Set 里只存一份，最终 flush 时只执行一次，输出最终值 60。

### Q12 [multiple]
关于 RenderEffect 和裸 effect 的区别，以下哪些是正确的？
A. 裸 effect 同步执行，适合调试和追踪精确的响应时机
B. RenderEffect 通过 scheduler 延迟执行，适合合并多次数据变更后统一更新视图
C. 两者底层都使用 ReactiveEffect，本质上是同一套响应式机制
D. RenderEffect 比裸 effect 更早收到依赖变化通知
答案：ABC
解析：D 错误，两者的 track/trigger 机制相同，收到通知时机一样，只是 RenderEffect 通过 scheduler 推迟了执行时机。
