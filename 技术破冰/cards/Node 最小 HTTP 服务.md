---
title: Node 最小 HTTP 服务
category: 后端基础
tags:
  - backend
  - node
  - http
  - server
  - express
difficulty: medium
status: draft
created: 2026-04-28
updated: 2026-04-28
---

# Node 最小 HTTP 服务

## 1. 它属于哪个知识板块？

```txt
后端基础
→ Node 服务端入门
→ 最小 HTTP 服务
→ 一个能 curl 到的进程
```

==这一站的目标**不是学完一个框架**，而是让"服务端"这个抽象词，变成你电脑上一个**真的在监听端口、能被 curl 到的进程**。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**Node 最小 HTTP 服务**解决的是“**前端只把 Node 当构建工具用，没真正写过服务**”的问题。==

绝大多数前端使用 Node 都是跑 Vite、跑测试、跑脚本，从来没有写过一个**接受外部请求**的服务。当后端同学说"我起了一个服务，监听 3000 端口"，你脑子里其实没有清晰画面。

==所以这一站的核心**不是 Express 还是 Fastify**，而是把**进程、端口、请求、响应、handler、中间件**这几个词从抽象变成可以 `node server.js` + `curl` 验证的实物。==

### 2.2 核心流程

```txt
启动一个 Node 进程
→ 创建 HTTP server 对象
→ 注册请求处理函数（handler）
→ server.listen(port)：让进程监听某个端口
→ 外部请求到达端口
→ 触发 handler，传入 req（请求）和 res（响应）
→ 在 handler 里读 method / url / headers / body
→ 调用 res.writeHead / res.end 写回 status、headers、body
→ 进程持续运行，等待下一个请求
```

### 2.3 关键词清单

1. process：操作系统里的"进程"，`node server.js` 就是启动了一个 Node 进程。Ctrl+C 才会结束。
2. port：端口号，1-65535，常见的 3000 / 8080 是约定俗成的开发端口。一个端口同一时间只能被一个进程监听。
3. listen：服务调用 `server.listen(port)` 才会开始接受请求；不调用就只是个变量。
4. request (req)：一次进入的 HTTP 请求对象，能读到 method、url、headers、body。
5. response (res)：要发回去的响应对象，能写 status、headers、body。
6. handler：处理某个请求的函数，签名通常是 `(req, res) => void`。
7. routing：路由，按 method + path 把请求分发到不同 handler。
8. middleware：中间件，在 handler 前后跑的通用逻辑（解析 body、鉴权、日志、错误捕获）。
9. body parser：请求体解析器，把字节流解析成 JSON / 表单等数据结构。
10. status code：res 上写回去的状态码，决定客户端怎么处理。
11. CORS middleware：跨域中间件，给响应加上 `Access-Control-*` 头让浏览器放行。
12. graceful shutdown：优雅关闭，进程退出前先停止接受新请求、把在处理的请求处理完。

### 2.4 一句面试版

==一个最小的 HTTP 服务就是**一个 Node 进程在某个端口上 listen，每来一个请求就触发 handler，从 req 读数据、往 res 写响应**；框架（Express、Fastify、Koa、Nest）只是在这个最小模型上提供**路由、中间件、参数解析、错误处理**等工程化封装。==

### 2.5 最小 demo / 最小案例

#### 用 Node 内置 http 模块（零依赖）

```js
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'hello' }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(3000, () => {
  console.log('listening on http://localhost:3000')
})
```

跑起来：

```bash
node server.js
```

在另一个终端验证：

```bash
curl -i http://localhost:3000/hello
curl -i http://localhost:3000/anything-else
```

==**当你看到 200 + `{"message":"hello"}` 出现的那一刻，"服务端"这个词就具象了。**==

#### 用 Express（更接近真实工程）

```bash
npm i express
```

```js
import express from 'express'

const app = express()

app.use(express.json())

app.get('/hello', (req, res) => {
  res.json({ message: 'hello' })
})

app.post('/users', (req, res) => {
  res.status(201).json({ id: 1, ...req.body })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'internal error' })
})

app.listen(3000)
```

要点：

1. `app.use(express.json())` 是**中间件**，把 JSON 请求体解析到 `req.body`。
2. `app.get` / `app.post` 是路由注册，按 method + path 派发到对应 handler。
3. 最后一个带 4 个参数的 `app.use((err, req, res, next) => ...)` 是**错误处理中间件**，所有 handler 抛错最终会落到这里。

