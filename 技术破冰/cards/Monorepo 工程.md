---
title: Monorepo 工程
category: 前端工程化
tags:
  - frontend
  - engineering
  - monorepo
  - workspace
  - turborepo
  - changesets
difficulty: hard
status: draft
created: 2026-04-27
updated: 2026-04-27
---

# Monorepo 工程

## 1. 它属于哪个知识板块？

```txt
前端工程化
→ 多包仓库管理
→ Monorepo 工程
→ workspace / 增量构建 / 版本治理
```

==它**不是“把多个项目塞进一个仓库”**。Monorepo 真正解决的是**多个相关包之间的依赖、构建、版本和发布**怎么协同。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**Monorepo** 解决的是“**多个相关包要共享代码、协同发布、CI 不重复劳动**”的问题。==

当一个团队同时维护 Web 应用、移动端 H5、组件库、工具库、Node 服务、SDK，分散在多个仓库时常见痛点是：复用代码要发包，发包要等版本，版本不一致出 bug 难排，PR 要跨仓库提，CI 重复安装依赖、重复构建相同代码。

==所以 Monorepo 的核心**不是源码集中**，而是用 **workspace 把多个 package 当一个依赖图**，用**增量构建**避免重复劳动，用**版本治理**保证对外发布的产物可控。==

### 2.2 核心流程

```txt
package manager 识别 workspace 配置
→ 把所有内部包链接进各自的 node_modules
→ 内部包之间通过 workspace 协议引用
→ 改动后通过依赖图判断哪些包受影响
→ 增量执行 lint / typecheck / test / build
→ 由发布工具汇总 changeset
→ 决定哪些包升版本、生成 changelog、发布
```

### 2.3 关键词清单

1. workspace：包管理器提供的多包能力，pnpm `pnpm-workspace.yaml`、Yarn / npm 在 `package.json` 用 `workspaces` 字段。
2. workspace protocol：`workspace:*`、`workspace:^`，让内部包之间通过工作区直接链接，发布时再被替换成真实版本号。
3. dependency graph：依赖图，描述包与包之间的依赖关系，是增量构建和影响分析的基础。
4. hoisting / isolated node_modules：依赖提升 vs 严格隔离。pnpm 默认严格，避免幽灵依赖。
5. internal package：内部包，仓库里互相引用、不一定发布到 npm 的包。
6. affected：受影响包，基于 git diff 与依赖图算出本次改动会牵连哪些包。
7. task pipeline：任务流水线，例如 `build` 依赖于其依赖包的 `build`，由 Turborepo / Nx 编排。
8. remote cache：远程缓存，把构建结果按输入哈希存在远端，跨开发者和 CI 复用。
9. changeset：变更集，由 Changesets 工具维护，描述本次改动属于 patch / minor / major 以及给哪些包升版本。
10. project references：TS 的项目引用，配合 Monorepo 做跨包类型解析与增量编译。
11. peerDependencies：宿主依赖声明，组件库和插件常用，避免重复打包同一个 React。
12. private package：`"private": true`，标记内部包不允许被发布到 npm。

### 2.4 一句面试版

==Monorepo 的本质是用 **workspace 把多个 package 当一个依赖图**，用 **task pipeline 与远程缓存做增量构建**，用 **Changesets 这类工具做版本治理与发布**，让多包协作既能快速联调，又能稳定对外交付。==

### 2.5 最小 demo / 最小案例

#### pnpm workspace 最小骨架

```txt
repo/
├── pnpm-workspace.yaml
├── package.json
├── apps/
│   └── web/        // 业务应用
└── packages/
    ├── ui/         // 组件库
    └── utils/      // 工具库
```

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

业务应用引用内部包：

```json
{
  "dependencies": {
    "@org/ui": "workspace:*",
    "@org/utils": "workspace:*"
  }
}
```

#### Turborepo 最小流水线

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

`^build` 表示当前包的 `build` 依赖于**所有上游依赖包**的 `build`。Turborepo 会基于输入哈希做缓存，命中缓存就直接复用上次产物。

#### Changesets 最小流程

```bash
pnpm changeset            # 写一条变更
pnpm changeset version    # 升版本号 + 写 changelog
pnpm -r publish           # 按依赖图发布
```

