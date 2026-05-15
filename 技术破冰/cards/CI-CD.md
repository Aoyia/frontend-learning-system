---
title: CI/CD
category: 前端工程化
tags:
  - frontend
  - engineering
  - ci
  - cd
  - automation
difficulty: medium
status: draft
created: 2026-04-25
updated: 2026-05-07
---

# CI/CD

## 1. 陌生技术出现后的学习顺序

CI/CD 和 [[DevOps|DevOps]] 的关系：

```txt
DevOps
→ 交付与运行闭环
→ CI/CD 是其中的自动化流水线实践
```

Jenkins 和 CI/CD 的关系：

```txt
CI/CD 是自动化交付实践
→ [[Jenkins|Jenkins]] 是承载 CI/CD 流水线的工具之一
```

### 1.1 它解决什么问题？

==**CI/CD** 解决的是“代码从提交到上线，怎么**稳定、可重复、可追踪**”的问题。==

没有 CI/CD 时，常见问题是本地能跑但线上失败、每个人发布步骤不一致、漏跑测试、构建产物不可复现、发布失败后不知道是谁在什么时候改了什么。

==CI/CD 的核心**不是某个平台**，而是把**检查、测试、构建、部署**这些容易靠人工漏掉的步骤，放进**自动化流水线**里执行。==

### 1.2 核心流程

```txt
开发者提交代码
→ 触发流水线
→ 拉取代码和安装依赖
→ 执行 lint / typecheck / test
→ 构建生产产物
→ 保存产物或镜像
→ 部署到目标环境
→ 健康检查、通知和回滚
```

### 1.3 关键词清单

1. CI：Continuous Integration，持续集成，重点是每次提交后自动检查、测试、构建，尽早发现问题。
2. CD：Continuous Delivery / Continuous Deployment，持续交付或持续部署，重点是让构建产物可以稳定发布，甚至自动发布。
3. pipeline：流水线，由多个 job 或 step 组成，描述从代码到产物或上线的自动化过程。
4. trigger：触发条件，例如 push、pull request、tag、手动触发、定时触发。
5. runner：执行流水线的机器，可以是云端托管 runner，也可以是团队自己的 self-hosted runner。
6. job / step：job 是一组运行任务，step 是 job 里的具体命令或 action。
7. artifact：流水线产物，例如前端 `dist` 目录、测试报告、sourcemap、Docker 镜像。
8. environment：部署环境，例如 dev、test、staging、production，不同环境通常有不同变量和审批规则。
9. secret：敏感配置，例如 token、密钥、服务器密码，不能写进源码，要放在 CI 平台的加密配置里。
10. rollback：回滚策略，例如重新部署上一个稳定产物、切回旧镜像、灰度发布失败后停止放量。

### 1.4 一句面试版

==CI/CD 是把**代码检查、测试、构建和部署**沉淀成**自动化流水线**，让每次交付都**可重复、可验证、可追踪**，从而降低**人为发布失误和线上变更风险**。==

### 1.5 最小 demo / 最小案例

前端项目可以先把本地命令统一到 `package.json`：

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "vite build"
  }
}
```

然后让 CI 复用同一套命令。下面是一个最小 GitHub Actions 例子：

```yaml
name: frontend-ci

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run typecheck --if-present
      - run: npm run test --if-present
      - run: npm run build
```

这个案例只做 CI，不直接部署。它的价值是先把“代码能不能合并”这件事变成自动判断。

如果要继续加 CD，可以在构建成功后增加部署步骤，例如上传静态产物、发布 Docker 镜像、触发服务器部署脚本或发布到云平台。

### 1.6 是否值得深入？

值得深入，但顺序要稳：

1. 先理解 CI 和 CD 分别解决什么问题，不要把它们混成“自动上线”。
2. 再掌握触发条件、runner、job、step、artifact、secret 这些基础概念。
3. 然后把本地命令和 CI 命令统一，避免 CI 里写一套、本地又跑另一套。
4. 如果公司项目里有 Jenkins，先看 [[Jenkins|Jenkins]]，理解 Job、Pipeline、Jenkinsfile、Agent 和 Credentials。
5. 最后再深入缓存、并行任务、矩阵构建、环境审批、灰度发布、回滚和权限收敛。

优先看官方资料：GitHub Actions workflows、GitLab CI/CD pipelines、Docker build/push、云平台部署文档。

## 2. 选择题自测

### Q1

CI 最核心的价值是什么？

A. 让代码提交后自动发朋友圈
B. 每次代码变更后自动执行检查、测试和构建，尽早发现问题
C. 替代所有人工代码评审
D. 让项目不用写测试

答案：B

解析：CI 的重点是持续集成，通过自动化检查降低集成风险。它不能替代代码评审，也不能让测试凭空消失。

### Q2

下面哪一类信息最不应该直接写进仓库？

A. `npm run build`
B. `.github/workflows/ci.yml`
C. 服务器密钥、云平台 token、数据库密码
D. README 里的使用说明

答案：C

解析：密钥和 token 要放在 CI 平台提供的 secret 配置里，不能提交到源码仓库。

### Q3

为什么建议 CI 复用 `package.json` 里的脚本？

A. 这样浏览器加载页面更快
B. 这样本地和 CI 的命令入口一致，减少环境差异和维护成本
C. 这样可以绕过依赖安装
D. 这样就不需要 lockfile

答案：B

解析：统一脚本入口后，本地调试和 CI 执行的是同一套命令，问题更容易复现，流程也更容易维护。

### Q4

artifact 在 CI/CD 里通常指什么？

A. 自动生成的随机密码
B. 流水线产生并可保存或传递的构建结果，例如 `dist`、测试报告、Docker 镜像
C. Git 分支名称
D. 代码编辑器插件

答案：B

解析：artifact 是流水线产物，可以被后续 job 使用，也可以用于部署、排查和回滚。

### Q5

关于 CD，下面哪种说法更准确？

A. CD 一定等于所有代码提交后立刻自动上线生产环境
B. CD 关注的是让构建产物处于可发布状态，具体可以是人工审批后发布，也可以自动部署
C. CD 只适用于后端服务
D. CD 不需要回滚策略

答案：B

解析：CD 既可能表示持续交付，也可能表示持续部署。前者通常保留人工发布决策，后者更强调自动上线。
