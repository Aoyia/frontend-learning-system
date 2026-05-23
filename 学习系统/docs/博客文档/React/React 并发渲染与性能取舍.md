---
title: React 并发渲染与性能取舍：从卡顿页面到可中断更新
module: react
difficulty: 困难
tags: [react, concurrent-rendering, scheduler, performance, senior-frontend]
sourceType: original
sourceTitle: 面向中高级前端面试的 React 渲染机制专项
sourceUrl:
sourceAuthor:
originalPath:
order: 1
created: 2026-05-21
updated: 2026-05-21
---

# React 并发渲染与性能取舍：从卡顿页面到可中断更新

这篇解决的是中高级面试里常见的 React 追问：**为什么页面会卡、为什么一次 setState 不等于一次 DOM 更新、为什么 React 18 要引入并发能力，以及这些能力不能替代哪些工程优化**。

中高级前端不能只说“用 memo 优化”。更好的回答是：

> 先判断卡顿来自渲染计算、提交 DOM、主线程长任务还是请求数据；React 的并发能力主要让低优先级渲染可中断、可让路，但它不能让昂贵计算消失，也不能自动修复组件边界和数据结构问题。

## 1. 它解决什么问题？

React 应用里常见的卡顿通常来自这些场景：

- 输入框一边输入，一边过滤大列表，输入明显跟手性差。
- 切换筛选条件后，整页大量组件一起重渲染。
- Tab 切换、搜索、拖拽、弹窗打开时主线程被同步计算占满。
- 数据层更新范围过大，局部变更导致整个页面树更新。

React 并发能力不是“多线程渲染”。它的核心价值是：==把不同紧急程度的更新分层，让不紧急的渲染可以被更紧急的用户输入打断或延后==。

## 2. 核心流程

React 更新大致可以分成：

```txt
触发更新
  ↓
进入调度
  ↓
Render 阶段计算新的 React tree
  ↓
Commit 阶段把变更提交到 DOM
  ↓
浏览器绘制
```

关键区别：

| 阶段 | 是否可中断 | 做什么 |
| --- | --- | --- |
| Render | 并发模式下可中断 | 计算新树、执行组件函数、比较变更 |
| Commit | 不可中断 | 修改 DOM、执行 layout effect |

所以，如果昂贵工作发生在 Commit 阶段、DOM 测量阶段或大段同步 JS 里，`startTransition` 也不能直接救回来。

## 3. urgent update 与 transition update

用户输入、点击反馈、光标移动属于 urgent update，应尽快响应。

列表过滤、复杂图表刷新、非关键面板切换属于 transition update，可以让路。

```tsx
import { startTransition, useState } from 'react'

function SearchPanel({ allItems }) {
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')

  function onChange(e) {
    const next = e.target.value
    setKeyword(next)

    startTransition(() => {
      setQuery(next)
    })
  }

  const visibleItems = allItems.filter(item => item.name.includes(query))

  return (
    <>
      <input value={keyword} onChange={onChange} />
      <List items={visibleItems} />
    </>
  )
}
```

这里的判断标准不是“用了 transition 就高级”，而是：

- 输入框值必须立刻更新。
- 列表过滤可以晚一点更新。
- 用户更关心输入跟手，而不是列表每个字符同步刷新。

## 4. useDeferredValue 的适用边界

`useDeferredValue` 适合把某个值的消费延后，让重组件基于延后的值更新。

```tsx
const deferredKeyword = useDeferredValue(keyword)
const filtered = useMemo(
  () => filterBigList(items, deferredKeyword),
  [items, deferredKeyword]
)
```

适合：

- 搜索结果列表。
- 大图表。
- 低优先级预览区域。

不适合：

- 表单输入值本身。
- 必须实时一致的金额、权限、提交状态。
- 安全相关反馈。

## 5. memo、useMemo、useCallback 不是默认答案

性能优化最容易犯的错是把 `memo/useMemo/useCallback` 当成三件套乱套。

更可靠的顺序：

1. 用 React DevTools Profiler 或浏览器 Performance 录制确认问题。
2. 找到重渲染范围：是谁更新，谁被带着更新。
3. 缩小状态作用域，避免全局状态牵连整棵树。
4. 稳定 props 引用，减少不必要子树渲染。
5. 再用 `memo/useMemo/useCallback` 固化边界。
6. 如果列表巨大，优先考虑虚拟列表、分页或服务端筛选。

`useMemo` 本身也有成本。它适合缓存昂贵计算或稳定引用，不适合包住所有表达式。

## 6. 真实客户问题

客户后台有一个“客户画像”页面：

