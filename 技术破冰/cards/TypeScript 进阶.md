---
title: TypeScript 进阶
category: 前端工程化
tags:
  - frontend
  - engineering
  - typescript
  - type-system
  - tooling
difficulty: hard
status: draft
created: 2026-04-27
updated: 2026-04-27
---

# TypeScript 进阶

## 1. 它属于哪个知识板块？

```txt
前端工程化
→ 类型系统
→ TypeScript 进阶
→ 类型表达 / API 设计 / 项目编译
```

==它**不是补 TS 语法**，而是回答三个问题：怎么用类型**表达约束**、怎么用类型**设计公开 API**、怎么让 **tsc 在大项目里跑得动**。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**TypeScript 进阶**解决的是“**会写 type 不等于会用 type**”的问题。==

中级阶段的 TS 通常停在“给变量加类型”和“写几个 interface”。但实际工程中真正花时间的是：库的 API 类型、表单和接口的精确推导、复杂联合类型的窄化、Monorepo 里跨包的类型解析、tsc 编译性能、类型和运行时的边界。

==所以进阶的核心**不是炫技**，而是用类型把**“调用方哪些用法是合法的”、“哪些数据形态会出现在哪个分支”、“哪些字段必须一起出现”**这些**业务约束**写成编译器能检查的规则。==

### 2.2 核心流程

```txt
明确要表达的约束
→ 选用合适的类型工具（联合 / 交叉 / 条件 / 映射 / 模板字面量）
→ 让推导自动发生，而不是手写一堆显式类型
→ 在公开 API 边界上稳定类型契约
→ 用 satisfies / as const 收紧字面量
→ 评估编译性能与可读性
→ 不能用类型表达的，退回运行时校验
```

### 2.3 关键词清单

1. union / intersection：联合与交叉类型，分别表达“可能是 A 也可能是 B”和“同时满足 A 和 B”。
2. literal type / `as const`：字面量类型，配合 `as const` 把对象冻结成精确字面量集合。
3. discriminated union：可辨识联合，用一个共同字段（例如 `kind`、`type`）做窄化。
4. narrowing：类型窄化，例如 `typeof`、`in`、自定义类型守卫、`asserts` 函数。
5. conditional type：条件类型 `T extends U ? X : Y`，是工具类型的核心。
6. distributive conditional：联合类型在裸条件类型上的**自动分发**，包裹成元组可以关掉它。
7. `infer`：在条件类型里抽取子类型，用来从函数、Promise、数组、字符串里取出局部类型。
8. mapped type：映射类型 `{ [K in keyof T]: ... }`，配合 `as` 重命名键、`-?` 去除可选。
9. template literal type：模板字面量类型，用来表达 `on${Capitalize<EventName>}`、路径、SQL 片段这类字符串约束。
10. `satisfies`：让值在通过类型检查的同时**保留更精确的字面量类型**，比 `as` 安全。
11. variance：协变 / 逆变，函数参数位置是逆变的，常出现在“为什么这个函数不能赋值给另一个”问题里。
12. project references：`tsconfig` 的项目引用机制，用 `composite` 把大项目拆成多个可缓存的子项目。
13. `moduleResolution`：模块解析策略，`node`、`bundler`、`nodenext` 在 ESM 和 monorepo 下行为差异大。
14. `tsc --noEmit` / `tsc --build`：前者只做类型检查，后者基于 project references 做增量构建。

### 2.4 一句面试版

==TypeScript 进阶的核心是用**条件类型、`infer`、映射类型、模板字面量类型和 `satisfies`** 把业务约束沉淀到**类型层**，并通过 **project references 与合理的 `moduleResolution`** 把大项目的编译性能控制住，目标是让**调用方在编辑器里就被拦下错误用法**。==

### 2.5 最小 demo / 最小案例

#### 用可辨识联合表达“互斥参数”

```ts
type Result<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'err'; error: Error }

function unwrap<T>(r: Result<T>): T {
  if (r.kind === 'ok') {
    return r.data
  }
  throw r.error
}
```

调用方一旦写 `r.data` 而不先判 `kind`，编译器就会报错。

#### 用 `infer` 从函数签名抽返回值

```ts
type AsyncReturn<F> = F extends (...args: any[]) => Promise<infer R> ? R : never

type User = AsyncReturn<() => Promise<{ id: number; name: string }>>
```

#### 用模板字面量类型约束事件名

