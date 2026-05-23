---
title: Vue 3 Diff 算法整体流程详解
module: vue
difficulty: 困难
tags: [vue, diff, patchFlag, vnode, lis, block-tree]
sourceType: blog
sourceTitle: Vue 3 Diff 算法整体流程详解
sourceUrl: 
sourceAuthor: 
originalPath: 学习系统/日常工作学习过程中的看过的文档/vue3的 diff.md
order: 2
created: 2026-05-18
updated: 2026-05-18
---

# Vue3 Diff算法的整体流程详解

亲爱的徒弟，非常高兴能够给你详细讲解Vue3的diff算法。作为你的师傅，我会尽可能地用通俗易懂的方式，同时保留技术细节的准确性，来帮助你彻底理解这个复杂的主题。

## 一、通过类比理解Vue3 Diff算法

想象你是一位整理超市货架的员工，每天晚上需要根据第二天销售计划调整货架上的商品排列：

**Vue2的员工**：必须检查每一个货架的每一件商品，即使只有少数几件商品需要移动或更换。这种方式耗时且低效。

**Vue3的员工**：拿着一份智能清单，上面不仅标记了"哪些货架有商品需要调整"，还精确到"每个货架上哪些具体位置的商品需要更换或移动"。这样可以直接定位需要工作的地方，大大提高效率。

这就是Vue3 diff算法的核心思想——通过编译时的标记和运行时的精确定位，避免无谓的DOM操作，提升渲染性能。

## 二、Vue3 Diff算法的整体流程

Vue3的diff算法流程分为两大部分：**编译时优化**和**运行时优化**。这两部分相辅相成，共同构成了Vue3高效的更新机制。

### 1. 编译时优化

在模板编译阶段，Vue3就为将来的diff操作做了充分准备：

```mermaid
flowchart TB
    Start[Vue3 Diff 算法] --> CompileTime[编译时优化]
    Start --> Runtime[运行时优化]

    CompileTime --> PatchFlag[PatchFlag 标记]
    CompileTime --> StaticHoist[静态提升]
    CompileTime --> EventCache[事件监听器缓存]

    Runtime --> BlockTree[Block tree机制]
    Runtime --> FastDiff[最长递增子序列算法]

    PatchFlag --> Benefit1[直接定位动态节点]
    StaticHoist --> Benefit1
    BlockTree --> Benefit1
    FastDiff --> Benefit2[最小化 DOM 操作]

    Benefit1 --> Result[高性能更新]
    Benefit2 --> Result

    style CompileTime fill:#e3f2fd
    style Runtime fill:#fff9c4
    style Result fill:#c8e6c9
```

#### 1.1 PatchFlag标记

Vue3会在编译阶段为动态节点添加标记，告诉运行时引擎该节点的哪些部分可能会变化：

```js
// Vue3编译后的render函数
function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("div", null, [
    // 静态节点，没有PatchFlag
    _createVNode("h1", null, "标题"),
    
    // 动态文本节点，PatchFlag为1
    _createVNode("p", null, _toDisplayString(_ctx.message), 1 /* TEXT */),
    
    // 动态属性节点，PatchFlag为8
    _createVNode("div", { id: _ctx.id }, "内容", 8 /* PROPS */, ["id"]),
    
    // 动态绑定多个属性，PatchFlag为16
    _createVNode("button", {
      class: _ctx.btnClass,
      onClick: _ctx.handleClick
    }, "点击", 16 /* FULL_PROPS */)
  ]))
}
```

PatchFlag的值表示节点的动态类型：

- 1: 动态文本内容
- 2: 动态Class
- 4: 动态Style
- 8: 动态Props
- 16: 全动态Props
- 32: 有动态子节点的组件
- 64: 有key的子节点顺序会变化

```mermaid
graph LR
    PatchFlag[PatchFlag 类型] --> Text[1: TEXT<br/>动态文本]
    PatchFlag --> Class[2: CLASS<br/>动态 Class]
    PatchFlag --> Style[4: STYLE<br/>动态 Style]
    PatchFlag --> Props[8: PROPS<br/>动态 Props]
    PatchFlag --> FullProps[16: FULL_PROPS<br/>全动态 Props]
    PatchFlag --> Component[32: COMPONENT<br/>动态子节点]
    PatchFlag --> Keyed[64: KEYED<br/>Key 顺序变化]

    style Text fill:#ffebee
    style Class fill:#e3f2fd
    style Style fill:#f3e5f5
    style Props fill:#e8f5e9
```

#### 1.2 静态提升

Vue3会将永远不变的节点提升到渲染函数外部，这样它们只会被创建一次：

```js
// 静态节点被提升到render函数外部
const _hoisted_1 = /*#__PURE__*/_createVNode("h1", null, "这是永远不变的标题", -1 /* HOISTED */)
const _hoisted_2 = /*#__PURE__*/_createVNode("div", { class: "static-class" }, "静态内容", -1 /* HOISTED */)

// 渲染函数中直接使用提升后的节点
function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("div", null, [
    _hoisted_1,
    _hoisted_2,
    _createVNode("p", null, _toDisplayString(_ctx.dynamicText), 1 /* TEXT */)
  ]))
}
```

#### 1.3 事件侦听器缓存

Vue3会缓存内联事件处理函数，避免不必要的重新创建：

```js
function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("button", {
    onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.handleClick(...args)))
  }, "点击我"))
}
```

### 2. 运行时优化：Block tree和快速Diff算法

#### 2.1 Block tree机制（结合源码）

##### 2.1.1 为什么还需要 Block？

很多人看到 PatchFlag 就以为"打了标记，diff 时认标记就行"，但这里有一个根本问题：**patchFlag 只描述"某个节点自身怎么变"，不告诉运行时"哪些节点是动态的"**。传统的 vnode diff 只能从根 vnode 出发，按父子结构一层一层递归下来——哪怕中间有 100 层静态 `<div>`，也得一层层走下去才能走到那唯一的动态文本。

Vue3 的做法是：**在编译阶段就把"某段模板里所有动态 vnode 的引用"扁平地收集起来，挂在一个"块根 vnode"上**，运行时 patch 时直接沿着这份扁平数组走，跳过所有静态的中间层级。这就是 block。

> 源码注释（`packages/runtime-core/src/vnode.ts`）原话：
> "once we consider v-if branches and each v-for fragment a block, we can divide a template into nested blocks, and within each block the node structure would be stable. This allows us to skip most children diffing and only worry about the dynamic nodes."
>
> 翻译：只要把 v-if 的每个分支、v-for 的每个 fragment 视为一个 block，模板就被切成嵌套的 block，**每个 block 内部的节点结构是稳定的**，因此我们可以跳过大部分孩子 diff，只关心动态节点。

##### 2.1.2 收集动态节点的核心数据结构

源码里只有三个全局变量在维持整个机制（`runtime-core/src/vnode.ts`）：

```ts
// 块栈：处理嵌套 block 时用的"当前所在 block"栈
export const blockStack: VNode['dynamicChildren'][] = []
// 当前正在被收集的动态子节点数组（栈顶）
export let currentBlock: VNode['dynamicChildren'] = null
// 是否启用 block 收集，可被 v-once / cloneVNode 等临时关闭
export let isBlockTreeEnabled = 1
```

开启/关闭一个 block：

```ts
export function openBlock(disableTracking = false): void {
  // disableTracking=true 出现在 v-for 上：v-for fragment 的 children
  // 本身长度/顺序都会变，不能把它们视作"结构稳定"的动态节点集合
  blockStack.push((currentBlock = disableTracking ? null : []))
}

export function closeBlock(): void {
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
}
```

`createBaseVNode` 里创建每一个普通 vnode 时，会**顺手把自己推进 currentBlock**——前提是它是动态的：

```ts
if (
  isBlockTreeEnabled > 0 &&
  !isBlockNode &&                  // block 根自己不进自己的数组
  currentBlock &&                  // 处在某个 block 内部
  (vnode.patchFlag > 0 || shapeFlag & ShapeFlags.COMPONENT) &&
  vnode.patchFlag !== PatchFlags.NEED_HYDRATION
) {
  currentBlock.push(vnode)
}
```

几个细节很关键：

- **只有带 patchFlag 的节点（或组件 vnode）才会被收集**——这就是"直接定位动态节点"的来源。
- **静态节点不带 patchFlag → 不进 currentBlock → 运行时完全不看它**。
- `shapeFlag & COMPONENT` 也会被收集：因为组件 vnode 即便看起来静态，也要保留 instance 引用以便后续卸载/更新。

`createElementBlock` / `createBlock` 在块根 vnode 上"封顶"，把 currentBlock 挂到 `dynamicChildren`：

```ts
function setupBlock(vnode: VNode) {
  vnode.dynamicChildren =
    isBlockTreeEnabled > 0 ? currentBlock || (EMPTY_ARR as any) : null
  closeBlock()
  // block 本身作为一个整体，要被推入它外层的 block
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode)
  }
  return vnode
}
```

注意最后那句 `currentBlock.push(vnode)`：**一个 block 整体会作为一个节点出现在它外层 block 的 dynamicChildren 里**，这就是"Block Tree"——外层 block 把内层 block 当作一个动态节点来引用，形成一棵**只由动态节点与 block 边界组成的树**。

##### 2.1.3 编译器生成的实际代码

看一段真实的模板和它的编译产物就能感受出扁平化的威力：

```html
<!-- 模板 -->
<div class="wrapper">
  <header>
    <h1>Static Title</h1>
    <p>Static paragraph</p>
  </header>
  <section>
    <div class="card">
      <span>{{ msg }}</span>
    </div>
  </section>
</div>
```

Vue3 编译产物（关键部分）：

```js
const _hoisted_1 = /*#__PURE__*/_createElementVNode("header", null, [
  /*#__PURE__*/_createElementVNode("h1", null, "Static Title"),
  /*#__PURE__*/_createElementVNode("p", null, "Static paragraph")
], -1 /* HOISTED */)

function render(_ctx) {
  return (_openBlock(), _createElementBlock("div", { class: "wrapper" }, [
    _hoisted_1,                                          // 整棵静态子树，-1 不进 block
    _createElementVNode("section", null, [
      _createElementVNode("div", { class: "card" }, [
        _createElementVNode("span", null,
          _toDisplayString(_ctx.msg), 1 /* TEXT */)       // 唯一的动态节点
      ])
    ])
  ]))
}
```