- 左侧筛选条件很多。
- 中间是 2 万条客户列表。
- 右侧是图表统计。
- 输入筛选词时页面明显卡顿。

排查路径：

1. Performance 录制发现输入时出现多个 80ms 以上 Long Task。
2. React Profiler 发现输入框状态更新导致列表、图表、详情面板全量重渲染。
3. `console.count` 验证多个无关组件被状态更新牵连。
4. 把输入框本地值和筛选 query 拆开。
5. 用 `startTransition` 延后列表筛选。
6. 图表使用 `useDeferredValue` 消费延后的筛选条件。
7. 列表改成虚拟列表，并把筛选尽量下推到服务端。
8. 增加性能预算和交互耗时监控，避免回退。

## 7. 常见问题怎么定位？

| 现象 | 优先检查 |
| --- | --- |
| 输入不跟手 | 同步计算、受控输入牵连大组件、transition 边界 |
| 切换 Tab 卡顿 | Tab 内容是否一次性挂载、图表是否同步初始化 |
| memo 后仍重渲染 | props 引用是否每次新建、context 是否变化 |
| 页面卡但 React Profiler 不明显 | 非 React JS、DOM 测量、第三方库、长任务 |
| useMemo 无效 | 依赖项是否总变化、计算是否真的昂贵 |
| Commit 很慢 | DOM 数量、layout effect、同步布局测量 |

## 8. 大厂面试追问

- React 并发渲染是不是多线程？
- Render 和 Commit 哪个可中断？
- `startTransition` 适合什么更新，不适合什么更新？
- 为什么 `memo` 后子组件还是渲染？
- Context 更新为什么容易扩大重渲染范围？
- React 性能问题怎么用 Profiler 证明？
- 虚拟列表和并发渲染解决的是同一个问题吗？

## 9. 推荐阅读

