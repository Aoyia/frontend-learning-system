---
title: Vue 3 Diff 算法面试表达题库
module: vue
difficulty: 困难
tags: [vue, diff, patchFlag, vnode, lis, block-tree, interview-expression]
sourceType: original
sourceTitle: Vue 3 Diff 算法面试表达题库
sourceUrl:
sourceAuthor: Antigravity
originalPath: 学习系统/docs/博客文档/Vue/Vue 3 Diff 算法面试表达题库.md
order: 3
created: 2026-06-13
updated: 2026-06-13
---

# Vue 3 Diff 算法面试表达题库

> 本文档专为**面试口头表达**设计，与《Vue 3 Diff 算法整体流程详解》互补。
> 那篇是学习理解用的；这篇是上阵开口用的。
>
> 每道题都配有：**预期表达结构**、**关键词锚点**、**常见追问链**。
> 背诵的不是答案，而是**思路框架**。

---

## 🎯 如何用这份题库

1. **先说结论**：每道题的第一句话就给出核心答案，不要绕弯。
2. **再讲原理**：用自己的语言解释"为什么"和"怎么做到的"。
3. **最后扩展**：主动补一个边界案例或追问，展示深度。
4. **关键词锚点**：面试时一定要说出括号里的技术词汇，这些词是面试官判断你是否真懂的信号。

---

## 面试题自测

## 一、破冰级（面试必答，不会直接减分）

### Q1 [expression]
Vue 3 的 Diff 算法相比 Vue 2 做了哪些优化？

> **适用场景**：面试开场「介绍一下 Vue 3 和 Vue 2 的区别」、「Vue 3 性能优化做了哪些」时必提。

**推荐表达结构**：

> 「Vue 3 的 Diff 优化可以从两个维度来说：**编译时**和**运行时**。
>
> **编译时**主要是三个东西：
> 1. **PatchFlag**——编译器给动态节点打上标记（比如 TEXT=1、CLASS=2），运行时更新时只比对标记对应的属性，跳过全量对比；
> 2. **静态提升**——把永远不变的节点提到 render 函数外面，组件重渲染时直接复用，不重新创建 VNode；
> 3. **事件缓存**——把内联事件函数缓存在 `_cache` 里，每次 render 传同一个函数引用，防止子组件无谓 re-render。
>
> **运行时**主要是 Block Tree 和快速 Diff。
> Block Tree 是在编译期把每个 block 内部的所有动态节点扁平收集到 `dynamicChildren` 数组里，更新时直接线性遍历这个数组，完全跳过中间的静态层级。
> 快速 Diff 就是在处理 v-for 列表的乱序区时，先做前置 + 后置扫描剥离稳定节点，然后用**最长递增子序列（LIS）**算法计算出不需要移动的最大节点集，只移动剩下的节点。」

**关键词锚点**：`PatchFlag`、`dynamicChildren`、`Block Tree`、`LIS 最长递增子序列`、`静态提升`

**高频追问**：
- → 什么是 Block Tree？（见 Q3）
- → LIS 具体是怎么减少 DOM 操作的？（见 Q6）
- → PatchFlag 是位运算吗？（见 Q2）

---

### Q2 [expression]
PatchFlag 是什么？它怎么工作？

> **适用场景**：「Vue 3 编译优化有了解吗」「PatchFlag 听说过吗」

**推荐表达结构**：

> 「PatchFlag 是 Vue 3 编译器在**编译阶段**为动态节点生成的整数标记，本质上是**位标志**（bit flags）。
>
> 比如 TEXT 是 1，CLASS 是 2，STYLE 是 4，PROPS 是 8。如果一个节点同时有动态 class 和动态 style，PatchFlag 就是 2 | 4 = 6。
>
> **运行时更新**的时候，Vue 看到节点有 PatchFlag，就用位运算 `patchFlag & PatchFlags.TEXT` 快速判断"只有文本需要更新"，然后直接调 `hostSetElementText`，跳过属性、子节点等全部无关对比。
>
> 所以 PatchFlag 的本质是把**编译器的静态分析结论**传递给运行时，让运行时不再"瞎猜"，做到精准 patch。」

**关键词锚点**：`位标志 / bit flags`、`位运算`、`编译器静态分析`、`精准 patch`

**追问引导**：
- **如果同时有多个动态属性怎么办**？用 `|` 位或合并，比如 CLASS | STYLE = 6，运行时分别检测每一位。
- **如果是 v-bind="object" 怎么处理**？编译期无法分析具体 key，降级为 `FULL_PROPS`，退化到全量属性 diff。

---

### Q3 [expression]
什么是 Block Tree？它解决了什么问题？