这棵 vnode 树在内存里有 5 层，但 `wrapper` 这个 block 的 `dynamicChildren` **长度为 1**，里面只有那个 `<span>{{ msg }}</span>` 的 vnode。msg 变化时，Vue 完全不会去看 `<section>`、`<div class="card">` 这些静态中间层。

##### 2.1.4 嵌套 Block：v-if 与 v-for

为什么 v-if 分支和 v-for 各自要开一个新 block？因为它们会让结构本身发生变化，外层 block 无法保证"孩子位置一一对应"。编译器的处理大致是：

```html
<div>
  <p>{{ title }}</p>
  <ul>
    <li v-for="item in list" :key="item.id">{{ item.text }}</li>
  </ul>
  <footer v-if="showFooter">{{ footerText }}</footer>
</div>
```

```js
function render(_ctx) {
  return (_openBlock(), _createElementBlock("div", null, [
    _createElementVNode("p", null, _toDisplayString(_ctx.title), 1 /* TEXT */),

    _createElementVNode("ul", null, [
      // v-for: openBlock(true) → disableTracking=true，currentBlock = null
      // fragment 自己作为 block 被外层收集
      (_openBlock(true), _createElementBlock(_Fragment, null,
        _renderList(_ctx.list, (item) => {
          return (_openBlock(), _createElementBlock("li", { key: item.id },
            _toDisplayString(item.text), 1 /* TEXT */))
        }), 128 /* KEYED_FRAGMENT */))
    ]),

    // v-if: 条件分支整体作为 block
    _ctx.showFooter
      ? (_openBlock(), _createElementBlock("footer", { key: 0 },
          _toDisplayString(_ctx.footerText), 1 /* TEXT */))
      : _createCommentVNode("v-if", true)
  ]))
}
```

对应的 block tree 结构如下：

```mermaid
graph TD
    Root["外层 Block: &lt;div&gt;<br/>dynamicChildren = [p, Fragment, footer?]"]

    Root --> P["&lt;p&gt; 动态文本<br/>patchFlag=1"]
    Root --> Frag["Fragment Block (v-for)<br/>patchFlag=128 KEYED_FRAGMENT<br/>dynamicChildren=null (disableTracking)"]
    Root --> Footer["&lt;footer&gt; Block (v-if 分支)<br/>dynamicChildren=[文本]"]

    Frag --> Li1["&lt;li&gt; Block<br/>每个 item 自成 block"]
    Frag --> LiN["&lt;li&gt; Block"]
    Li1 --> T1["动态文本"]
    LiN --> TN["动态文本"]

    style Root fill:#e3f2fd
    style Frag fill:#fff9c4
    style Footer fill:#ffebee
    style Li1 fill:#fff9c4
    style LiN fill:#fff9c4
```

几个细节：

- **v-for 的 fragment 用 `openBlock(true)` 禁用追踪**：因为 fragment 的孩子列表顺序、数量完全由数据决定，没有"稳定结构"可言，所以这一层不做扁平收集，而是走完整的快速 diff（也就是前面第 2.2 节讲的带 LIS 的那套算法）。
- **v-if 的每个分支是独立 block**：分支切换时（比如从 `<footer>` 变成 `<!---->` 注释节点），块根 vnode 类型本身都变了，外层只需把它当成一个动态节点整体 patch/替换。
- **嵌套 block 自动形成树**：靠的是 `setupBlock` 最后那句 `currentBlock.push(vnode)`，内层 block 会出现在外层 block 的 `dynamicChildren` 中。

##### 2.1.5 运行时怎么用 dynamicChildren？

看 `runtime-core/src/renderer.ts` 里的 `patchElement`：

```ts
// n2 是新 vnode；如果它带 dynamicChildren，直接走 block 快速路径
if (dynamicChildren) {
  patchBlockChildren(
    n1.dynamicChildren!,   // 旧 block 收集的动态节点数组
    dynamicChildren,       // 新 block 收集的动态节点数组
    el,
    parentComponent,
    parentSuspense,
    resolveChildrenNamespace(n2, namespace),
    slotScopeIds,
  )
} else if (!optimized) {
  // 没有 dynamicChildren，退回到传统的完整 children diff
  patchChildren(n1, n2, el, /* ... */)
}
```

而 `patchBlockChildren` 本身几乎什么都没做——就是**线性遍历两个扁平数组，一一对应 patch**：

```ts
const patchBlockChildren: PatchBlockChildrenFn = (
  oldChildren, newChildren, fallbackContainer, /* ... */
) => {
  for (let i = 0; i < newChildren.length; i++) {
    const oldVNode = oldChildren[i]
    const newVNode = newChildren[i]
    // Fragment/不同类型/组件/Teleport/Suspense 需要真实 parent
    const container =
      oldVNode.el &&
      (oldVNode.type === Fragment ||
        !isSameVNodeType(oldVNode, newVNode) ||
        oldVNode.shapeFlag &
          (ShapeFlags.COMPONENT | ShapeFlags.TELEPORT | ShapeFlags.SUSPENSE))
        ? hostParentNode(oldVNode.el)!
        : fallbackContainer
    patch(oldVNode, newVNode, container, null, /* ... */, true /* optimized */)
  }
}
```

注意这里的两个关键点：

1. **数组是按编译时顺序一一对应的**，所以不需要 key、不需要查找、不需要 LIS，直接 `for` 循环就是 O(n)，其中 n 是**动态节点数**，而不是整棵树的节点数。
2. **遇到内层 block vnode 时，`patch` 会递归进入 `patchElement`**，因为内层 block vnode 自己也有 `dynamicChildren`，于是继续走快速路径——block tree 的"跳跃式递归"就是这样层层展开的。

##### 2.1.6 什么时候会"退出"block 优化？

源码里至少有这些 bail-out（降级为完整 diff）的情况，面试里经常会追问：

- **cloneVNode**：`createVNode` 检测到传进来的 `type` 已经是 vnode，会走克隆逻辑，并把 `patchFlag` 设为 `PatchFlags.BAIL`（`-2`），意思是"这棵子树放弃 block 优化"。
- **HMR 更新时**：`patchElement` 里 `if (__DEV__ && isHmrUpdating)` 会把 `dynamicChildren = null`，强制走完整 diff，保证热更新正确性。
- **v-for fragment 的 children**：上面说过，结构本身会变，只能用完整快速 diff 处理这一层。
- **动态组件 `<component :is="...">` 指向一个运行时 vnode**：进入克隆分支，同样降级。
- **用户手写 render 函数**：没有编译器注入 patchFlag，所有节点都会被视作动态，此时 block tree 实际没什么收益，但也不影响正确性。

##### 2.1.7 小结

一句话概括：**Block Tree = 用编译时的静态分析，在 vnode 树上额外架一条"只穿过动态节点的快速通道"**。

- 编译器负责把动态节点"扁平化"塞进 `dynamicChildren`；
- `v-if` 分支 / `v-for` fragment 作为嵌套 block，把"结构会变"的部分圈进独立的小盒子；
- 运行时 `patchBlockChildren` 沿着这条快速通道线性走，静态层级完全不访问；
- 遇到"结构不稳定"或用户自定义 render 时优雅降级，保证正确性优先。

这就是为什么 Vue3 号称"**更新复杂度与模板大小无关，只与动态绑定数量有关**"。

##### 2.1.8 端到端完整示例：一次更新中，静态节点到底被访问了几次？

很多人读到这里仍然有两个疑惑，我们用一个具代表性的例子把它彻底走通：

> ❓ **Q1**：静态节点真的完全不被遍历吗？
> ❓ **Q2**：嵌套层级深时，是不是只遍历 block tree 里的节点？

**先给结论**：
- **首次渲染时**——静态节点**会被访问**（因为要真实地创建 DOM），但只访问一次。
- **更新时**——如果父元素是 block，**完全跳过**所有静态节点，无论嵌套多深，只沿着 `dynamicChildren` 指针跳跃前进。

下面我们用一棵"5 层嵌套 + 1 个动态文本 + 1 个 v-if + 1 个 v-for"的典型组件，一步步走完编译 → 首次渲染 → 更新的全链路。

---

**Step 1：模板**

```html
<template>
  <div class="page">                          <!-- L1 -->
    <header class="header">                   <!-- L2 静态 -->
      <div class="logo">                      <!-- L3 静态 -->
        <h1>My Blog</h1>                      <!-- L4 静态 -->
        <span class="version">v1.0.0</span>   <!-- L4 静态 -->
      </div>
      <nav>
        <a href="/">Home</a>                  <!-- 静态 -->
        <a href="/about">About</a>            <!-- 静态 -->
      </nav>
    </header>

    <main class="main">                       <!-- L2 -->
      <section class="hero">                  <!-- L3 -->
        <div class="title-wrapper">           <!-- L4 静态 -->
          <h2>{{ title }}</h2>                <!-- L5 动态文本 ① -->
        </div>
      </section>

      <section v-if="showList" class="list">  <!-- v-if block ② -->
        <p>Total: {{ total }}</p>             <!-- 动态文本 -->
        <ul>
          <li v-for="item in items"           <!-- v-for block ③ -->
              :key="item.id">
            {{ item.text }}
          </li>
        </ul>
      </section>
    </main>

    <footer>© 2026</footer>                   <!-- 静态 -->
  </div>
</template>
```

这棵模板在"自然树形"下有 **20+ 个 vnode**，但其中真正动态的只有 3 处：`title`、`total`、`item.text`，外加一个 v-if 分支开关。

---

**Step 2：编译产物（真实 compiler 输出风格）**

