---
title: REST 与接口设计
category: 后端基础
tags:
  - backend
  - api
  - rest
  - http
  - api-design
difficulty: medium
status: draft
created: 2026-04-28
updated: 2026-04-28
---

# REST 与接口设计

## 1. 它属于哪个知识板块？

```txt
后端基础
→ 接口与协议
→ REST 与接口设计
→ 资源建模 / HTTP 语义 / 错误格式
```

==这一站的目标**不是讲 REST 教条**，而是回答"**接口怎么设计才让前端用得舒服、后端改得动、调用方少踩坑**"。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**REST 与接口设计**解决的是“**接口字段和路径很随意，前后端协作成本高、改一次炸一片**”的问题。==

没有约定时常见现象：URL 路径里动词乱飞（`/getUserList`、`/doDelete`）、所有错误都返回 200、状态码乱用、字段命名不一致、列表参数无法翻页、版本一改全炸。

==所以 REST 风格的核心**不是“路径要好看”**，而是把 URL 当**资源定位**、把 method 当**操作语义**、把 status code 当**结果分类**、把 body 当**数据载荷**，让接口的语义**写在协议里、不写在文档里**。==

### 2.2 核心流程

```txt
识别业务里的资源（名词）
→ 用 URL 表示资源（复数、层级清晰）
→ 用 HTTP method 表达对资源的操作
→ 用 HTTP status code 表达结果分类
→ 用统一的请求 / 响应结构（含错误格式）
→ 设计列表分页、过滤、排序的标准参数
→ 处理版本演进与向后兼容
→ 用 OpenAPI 之类的契约固化下来
```

### 2.3 关键词清单

1. resource：资源，业务里的"名词"，例如 user、order、article。URL 表示资源，不表示动作。
2. collection / item：集合 `/users` 与单项 `/users/123`。
3. HTTP method 语义：GET 读、POST 创建、PUT 整体替换、PATCH 局部更新、DELETE 删除。
4. safe method：安全方法（GET、HEAD、OPTIONS），不应改变服务器状态。
5. idempotent：幂等，多次相同请求结果一致。GET / PUT / DELETE 应当幂等；POST 不要求。
6. status code：2xx 成功、3xx 重定向、4xx 客户端错（参数 / 鉴权 / 权限 / 不存在 / 冲突）、5xx 服务端错。
7. error envelope：统一错误结构，例如 `{ code, message, details }`，让前端能可预测地处理。
8. pagination：分页方式，常见 `?page=1&pageSize=20` 或基于游标 `?cursor=abc&limit=20`。
9. filtering / sorting：过滤与排序参数，例如 `?status=active&sort=-createdAt`。
10. versioning：接口版本化，常见 URL 版本（`/v1/...`）或 Header 版本（`Accept: application/vnd.x.v1+json`）。
11. content negotiation：通过 `Accept` / `Content-Type` 协商数据格式。
12. CORS：浏览器跨域控制，由服务端响应头声明允许范围。
13. OpenAPI / Swagger：接口描述规范，可以生成文档、Mock、客户端 SDK、Schema 校验。
14. HATEOAS：REST 理论里的"超媒体驱动"，工程上很少严格落地，了解概念即可。

### 2.4 一句面试版

==REST 风格接口设计的核心是把 **URL 当资源定位**、**HTTP method 当操作语义**、**status code 当结果分类**、**body 当数据载荷**，并配合**统一的错误结构、标准的列表参数和明确的版本策略**，让接口语义写在协议里，前后端不依赖大量文档也能正确协作。==

### 2.5 最小 demo / 最小案例

#### 一个 user 资源的完整接口

```txt
GET    /users                列表（支持 page、pageSize、status、sort）
POST   /users                创建一个 user
GET    /users/123            获取单个
PUT    /users/123            整体替换（字段全量提交）
PATCH  /users/123            局部更新（只交要改的字段）
DELETE /users/123            删除
```

#### 统一的响应结构

成功：

```json
{
  "data": { "id": 123, "name": "Tom" }
}
```

列表：

```json
{
  "data": [{ "id": 1 }, { "id": 2 }],
  "pagination": { "page": 1, "pageSize": 20, "total": 137 }
}
```

错误：

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "user not found",
    "details": { "id": 123 }
  }
}
```

==**关键点：错误用 4xx / 5xx 状态码 + `error` 对象，不要用 200 + `{ code: -1 }` 假装成功。**==

#### 状态码挑选指南（最常用的一组）

```txt
200  OK                  通用成功
201  Created             创建成功
204  No Content          成功但不返回 body（常见 DELETE）

400  Bad Request         参数格式不对、缺字段
401  Unauthorized        没登录 / token 失效
403  Forbidden           已登录但没权限
404  Not Found           资源不存在
409  Conflict            资源状态冲突（重复创建、版本冲突）
422  Unprocessable       参数语义不合法（业务校验失败）
429  Too Many Requests   被限流

