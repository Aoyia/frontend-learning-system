---
title: 内部 NPM 包与库模式构建
category: 前端工程化
tags:
  - frontend
  - engineering
  - npm-package
  - library-build
  - vue-cli
  - rollup
  - umd
difficulty: medium
status: draft
created: 2026-04-29
updated: 2026-04-29
---

# 内部 NPM 包与库模式构建

## 1. 它属于哪个知识板块？

它属于：

```txt
前端工程化
→ 包管理器 / 构建工具
→ 内部 NPM 包
→ Library build
→ 包入口声明 / 模块格式 / 主工程消费
```

==**内部 NPM 包与库模式构建**解决的是“如何把一段通用前端能力做成**可版本化、可安装、可被主工程引用**的包”的问题。==

它不是单独的 Vue 知识，也不是单独的 npm 知识，而是把 **包管理器、构建工具、模块格式、`package.json` 入口声明、主工程消费方式** 串在一起。

## 2. 陌生命令：`vue-cli-service build --target lib`

### 2.1 它解决什么问题？

普通的 Vue CLI 构建：

```bash
vue-cli-service build
```

默认目标是 `app`，它会把项目打成一个可以部署访问的完整应用：

```txt
dist/
  index.html
  js/app.xxx.js
  js/chunk-vendors.xxx.js
  css/app.xxx.css
```

但是库模式构建：

```bash
vue-cli-service build --target lib --name MyWidget src/index.js
```

目标是 `lib`，它会把指定入口打成一个库：

```txt
dist/
  MyWidget.common.js
  MyWidget.umd.js
  MyWidget.umd.min.js
  MyWidget.css
```

==`vue-cli-service build --target lib` 的核心不是“部署页面”，而是把某个入口打成**给其他项目消费的库产物**。==

公司内部项目里常见它，通常是因为某个模块需要被复用：

1. 通用 Vue 组件。
2. 公司内部组件库。
3. 业务插件。
4. 埋点 SDK。
5. 低代码渲染器。
6. 表单设计器。
7. 地图、图表、富文本等复杂组件封装。
8. 被主工程动态加载的子模块。

### 2.2 命令拆解

```bash
vue-cli-service build --target lib --name MyWidget src/index.js
```

1. `vue-cli-service`：Vue CLI 项目里的命令入口，本质上封装了一套 webpack 构建链路。
2. `build`：执行生产构建。
3. `--target lib`：构建目标改成库，不再按完整应用输出。
4. `--name MyWidget`：库名，也会影响 UMD 全局变量名和产物文件名前缀。
5. `src/index.js`：库入口文件，从这里决定对外暴露什么。

### 2.3 核心流程

```txt
读取 lib 入口
→ 解析 Vue SFC / JS / TS / CSS / 静态资源
→ 调用 Vue CLI 内部 webpack 配置
→ 按 library 目标配置 output
→ 默认 external 掉 Vue
→ 输出 CommonJS / UMD / UMD min / CSS
→ package.json 指向这些产物
→ 主工程 import 或 script 引用
```

这条链路里最重要的是两个边界：

1. **源码边界**：包作者维护 `src/index.js`、组件源码和内部依赖。
2. **产物边界**：主工程只关心 `dist` 产物和 `package.json` 声明的入口。

==库模式构建的本质，是把“源码工程”变成一个有明确入口、明确格式、明确依赖边界的“可消费包”。==

## 3. 为什么会生成 UMD？

UMD 是 Universal Module Definition。

可以粗暴理解成：

==**UMD** 是一种兼容性很强的库格式：同一个产物既可以被 CommonJS `require()` 消费，也可以被 AMD 加载，还可以通过 `<script>` 暴露到全局变量。==

所以这个文件：

```txt
MyWidget.umd.js
```

可能被这样用：

```js
const MyWidget = require('@company/my-widget')
```

也可能被这样用：

```html
<script src="/assets/MyWidget.umd.js"></script>
<script>
  window.MyWidget.init()
</script>
```