```js
import {
  createElementVNode as _createElementVNode,
  createElementBlock as _createElementBlock,
  openBlock as _openBlock,
  createCommentVNode as _createCommentVNode,
  Fragment as _Fragment,
  renderList as _renderList,
  toDisplayString as _toDisplayString,
  normalizeClass as _normalizeClass,
} from "vue"

// 🔵 静态子树被提升（hoist）到 render 外，只创建一次
const _hoisted_header = /*#__PURE__*/_createElementVNode(
  "header", { class: "header" },
  [
    _createElementVNode("div", { class: "logo" }, [
      _createElementVNode("h1", null, "My Blog"),
      _createElementVNode("span", { class: "version" }, "v1.0.0")
    ]),
    _createElementVNode("nav", null, [
      _createElementVNode("a", { href: "/" }, "Home"),
      _createElementVNode("a", { href: "/about" }, "About")
    ])
  ], -1 /* HOISTED */
)
const _hoisted_title_wrapper_open = /*#__PURE__*/_createElementVNode(
  "div", { class: "title-wrapper" }, null, -1 /* ← 实际会以结构拆分 */)
const _hoisted_footer = /*#__PURE__*/_createElementVNode(
  "footer", null, "© 2026", -1 /* HOISTED */)

export function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock("div", { class: "page" }, [
    _hoisted_header,                                         // -1，不进 block

    _createElementVNode("main", { class: "main" }, [
      _createElementVNode("section", { class: "hero" }, [
        _createElementVNode("div", { class: "title-wrapper" }, [
          _createElementVNode("h2", null,
            _toDisplayString(_ctx.title),
            1 /* TEXT */)                                    // ① 动态
        ])
      ]),

      // ② v-if：条件分支自成 block
      (_ctx.showList)
        ? (_openBlock(), _createElementBlock("section",
            { key: 0, class: "list" }, [
            _createElementVNode("p", null,
              "Total: " + _toDisplayString(_ctx.total),
              1 /* TEXT */),
            _createElementVNode("ul", null, [
              // ③ v-for：fragment block，disableTracking=true
              (_openBlock(true), _createElementBlock(
                _Fragment, null,
                _renderList(_ctx.items, (item) => {
                  return (_openBlock(), _createElementBlock("li",
                    { key: item.id },
                    _toDisplayString(item.text),
                    1 /* TEXT */))
                }),
                128 /* KEYED_FRAGMENT */))
            ])
          ]))
        : _createCommentVNode("v-if", true),

    _hoisted_footer                                          // -1，不进 block
  ]))
}
```

可以看到**编译器只在三个地方调用了 `_openBlock`**：

1. 最外层 `<div class="page">`（组件根）；
2. v-if 的 `<section class="list">` 分支；
3. v-for 的 `<Fragment>`，以及 fragment 内每个 `<li>`（每个 item 都是独立 block，保证列表稳定）。

---

**Step 3：运行时构造的 VNode 树 vs Block Tree**

我用两种视角画同一棵树。左边是"自然的父子结构"，右边是"dynamicChildren 指针链"——**更新时 Vue 只走右边**。

```mermaid
graph TD
    subgraph VNode_Tree["VNode 树（父子结构，20+ 节点，首次渲染按这个遍历）"]
        R["div.page &#40;Block&#41;"]
        R --> HD["header &#40;HOISTED&#41;"]
        R --> M["main"]
        R --> V["v-if? section.list &#40;Block&#41; : Comment"]
        R --> F["footer &#40;HOISTED&#41;"]

        M --> HERO["section.hero"]
        HERO --> TW["div.title-wrapper"]
        TW --> H2["h2 — {{title}} ①"]

        HD --> HL["div.logo"]
        HL --> HH1["h1 &#40;static&#41;"]
        HL --> HSP["span.version &#40;static&#41;"]
        HD --> NAV["nav"]
        NAV --> A1["a Home"]
        NAV --> A2["a About"]

        V --> PTotal["p — {{total}}"]
        V --> UL["ul"]
        UL --> FRAG["Fragment &#40;v-for Block&#41;"]
        FRAG --> Li1["li &#40;Block&#41; {{item.text}}"]
        FRAG --> LiN["li &#40;Block&#41; {{item.text}}"]
    end

    style R fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style V fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style FRAG fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style Li1 fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style LiN fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style HD fill:#eeeeee
    style F fill:#eeeeee
    style HL fill:#eeeeee
    style HH1 fill:#eeeeee
    style HSP fill:#eeeeee
    style NAV fill:#eeeeee
    style A1 fill:#eeeeee
    style A2 fill:#eeeeee
    style HERO fill:#eeeeee
    style TW fill:#eeeeee
    style M fill:#eeeeee
    style H2 fill:#ffcdd2
    style PTotal fill:#ffcdd2
```

```mermaid
graph TD
    subgraph Block_Tree["Block Tree（dynamicChildren 扁平指针，更新时只走这条）"]
        BR["Block: div.page<br/>dynamicChildren = [h2, if-section-or-comment]"]
        BR -.-> BH2["h2 — {{title}} patchFlag=1"]
        BR -.-> BV["Block: section.list<br/>dynamicChildren = [p, Fragment]"]

        BV -.-> BP["p — {{total}} patchFlag=1"]
        BV -.-> BFRAG["Block: Fragment<br/>patchFlag=128 KEYED_FRAGMENT<br/>dynamicChildren=null ⚠️"]

        BFRAG ==>|完整 diff<br/>走 patchKeyedChildren| BLIS["[li Block, li Block, ...]"]

        BLIS -.-> BLi["Block: li<br/>dynamicChildren = [text]"]
        BLi -.-> BText["{{item.text}} patchFlag=1"]
    end

    style BR fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style BV fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style BFRAG fill:#ffebee,stroke:#c62828,stroke-width:2px
    style BLi fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style BH2 fill:#ffcdd2
    style BP fill:#ffcdd2
    style BText fill:#ffcdd2
```

两张图的核心差异一眼可见：**block tree 上没有任何 `header`、`logo`、`h1`、`nav`、`a`、`main`、`hero`、`title-wrapper`、`footer` 这些静态节点的身影**。它们在 block tree 上根本不存在。

---

**Step 4：首次渲染——为什么静态节点此时必须被访问**

首次渲染时，Vue 没有旧 vnode 可参照，必须把整棵 DOM 树真正创建出来。调用链（`renderer.ts`）：

```
render(vnode, container)
  └─ patch(null, vnode, container)                        // n1 = null
       └─ processElement → mountElement(div.page)
            ├─ hostCreateElement("div")
            ├─ mountChildren([header, main, v-if?, footer], ...)
            │    │ // ⚠️ 就是这里：必须逐个创建每个孩子的 DOM
            │    ├─ patch(null, header)  → mountElement → mountChildren(...) 递归
            │    ├─ patch(null, main)    → mountElement → mountChildren(...) 递归
            │    ├─ patch(null, section) → mountElement → mountChildren(...) 递归
            │    └─ patch(null, footer)  → mountElement
            └─ hostInsert(el, container)
```

这里 `mountChildren` 走的是 `vnode.children`（自然父子结构），**不是 `dynamicChildren`**。看源码确认：

```ts
// renderer.ts - mountElement
if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
  mountChildren(
    vnode.children as VNodeArrayChildren,   // ⚠️ 注意是 children 不是 dynamicChildren
    el, null, parentComponent, parentSuspense,
    resolveChildrenNamespace(vnode, namespace),
    slotScopeIds,
    optimized,
  )
}
```

所以**首次 mount 时所有节点都必须被访问**——不然 DOM 没人创建。静态节点（`patchFlag === -1`）创建完成后，由于它们不会出现在 `dynamicChildren` 数组中，**从此再也不会被 patch 访问**。

这个"HOISTED"还有一个额外福利：`_hoisted_header` 这个 vnode 对象本身在 render 外面只创建一次，每次 render 都复用同一个 vnode 引用。结合 vnode 上 `el` 字段持有真实 DOM 的引用，连"克隆 vnode"的成本都省了。

---

**Step 5：更新——block tree 真正起作用的时刻**

现在假设 `title` 变了，触发了组件重新渲染。产生了新的 vnode 树 `n2`，旧的是 `n1`。进入 `patch`：

```ts
// renderer.ts L374
const patch = (n1, n2, container, ...,
  optimized = !!n2.dynamicChildren,   // ⚠️ 关键开关：有 dynamicChildren → optimized=true
) => { ... }
```

**调用栈追踪：**

```
patch(oldRoot, newRoot)           // optimized=true，因为 newRoot.dynamicChildren 存在
  └─ processElement → patchElement(oldRoot, newRoot)
       │
       │  patchElement 源码关键分支（renderer.ts L862）：
       │  if (dynamicChildren) {
       │    patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, ...)
       │  } else if (!optimized) {
       │    patchChildren(...)   // ← 传统的完整 diff，本例不会走这里
       │  }
       │
       └─ patchBlockChildren(
              oldRoot.dynamicChildren,   // [旧 h2, 旧 if-section]
              newRoot.dynamicChildren,   // [新 h2, 新 if-section]
              el, ...)
            │
            │  for 循环线性遍历 2 个元素：
            │
            ├─ patch(旧 h2, 新 h2)                    ← 进入 h2 的 patch
            │    └─ patchElement(旧 h2, 新 h2)
            │         │  h2.dynamicChildren = null（它不是 block，只是带 TEXT flag 的普通节点）
            │         │  所以跳过 patchBlockChildren
            │         │
            │         └─ 判断 patchFlag & PatchFlags.TEXT:
            │              hostSetElementText(el, "新的 title")  ✅ 更新完成
            │
            └─ patch(旧 section.list, 新 section.list)
                 └─ patchElement(...)
                      └─ patchBlockChildren(             ← 嵌套 block 递归进入
                           [旧 p, 旧 Fragment],
                           [新 p, 新 Fragment])
                           ├─ patch(旧 p, 新 p)  → hostSetElementText（total 没变也会比对字符串）
                           └─ patch(旧 Fragment, 新 Fragment)
                                └─ processFragment → patchKeyedChildren(...)
                                     └─ ... 列表没变，for 循环打平 patch 每个 li
                                          └─ 每个 li 是 block → 走各自的 patchBlockChildren
                                               └─ patch(旧 text, 新 text) → hostSetElementText
```

**整个更新过程被真正访问的节点一共是**：

| 节点 | 是否访问 | 访问原因 |
|---|---|---|
| `div.page` (根 block) | ✅ | patchElement 入口 |
| `h2` | ✅ | 根 block 的 dynamicChildren[0] |
| `section.list` (内层 block) | ✅ | 根 block 的 dynamicChildren[1] |
| `p` (Total) | ✅ | section.list 的 dynamicChildren[0] |
| `Fragment` (v-for) | ✅ | section.list 的 dynamicChildren[1] |
| 每个 `<li>` | ✅ | Fragment 的 children（走 patchKeyedChildren） |
| 每个 li 内的文本 | ✅ | li 的 dynamicChildren[0] |
| **`header`** | ❌ | HOISTED，不进 block |
| **`div.logo`** | ❌ | header 子节点，根本访问不到 |
| **`h1` / span.version** | ❌ | 同上 |
| **`nav` / `a` × 2** | ❌ | 同上 |
| **`main`** | ❌ | 静态，无 patchFlag |
| **`section.hero`** | ❌ | 静态，无 patchFlag |
| **`div.title-wrapper`** | ❌ | 静态，无 patchFlag |
| **`ul`** | ❌ | 静态，无 patchFlag |
| **`footer`** | ❌ | HOISTED |