> **适用场景**：追问 Diff 原理时最常被深挖的点。

**推荐表达结构**：

> 「Block Tree 解决的核心问题是：**在传统树形 diff 里，即使只有一个动态节点，运行时也得从根节点一层一层递归下去才能找到它**，中间大量的静态 div 都被白白遍历了。
>
> Block Tree 的思路是：**编译期先把动态节点扁平收集起来**。具体是这样：当 render 函数执行时，`openBlock()` 会初始化一个收集数组 `currentBlock`，后续创建的每个带 PatchFlag 的 VNode 会自动把自己 push 进去。最后 `createElementBlock()` 把这个数组挂到块根 VNode 的 `dynamicChildren` 属性上。
>
> **更新时**，`patchElement` 函数一旦检测到节点有 `dynamicChildren`，就走 `patchBlockChildren`——直接线性遍历这个扁平数组，静态节点完全不会被访问，连进入 `patch` 函数的机会都没有。
>
> 所以 Vue 3 说"更新复杂度与模板大小无关，只与动态绑定数量相关"，根本原因就在这里。」

**关键词锚点**：`openBlock`、`currentBlock`、`dynamicChildren`、`patchBlockChildren`、`扁平收集`

**追问引导**：
- **v-if 和 v-for 为什么要单独开 Block**？因为它们会让节点结构本身发生变化（子节点数量/类型变了），父 Block 无法保证扁平数组的位置一一对应，所以必须隔离为独立的子 Block。
- **首次渲染时静态节点会被访问吗**？会，首次 mount 必须创建真实 DOM，但只访问一次，之后更新时再也不看它们了。

---

## 二、进阶级（展示理解深度）

### Q4 [expression]
Vue 3 的快速 Diff 算法（patchKeyedChildren）是什么流程？

> **适用场景**：「讲一下 v-for 列表的 diff 流程」「Vue 3 如何处理乱序列表」

**推荐表达结构**：

> 「Vue 3 对有 key 的子节点列表用的是 `patchKeyedChildren`，分五个阶段：
>
> **第一步：前置扫描**——从头往后，key 和 type 都相同就直接 patch，遇到第一个不匹配就停。
> **第二步：后置扫描**——从尾往前，同样逻辑，剥掉尾部的稳定节点。
>
> 这两步处理掉大多数日常场景（尾部追加、头部追加、中间插一个），剩下的才是真正乱序的中间区。
>
> **第三步：纯新增**——如果旧节点全处理完了，新节点还有剩余，就批量 mount。
> **第四步：纯删除**——如果新节点全处理完了，旧节点还有剩余，就批量 unmount。
>
> **第五步：乱序中间区**——最复杂的情况：
> 1. 为新的中间区建 `keyToNewIndexMap`（key → 新索引）；
> 2. 遍历旧中间区，通过 key 在 map 里找对应的新节点，找不到就 unmount，找到就 patch 并记录 `newIndexToOldIndexMap`；同时检测顺序，如果出现回退（索引不是单调递增）就标记 `moved = true`；
> 3. 如果 moved，用 LIS 算法算出最大稳定节点集，然后**从后往前**遍历，不在 LIS 中的节点就 move，在 LIS 中的跳过，值为 0 的就 mount 新节点。」

**关键词锚点**：`前置/后置扫描`、`keyToNewIndexMap`、`newIndexToOldIndexMap`、`moved`、`LIS`、`从后往前`

**追问引导**：
- **为什么是从后往前遍历**？因为右侧节点先处理完已经稳定了，可以作为安全的 `insertBefore` 锚点（anchor）。
- **没有 key 怎么处理**？退化为"就地复用"，按索引位置强行配对 patch，不会做任何移动操作，在列表有重排/插入时极易引发状态残留 bug。

---

### Q5 [expression]
为什么说"首次渲染时静态节点会被访问，但更新时不会"？

> **适用场景**：追问 Block Tree 细节时，体现你真正理解了设计取舍。

**推荐表达结构**：

> 「这是一个很重要的区分。
>
> **首次 mount 时**，Vue 走的是 `mountElement`，里面调用 `mountChildren` 遍历的是 VNode 的 `children` 数组（普通父子结构），不是 `dynamicChildren`。所有节点——包括静态节点——都必须被遍历一次，因为真实 DOM 得在这时候创建出来，不然页面什么都没有。
>
> **更新时**，Vue 走的是 `patchElement`，一旦检测到 `dynamicChildren` 存在，直接走 `patchBlockChildren`，线性遍历动态节点数组，静态节点压根进不了 `patch` 函数。
>
> 静态节点在 mount 完成后，它的 VNode 对象（被 hoist 出去的那个常量）就永远挂在那里，`el` 字段指向真实 DOM。以后不管组件重渲染多少次，这个 VNode 直接复用，完全不参与 diff。这是静态提升带来的"一次创建，永久复用"。」