为什么公司内部历史项目喜欢 UMD？

1. 老后台系统不一定有现代构建链路，但可以插 `<script>`。
2. 主工程可能不是 Vue CLI，也可能不是同一套构建工具。
3. 微前端、插件系统、低代码平台可能需要运行时动态加载一个 JS 文件。
4. 内部包需要同时兼容“npm import”和“浏览器全局变量”两种消费方式。

如果是现代纯 npm 依赖，并且主工程一定经过 Vite、webpack、Rollup 这类 bundler，ESM 或 CommonJS 通常更常见；UMD 更多是在兼容老系统或运行时脚本加载时有价值。

## 4. Vue 默认会不会打进包里？

Vue CLI 的 `lib` 模式默认会把 Vue external 掉。

也就是说，如果你的库里写了：

```js
import Vue from 'vue'
```

最终包里默认不会把 Vue 本体一起打进去。消费方需要自己提供 Vue：

1. 如果主工程通过 bundler 引用，Vue 会从主工程依赖里解析。
2. 如果通过 `<script>` 引用 UMD，页面上需要先有全局 `Vue`。

如果你希望把 Vue 也打进库产物，可以使用：

```bash
vue-cli-service build --target lib --inline-vue
```

但这不是默认推荐思路。因为内部组件库通常不希望每个包都内置一份 Vue，否则主工程里可能出现重复 Vue、体积变大、运行时上下文不一致等问题。

==对组件库或内部 Vue 包来说，Vue 通常应该放在 `peerDependencies`，由主工程统一提供。==

示例：

```json
{
  "peerDependencies": {
    "vue": "^2.7.0"
  }
}
```

## 5. 主工程怎么引用它？

### 5.1 npm 包方式

内部包发布到公司私有源后，主工程安装：

```bash
npm install @company/my-widget
```

然后引用：

```js
import MyWidget from '@company/my-widget'
import '@company/my-widget/dist/MyWidget.css'
```

这时主工程能找到入口，通常依赖 `package.json`：

```json
{
  "name": "@company/my-widget",
  "version": "1.2.3",
  "files": ["dist"],
  "main": "./dist/MyWidget.common.js",
  "unpkg": "./dist/MyWidget.umd.min.js",
  "style": "./dist/MyWidget.css"
}
```

### 5.2 UMD 脚本方式

某些老系统或动态加载场景可能直接加载文件：

```html
<script src="/libs/vue.js"></script>
<script src="/libs/MyWidget.umd.js"></script>
```

然后通过全局变量使用：

```js
window.MyWidget
```

这种方式不依赖主工程打包器，但要求你清楚：

1. 全局变量叫什么。
2. Vue 是否已经提前加载。
3. CSS 是否需要单独加载。
4. 产物路径是否稳定。

## 6. 看到这种内部包时怎么排查？

以后看到类似命令，按这个顺序看：

```txt
package.json scripts
→ build 命令
→ lib 入口文件
→ vue.config.js
→ dist 产物
→ package.json 入口字段
→ 主工程引用方式
```

重点问题：

1. **它打包哪个入口？** 看命令最后的 `src/index.js`、`src/lib.js` 或 `.vue` 文件。
2. **它暴露什么能力？** 看入口文件里的 `export default`、`export { ... }`、`install`。
3. **它输出什么格式？** 看 `dist` 里有没有 `.common.js`、`.umd.js`、`.css`。
4. **Vue 是否 external？** 看有没有 `--inline-vue`，以及 `peerDependencies`。
5. **CSS 怎么消费？** 看是否生成独立 CSS，主工程有没有 import 或 script 页面有没有 link。
6. **主工程怎么接入？** 搜包名、UMD 文件名、全局变量名。
7. **版本怎么管理？** 看公司私有 npm 源、lockfile、CI 发布流程。

## 7. 常见坑

### 7.1 `default` 多一层

