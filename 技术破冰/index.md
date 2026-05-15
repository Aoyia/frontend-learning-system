# 技术破冰知识卡索引

注意：正文不直接放技术破冰目录外的外部链接；官方资料只保留名称作为学习线索。

可视化知识地图：[[技术破冰.canvas|技术破冰 Canvas]]

## 阅读标记约定

- ==整句高亮==：定义句、解决问题句、面试版关键句。
- **加粗词**：句子里的核心概念、判断标准、关键词。

## 难度标记

- `medium`：中级前端
- `hard`：中高级及以上前端

---

## 零、软件工程基础

- [[cards/传统软件开发工作流|传统软件开发工作流]]

---

## 一、前端工程化

### 1.1 工程化主干

- [[cards/前端工程化|前端工程化]]
- [[cards/包管理器|包管理器]]
- [[cards/开发服务器|开发服务器]]
- [[cards/构建工具|构建工具]]
  - [[cards/Vite|Vite]]
  - [[cards/内部 NPM 包与库模式构建|内部 NPM 包与库模式构建]]
- [[cards/CI-CD|CI/CD]]
  - [[cards/Jenkins|Jenkins]]
  - [[cards/发布策略|发布策略（灰度 / 金丝雀 / 蓝绿）]] `hard`
- [[cards/前端性能优化|前端性能优化]]
  - [[cards/性能指标与度量|性能指标与度量]]
  - [[cards/LCP 与首屏加载|LCP 与首屏加载]]
  - [[cards/INP 与交互响应|INP 与交互响应]]
    - [[cards/Long Task 与主线程让出|Long Task 与主线程让出]] `hard`
  - [[cards/CLS 与视觉稳定|CLS 与视觉稳定]]
  - [[cards/资源加载与缓存策略|资源加载与缓存策略]]
  - [[cards/渲染流程与渲染性能|渲染流程与渲染性能]]
  - [[cards/性能监控与性能预算|性能监控与性能预算]]
    - [[cards/Chrome Memory 与 Performance Monitor|Chrome Memory / Performance Monitor]]

### 1.2 进阶专题（中高级方向）

- [[cards/TypeScript 进阶|TypeScript 进阶]] `hard`
- [[cards/Monorepo 工程|Monorepo 工程]] `hard`
- [[cards/微前端|微前端]] `hard`
- [[cards/组件库设计|组件库设计]] `hard`

### 1.3 待补

- 自动化测试（测试金字塔、Vitest、Playwright、视觉回归、契约测试）
- 前端可观测性（错误监控、RUM、Trace ID 串联、灰度健康指标联动）
- 前端安全（XSS、CSRF、CSP、Trusted Types、供应链）
- SSR / SSG / RSC / Streaming
- 状态管理与数据层架构（Server State vs Client State）

---

## 二、后端基础

### 2.1 接口与协议

- [[cards/请求-响应全链路|请求-响应全链路]]
- [[cards/REST 与接口设计|REST 与接口设计]]

### 2.2 Node 服务端

- [[cards/Node 最小 HTTP 服务|Node 最小 HTTP 服务]]

### 2.3 数据存储

- [[cards/关系型数据库与 SQL|关系型数据库与 SQL]]

### 2.4 运行环境

- [[cards/Docker 与容器化|Docker 与容器化]]
- [[cards/K8s 与容器编排|K8s 与容器编排]] `hard`

### 2.5 待补

- GraphQL / RPC / 鉴权与会话 / 限流重试幂等熔断
- Node 服务端 & BFF 进阶（事件循环 / Worker / 流 / 内存 / Edge Runtime / 服务可观测性）
- Redis 与缓存策略、消息队列
- IaC / GitOps / 平台工程

---

## 三、软件架构（语言无关）

### 3.1 待补

- 分布式系统基础（CAP / BASE / 一致性 / 共识）
- 微服务 vs 单体的取舍
- 系统设计模板（IM / Feed / 短链 / 评论 / 秒杀）

---

## 四、交付与运维

- [[cards/DevOps|DevOps]]
  - [[cards/CI-CD|CI/CD]]
  - [[cards/Jenkins|Jenkins]]
  - [[cards/Docker 与容器化|Docker 与容器化]]
  - [[cards/K8s 与容器编排|K8s 与容器编排]] `hard`
  - [[cards/发布策略|发布策略（灰度 / 金丝雀 / 蓝绿）]]

---

## 使用方式

1. 打开对应文档。
2. 先按固定顺序建立主干认知。
3. 再根据文档内容做复习、练习或实操。

## 固定学习顺序

```txt
陌生技术出现
→ 先问它解决什么问题
→ 画核心流程
→ 找关键概念 / 关键词
→ 写一句面试版
→ 做一个最小 demo 或最小案例
→ 再决定要不要深入
```