**关键词锚点**：`mountChildren`（用 children）vs `patchBlockChildren`（用 dynamicChildren）、`静态提升 hoisting`、`el 字段`

---

### Q6 [expression]
LIS（最长递增子序列）在 Diff 里具体如何减少 DOM 操作？

> **适用场景**：「为什么 Vue 3 列表 diff 比 Vue 2 快」「LIS 算法在这里怎么用的」

**推荐表达结构**：

> 「核心思想是：**只移动"必须移动"的节点，不动能不动的**。
>
> 举个例子，旧列表是 `[c, d, e, f]`，新列表中间区是 `[e, c, d, h]`。
>
> 经过 key 映射，我们得到 `newIndexToOldIndexMap = [5, 3, 4, 0]`——意思是新列表里 e 在旧列表索引 4，c 在索引 2，d 在索引 3，h 是新节点（0）。
>
> LIS 算法找出这个数组中的最长递增子序列是 `[3, 4]`（对应 c 和 d），说明 c 和 d 在新旧两个序列中的**相对顺序没有被打乱**，它们保持原位不动就好。
>
> 只有 e 不在 LIS 里，需要真正做一次 DOM insertBefore；h 是新节点，需要 mount。
>
> 如果没有 LIS，朴素方法可能会把 c、d、e 全部移动一遍，做三次 DOM 操作。LIS 优化后只需要一次 move + 一次 mount。
>
> Vue 3 用的 LIS 实现是 O(n log n) 的，结合了二分查找和回溯指针重建。」

**关键词锚点**：`最长递增子序列`、`newIndexToOldIndexMap`、`DOM move 次数最小化`、`O(n log n)`、`二分查找 + 回溯`

---

## 三、高阶级（体现架构级思考）

### Q7 [expression]
Block Tree 在哪些情况下会"退出优化"（bail out）？

> **适用场景**：考察你对 Block Tree 边界的理解，通常在深聊源码时出现。

**推荐表达结构**：

> 「Block Tree 的扁平化优化建立在一个前提上：**块内部的节点结构是稳定的**（位置一一对应）。一旦这个前提被破坏，就必须降级。
>
> 常见的几种情况：
>
> **1. v-for**：列表的子节点数量和顺序是运行时决定的，编译器用 `openBlock(true)` 传入 `disableTracking = true`，强制让 Fragment 的 currentBlock 为 null，禁止收集子节点。Fragment 层走完整的快速 diff（patchKeyedChildren），但每个 li 内部仍然是独立 Block。
>
> **2. v-if**：每个分支自成一个独立 Block，条件切换时父 Block 把整个子 Block 作为一个节点来 patch/替换，内部仍走 Block 优化。
>
> **3. cloneVNode**：被 clone 的 VNode patchFlag 会被设为 BAIL（-2），整棵子树放弃 Block 优化。
>
> **4. HMR 热更新**：开发环境下 patchElement 会强制把 dynamicChildren 置 null，走完整 diff，保证热更新的准确性。
>
> **5. 手写 render 函数**：没有编译器注入 PatchFlag，所有节点都被视作动态，Block Tree 没有收益，降级为全量 diff，但渲染结果依然正确。」

**关键词锚点**：`disableTracking`、`BAIL flag`、`HMR`、`结构稳定前提`

---

### Q8 [expression]
Vue 3 和 React Fiber 在 Diff 思路上有什么本质差异？

> **适用场景**：大厂 SR / P7 面试常问的横向对比题，展示技术格局。

**推荐表达结构**：

> 「这两个框架在 Diff 思路上代表了**两种不同的工程哲学**。
>
> **Vue 3 是"编译时指导运行时"**。它在打包阶段就通过静态分析生成 PatchFlag、Block Tree、静态提升等信息，把"哪些东西会变"的结论直接传递给运行时。运行时因此变得极度精准，不需要任何任务调度就能在大多数更新场景下保持高帧率。代价是必须依赖编译器，手写 render 函数会失去大部分优化。
>
> **React 是"运行时可中断调度"**。React 有意让 Compiler 做的很少（虽然 React Compiler 在推进中），核心靠 Fiber 架构在运行时把渲染工作切成小片，通过调度器（Scheduler）实现可中断、可优先级的更新，保证主线程不被长时间占用。这是一种偏重运行时的"普适性"设计，对动态性更强的大型应用更友好，但额外引入了调度、时间切片的复杂度。
>
> 简单说：Vue 3 的优化是在"出发前就规划好路线"，React 的优化是"走着走着发现堵车就换道"。两种思路各有适用场景，没有绝对优劣。」