如果入口文件既有默认导出又有命名导出，UMD 或 CommonJS 消费时可能出现：

```js
require('@company/my-widget').default
```

这通常和 webpack 的 `libraryExport`、入口导出方式、Babel 转译有关。排查时先看入口文件到底导出了什么。

### 7.2 样式没有生效

库模式通常会抽出 CSS：

```txt
MyWidget.css
```

主工程如果只 import JS，不 import CSS，就可能组件功能正常但样式丢失。

### 7.3 Vue 被重复打包

如果库里内置 Vue，主工程里又有 Vue，就可能出现：

```txt
主工程 Vue
内部包 Vue
```

这会带来体积变大、插件上下文不一致、组件实例异常等问题。组件库优先考虑 `peerDependencies`。

### 7.4 把应用误打成库

`--target lib` 适合打“可复用能力”，不适合打一个完整页面应用。

如果你的入口依赖路由、全局 store、环境变量、登录态、页面模板，那它可能更像一个应用，而不是一个库。

## 8. 它和 Vite / Rollup / tsup 的关系

`vue-cli-service build --target lib` 是 Vue CLI 时代的库模式方案，底层主要是 webpack。

现代项目里，类似问题也可以用：

1. Vite library mode。
2. Rollup。
3. tsup。
4. unbuild。
5. webpack library output。

工具会变，但主线不变：

==库构建永远要回答四个问题：**入口是谁、输出什么格式、外部依赖怎么处理、消费方怎么找到并使用产物**。==

### 8.1 Rollup 是什么？

==**Rollup** 是一个 JavaScript 模块打包器，它更常出现在**库项目**里：把多个源码模块从入口开始打包成 ESM、CommonJS、UMD、IIFE 等不同格式的 npm 包产物。==

它和 webpack、Vite、tsup 的区别不要先从配置项背：

| 工具 | 更常见的定位 |
| --- | --- |
| webpack | 应用打包、复杂历史项目、loader/plugin 生态很强 |
| Vite | 应用开发体验 + 生产构建，也支持 library mode |
| Rollup | 库打包，尤其适合 npm 包、组件库、SDK |
| tsup | 更轻量的 TS/JS 库打包工具，配置少 |

Rollup 很适合库项目，是因为库项目最关心这些事：

1. **输出多种模块格式**：给现代 bundler 用 ESM，给 Node 或老工具用 CommonJS，给 script 标签场景用 UMD / IIFE。
2. **产物尽量干净**：库代码不应该塞一堆应用运行时代码。
3. **Tree shaking 友好**：基于 ESM 静态结构，主工程只用到部分导出时，理论上可以删掉没用代码。
4. **外部依赖边界清楚**：React、Vue 这类框架依赖通常不应该打进组件库，而是由主工程提供。
5. **容易做多入口**：比如 `@company/ui/button`、`@company/ui/table`、`@company/ui/style.css`。

### 8.2 Rollup 和依赖库项目是什么关系？

一个依赖库项目通常有两种形态：

```txt
源码形态：src/index.ts、src/Button.vue、src/style.css
产物形态：dist/index.es.js、dist/index.cjs、dist/index.umd.js、dist/style.css、dist/index.d.ts
```

Rollup 做的就是把**源码形态**转换成**产物形态**：

```txt
src/index.ts
→ Rollup 解析 import / export 依赖图
→ 插件处理 TS / Vue / Babel / CSS / 图片
→ external 掉不该内置的依赖
→ 输出 ESM / CJS / UMD 等格式
→ package.json 用 exports / main / module / types 指向 dist
```

所以你看到很多 npm 依赖库里有：

```txt
rollup.config.js
rollup.config.mjs
@rollup/plugin-node-resolve
@rollup/plugin-commonjs
@rollup/plugin-typescript
rollup-plugin-dts
```

它们通常是在解决这些问题：