```ts
type EventName = 'click' | 'change' | 'submit'
type Handler<E extends EventName> = `on${Capitalize<E>}`

const a: Handler<'click'> = 'onClick'
```

#### `satisfies` 收紧字面量但不放弃类型校验

```ts
type Theme = Record<string, string>

const theme = {
  primary: '#1677ff',
  danger: '#ff4d4f'
} satisfies Theme

theme.primary
```

`theme.primary` 仍是精确字面量类型，而不是退化成 `string`。

### 2.6 大项目里 tsc 为什么慢？

```txt
单一巨大 tsconfig
→ 一次性 parse、resolve 所有文件
→ 修改一个文件触发全量类型检查
→ 复杂条件类型 / 深递归类型在每次检查时都展开
```

常见缓解手段：

1. 用 **project references** + `composite` 拆子项目，配合 `tsc --build` 做增量。
2. 关掉无关目录：`include` 精确，`exclude` 把测试、生成代码、构建产物排除。
3. 减少**深递归**和**全量 distributive** 条件类型，必要时用元组包裹。
4. 把“仅运行时使用”的类型断言改成 schema 校验（zod / valibot），避免类型层硬扛。
5. 用 `--diagnostics` / `--extendedDiagnostics` / `tsc --generateTrace` 找最慢的文件和最贵的类型实例化。

### 2.7 类型与运行时的边界

==类型只在编译阶段存在，**不会在运行时帮你校验任何用户输入或接口数据**。==

正确分工：

```txt
来源可信、形态稳定
→ 用 type / interface 表达即可

来源不可信（接口、用户输入、跨进程消息）
→ 运行时用 zod / valibot / yup 等做 schema 校验
→ 校验后再用类型断言进入 TS 世界
```

不要用 `as Foo` 强行把 `unknown` 当成业务类型，那等于关掉编译器。

### 2.8 是否值得深入？

值得，但要按梯度：

1. 先掌握 union、narrowing、可辨识联合，这是日常代码 80% 收益来源。
2. 再掌握泛型、`keyof`、`typeof`、映射类型，能写常用工具类型。
3. 然后理解条件类型、`infer`、distributive 行为、模板字面量类型。
4. 接着学会 `satisfies`、`as const`、`unknown` 与 `any` 的边界、自定义类型守卫。
5. 最后处理 project references、`moduleResolution`、tsc 编译性能、库的类型导出。

优先看官方资料：TypeScript Handbook、Release Notes、tsconfig Reference、Performance、Project References。

## 3. 选择题自测

### Q1

下面哪种写法最适合表达“互斥参数”？

A. 一个 interface 里把所有字段都写成可选
B. 用可辨识联合（discriminated union），通过共同字段做窄化
C. 全部用 `any`
D. 用枚举常量

答案：B

解析：可辨识联合让编译器在不同分支里推导出不同字段集合，比一堆可选字段更精确。

### Q2

`satisfies` 相比 `as` 的关键优势是什么？

A. `satisfies` 会允许该变量强行绕过 Strict 选项校验
B. `satisfies` 在通过类型检查的同时保留更精确的字面量类型
C. `satisfies` 会在编译期自动向源码中注入运行时类型保护
D. `satisfies` 能够直接对高阶函数的泛型参数执行静态断言

答案：B

解析：`as` 是断言，会强行通过；`satisfies` 仍然检查，且不放弃推导出的精确类型。

### Q3

为什么大型 TS 项目要用 project references？

A. 为了让代码格式化更快
B. 为了把单一巨大 tsconfig 拆成可独立缓存与增量构建的子项目
C. 为了禁止使用 ESM
D. 为了删除 `node_modules`

答案：B

解析：`composite` + `tsc --build` 让未变化的子项目走缓存，显著缩短大项目的检查时间。

### Q4

下面哪个理解最准确？

A. TypeScript 类型可以在运行时校验任何接口数据
B. TypeScript 类型只在编译阶段存在，运行时数据要靠 schema 校验库或手写校验保证
C. 加了类型就不需要测试
D. `any` 等于 `unknown`

答案：B

解析：类型不会在运行时执行，外部数据必须用运行时手段校验。

### Q5

`infer` 最常见的用途是什么？

A. 在条件类型里抽取子类型，例如从 `Promise<T>` 抽出 `T`
B. 替代 `console.log`
C. 自动写测试
D. 自动生成 UI 组件

答案：A

解析：`infer` 让你在条件类型分支里命名一个被推导出来的子类型，是工具类型的常用工具。