**关键词锚点**：`编译时 vs 运行时`、`Fiber 可中断调度`、`时间切片`、`React Compiler`

---

### Q9 [expression]
在极端场景下，Vue 3 的 Block Tree 优化会失效吗？

> **适用场景**：体现你对技术权衡的理解，接近架构师思维。

**推荐表达结构**：

> 「会，而且 Vue 官方文档和源码注释里都明确承认了这点。
>
> **第一个场景：手写 render 函数或 JSX 不带 PatchFlag**。如果开发者自己写 createVNode 且不传 PatchFlag，运行时走全量 diff，Block Tree 没有收益。解决方案是手动传入 PatchFlag 常量，但这很容易出错，生产上还是推荐 SFC 模板。
>
> **第二个场景：大量动态绑定导致 dynamicChildren 过大**。如果模板里几乎所有节点都是动态的，dynamicChildren 数组跟完整 children 差不多长，Block Tree 的降维效果就不明显了。这种情况本身也是个代码设计问题，应该考虑组件拆分。
>
> **第三个场景：深度嵌套的多层动态结构**。每层都是 Block 时，嵌套 Block 的递归遍历路径和普通树形 diff 差不多，优化空间缩小。
>
> 所以 Block Tree 的收益，在"大量静态节点 + 少量动态绑定"的典型业务页面里最大，在"几乎全动态"的场景里效果有限，这是一个非常符合实际业务分布的权衡设计。」

**关键词锚点**：`失效场景`、`技术权衡`、`动态绑定密度`

---

## 四、追问速查卡

> 面试时被追问时，用这里快速组织语言。

| 追问 | 一句话核心 | 关键词 |
|------|-----------|--------|
| newIndexToOldIndexMap 里 0 代表什么？ | 新节点在旧列表中不存在，需要新建 | `oldIndex + 1` 的设计，0 = 全新节点 |
| 为什么从后往前做 DOM 移动？ | 右侧节点先处理稳定，可安全作为 anchor | `insertBefore(node, anchor)` |
| v-for 里为什么每个 li 也是 Block？ | li 内部结构稳定，让内部走 Block 快速通道 | 嵌套 Block |
| 静态提升字符串化是什么？ | 大段连续静态节点直接编译成 HTML 字符串，用 innerHTML 挂载 | `createStaticVNode` |
| 没有 key 的列表有什么风险？ | "就地复用"按索引配对，列表重排时状态会残留到错误位置 | in-place patch |
| Vue 3.5 响应式重构和 Diff 有关系吗？ | 没有直接关系，3.5 是依赖追踪的双向链表重构，减少 GC 开销 | `Bidirectional Linked List` |
| 手写 render 函数能获得 Block Tree 优化吗？ | 不能，因为没有编译器注入 PatchFlag；可手动传但不推荐 | 降级到全量 diff |

---

## 五、口头表达练习场景

### 场景一：「你对 Vue 3 性能优化有什么了解？」（开放题）

**30 秒版**（简历筛选面）：
> 「Vue 3 的性能优化主要分编译时和运行时两块。编译时最核心的是 PatchFlag 和 Block Tree——给动态节点打标记，把动态节点收集到 dynamicChildren 扁平数组里，运行时更新直接跳过静态节点。运行时的优化是列表 diff 引入了最长递增子序列算法，把 DOM 移动次数降到最低。整体让 Vue 3 在大型应用下比 Vue 2 快 1.3 到 2 倍。」

**2 分钟版**（技术深聊）：
接上面的结构，然后展开 Q1 → Q3 → Q6 的表达链。

---

### 场景二：「Vue 3 Diff 和 Vue 2 Diff 有什么区别？」（对比题）

**核心差异三板斧**：
1. **编译时有没有信息传递**：Vue 2 运行时什么都不知道，必须全量 diff；Vue 3 编译期把 PatchFlag 和 Block 结构告诉运行时，做精准更新。
2. **静态节点怎么处理**：Vue 2 每次重渲染都重建全部 VNode；Vue 3 静态节点提升到外部，更新时通过 dynamicChildren 绕过它们。
3. **乱序列表怎么处理**：Vue 2 双端 + key-index map 暴力查找，有较多不必要 DOM move；Vue 3 五段式 + LIS，DOM 操作数降到物理极限。

---

## 📌 使用建议

- 面试前一天：精读 Q1、Q3、Q4、Q6（最高频）
- 面试前半小时：过一遍「追问速查卡」和「口头表达练习场景」
- 答题时：**先说结论，再讲原理，最后主动补追问**——让面试官跟着你的节奏走