1. 源码是 TypeScript，发布前要变成 JavaScript。
2. 源码有很多小文件，发布时要生成稳定入口。
3. 同一个库要同时提供 ESM 和 CJS。
4. 组件库要输出 CSS。
5. 类型声明要生成 `.d.ts`。
6. `vue` / `react` 这类 peer dependency 不应该被打进包里。

### 8.3 自己做组件库要不要用 Rollup？

答案不是“必须用”，而是看你做的组件库处在什么阶段。

如果是 Vue 组件库，并且项目已经用 Vite：

==优先用 **Vite library mode**。它会给库构建提供一套更省心的默认配置，你只需要重点理解 `build.lib`、`external`、`exports`、CSS 输出和类型声明。==

如果你需要很强的产物控制，比如：

1. 多入口产物。
2. 同时输出 ESM / CJS / UMD。
3. 精细控制哪些依赖 external。
4. 单独生成类型声明包。
5. 精细处理 CSS、图片、图标、主题包。
6. 兼容老系统 script 标签接入。

那就可以直接用 Rollup。

如果只是一个很简单的 TS 工具库，不涉及 Vue SFC、复杂 CSS、UMD：

```txt
tsup / unbuild 可能更轻
```

所以实战判断可以这样记：

```txt
应用开发：优先 Vite
Vue 组件库：优先 Vite library mode，再理解底层 Rollup 思路
复杂 npm 包 / 多格式库：Rollup 很常见
简单 TS 工具库：tsup / unbuild 更省配置
老 Vue CLI 项目：vue-cli-service build --target lib
```

### 8.4 Rollup 最小库配置长什么样？

一个非常简化的库构建配置：

```js
// rollup.config.mjs
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/index.js',
  external: ['vue'],
  output: [
    {
      file: 'dist/index.es.js',
      format: 'es'
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs'
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'MyLibrary',
      globals: {
        vue: 'Vue'
      }
    }
  ],
  plugins: [
    resolve(),
    commonjs()
  ]
}
```

这段配置先抓五个点：

1. `input`：库入口，从这里决定对外暴露什么。
2. `output.format`：输出模块格式，例如 `es`、`cjs`、`umd`。
3. `external`：哪些依赖不打进库里，由主工程提供。
4. `name`：UMD 全局变量名，script 标签接入时会用到。
5. `globals`：UMD 场景下，external 的依赖在全局变量里叫什么。

对应的 `package.json` 可能这样写：

```json
{
  "name": "@company/my-library",
  "version": "1.0.0",
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.es.js",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs"
    }
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

==Rollup 配置决定**产物怎么生成**，`package.json` 决定**主工程怎么找到这些产物**。这两者合起来，才是一个 npm 依赖库真正可用的交付形态。==

Vue CLI 现在已经进入维护模式，新项目更常用 Vite。但在老 Vue 项目、内部组件库、历史插件系统里，`vue-cli-service build --target lib` 仍然会经常出现。

## 9. 一句面试版

==`vue-cli-service build --target lib` 是 Vue CLI 提供的**库模式构建能力**，它基于 webpack 把指定入口打包成可被其他项目消费的库产物，常见输出包括 **CommonJS、UMD、压缩 UMD 和 CSS**；它解决的是“把一个 Vue 模块从完整应用里抽出来，作为**内部 NPM 包、组件库或业务插件复用**”的问题。==

## 10. 最小 demo / 最小案例

### 10.1 package.json

```json
{
  "name": "@company/my-widget",
  "version": "1.0.0",
  "scripts": {
    "build:lib": "vue-cli-service build --target lib --name MyWidget src/lib-entry.js"
  },
  "files": ["dist"],
  "main": "./dist/MyWidget.common.js",
  "unpkg": "./dist/MyWidget.umd.min.js",
  "style": "./dist/MyWidget.css",
  "peerDependencies": {
    "vue": "^2.7.0"
  }
}
```

### 10.2 src/lib-entry.js

```js
import MyWidget from './components/MyWidget.vue'