### 2.6 前端类比：你已经会的那部分

| 你已经熟悉的（前端） | 后端里的对应物 |
| --- | --- |
| `vite` 启动一个 dev server，监听 5173 | 你这个 Node 进程监听 3000，做的是同一件事 |
| `addEventListener('click', handler)` | `app.get('/path', handler)`：注册一个回调，等事件来 |
| `fetch(url)` | `req`：你这边变成了被调用的一方 |
| Promise reject 没人 catch → 全局 unhandledRejection | Express 没 catch 的错 → 错误中间件 |
| Vite 插件 transform | Express 中间件 chain |

### 2.7 一定会踩的几个坑

1. **`res.end` 必须被调用**，否则客户端会一直 pending 直到超时。
2. **同一个端口同时只能被一个进程监听**，否则报 `EADDRINUSE`。开发时换端口或杀掉占用进程。
3. **Node 进程是单线程的事件循环**：handler 里写一段同步 CPU 密集代码，会阻塞**所有其它请求**。
4. **未捕获异常会让进程退出**，生产环境必须有进程守护（pm2、Docker 重启策略、systemd）。
5. **必须有错误处理中间件**，否则任何业务异常都会让客户端拿到一个奇怪的 500 或挂死。
6. **CORS 不是后端"自动"的**，要主动加响应头，浏览器才放行跨域。

### 2.8 框架选型怎么看？

| 框架 | 风格 | 适合 |
| --- | --- | --- |
| 内置 `node:http` | 零依赖、最贴底层 | 学习 / 极简内部脚本服务 |
| Express | 中间件链路、生态最大 | 入门、业务 BFF、内部工具 |
| Koa | async/await 友好、洋葱模型 | 习惯现代异步写法 |
| Fastify | 性能强、Schema 校验内置 | 关心吞吐与启动速度 |
| Nest | 偏 Java/Angular 风格、强约定 | 大型项目、需要 DI / 模块化 |
| Hono | 轻量、跨运行时（Node / Deno / Bun / Edge） | Edge 场景、Workers |

入门阶段不必纠结：**Express 跑通一遍**，再按需了解其它。

### 2.9 是否值得深入？

值得深入。优先顺序：

1. 先用内置 http 模块跑通 hello world，建立"端口 / 进程 / handler"的物理感。
2. 再用 Express 体会中间件链、路由、错误处理。
3. 然后掌握请求体解析、文件上传、流式响应。
4. 接着理解 Node 事件循环对 server 的影响、worker_threads / cluster。
5. 最后再深入框架内部、性能调优、可观测性接入。

优先看官方资料：Node.js HTTP module、Express docs、MDN HTTP。

## 3. 选择题自测

### Q1

让一个 Node 进程"成为一个 HTTP 服务"的关键是什么？

A. 取一个文件名叫 `server.js`
B. 调用 `server.listen(port)` 让进程开始在端口上监听
C. 写一个 console.log
D. 安装一个 npm 包

答案：B

解析：监听端口才是"成为服务"的本质动作；其它都只是辅助。

### Q2

一个端口同一时间能被几个进程监听？

A. 任意多个
B. 只能 1 个，否则报 EADDRINUSE
C. 由 CPU 核数决定
D. 由内存决定

答案：B

解析：端口的占用是独占的，常见错误码就是 EADDRINUSE。

### Q3

Express 中间件 `app.use(express.json())` 的作用是什么？

A. 自动写测试
B. 把 JSON 请求体解析到 `req.body`
C. 让所有响应变成 JSON
D. 替代数据库

答案：B

解析：它是请求体解析中间件之一，让 handler 直接读到结构化数据。

### Q4

下面哪种行为最容易把整个 Node 服务卡住？

A. 在 handler 里跑一段同步 CPU 密集代码
B. 调用 `res.json()`
C. 注册路由
D. 设置 CORS 头

答案：A

解析：Node 是单线程事件循环，同步阻塞会让整个进程无法处理其它请求。

### Q5

下面哪种实践对生产环境的 Node 服务最关键？

A. 写得越复杂越好
B. 配置错误处理中间件 + 进程守护 + 优雅关闭
C. 关闭所有日志
D. 永远不重启

答案：B

解析：错误中间件兜底业务异常，进程守护负责自动重启，优雅关闭保证发布不丢请求。