这就是你问题的直接答案：**静态节点在更新阶段完全不被访问——不是"轻量处理"、不是"快速掠过"，而是彻底不进入 patch 函数**。它们在 `dynamicChildren` 指针链上根本不存在。

---

**Step 6：嵌套层级深时的"跳跃式递归"**

你问"嵌套层级深时，只遍历 block tree 节点吗？"——答案是**是**。嵌套的秘密在 `setupBlock` 最后一行：

```ts
// vnode.ts setupBlock
if (isBlockTreeEnabled > 0 && currentBlock) {
  currentBlock.push(vnode)   // ⚠️ 内层 block 作为一个整体节点，塞进外层 block
}
```

所以即便你的模板有 100 层嵌套，只要中间全是静态节点，外层 block 的 `dynamicChildren` 里仍然是**直接指向内层那个 block vnode**——中间 99 层对运行时完全透明。

用这个例子的 `div.page` → `section.list` 举例：

```
外层 block: div.page
  dynamicChildren = [ h2 vnode,           ← 跨越了 main/section.hero/title-wrapper 3 层
                      section.list vnode ]  ← 跨越了 main 1 层
                       ↓
                     (section.list 自身也是 block)
                       ↓
                     dynamicChildren = [ p vnode,
                                         Fragment vnode ]
                                          ↓
                                        dynamicChildren = null (disableTracking)
                                        走 children 列表的 patchKeyedChildren
                                          ↓
                                        每个 li 又是独立 block
                                          ↓
                                        dynamicChildren = [ text ]
```

它本质上是一个**"跳过一切中间层、只在 block 节点之间跳跃"的遍历**。时间复杂度是 `O(动态节点数)`，**与模板的实际节点总数和嵌套深度都无关**。

---

**Step 7：一张图总结两个阶段的访问范围**

```mermaid
graph LR
    subgraph Mount["首次渲染（创建阶段）"]
        M1["遍历整棵 children 树"]
        M2["所有节点都被访问<br/>（创建真实 DOM）"]
        M3["静态节点创建完即脱钩"]
        M1 --> M2 --> M3
    end

    subgraph Patch["更新（Patch 阶段）"]
        P1["从根 block 开始"]
        P2["只走 dynamicChildren<br/>指针链"]
        P3["遇到嵌套 block<br/>跳跃式进入"]
        P4["静态节点完全不访问<br/>甚至不知道它们存在"]
        P1 --> P2 --> P3 --> P4
    end

    Mount --> Patch

    style M2 fill:#fff9c4
    style P4 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
```

---

**Step 8：怎么在浏览器里亲手验证？**

不用跑源码，直接在 `main.js` 里加这两行就能在控制台看到 block tree：

```js
const app = createApp(App)
app.mount('#app')

const root = app._instance.subTree              // 组件的根 vnode
console.log('vnode.children 长度（自然树）:',
            Array.isArray(root.children) ? root.children.length : 1)
console.log('dynamicChildren（扁平动态节点）:', root.dynamicChildren)
// 在 Vue SFC Playground 里跑上面那段模板会看到：
// dynamicChildren 长度 = 2（h2 和 section.list），
// 而不是 20+
```