MyWidget.install = function install(Vue) {
  Vue.component(MyWidget.name, MyWidget)
}

export default MyWidget
```

### 10.3 主工程引用

```js
import MyWidget from '@company/my-widget'
import '@company/my-widget/dist/MyWidget.css'

Vue.use(MyWidget)
```

这个最小案例里：

1. `src/lib-entry.js` 决定库暴露什么。
2. `build:lib` 决定怎么打包。
3. `dist` 决定最终产物。
4. `main`、`unpkg`、`style` 决定消费方怎么找到产物。
5. `peerDependencies` 决定 Vue 由主工程提供。

## 11. 是否值得深入？

值得。尤其当你在公司项目里经常看到内部包、组件库、SDK、UMD 文件、私有 npm 源时，这块是前端工程化的核心能力之一。

推荐深入顺序：

1. 先看懂 `package.json` 的 `scripts`、`main`、`files`、`peerDependencies`。
2. 再看懂 `vue-cli-service build --target lib` 的入口、产物和 `--name`。
3. 然后理解 CommonJS、ESM、UMD 分别服务什么消费方式。
4. 接着学习 webpack library output、externals、libraryExport。
5. 再重点理解 Rollup 的 `input`、`output.format`、`external`、`globals`。
6. 最后再迁移到 Vite library mode、Rollup、tsup 这类现代库构建方案。

优先看官方资料：Vue CLI Build Targets、Vue CLI Service、Rollup introduction、Rollup configuration options、Vite library mode、webpack Authoring Libraries、webpack output library、npm package.json。

## 12. 选择题自测

### Q1

`vue-cli-service build --target lib` 和普通 `vue-cli-service build` 最大区别是什么？

A. 前者会启动本地开发服务器  
B. 前者把入口打成库产物，后者默认把项目打成可部署应用  
C. 前者不能处理 Vue 文件  
D. 前者只会生成 HTML

答案：B

解析：`--target lib` 会改变构建目标，输出给其他项目消费的库文件。

### Q2

UMD 产物最核心的价值是什么？

A. 只能在 Node.js 里运行  
B. 只能被浏览器原生 ESM 加载  
C. 同时兼容 CommonJS、AMD 和 script 全局变量等消费方式  
D. 自动生成数据库表

答案：C

解析：UMD 的重点是兼容多种模块消费方式，适合库分发和老系统接入。

### Q3

Vue CLI 的 lib 模式默认如何处理 Vue？

A. 默认 external 掉 Vue，由消费方提供  
B. 默认删除所有 Vue 代码  
C. 默认把 Vue 编译成 CSS  
D. 默认要求不能使用 Vue

答案：A

解析：lib 模式默认不把 Vue 本体打进包里，除非使用 `--inline-vue`。

### Q4

内部组件库更适合把 Vue 放在哪里？

A. `peerDependencies`  
B. `scripts`  
C. `keywords`  
D. `license`

答案：A

解析：组件库通常希望主工程统一提供 Vue，避免重复打包和运行时上下文不一致。

### Q5

看到一个内部包样式丢失，优先检查什么？

A. 是否生成了独立 CSS，主工程是否引入了这个 CSS  
B. Git 用户名  
C. 浏览器书签  
D. 是否删除了 README

答案：A

解析：库模式常会生成单独 CSS 文件，只引用 JS 不一定会自动带上样式。

### Q6

为什么很多 npm 依赖库会使用 Rollup？

A. 因为 Rollup 只能打包完整页面应用  
B. 因为 Rollup 适合从库入口生成 ESM、CJS、UMD 等多种产物，并且方便 external 掉 peerDependencies  
C. 因为 Rollup 会自动发布 npm 包  
D. 因为 Rollup 可以替代所有类型声明

答案：B

解析：Rollup 常用于库打包，重点是入口、输出格式、tree shaking 和外部依赖边界。发布 npm、生成类型声明通常还需要额外配置或工具配合。