- [React 官方文档：useTransition](https://react.dev/reference/react/useTransition)
- [React 官方文档：useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [React 官方文档：memo](https://react.dev/reference/react/memo)
- [React 官方文档：useMemo](https://react.dev/reference/react/useMemo)
- [React 官方文档：Profiler](https://react.dev/reference/react/Profiler)

## 10. 作业

1. 写一个包含输入框、1 万条列表和统计面板的小 demo，先故意让输入卡顿。
2. 用 Performance 面板录制一次输入，标出 Long Task 和用户输入之间的关系。
3. 用 React Profiler 找到被输入状态牵连的组件。
4. 分别用状态下沉、`startTransition`、`useDeferredValue`、虚拟列表优化，记录每一步改善了什么。
5. 用一句面试版解释：为什么并发渲染不能替代数据结构和组件边界优化。

## 📝 面试题自测

### Q1 [single]
在 React 18 渲染性能与并发更新场景中，React 并发能力主要解决哪类问题？
A. 让低优先级渲染可以让路给更紧急的用户更新：
   例如输入框的 value 更新是 urgent update，搜索结果列表可以放进 transition，先保证输入跟手。
B. 让浏览器 DOM 操作变成多线程：
   React 的并发渲染不是 DOM 多线程，Commit 阶段仍然要在主线程提交 DOM 变更。
C. 自动消除所有 JS 计算成本：
   昂贵过滤、排序、图表计算仍然存在，必要时要用 memo、Worker、分页或虚拟列表处理。
D. 自动减少接口请求数量：
   请求数量属于数据层缓存、去重和失效策略问题，不是 React 并发渲染直接解决的问题。
答案：A
解析：
- 结论：本题选择 A。并发能力的核心是调度和可中断渲染，不是让 DOM 或 JS 自动多线程。
- 逐项拆解：
  - A：让低优先级渲染可以让路给更紧急的用户更新应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：让浏览器 DOM 操作变成多线程不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - C：自动消除所有 JS 计算成本不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - D：自动减少接口请求数量不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q2 [single]
在 React 18 渲染性能与并发更新场景中，React 更新流程中通常不可中断的是哪一阶段？
A. Commit 阶段
B. Render 阶段
C. 组件函数计算前的等待阶段
D. startTransition 回调注册阶段
答案：A
解析：
- 结论：本题选择 A。Commit 阶段会把结果提交到 DOM，必须保持一致性，不能随意中断。
- 逐项拆解：
  - A：Commit 阶段应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：Render 阶段不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - C：组件函数计算前的等待阶段不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - D：startTransition 回调注册阶段不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q3 [single]
在 React 18 渲染性能与并发更新场景中，搜索输入框输入不跟手，最合理的第一步是？
A. 先用 Performance 和 React Profiler 定位卡顿来源
B. 直接给所有组件加 memo
C. 删除所有状态
D. 把接口全部改成同步请求
答案：A
解析：
- 结论：本题选择 A。中高级排查要先取证，再决定优化手段。
- 逐项拆解：
  - A：先用 Performance 和 React Profiler 定位卡顿来源应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：直接给所有组件加 memo不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - C：删除所有状态不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - D：把接口全部改成同步请求不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q4 [single]
在 React 18 渲染性能与并发更新场景中，`startTransition` 更适合包裹哪类更新？
A. 大列表筛选结果更新：
   例如把列表查询条件更新放入 transition，让输入框先响应。
   ```tsx
   setKeyword(next)
   startTransition(() => {
     setQuery(next)
   })
   ```
B. 输入框当前字符显示：
   不适合放进 transition；用户输入本身是高优先级反馈，延迟会直接造成“不跟手”。
C. 支付确认按钮禁用状态：
   不适合延后；这是防重复提交和资金安全相关反馈，应立即生效。
D. 权限校验结果：
   不适合随意延后；权限和安全边界相关状态应保持清晰一致，不能为了视觉流畅牺牲正确性。
答案：A
解析：
- 结论：本题选择 A。列表结果可以延后，输入和安全关键反馈不应延后。
- 逐项拆解：
  - A：大列表筛选结果更新应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：输入框当前字符显示不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - C：支付确认按钮禁用状态不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
  - D：权限校验结果不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q5 [multiple]
在 React 18 渲染性能与并发更新场景中，React 页面重渲染范围过大时，可以考虑哪些方向？
A. 缩小状态作用域
B. 稳定传给子组件的 props 引用
C. 拆分 Context 或改用选择器订阅
D. 把所有状态都放到根组件
答案：ABC
解析：
- 结论：本题选择 ABC。根组件集中状态通常会扩大更新影响范围。
- 逐项拆解：
  - A：缩小状态作用域应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：稳定传给子组件的 props 引用应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - C：拆分 Context 或改用选择器订阅应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - D：把所有状态都放到根组件不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q6 [multiple]
在 React 18 渲染性能与并发更新场景中，`memo` 失效或收益不明显的常见原因包括？
A. 子组件每次收到新的对象或函数引用
B. Context 值变化导致子树更新
C. 组件本身计算很轻，缓存成本抵消收益
D. 浏览器不支持 HTML
答案：ABC
解析：
- 结论：本题选择 ABC。memo 只对 props 浅比较有帮助，不能解决所有更新来源。
- 逐项拆解：
  - A：子组件每次收到新的对象或函数引用应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：Context 值变化导致子树更新应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - C：组件本身计算很轻，缓存成本抵消收益应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - D：浏览器不支持 HTML不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q7 [multiple]
在 React 18 渲染性能与并发更新场景中，复杂列表卡顿时，除了 React 并发能力，还应考虑？
A. 虚拟列表
B. 服务端分页或筛选
C. 减少 DOM 数量
D. 在 render 里同步计算所有 10 万条数据
答案：ABC
解析：
- 结论：本题选择 ABC。巨大数据和 DOM 数量问题不能只靠调度解决。
- 逐项拆解：
  - A：虚拟列表应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - B：服务端分页或筛选应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - C：减少 DOM 数量应选。它抓住了 React 渲染性能的关键：更新优先级、渲染范围、引用稳定性或主线程成本。
  - D：在 render 里同步计算所有 10 万条数据不选。它把 React 性能问题简化成单一 API，忽略了 Render/Commit、状态边界或实际瓶颈取证。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q8 [judgment]
在 React 18 渲染性能与并发更新场景中，React 并发渲染意味着组件渲染和 DOM 提交都在浏览器多线程里完成。
答案：错
解析：
- 结论：本题判断为“错”。并发渲染是调度模型和可中断渲染能力，不等于 DOM 多线程提交。
- 判断标准：React 并发能力是调度模型，不是让所有昂贵计算和 DOM 提交自动消失。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

### Q9 [judgment]
在 React 18 渲染性能与并发更新场景中，如果 Commit 阶段很慢，`startTransition` 一定能彻底解决问题。
答案：错
解析：
- 结论：本题判断为“错”。Commit 阶段不可中断，DOM 数量、layout effect 和同步测量仍需单独治理。
- 判断标准：React 并发能力是调度模型，不是让所有昂贵计算和 DOM 提交自动消失。
- 反向理解：如果只看题目表面的“能不能做”，而不看边界、成本、风险和验证，就容易把中高级问题答成初级 API 题。
- 面试表达：React 性能题要先定位卡顿来源，再区分调度、组件边界、数据规模和 DOM 提交成本。