### 2.6 常见坑怎么定位？

#### 内部包改了不生效

```txt
确认是否用了 workspace:* 而不是固定版本
→ 确认包的 main / module / exports 指向的是源码还是构建产物
→ 确认消费方是否走了缓存
```

#### CI 装依赖很慢

```txt
检查是否每个 job 都重复 install
→ 是否启用了 pnpm store / actions/cache
→ Turborepo / Nx 是否配置了 remote cache
→ 是否一次跑了所有包，而不是 affected
```

#### 发布后版本错乱

```txt
内部互相依赖时，是否每个相关包都加了 changeset
→ 发布顺序是否按拓扑排序
→ peerDependencies 范围是否过严或过松
```

#### 类型跨包不识别

```txt
是否每个包正确导出 .d.ts
→ tsconfig 是否配置了 references
→ 包的 exports 字段是否同时声明 types 条件
```

### 2.7 选型怎么判断？

| 维度 | pnpm workspace | Yarn workspaces | npm workspaces |
| --- | --- | --- | --- |
| 依赖隔离 | 严格，硬链接 + 符号链接 | 默认提升，PnP 可选严格 | 提升 |
| 幽灵依赖 | 容易暴露 | 取决于配置 | 容易出现 |
| 安装速度 | 通常较快 | PnP 模式下可不写 node_modules | 取决于版本 |

| 维度 | Turborepo | Nx | Bazel |
| --- | --- | --- | --- |
| 上手成本 | 低 | 中 | 高 |
| 生态侧重 | 前端为主 | 前端 + Node 多语言扩展 | 大型多语言企业 |
| 远程缓存 | 内置 | 内置 | 自建 |
| 适用规模 | 中小型到中大型 | 中型到大型 | 大型 / 跨语言 |

不要先选工具再找问题。优先顺序应该是：先有“多包协同 + 增量构建 + 版本治理”的真实痛点，再选最匹配的工具。

### 2.8 是否值得深入？

值得深入，但顺序不能倒：

1. 先理解 workspace 协议和内部包的依赖图。
2. 再掌握 affected 与拓扑排序的概念。
3. 然后引入 task pipeline 与缓存（Turborepo / Nx）。
4. 接着引入 Changesets 做版本治理与 changelog。
5. 最后再深入跨包类型 references、远程缓存、构建产物分发与私有 registry。

优先看官方资料：pnpm Workspace、Turborepo Docs、Nx Docs、Changesets。

## 3. 选择题自测

### Q1

Monorepo 最核心解决的问题是什么？

A. 让代码更短
B. 多个相关包共享代码、协同发布、CI 不重复劳动
C. 替代 Git
D. 让所有项目必须用同一个框架

答案：B

解析：Monorepo 不是“把项目塞一起”，而是依赖、构建、版本三件事一起治理。

### Q2

`workspace:*` 这种依赖协议的作用是什么？

A. 让内部包之间通过工作区直接链接，发布时替换成真实版本号
B. 自动跳过测试
C. 让外部用户也能直接用
D. 取消依赖

答案：A

解析：workspace 协议是 Monorepo 内部联调与发布两不误的关键。

### Q3

Turborepo / Nx 这类工具最核心的能力是什么？

A. 替代 Git
B. 基于依赖图做任务编排，并按输入哈希缓存任务产物
C. 自动写业务代码
D. 删除 node_modules

答案：B

解析：task pipeline + 缓存让“没变的就不重跑”，这是 Monorepo 提速的核心。

### Q4

Changesets 主要解决什么问题？

A. 替代 lockfile
B. 描述本次改动给哪些包升什么版本，并生成 changelog 与发布命令
C. 自动写测试
D. 自动写 README

答案：B

解析：Changesets 把版本号决定权交给改动者，发布时按依赖图统一处理。

### Q5

下面哪种现象最不该出现在一个治理良好的 Monorepo 里？

A. 内部包通过 `workspace:*` 引用
B. CI 用 affected 只跑改动相关包
C. 一个内部包升 major，但依赖它的其它包没有相应升版本和 changelog
D. 用 Changesets 维护 changelog

答案：C

解析：内部包的破坏性变更必须传导到下游包，否则发布出去的版本会让外部用户踩坑。