也推荐到 [Vue SFC Playground](https://play.vuejs.org/) 贴模板，右侧切到"Compiled Output"就能看到 `_openBlock()` / `_createElementBlock()` 的真实编译产物，跟上面 Step 2 完全一致。

---

**最后一句话回答你的疑惑**：

> 📌 更新时，**静态节点不被遍历**，即使嵌套 100 层也一样——Vue 只沿着 `dynamicChildren` 指针链做跳跃式递归，这条链上只有动态节点和嵌套 block 的根，中间的静态层级对运行时**不可见**。

#### 2.2 快速Diff算法

Vue3采用了全新的快速diff算法，它的核心流程如下：

```mermaid
flowchart TD
    Start[开始 Diff] --> Step1[步骤 1: 前置扫描<br/>匹配相同前缀]
    Step1 --> Step2[步骤 2: 后置扫描<br/>匹配相同后缀]
    Step2 --> Check{中间<br/>部分?}

    Check -->|i > e1| Step3[步骤 3: 挂载新节点<br/>旧节点已处理完，新节点有剩余]
    Check -->|i > e2| Step4[步骤 4: 卸载旧节点<br/>新节点已处理完，旧节点有剩余]
    Check -->|复杂情况| Step5[步骤 5: 处理中间部分<br/>构建 keyMap，追踪移动，使用 LIS]

    Step3 --> End[完成]
    Step4 --> End
    Step5 --> End

    style Step1 fill:#e3f2fd
    style Step2 fill:#e3f2fd
    style Step3 fill:#c8e6c9
    style Step4 fill:#ffcdd2
    style Step5 fill:#fff9c4
```

```js
// 简化版的Vue3 diff算法核心
function patchKeyedChildren(oldChildren, newChildren, container) {
  let i = 0                           // 前置扫描指针
  const oldChildrenLength = oldChildren.length
  const newChildrenLength = newChildren.length
  let e1 = oldChildrenLength - 1      // 旧子序列尾指针
  let e2 = newChildrenLength - 1      // 新子序列尾指针

  // 1. 从前向后扫描，处理相同前缀
  while (i <= e1 && i <= e2) {
    const oldVNode = oldChildren[i]
    const newVNode = newChildren[i]
    
    if (isSameVNodeType(oldVNode, newVNode)) {
      // 节点类型相同，递归更新
      patch(oldVNode, newVNode)
    } else {
      // 一旦发现不同，退出循环
      break
    }
    i++
  }

  // 2. 从后向前扫描，处理相同后缀
  while (i <= e1 && i <= e2) {
    const oldVNode = oldChildren[e1]
    const newVNode = newChildren[e2]
    
    if (isSameVNodeType(oldVNode, newVNode)) {
      patch(oldVNode, newVNode)
    } else {
      break
    }
    e1--
    e2--
  }

  // 3. 处理新增节点
  if (i > e1) {
    // 所有旧节点都处理完，但新节点还有剩余
    // 说明是新增节点
    if (i <= e2) {
      const nextPos = e2 + 1
      // 确定插入位置的锚点
      const anchor = nextPos < newChildrenLength ? newChildren[nextPos].el : null
      
      // 挂载所有剩余的新节点
      while (i <= e2) {
        patch(null, newChildren[i], container, anchor)
        i++
      }
    }
  }
  // 4. 处理需要删除的节点
  else if (i > e2) {
    // 所有新节点都处理完，但旧节点还有剩余
    // 说明这些旧节点需要被移除
    while (i <= e1) {
      unmount(oldChildren[i])
      i++
    }
  }
  // 5. 处理中间部分（最复杂的情况）
  else {
    // 中间部分的开始和结束索引
    const s1 = i // 旧子序列开始索引
    const s2 = i // 新子序列开始索引
    
    // 5.1 构建新节点key到索引的映射
    const keyToNewIndexMap = new Map()
    for (i = s2; i <= e2; i++) {
      const nextChild = newChildren[i]
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i)
      }
    }
    
    // 5.2 更新和移除旧节点，同时记录节点是否需要移动
    let j
    let patched = 0                   // 已更新节点数
    const toBePatched = e2 - s2 + 1   // 待更新新节点数
    let moved = false                 // 是否需要移动节点
    let maxNewIndexSoFar = 0          // 记录是否有节点需要移动
    
    // 初始化映射数组，用来记录新节点在旧序列中的位置
    // 0表示该新节点在旧序列中不存在
    const newIndexToOldIndexMap = new Array(toBePatched)
    for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
    
    // 遍历所有旧节点
    for (i = s1; i <= e1; i++) {
      const prevChild = oldChildren[i]
      
      // 如果已经更新的节点数大于等于需要更新的节点数
      // 说明剩下的旧节点都是多余的，直接移除
      if (patched >= toBePatched) {
        unmount(prevChild)
        continue
      }
      
      // 查找当前旧节点在新序列中的位置
      let newIndex
      if (prevChild.key != null) {
        // 如果有key，通过key找到在新序列中对应的位置
        newIndex = keyToNewIndexMap.get(prevChild.key)
      } else {
        // 如果没有key，遍历查找相同类型的节点
        for (j = s2; j <= e2; j++) {
          if (
            newIndexToOldIndexMap[j - s2] === 0 &&
            isSameVNodeType(prevChild, newChildren[j])
          ) {
            newIndex = j
            break
          }
        }
      }
      
      // 如果在新序列中找不到该节点，说明它被移除了
      if (newIndex === undefined) {
        unmount(prevChild)
      } else {
        // 记录新序列中的位置 -> 旧序列中的位置
        // +1是为了避开0值（0有特殊含义）
        newIndexToOldIndexMap[newIndex - s2] = i + 1
        
        // 判断节点是否需要移动
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex
        } else {
          moved = true
        }
        
        // 更新节点
        patch(prevChild, newChildren[newIndex])
        patched++
      }
    }
    
    // 5.3 移动和挂载节点
    // 如果需要移动节点，使用最长递增子序列算法优化移动
    if (moved) {
      // 计算最长递增子序列
      const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
      j = increasingNewIndexSequence.length - 1
      
      // 从后向前遍历，确保正确的DOM操作顺序
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = newChildren[nextIndex]
        // 确定锚点位置
        const anchor = nextIndex + 1 < newChildrenLength ? 
          newChildren[nextIndex + 1].el : null
        
        // 如果是新增的节点（即在旧序列中不存在）
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, anchor)
        }
        // 如果需要移动
        else if (moved) {
          // 如果不在最长递增子序列中，则需要移动
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            // 是递增子序列的一部分，不需要移动
            j--
          }
        }
      }
    }
  }
}
```

## 三、深入理解Vue3 Diff算法中的关键步骤

我们现在来详细解析Vue3 diff算法中最核心的部分——**处理中间不同部分**，这也是算法最复杂的地方。

### 代码中的具体案例分析

假设我们有下面的两组子节点序列：

```
旧子节点：[a, b, c, d, e, f, g]
新子节点：[a, b, e, c, d, h, g]
```

```mermaid
graph TD
    subgraph Old["旧子节点: [a, b, c, d, e, f, g]"]
        O0[a] --> O1[b] --> O2[c] --> O3[d] --> O4[e] --> O5[f] --> O6[g]
    end

    subgraph New["新子节点: [a, b, e, c, d, h, g]"]
        N0[a] --> N1[b] --> N2[e] --> N3[c] --> N4[d] --> N5[h] --> N6[g]
    end

    O0 -.前缀匹配.-> N0
    O1 -.前缀匹配.-> N1
    O6 -.后缀匹配.-> N6

    style O0 fill:#c8e6c9
    style O1 fill:#c8e6c9
    style O6 fill:#c8e6c9
    style N0 fill:#c8e6c9
    style N1 fill:#c8e6c9
    style N6 fill:#c8e6c9
    style O2 fill:#fff9c4
    style O3 fill:#fff9c4
    style O4 fill:#fff9c4
    style O5 fill:#ffebee
    style N2 fill:#fff9c4
    style N3 fill:#fff9c4
    style N4 fill:#fff9c4
    style N5 fill:#e1f5ff
```

根据之前讲解的算法流程，我们来一步步分析：

#### 1. 前置处理

首先，算法会从前向后扫描，找到相同的前缀：

- `a`和`b`是相同的，直接复用，索引`i`移动到2

```
旧：[a, b, (c, d, e, f), g]
         i
新：[a, b, (e, c, d, h), g]
         i
```

#### 2. 后置处理

然后，算法会从后向前扫描，找到相同的后缀：

- `g`是相同的，直接复用，索引`e1`和`e2`都减少1

```
旧：[a, b, (c, d, e, f), g]
         i        e1
新：[a, b, (e, c, d, h), g]
         i        e2
```

```mermaid
graph TB
    subgraph Phase1["阶段 1: 前置扫描后"]
        P1_Old["旧: [a✓, b✓, |i→ c, d, e, f, g]"]
        P1_New["新: [a✓, b✓, |i→ e, c, d, h, g]"]
    end

    subgraph Phase2["阶段 2: 后置扫描后"]
        P2_Old["旧: [a✓, b✓, |i→ c, d, e, f ←e1|, g✓]"]
        P2_New["新: [a✓, b✓, |i→ e, c, d, h ←e2|, g✓]"]
    end

    subgraph Phase3["中间部分待处理"]
        P3_Old["旧中间: [c, d, e, f]"]
        P3_New["新中间: [e, c, d, h]"]
    end

    Phase1 --> Phase2 --> Phase3

    style Phase1 fill:#e3f2fd
    style Phase2 fill:#fff9c4
    style Phase3 fill:#ffebee
```

#### 3. 中间部分处理

现在我们需要处理中间不同的部分：旧序列中的`[c, d, e, f]`和新序列中的`[e, c, d, h]`。

##### 3.1 构建新节点key到索引的映射

```js
keyToNewIndexMap = {
  'e': 2, // 新序列中e的索引是2
  'c': 3, // 新序列中c的索引是3
  'd': 4, // 新序列中d的索引是4
  'h': 5  // 新序列中h的索引是5
}
```

```mermaid
graph TD
    subgraph KeyMap["keyToNewIndexMap 映射"]
        K1["'e' → 2"]
        K2["'c' → 3"]
        K3["'d' → 4"]
        K4["'h' → 5"]
    end

    subgraph NewSeq["新序列中间部分"]
        N2[e at index 2]
        N3[c at index 3]
        N4[d at index 4]
        N5[h at index 5]
    end

    K1 -.-> N2
    K2 -.-> N3
    K3 -.-> N4
    K4 -.-> N5

    style KeyMap fill:#e1f5ff
```

##### 3.2 遍历旧子序列，更新和标记需要移动的节点

初始化`newIndexToOldIndexMap`数组，大小为新序列中间部分长度，初值为0：

```js
newIndexToOldIndexMap = [0, 0, 0, 0] // 对应新序列中的e, c, d, h
```

然后遍历旧序列中间部分：

- 处理旧节点`c`（索引2）：
  - 在`keyToNewIndexMap`中找到，对应的新索引是3
  - `newIndexToOldIndexMap[3-2] = 2+1`，即`newIndexToOldIndexMap[1] = 3`
  - `maxNewIndexSoFar = 3`，无需移动
  - 更新节点

- 处理旧节点`d`（索引3）：
  - 在`keyToNewIndexMap`中找到，对应的新索引是4
  - `newIndexToOldIndexMap[4-2] = 3+1`，即`newIndexToOldIndexMap[2] = 4`
  - `maxNewIndexSoFar = 4`，无需移动
  - 更新节点

- 处理旧节点`e`（索引4）：
  - 在`keyToNewIndexMap`中找到，对应的新索引是2
  - `newIndexToOldIndexMap[2-2] = 4+1`，即`newIndexToOldIndexMap[0] = 5`
  - `maxNewIndexSoFar = 4`，但新索引2小于4，需要移动
  - 设置`moved = true`
  - 更新节点

- 处理旧节点`f`（索引5）：
  - 在`keyToNewIndexMap`中未找到，说明需要删除
  - 删除节点`f`

处理完后，`newIndexToOldIndexMap = [5, 3, 4, 0]`，其中：

- 5表示新节点`e`在旧序列中的位置是索引4（+1后为5）
- 3表示新节点`c`在旧序列中的位置是索引2（+1后为3）
- 4表示新节点`d`在旧序列中的位置是索引3（+1后为4）
- 0表示新节点`h`在旧序列中不存在，需要新建

```mermaid
graph TD
    Init["初始: [0, 0, 0, 0]<br/>对应 [e, c, d, h]"] -->
    Step1["处理 'c': [0, 3, 0, 0]<br/>c 在旧序列索引 2"]
    Step1 --> Step2["处理 'd': [0, 3, 4, 0]<br/>d 在旧序列索引 3"]
    Step2 --> Step3["处理 'e': [5, 3, 4, 0]<br/>e 在旧序列索引 4<br/>⚠️ moved=true"]
    Step3 --> Step4["处理 'f': [5, 3, 4, 0]<br/>f 未找到，卸载"]

    Step4 --> Final["最终映射: [5, 3, 4, 0]<br/>0 = 新节点<br/>其他 = 旧索引 + 1"]

    style Step3 fill:#ffebee
    style Final fill:#c8e6c9
```

##### 3.3 移动和挂载节点

由于`moved = true`，需要使用最长递增子序列算法来优化节点移动。

计算`newIndexToOldIndexMap = [5, 3, 4, 0]`的最长递增子序列：

- 最长递增子序列是`[1, 2]`，对应索引值为`[3, 4]`，也就是新节点`c`和`d`

从后向前遍历中间部分的新节点：

- 处理新节点`h`（索引5）：
  - `newIndexToOldIndexMap[3] = 0`，说明是新节点，需要创建并插入

- 处理新节点`d`（索引4）：
  - 在最长递增子序列中（索引2对应值为2），无需移动

- 处理新节点`c`（索引3）：
  - 在最长递增子序列中（索引1对应值为1），无需移动

- 处理新节点`e`（索引2）：
  - 不在最长递增子序列中，需要移动到正确位置

最终的DOM操作：

1. 将节点`e`移动到新位置（插入到节点`b`后面）
2. 创建新节点`h`并插入到正确位置
3. 删除节点`f`

```mermaid
sequenceDiagram
    participant Old as 旧 DOM
    participant Diff as Diff 引擎
    participant New as 新 DOM

    Note over Old,New: 初始: [a, b, c, d, e, f, g]

    Diff->>Old: 保持 a, b (前缀匹配)
    Diff->>Old: 保持 g (后缀匹配)

    Diff->>Old: 移动 e 到位置 2
    Old->>New: e 已移动

    Diff->>Old: 保持 c, d (在 LIS 中)

    Diff->>Old: 卸载 f
    Old-->>Diff: f 已删除

    Diff->>New: 挂载 h 到位置 5

    Note over Old,New: 最终: [a, b, e, c, d, h, g]
```

这样，通过最少的DOM操作，我们就完成了从`[a, b, c, d, e, f, g]`到`[a, b, e, c, d, h, g]`的转变。

## 四、图解最长递增子序列算法

我们已经提到，Vue3使用最长递增子序列算法来优化节点移动。现在让我们更直观地理解这个算法。

最长递增子序列是一个序列中**保持相对顺序不变的最长上升子序列**。例如，对于序列`[10, 9, 2, 5, 3, 7, 101, 18]`，最长递增子序列是`[2, 3, 7, 18]`或`[2, 5, 7, 18]`，长度为4。

在Vue3 diff算法中，我们关注的是新节点在旧序列中的索引顺序：

```
newIndexToOldIndexMap = [5, 3, 4, 0]
```

这里：

- 第一个值5表示新节点在旧序列中的索引是4
- 第二个值3表示新节点在旧序列中的索引是2
- 第三个值4表示新节点在旧序列中的索引是3
- 第四个值0表示新节点在旧序列中不存在

我们需要找出最长递增子序列。在这个例子中，`[3, 4]`是最长递增子序列，对应的索引是`[1, 2]`。

这意味着在新序列中，索引为1和2的节点（即`c`和`d`）可以保持原位不动，而其他节点需要移动或创建。

```mermaid
graph TD
    subgraph Input["输入: [5, 3, 4, 0]"]
        I1[5] --> I2[3] --> I3[4] --> I4[0]
    end

    subgraph Analysis["寻找递增子序列"]
        S1["[3, 4] ✓ 长度: 2"]
        S2["[5] 长度: 1"]
        S3["[3] 长度: 1"]
    end

    subgraph Result["LIS 结果: [1, 2]"]
        R1["索引 1 → 值 3"]
        R2["索引 2 → 值 4"]
    end

    Input --> Analysis
    Analysis --> Result

    subgraph Meaning["含义: 节点 c 和 d 不需要移动"]
        M1["c 保持原位"]
        M2["d 保持原位"]
        M3["e 需要移动"]
        M4["h 需要挂载"]
    end

    Result --> Meaning

    style S1 fill:#c8e6c9
    style M1 fill:#c8e6c9
    style M2 fill:#c8e6c9
    style M3 fill:#ffebee
    style M4 fill:#e1f5ff
```

### 最长递增子序列算法实现

```js
function getSequence(arr) {
  const p = arr.slice()      // 存放最长递增子序列中每个元素的前驱节点位置
  const result = [0]         // 存放最长递增子序列的索引
  let i, j, u, v, c
  const len = arr.length
  
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    // 跳过需要新建的元素
    if (arrI !== 0) {
      j = result[result.length - 1]
      // 如果当前元素比最长递增子序列中的最后一个元素还大
      // 直接将当前位置插入到结果中
      if (arr[j] < arrI) {
        p[i] = j           // 记录前驱节点
        result.push(i)     // 添加到递增子序列中
        continue
      }
      
      // 二分查找，找到数组中第一个比arrI大的元素
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      
      // 找到了第一个比arrI大的位置，更新result数组
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  
  // 回溯找到真正的最长递增子序列
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  
  return result
}
```

这个算法使用了动态规划和二分查找，使其复杂度达到了O(n log n)，比简单的O(n²)算法更高效。

## 五、Vue3 Diff算法的优势总结

Vue3的diff算法相较于Vue2有以下几个方面的优势：

1. **更精准的更新**：通过PatchFlag和Block tree，Vue3可以直接定位动态节点，避免对整个树进行遍历。

2. **更高效的静态内容处理**：通过静态提升，静态内容只会被创建一次，大大减少了不必要的操作。

3. **更智能的节点移动策略**：通过最长递增子序列算法，Vue3可以用最少的DOM移动操作完成更新。

4. **更小的内存占用**：Vue3的虚拟DOM结构更加精简，平均减少了40%的内存使用。

5. **更快的渲染速度**：在大型应用中，Vue3比Vue2快1.3~2倍。

## 六、思考题：检验你的理解

让我出几道问题，检验你对Vue3 diff算法的理解：

1. 假设有一个列表需要从`[A, B, C, D]`变为`[D, B, A, C]`，Vue3的diff算法会进行哪些具体操作？

2. 如果一个组件有大量静态内容和少量动态内容，Vue3编译器会如何优化？
v
3. 为什么Vue3在处理节点移动时，要从后向前遍历而不是从前向后？

4. Vue3的PatchFlag和Vue2的静态优化有什么本质区别？

5. 为什么最长递增子序列算法可以减少DOM操作？

希望这篇详细的讲解能帮助你彻底理解Vue3 diff算法的整体流程。如果有任何疑问，请随时向我提问！

## 作业

1. 手写 `patchKeyedChildren` 的五段式流程伪代码，并说明每一段能提前跳过哪些 DOM 操作。
2. 用一组 keyed children 变化案例，手算最长递增子序列和最终需要移动的节点。
3. 对比有 key、无 key、错误 key 的列表更新行为，说明真实业务里的风险。
4. 阅读 Vue core 渲染器代码，找出 patch flag 和 block tree 如何减少 diff 范围。

## 📝 面试题自测

### Q1 [single]
在 Vue 3 的虚拟 DOM Diff 算法中，性能大幅提升的关键之一是编译阶段引入了什么标记机制？
A. VNodeHash
B. PatchFlag
C. TreeShakingFlag
D. HydrateMask
答案：B
解析：
💡 它解决了什么问题：
解决了 Vue 2 中在数据更新时必须对整棵虚拟 DOM 树进行全量深度递归 Diff 所带来的巨大 CPU 耗时与长任务卡顿。在大型复杂组件中，即使只修改了一个数字，Vue 2 依然需要耗费大量时间去逐层比对大量未曾改变的静态元素。

🔍 核心原理解析（防拷打）：
1. PatchFlag 是在编译阶段（Compiler）对元素进行静态分析后，在生成的 render 函数里为动态节点注入的二进制整型标记（如 TEXT = 1, CLASS = 1 << 1 等）。
2. 运行时（Runtime），当执行 patch 逻辑时，系统能够通过位运算（如 patchFlag & PatchFlags.TEXT）快速判断该节点“仅有文本需要更新”或“仅有 class 需要更新”，直接切入目标属性更新函数，完全跳过子节点比对、其他属性比对等多余的执行分支。
3. 进一步拓展大厂面试追问：在真实业务中如果一个元素同时具有动态 class、动态 style、动态 id 时，PatchFlag 是如何演变的？编译期会对其进行位或运算合并（如 CLASS | STYLE），当 patch 发现是复合属性时，会通过多重分支合并更新。如果属性过于复杂（如 v-bind="object"）导致无法在编译期静态分析其 Key 范围，则会降级为 FULL_PROPS = 1 << 4 标记，退化为全量属性 diff，以确保渲染的正确性。

### Q2 [multiple]
以下哪些属于 Vue 3 编译时优化手段？
A. 静态提升（hoist）
B. 事件监听器缓存
C. Block tree 动态子节点收集
D. 每次渲染都重建全部 vnode
答案：ABC
解析：
💡 它解决了什么问题：
解决了在频繁组件重渲染过程中，由于重复执行 render 函数导致的大量临时 VNode 对象频繁创建与销毁，从而引发的高频垃圾回收（GC）开销与内存抖动，同时消除了在 Diff 时对静态内容进行无效遍历的系统开销。

🔍 核心原理解析（防拷打）：
1. 静态提升（Static Hoisting）将不依赖组件状态的静态 VNode 节点提取到 render 函数外部声明为常量，使得每次重渲染时能直接复用内存中同一个 VNode 实例，避免重复创建，并将该节点的 patch 开销降为 O(1)。
2. 事件监听器缓存（Cache Handlers）将 inline 事件绑定（如 @click="foo"）包装成一个缓存的代理函数。在后续更新中，由于绑定的函数引用从未改变，从而完全规避了子组件因为属性引用变化而触发的非必要 patch 更新。
3. 进一步拓展大厂面试追问：Block Tree 设计的边界是什么？它是如何避免“静态叶子节点”被 diff 的？Block Tree 会将含有动态节点的元素（Block）在编译期维护成一个 dynamicChildren 数组。在 patch 时，它不再进行传统的递归树形遍历，而是直接一维扁平遍历 dynamicChildren。然而，遇到 v-if 或 v-for 等会动态改变 DOM 树物理结构的指令时，会强制将其定义为新的“Block 边界”，隔离其内部的动态节点，从而保证了即使在结构不稳定的场景下，扁平收集依然安全。

### Q3 [judgment]
在 Vue 3 的虚拟 DOM 更新阶段，Block Tree 的设计目标是让 diff 复杂度更接近于‘动态节点数量’而非‘整棵模板的节点大小’。
答案：对
解析：
💡 它解决了什么问题：
解决了在复杂模板中，大量的静态 DOM 节点（如布局 div、表单标签等）混杂在少量的动态节点中，导致运行时 Diff 算法被静态结构牵制，无法实现针对“动态部分”做定向精确更新的致命痛点。

🔍 核心原理解析（防拷打）：
1. Block Tree 将虚拟 DOM 的层级关系扁平化。在一个 Block 容器内部，编译期会自动扫描所有动态节点（带有 PatchFlag 的节点），并将其扁平地收集到根 Block 的 dynamicChildren 数组中。
2. 运行时在 Diff 阶段，如果检测到 Block 节点，它会直接忽略常规的 children 数组，而是直接扁平遍历 dynamicChildren 执行精准更新，使算法的时间复杂度从模板整体节点数 O(N) 完美退变为仅与动态节点数相关的 O(M)。
3. 进一步拓展大厂面试追问：当模板中存在 v-if 条件渲染分支时，dynamicChildren 的扁平解构如何不发生错位？Vue 采用的解决手段是“嵌套 Block 机制”。v-if 的每个分支都会被编译器单独编译为一个独立的子 Block，当 v-if 条件切换时，父 Block 的 dynamicChildren 会将该子 Block 作为整体进行更新。在子 Block 内部，又独立维护其内部的 dynamicChildren，通过这种树形的 Block 嵌套，在保证结构稳定性的同时，依然保留了扁平 Diff 的性能优势。

### Q4 [single]
在 Vue 3 子节点双端 Diff 算法的 'patchKeyedChildren' 阶段中，先做"前置扫描 + 后置扫描"的主要目的是什么？
A. 为了生成 source map
B. 快速跳过头尾稳定区，缩小中间复杂 diff 范围
C. 为了兼容 IE11
D. 为了让 key 失效
答案：B
解析：
💡 它解决了什么问题：
解决了在大部分列表更新（如分页、尾部追加、头部追加、仅有个别元素变动）时，如果直接进入全量的最长递增子序列（LIS）或乱序映射表（Map）计算，会导致严重的 CPU 算力与内存浪费。

🔍 核心原理解析（防拷打）：
1. patchKeyedChildren 的第一阶段和第二阶段分别是前置扫描（Sync from start）和后置扫描（Sync from end）。
2. 它使用双指针从新旧列表的头部和尾部同时开始向中间逼近，只要节点的 key 和 type 完全相同，就直接对其进行 patch 复用，直到遇到第一个不匹配的节点才停下。这一步旨在快速剥离完全不需要重排的“首尾稳定区”。
3. 进一步拓展大厂面试追问：在完成首尾扫描后，除了中间不稳定乱序区外，有哪些可以直接退出的黄金路径？如果前置/后置扫描后：一 旧节点全部扫描完毕，新节点仍有剩余，说明是单纯的“插入/追加”场景，直接循环挂载新节点即可；二 新节点全部扫描完毕，旧节点仍有剩余，说明是单纯的“删除”场景，直接循环卸载老节点即可。只有在新旧节点均有剩余且首尾不匹配时，才会启动最耗费性能的乱序 Diff 流程，这使得 80% 的日常更新能以 O(N) 的极佳效率完成。

### Q5 [single]
在 Vue 3 的列表乱序 Diff 算法中，用于映射新旧节点索引的 'newIndexToOldIndexMap' 数组中，值为 '0' 通常表示什么？
A. 该节点在旧序列中存在且无需移动
B. 该节点是静态节点
C. 该新节点在旧序列中不存在，需要新建
D. 该节点需要立即卸载
答案：C
解析：
💡 它解决了什么问题：
解决了一维映射数组中由于“无法区分索引 0 与空初始状态”导致的逻辑混乱隐患。它用于构建一个极高效率的物理内存数组，避免了使用高开销的对象映射，同时精确度量哪些节点是“需要全新挂载”的，哪些是“可以从老 DOM 中复用”的。

🔍 核心原理解析（防拷打）：
1. newIndexToOldIndexMap 的长度为新列表乱序区的长度，其默认填充值为 0。
2. 在遍历旧乱序区建立映射时，我们将对应旧节点的旧索引 oldIndex 填入该数组。为了防止当 oldIndex 恰好为 0 时与初始值冲突，填入的值被设定为 oldIndex + 1。因此，数组中值为 0 的项代表“新节点在旧列表中根本不存在”，必须创建并挂载全新 DOM 节点。
3. 进一步拓展大厂面试追问：在这个 Map 填充完成后，Vue 是如何判断整个列表是否发生了“移动”的？Vue 维护了一个全局状态变量 moved。在遍历旧节点并填充 Map 时，如果发现本次匹配到的新节点索引 newIndex 呈现“非单调递增”状态（即当前 newIndex 小于之前记录的 maxNewIndexSoFar），则意味着节点顺序被打乱，会将 moved 设为 true。这决定了后续是否需要执行高成本的 LIS 最长递增子序列计算及 DOM insertBefore 重排逻辑。如果 moved 始终为 false，则说明虽然在中间区，但节点顺序完全没有被打乱，只更新属性即可，从而避免了重排开销。

### Q6 [multiple]
在 Vue 3 列表 Diff 的中间乱序区比对中，使用 LIS（最长递增子序列）算法优化时，以下哪些说法是正确的？
A. 位于 LIS 的节点可保持相对顺序，通常不需要移动
B. 不在 LIS 的老节点更可能触发移动
C. LIS 的主要价值是减少 DOM move 次数
D. 使用 LIS 后就不需要处理新增和删除
答案：ABC
解析：
💡 它解决了什么问题：
解决了在子节点乱序重排时，如果盲目将所有节点全部执行 DOM 物理移动，会引发极其高昂的浏览器 DOM 树重绘重排开销的致命痛点。

🔍 核心原理解析（防拷打）：
1. 列表乱序更新时，我们需要根据 newIndexToOldIndexMap 计算出“新节点在旧节点中最长且顺序递增的索引子序列”（即最长递增子序列，LIS）。
2. 位于这个子序列中的索引所对应的新节点，其在 DOM 中相对前后顺序在更新前后是保持稳定的。因此，在后面的 DOM 移动阶段，这些节点在 DOM 树中被视作“绝对锚点”，完全保持不动。我们只去物理移动那些“不在子序列内”的动态节点。
3. 进一步拓展大厂面试追问：在计算最长递增子序列时，Vue 3 的底层算法复杂度是多少？它的核心原理是什么？Vue 3 内部实现了一个 O(N log N) 复杂度的 LIS 计算算法，它结合了“二分查找”和“回溯”指针重建。算法在内存中动态维护一个递增轨迹数组，通过二分查找快速判定插入位置，最终通过保存的 parent 指针反向回溯重建出真正的最长子序列索引，这是极其硬核的算法性能调优。

### Q7 [single]
在 Vue 3 的 'patchKeyedChildren' 最后阶段，运行时需要把新增或需要移动的节点插入到正确 DOM 位置。由于 DOM 插入通常需要 'anchor' 表示“插到哪个节点前面”，为什么 Vue 常从后向前处理这批节点？
A. 从后向前处理可以避免事件监听丢失
B. 当前节点右侧的节点通常已经处理完并处于稳定位置，更容易作为插入锚点 anchor
C. 因为前向遍历语法不支持
D. 为了跳过 key 校验
答案：B
解析：
💡 它解决了什么问题：
解决了在插入全新节点或移动现有节点时，由于依赖的参照锚点（Anchor）尚不存在或处于不稳定状态，导致 DOM 操作不得不频繁重新检索或出错，增加了逻辑开销和出错的概率。

🔍 核心原理解析（防拷打）：
1. 浏览器的原生 DOM 插入方法为 parentNode.insertBefore(newNode, referenceNode)。这意味着要插入一个节点，我们必须拥有一个“已经处于正确位置且保持稳定的 referenceNode（即锚点）”。
2. 如果从前向后处理，当前处理节点右侧的兄弟节点可能尚未被处理（未移动或未挂载），无法作为安全的锚点。
3. 而如果选择从后向前处理，由于右侧节点在逻辑上先被处理，它们要么已经被挂载完成，要么已经被移动到最终的正确位置。因此，我们总是能够安全地将右侧节点作为锚点（若右侧为空则以 null 作为锚点，退化为 appendChild），极大地简化了定位算法的实现难度。
4. 进一步拓展大厂面试追问：在并发复杂渲染或者大列表无限滚动场景下，这种倒序遍历渲染对浏览器的布局回流有什么微弱的正面影响？虽然从后向前在微观 DOM 接口调用上没有改变 layout tree，但在某些复杂的 CSS Flexbox / Grid 布局环境中，先挂载后面的元素、再在其前面插入元素，部分浏览器渲染引擎能够减少因后发位置变动带来的多次全局布局重排计算，提供更好的渲染平滑度。

### Q8 [judgment]
在 Vue 3 的组件生命周期中，首次挂载阶段静态节点也会被创建，只是在后续的重渲染与更新中通常会被优化跳过。
答案：对
解析：
💡 它解决了什么问题：
解决了首次渲染时必须生成完整 DOM 结构的“硬性渲染要求”与后续更新时静态元素无需重复处理的“优化收益”之间的技术矛盾。

🔍 核心原理解析（防拷打）：
1. 首次挂载（Mount）是页面的零到一初始化。在此阶段，模板中的所有节点（无论是静态还是动态）都必须被执行一遍 VNode 创建并物理生成为真实的 DOM 树节点，否则页面将无法呈现出完整结构。
2. 优化设计的精妙取舍：虽然首次挂载时静态节点没有任何“对比跳过”的性能红利，但由于编译期静态提升（Hoisting）的存在，这些静态节点的 VNode 已经在外部被缓存。因此，多次组件实例挂载时，可以直接共享相同的静态 VNode 实例，避免了分配内存的开销。
3. 进一步拓展大厂面试追问：首次挂载阶段，如果静态节点非常庞大（例如一个包含几千字说明协议的静态 modal），静态提升是否会带来弊端？这会导致生成极其臃肿的渲染代码，增大 JS 包。为此，Vue 3 引入了“静态提升字符串化（Static Stringify）”优化。当检测到连续的静态节点达到一定阈值时，编译器会直接将其合并为一个 createStaticVNode("html_string", count)。运行时在挂载时直接使用浏览器的原生 C++ innerHTML 进行超高速度的模板解析与 DOM 创建，这不仅缩减了 JS 体积，还把大型静态块的挂载速度提升了数倍之多。

### Q9 [single]
在 Vue 3 的 Block Tree 编译优化路径中，'dynamicChildren' 数组更接近哪种角色？
A. 完整节点树的镜像副本
B. 只包含动态节点的扁平"快速通道"
C. 服务端 hydration 的 HTML 字符串
D. 编译期产物映射表
答案：B
解析：
💡 它解决了什么问题：
解决了虚拟 DOM 的 Diff 算法运行效率深受 DOM 树嵌套层级深度影响的宿命。它将复杂的树状 Diff 转换成了一维的数组 Diff，在包含大量多级嵌套且多静态元素的组件中，起到了惊人的降维提速作用。

🔍 核心原理解析（防拷打）：
1. 当一个虚拟 DOM 节点被标记为一个 Block 时，其对应的 VNode 在创建时，编译生成的代码中会利用一个特殊的收集上下文将它下面所有层级内带有 PatchFlag 的动态子节点引用提取出来，保存在这个 Block 节点的 dynamicChildren 属性中。
2. 在更新时，如果发现节点具有 dynamicChildren，运行时算法会直接放弃递归其常规 children 树，而是执行静态检测的一维循环直接对 dynamicChildren 数组中的元素进行 patch。
3. 进一步拓展大厂面试追问：在哪些特定场景下，dynamicChildren 的扁平遍历必须被强行中断或局部退化为常规深度 Diff？当遇到 v-for 生成的 Fragment，或者包含 v-if 条件渲染的分支 Block，以及手写的自定义插槽渲染时，由于这些区域的子节点数量和空间结构随时可能改变，原本在 Block 根节点上收集的扁平路径将无法保证安全性。此时，这些指令对应的节点会在编译期生成独立的“嵌套 Block”，父 Block 的扁平遍历在到达该节点时，会对这个子 Block 整体进行 patch，从而在局部回归正常的嵌套 Diff 规则。

### Q10 [multiple]
在 Vue 3 子节点乱序 Diff 比对中，哪些情况更容易导致节点进入 DOM "移动"逻辑，而不是"仅更新属性"逻辑？
A. key 存在且新索引出现逆序
B. 新旧节点类型相同且位置不变
C. 中段乱序导致 maxNewIndexSoFar 回退
D. 节点在 LIS 中
答案：AC
解析：
💡 它解决了什么问题：
解决了无法精准确定列表元素顺序是否被“打乱（Moved）”的问题，避免了在列表完全没有变动、或者只是简单的属性修改时，也去执行最长递增子序列计算与物理 DOM 重排这种大杀器，实现了最合理的算力分级策略。

🔍 核心原理解析（防拷打）：
1. 在列表乱序比对的遍历旧节点过程中，Vue 维护了一个代表当前匹配到的新节点索引的最大值 maxNewIndexSoFar。
2. 如果在遍历中，新匹配到的节点索引 newIndex 一端一直都是单调递增的（即 newIndex >= maxNewIndexSoFar），则说明新节点在旧列表里的物理顺序并没有发生逆序，只需要对它们执行属性对比更新即可。
3. 进一步拓展大厂面试追问：一旦发现新索引出现了回退（即 newIndex < maxNewIndexSoFar，moved 被置为 true），Vue 接下来在具体执行 DOM 移动时是怎么确定移动顺序和范围的？一旦判定 moved 为真，Vue 会根据 newIndexToOldIndexMap 计算最长递增子序列（LIS），然后使用倒序双指针进行扫描。扫描时，如果发现当前待处理的新节点索引不在 LIS 数组中，就会调用 move 方法（底层执行 insertBefore）将其移动到它倒序处理中右侧的兄弟节点前面；若在 LIS 中，则直接跳过，保持静止不动。

### Q11 [judgment]
在 Vue 3 中，没有 'key' 的列表在复杂重排场景下，通常比有唯一 'key' 的列表更容易实现 DOM 节点的稳定复用。
答案：错
解析：
💡 它解决了什么问题：
解决了部分开发者因缺少对虚拟 DOM 底层机制的认知，忽视 key 属性的价值或乱用随机 key，从而在生产环境中引发一系列组件状态混乱（如表单输入残留）以及无端性能开销的痛点。

🔍 核心原理解析（防拷打）：
1. 如果列表没有 key，Vue 在 Diff 子节点时会退化为“就地复用（In-place Patch）”算法。这意味着在遍历时，Vue 仅仅是按照新旧数组的索引位置（0 对 0，1 对 1）强行进行配对并更新其内部 Props。
2. 缺陷与安全风险：如果列表发生了插入、删除或顺序翻转，“就地复用”会直接把原本属于 A 节点的 Props 强制写到原本是 B 节点的 DOM 元素上。此时如果该 DOM 包含用户输入状态（如 input 里的文字）或非受控组件内部状态，由于 DOM 节点物理上被强制复用，这些非受控状态就会残留并在错误的位置展示，造成极其严重的业务逻辑错误。
3. 进一步拓展大厂面试追问：既然无 key 有上述痛点，为什么 Vue 内部仍然默认保留无 key 路径？甚至在某些特定场景下，无 key 的更新效率反而高于有 key？因为当列表非常简单（如纯静态文本展示列表，没有任何用户输入或状态残留），且仅仅是局部文字更新时，无 key 的“就地复用”由于完全不需要建立 Map 索引映射，也完全不需要执行复杂的双端扫描和 LIS 移动计算，其在 JS 运行层面的 CPU 开销是最低的。

### Q12 [single]
在 Vue 3 模板编译优化的 Block Tree 设计中，为什么 v-for 相关的 Fragment 常被单独视为一个 Block 边界？
A. 因为它只包含静态节点
B. 因为其子节点数量或顺序极易发生变动，需要独立且更稳定的处理范围
C. 因为 'v-for' 不参与 Diff 过程
D. 因为必须关闭 key
答案：B
解析：
💡 它解决了什么问题：
解决了扁平 Block Tree 优化在遭遇“动态不确定列表（如 v-for）”时可能产生的物理结构破坏隐患。通过在列表外部强制设立 Block 哨兵边界，将高度不稳定的列表区域进行隔离，使得父组件的其他区域依然能安全地走扁平 Diff 快速通道。

🔍 核心原理解析（防拷打）：
1. v-for 指令在渲染时，由于其列表项的个数、内容和顺序是完全在运行时决定的，因此在编译期无法确定其真实的 DOM 结构。
2. 如果不加以隔离，v-for 内部动态生成的 VNode 就会直接渗透并混入到其外层 Block 的 dynamicChildren 中，导致整个组件的动态子节点收集队列发生错乱。因此，Vue 在编译期会将所有 v-for 区域编译成一个特殊的 Fragment 节点，并为该 Fragment 强制开启 Block 属性。
3. 进一步拓展大厂面试追问：除了 v-for 之外，还有哪些指令或语法会在编译期强制开启一个 Block 边界以切断父 Block 的直接动态收集？条件渲染指令 v-if / v-else-if / v-else 以及特殊的 <slot> 插槽渲染也会强制生成 Block。因为 v-if 的分支切换会彻底改变子树的骨架拓扑结构，而 <slot> 的具体渲染内容完全由父组件传入。必须通过在这些节点上构建 Block 边界，才能确保组件树在发生结构突变时，底层的 Patch 依然稳定可靠。

### Q13 [single]
在 Vue 3 子节点乱序 Diff 的中段比对中，如果某个旧子节点在 'keyToNewIndexMap' 中找不到对应的新索引，应该如何处理？
A. 移动到末尾
B. 卸载该旧节点
C. 强制复用到最近节点
D. 标记为静态并跳过
答案：B
解析：
💡 它解决了什么问题：
解决了随着业务逻辑的变更，列表中的某些旧元素在新列表中已经不存在时，如果不及时清理这些已经失效的 DOM 节点，不仅会导致页面 UI 与数据状态不一致，还会引发严重的浏览器内存泄漏与 DOM 节点淤积。

🔍 核心原理解析（防拷打）：
1. 在 patchKeyedChildren 中段乱序比对的开始，会为新乱序区建立一个 keyToNewIndexMap（Key 到新索引的映射表）。
2. 接着，Vue 会遍历旧乱序区中的所有节点。对于每一个旧节点，通过它的 key 去 keyToNewIndexMap 中查找它在新列表中的位置。如果找不到，或者发现当前的更新数已经超出了新乱序区节点的数量上限，便说明该节点已经没有复用价值。
3. 此时，运行时便会安全、彻底地调用 unmount 方法，执行解绑指令、销毁子组件实例、移除 DOM 元素等一系列操作，清空其占用的所有资源。
4. 进一步拓展大厂面试追问：在卸载组件时，Vue 是如何处理其中的生命周期钩子与自定义过渡动画的？当执行 unmount 时，Vue 会触发 patch 中的卸载流程。它首先会执行组件的 beforeUnmount 钩子，然后遍历其子树执行副作用清理，并收集子组件上的 transition 离开类名。如果检测到有自定义过渡动画，Vue 会将真实 DOM 节点的物理移出时机“托管”给 transition 的动画结束回调，在动画播放完毕后才真正将其从 DOM 树中 remove，确保了极其良好的体验。

### Q14 [multiple]
面试里描述 Vue3 diff 优势时，哪些说法更准确？
A. 编译时标记 + 运行时定向 patch
B. 静态提升可减少重复 vnode 创建与 patch 成本
C. LIS 优化目标是减少 DOM move 次数
D. Vue3 完全不需要 patch children 逻辑
答案：ABC
解析：
💡 它解决了什么问题：
打破了传统虚拟 DOM “先全量重建，再全量递归对比”的效率桎梏，将前端框架渲染引擎的执行开销推向了“编译时与运行时完美契合”的工程制高点。

🔍 核心原理解析（防拷打）：
1. Vue 3 核心优势在于将“静态分析”融入到构建打包阶段。通过编译期分析出 PatchFlag 与 Block Tree，在运行时极大缩小了比对范围。
2. 静态提升（Hoisting）极大地减轻了频繁触发重渲染时，由于频繁分配内存产生的大量垃圾回收开销；乱序 Diff 阶段的最长递增子序列（LIS）算法将 DOM 移动成本压缩到了极致。
3. 进一步拓展大厂面试追问：对比 React 的 Fiber 架构在 Diff 上的设计理念，Vue 3 的这套编译优化有着怎样的底层思维差异？React 的核心思维是“运行时切片”加通用 Diff，它在编译期做的事极少，完全依赖运行时的单向链表遍历和可中断调度来保证大页面交互不卡顿，这是一种偏向重度运行时的“普适性”设计；而 Vue 3 则是“极致的编译时指导”，利用静态分析为运行时提供精准的精简指令。这种差异导致 Vue 在绝大多数日常更新中，无需任务调度切片也能轻松获得超高的帧率表现。

### Q15 [judgment]
在 Vue 3 列表 diff 的最后移动/插入阶段，如果运行时从后向前遍历新 children，当前节点要插入时通常可以把它右侧已经处理好的 DOM 节点作为 'anchor'，也就是“插到这个右侧节点前面”，这有助于稳定插入逻辑。
答案：对
解析：
💡 它解决了什么问题：
解决了 DOM 重排（Reorder）过程中插入节点需要依赖同级兄弟节点的引用作为参数的问题。通过自后向前的遍历顺序，确保了任何时候执行 insertBefore 操作时，其右侧的目标兄弟节点一定是一个已经归位并稳定的 DOM 元素。

🔍 核心原理解析（防拷打）：
1. 浏览器 insertBefore API 在插入节点时，要求指定的目标锚点节点本身必须已经在 DOM 树中并且位置固定。
2. 在倒序遍历中，我们从新列表乱序区的最后一个节点开始处理，因为其右侧的所有节点在此之前都已经优先完成了 patch、move 或 mount。所以，我们可以直接将右侧的第一个稳定节点作为锚点传入。
3. 进一步拓展大厂面试追问：如果在处理过程中，右侧确实没有任何节点（即当前节点是新列表的尾元素），此时 anchor 会是什么？如果是尾元素，anchor 会是 null。此时底层调用 insertBefore(child, null)，浏览器渲染引擎会自动将其追加到父容器的末尾，这同样是一个百分之百稳定的预期行为。

### Q16 [single]
在 Vue 3 中，当用户手写 render 函数且缺乏编译器注入的 PatchFlag 等优化标记时，更常见的结果是？
A. 自动补齐全部 PatchFlag 并保持同等优化
B. 部分优化路径收益下降，更依赖通用 diff 逻辑
C. 直接无法渲染
D. 自动退化到 Vue2 运行时
答案：B
解析：
💡 它解决了什么问题：
解决了当开发者需要极大自由度、手写 JSX 或复杂渲染逻辑时，框架如何保证系统的稳定和向后兼容的痛点。它提供了一条安全降级的“兜底逻辑”，确保了页面依旧是绝对正确的。

🔍 核心原理解析（防拷打）：
1. 如果开发者手写 render 函数，由于在运行期执行的 VNode 节点上没有 PatchFlag（或者其值为默认的 -1，即 HOISTED 代表非动态分析节点），运行时渲染引擎将无法启用 Block Tree 快速通道。
2. 运行时会自动将该节点的 Diff 逻辑降级为 Vue 2 式的“全量树状递归比对（Full Diff）”。它会对子节点的属性、样式、类名以及 children 列表执行全量检查与 patch，以保证所有潜在的变更都得到正确呈现。
3. 进一步拓展大厂面试追问：在手写 JSX 时，如果依然希望获得类似 PatchFlag 的更新性能，有什么手动优化的途径？开发者其实可以手动声明 PatchFlag（例如在 createVNode 的第四个参数中显式传入二进制常量，如 PatchFlags.TEXT）。但这极易因为人工误判属性动态性而引入 UI 渲染不一致的 bug。在绝大多数日常开发中，依然强烈建议使用 SFC 模板语法，让 Vue 编译器进行全自动的安全静态分析。