500  Internal Server     未捕获异常
502  Bad Gateway         反向代理拿不到上游响应
503  Service Unavailable 服务暂不可用（维护、过载）
504  Gateway Timeout     上游超时
```

### 2.6 前端类比：你已经会的那部分

| 你已经熟悉的（前端） | 接口设计里对应的事 |
| --- | --- |
| `fetch('/users/123')` 拿单个对象 | GET 单项接口的契约 |
| 提交表单 | POST / PUT / PATCH 的语义差别 |
| `axios` 拦截 401 跳登录 | error envelope + 状态码语义 |
| 列表加载更多 / 翻页 | 分页参数与响应结构的设计 |
| 一个版本上线后老页面崩了 | 接口未做版本兼容，破坏了既有契约 |

### 2.7 几条工程层硬规矩

==这些规矩决定一个接口"看起来像 REST"还是"真的能用"。==

1. **URL 是名词，不是动词**：`/users` ✓，`/getUserList` ✗。
2. **method 表达动作**：删除一定是 `DELETE /users/123`，不要 `POST /deleteUser`。
3. **错误必须用 4xx / 5xx 状态码**，前端能用 `if (!res.ok)` 直接分流。
4. **错误结构要稳定**：`code` 是机器读的字符串、`message` 是人读的提示、`details` 给上下文。
5. **必填和可选要明确**：写在 OpenAPI 或类型里，前端能自动生成类型。
6. **破坏性变更必须升版本**：删字段、改字段语义、改状态码含义都属于破坏性。
7. **新增字段要可选**，老调用方不应被影响。
8. **分页参数固定一种风格**：要么全部 `page+pageSize`，要么全部 `cursor+limit`，不要一个项目两套。
9. **时间统一用 ISO 8601 字符串**（`2026-04-28T10:00:00Z`），不要混用时间戳与字符串。
10. **金额用整数最小单位**（如分），不用浮点数，避免精度问题。

### 2.8 REST 之外还有什么？

| 风格 | 一句话定位 | 适合场景 |
| --- | --- | --- |
| REST | 资源 + HTTP 语义 | 通用 Web API，最广泛 |
| GraphQL | 客户端按需声明字段，单 endpoint | 字段组合多变、多端共用、过度获取严重 |
| RPC（gRPC、Thrift） | 远程函数调用，强契约 | 内部服务间调用，性能敏感 |
| tRPC | TS 端到端类型安全 RPC | 同栈 TS 全栈、Monorepo |
| WebSocket / SSE | 长连接 / 服务端推送 | 实时消息、推送、流式 |

REST 最广泛，但**不是唯一答案**。设计接口前先想：调用方是谁、字段组合多不多、要不要推送、是不是同栈。

### 2.9 是否值得深入？

值得深入，是后端 / 全栈基本功。优先顺序：

1. 先掌握资源 + method + status + 统一错误结构这条主干。
2. 再掌握分页 / 排序 / 过滤 / 版本化的标准做法。
3. 然后用 OpenAPI 把接口契约写下来，能生成文档与类型。
4. 接着理解幂等、限流、CORS、缓存头在接口中的位置。
5. 最后再深入 GraphQL、tRPC、gRPC 等其它风格的取舍。

优先看官方资料：MDN HTTP、HTTP status codes（RFC 9110）、OpenAPI Specification。

## 3. 选择题自测

### Q1

下面哪个 URL 更符合 REST 风格？

A. `POST /deleteUser?id=123`
B. `DELETE /users/123`
C. `GET /doRemoveUserById/123`
D. `POST /api/user/delete-action`

答案：B

解析：URL 表示资源，动作交给 HTTP method。

### Q2

业务校验失败（例如手机号格式不合法），返回哪种状态码更合适？

A. 200 + `{ code: -1, msg: '...' }`
B. 400 或 422 + 统一错误结构
C. 500
D. 302 重定向

答案：B

解析：用 4xx 把错误暴露在协议层，前端可以统一处理；用 200 假装成功会让所有错误处理变得复杂。

### Q3

下列哪个 method 通常被认为是**幂等**的？

A. POST
B. DELETE
C. CONNECT
D. TRACE

答案：B

解析：DELETE 多次执行结果一致；POST 通常不要求幂等。

### Q4

接口列表分页，更推荐的做法是什么？

A. 在同一个项目里混用基于偏移量和基于游标的分页策略
B. 在同一个项目里固定一种分页风格，并保持响应结构一致
C. 取消分页，依靠前端在内存中分片缓存渲染
D. 将当前页码与大小强制缓存至全局 HTTP Cookie 头中

答案：B

解析：风格统一才能让客户端封装一次到处用，混用是常见维护负担。

### Q5

下列哪种变更应该被视为**破坏性变更**，必须升版本号？

A. 给响应新增一个可选字段
B. 删除一个已存在字段或改变其语义
C. 修复响应里的拼写错误内容（不影响结构）
D. 新增一个新接口

答案：B

解析：破坏既有契约的字段删除 / 语义变更要升版本，并通知调用方。
