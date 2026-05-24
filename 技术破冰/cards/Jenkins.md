---
title: Jenkins
category: 交付与运维
tags:
  - devops
  - ci-cd
  - jenkins
  - pipeline
  - automation
difficulty: medium
status: draft
created: 2026-05-07
updated: 2026-05-07
---

# Jenkins

## 1. 它属于哪个知识板块？

Jenkins 属于：

```txt
交付与运维
→ DevOps
→ CI/CD
→ 自动化流水线服务器
→ Job / Pipeline / Jenkinsfile / Agent / Plugin / Credentials
```

==**Jenkins** 解决的是“怎么把代码检查、测试、构建、打包、部署这些步骤放到一台自动化服务器上可重复执行”的问题。==

它不是 DevOps 本身，也不是 CI/CD 这个概念本身。更准确地说：

==Jenkins 是一个开源自动化服务器，常用来承载 [[CI-CD|CI/CD]] 流水线；它通过 Job、Pipeline、Jenkinsfile、插件和 Agent，把代码从提交到构建、测试、发布的过程自动化。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

没有 Jenkins 这类 CI/CD 工具时，发布可能是这样：

```txt
开发本地拉代码
→ 手动 npm install
→ 手动 npm run build
→ 手动压缩 dist
→ 手动上传服务器
→ 手动重启服务
→ 出问题再手动回滚
```

这会带来很多问题：

1. 每个人执行步骤不一致。
2. 漏跑测试或漏跑构建。
3. 本地环境和线上环境不一致。
4. 产物不可追踪，不知道哪个 commit 打出来的。
5. 密钥和服务器权限散落在个人电脑。
6. 发布失败后没有标准回滚流程。

==Jenkins 的核心价值是把这些人工步骤沉淀成**可配置、可触发、可记录、可复用**的自动化任务。==

### 2.2 核心流程

一个典型 Jenkins 流水线是：

```txt
代码 push / PR / 手动触发
→ Jenkins 接收触发
→ 分配 Agent 执行任务
→ 拉取代码
→ 安装依赖
→ 运行 lint / test / build
→ 生成 artifact 或 Docker 镜像
→ 部署到目标环境
→ 记录日志、状态和产物
→ 成功或失败通知团队
```

对前端来说，最常见的是：

```txt
Git 仓库
→ Jenkins Pipeline
→ npm ci
→ npm run lint / test / build
→ 产出 dist
→ 上传 CDN / 对象存储 / 服务器
→ 通知发布结果
```

==Jenkins 不是替你写业务代码，而是替你稳定执行“从代码到产物再到部署”的重复流程。==

## 3. Jenkins 里的核心概念

1. Controller：Jenkins 的主控节点，负责 Web UI、任务调度、配置管理、插件管理和流水线编排。
2. Agent：执行构建任务的节点，真正跑命令的地方，例如 `npm ci`、`docker build`。
3. Job：Jenkins 里的任务单元，可以是 freestyle job，也可以是 pipeline job。
4. Pipeline：用代码描述的一条流水线，包含多个 stage 和 step。
5. Jenkinsfile：放在代码仓库里的流水线定义文件，通常用 Groovy 风格 DSL 编写。
6. Stage：流水线阶段，例如 Checkout、Install、Test、Build、Deploy。
7. Step：阶段里的具体动作，例如 `sh 'npm ci'`。
8. Workspace：Agent 上给当前任务使用的工作目录。
9. Plugin：插件，扩展 Jenkins 能力，例如 Git、Docker、Kubernetes、Credentials、Pipeline。
10. Credentials：凭据管理，用来保存 token、用户名密码、SSH key 等敏感信息。
11. Artifact：流水线产物，例如 `dist`、测试报告、镜像 tag、构建包。
12. Trigger：触发方式，例如手动触发、定时触发、webhook、代码分支变化。
13. Multibranch Pipeline：多分支流水线，自动为仓库里的不同分支或 PR 创建流水线。

## 4. Jenkinsfile 最小案例

一个最小前端 Jenkinsfile：

```groovy
pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Test') {
      steps {
        sh 'npm run test --if-present'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true
    }
  }
}
```

这段先抓住五个点：

1. `pipeline`：声明这是一条 Jenkins Pipeline。
2. `agent any`：让 Jenkins 找一个可用 Agent 执行。
3. `stages`：流水线分阶段执行。
4. `steps`：每个阶段里的具体命令。
5. `post`：流水线结束后的动作，例如保存产物、通知、清理。

==Jenkinsfile 的价值是把流水线配置放进代码仓库，让构建流程也能被版本管理、Code Review 和回溯。==

## 5. Jenkins 和 CI/CD 的关系

[[CI-CD|CI/CD]] 是一种交付实践：

```txt
代码提交
→ 自动检查
→ 自动测试
→ 自动构建
→ 自动或半自动部署
```

Jenkins 是实现这套实践的工具之一：

```txt
CI/CD 是思想和流程
Jenkins 是承载流程的自动化服务器
Jenkinsfile 是流水线的代码化描述
Agent 是执行流水线的机器
Plugin 是接入 Git、Docker、K8s、通知、凭据等能力的扩展
```

所以不要说“Jenkins 就是 CI/CD”。更准确的说法是：

==Jenkins 是常见的 CI/CD 平台之一，它负责把 CI/CD 流程变成可执行、可追踪、可复用的自动化流水线。==

## 6. Jenkins 和 DevOps 的关系

[[DevOps|DevOps]] 关心的是完整交付闭环：

```txt
开发
→ 测试
→ 构建
→ 发布
→ 运行
→ 监控
→ 反馈
```

Jenkins 通常处在“自动化层”：

```txt
协作层：团队怎么协作和负责
自动化层：Jenkins / GitHub Actions / GitLab CI
运行层：Docker / K8s / 云平台
反馈层：日志 / 监控 / 告警 / 复盘
```

Jenkins 可以把 DevOps 里的很多动作自动化，但它不能单独代表 DevOps。

例如：

1. Jenkins 可以自动跑测试，但不能保证测试设计合理。
2. Jenkins 可以自动部署，但不能替你设计灰度和回滚策略。
3. Jenkins 可以保存日志，但不能替你定义可靠性目标。
4. Jenkins 可以接入凭据，但不能替你完成权限治理。

==会写 Jenkinsfile 只是工具能力；真正理解 DevOps，要知道这条流水线如何降低交付风险、如何反馈线上问题、如何支持回滚和持续改进。==

## 7. Jenkins 和 GitHub Actions / GitLab CI 怎么区分？

| 工具 | 更常见的特点 |
| --- | --- |
| Jenkins | 老牌、自托管、插件生态大、定制能力强、历史项目常见 |
| GitHub Actions | 和 GitHub 仓库集成紧，配置轻，适合 GitHub 项目 |
| GitLab CI | 和 GitLab 仓库、Runner、环境、权限集成紧 |
| Argo CD | 更偏 GitOps 和 K8s 持续部署，不是传统通用 CI 工具 |

为什么很多公司仍然有 Jenkins？

1. 历史系统早就建好了。
2. 插件生态覆盖很多内部系统。
3. 公司希望自托管，构建环境和权限完全掌控。
4. 流水线很复杂，需要高度定制。
5. 内部发布平台、制品库、服务器权限都已经和 Jenkins 打通。

为什么新项目可能不用 Jenkins？

1. 维护 Jenkins Controller、Agent、插件和权限有成本。
2. 插件版本和安全漏洞需要持续治理。
3. 云端 CI 平台更省心。
4. 对简单项目来说，GitHub Actions / GitLab CI 配置更轻。

## 8. 看到 Jenkins 项目时怎么读？

优先按这个顺序看：

```txt
仓库里有没有 Jenkinsfile
→ Jenkinsfile 有哪些 stage
→ 每个 stage 跑了什么命令
→ 用了哪个 agent / node / docker image
→ 依赖怎么安装
→ 产物保存在哪里
→ 凭据从哪里注入
→ 部署到哪个环境
→ 失败后有没有通知和回滚
```

关键问题：

1. **触发方式是什么？** push、PR、tag、定时、手动。
2. **执行环境是什么？** 固定 Agent、Docker Agent、K8s 临时 Pod。
3. **命令是否和本地一致？** 是否复用 `package.json` scripts。
4. **依赖安装是否可复现？** 是否使用 `npm ci`、lockfile。
5. **凭据是否安全？** 是否从 Jenkins Credentials 注入。
6. **产物是否可追踪？** 是否保存 artifact、镜像 tag、commit sha。
7. **失败后怎么处理？** 是否阻断发布、通知、回滚。

## 9. 常见坑

### 9.1 把复杂业务逻辑写进 Jenkinsfile

Jenkinsfile 应该描述流水线，不应该塞大量业务脚本。复杂逻辑更适合放到仓库脚本里：

```txt
scripts/build.sh
scripts/deploy.sh
scripts/upload-sourcemap.sh
```

Jenkinsfile 只负责调用。

### 9.2 构建环境不可控

如果 Agent 上的 Node、npm、pnpm、Java、Docker 版本不固定，就容易出现“这次能构建，下次不能构建”。

解决思路：

1. 固定 Agent 镜像。
2. 使用 Docker Agent。
3. 在流水线里明确 Node 版本。
4. 使用 lockfile 和 `npm ci`。

### 9.3 密钥写在脚本里

不要把 token、服务器密码、SSH key 写在 Jenkinsfile 或仓库脚本里。应该用 Jenkins Credentials，并在流水线中按需注入。

### 9.4 插件越装越多

Jenkins 强在插件，风险也在插件。插件太多会带来：

1. 升级困难。
2. 安全漏洞。
3. 配置不可控。
4. 流水线行为依赖隐式插件。

### 9.5 Controller 做太多重活

构建、测试、打包这类重活应该尽量在 Agent 上执行。Controller 更适合做调度、配置和编排。

### 9.6 只自动构建，不自动反馈

流水线失败后如果没人知道，自动化价值会打折。至少要有：

1. 失败通知。
2. 构建日志。
3. 产物记录。
4. 负责人或群组。
5. 必要时阻断发布。

## 10. 前端项目里 Jenkins 常见场景

1. PR 阶段跑 lint、typecheck、test。
2. main 分支合并后自动构建 `dist`。
3. 上传静态资源到 CDN。
4. 上传 sourcemap 到监控平台。
5. 构建 Docker 镜像。
6. 推送镜像到公司镜像仓库。
7. 触发 K8s 或内部发布平台部署。
8. 发钉钉、飞书、Slack、邮件通知。
9. 给测试环境、预发环境、生产环境分别配置流水线。

一个前端发布链路可能是：

```txt
push tag
→ Jenkins 拉代码
→ npm ci
→ npm run build
→ 上传 dist 到对象存储 / CDN
→ 上传 sourcemap
→ 刷新缓存
→ 通知发布结果
```

一个 Node BFF 发布链路可能是：

```txt
push main
→ Jenkins 拉代码
→ npm ci
→ npm test
→ docker build
→ docker push
→ 更新 K8s Deployment
→ rollout status
→ 通知结果
```

## 11. 一句面试版

==Jenkins 是一个开源自动化服务器，常用于实现 CI/CD。它通过 Job、Pipeline、Jenkinsfile、Agent、Plugin 和 Credentials，把代码检查、测试、构建、制品保存、镜像构建、部署和通知等步骤串成可重复执行、可追踪的流水线；它是 DevOps 自动化层的工具之一，不等同于 DevOps 本身。==

## 12. 是否值得深入？

值得。尤其当你在公司项目里看到：

1. `Jenkinsfile`。
2. Jenkins 构建页面。
3. 内部发布平台依赖 Jenkins。
4. 构建失败需要看 console log。
5. 前端产物、Docker 镜像、sourcemap 都由 Jenkins 发布。

推荐深入顺序：

1. 先理解 [[CI-CD|CI/CD]]，知道流水线要解决什么问题。
2. 再理解 Jenkins 的 Controller、Agent、Job、Pipeline。
3. 然后看懂 Jenkinsfile 的 `pipeline`、`agent`、`stages`、`steps`、`post`。
4. 接着理解 Credentials、artifact、trigger、workspace。
5. 再看 Docker Agent、K8s Agent、多分支流水线。
6. 最后再深入共享库、权限治理、插件治理、Jenkins Configuration as Code。

优先看官方资料：Jenkins Pipeline、Using a Jenkinsfile、Pipeline Syntax、Managing Jenkins、Using credentials。

## 13. 选择题自测

### Q1

Jenkins 最核心解决的问题是什么？

A. 替代生产环境的 CDN 服务来进行多节点资源缓存分发  
B. 把检查、测试、构建、部署等重复流程自动化、可追踪化  
C. 提供客户端运行时的性能监控与数据全链路追踪  
D. 作为分布式版本管理系统来替代 Git 的核心版本控制能力

答案：B

解析：Jenkins 是自动化服务器，常用来承载 CI/CD 流水线。

### Q2

Jenkinsfile 的作用是什么？

A. 用代码描述 Jenkins Pipeline，让流水线可以放进仓库版本管理  
B. 存储用户头像  
C. 替代 package.json  
D. 自动生成数据库

答案：A

解析：Jenkinsfile 让流水线配置可以和代码一起管理、评审和回溯。

### Q3

Agent 在 Jenkins 里通常负责什么？

A. 执行构建、测试、打包等实际任务  
B. 编写 PRD  
C. 保存浏览器书签  
D. 替代 Git 分支

答案：A

解析：Controller 负责任务调度和管理，Agent 通常负责具体命令执行。

### Q4

Jenkins 和 DevOps 的关系更准确的是？

A. Jenkins 是 DevOps 自动化层里的工具之一  
B. Jenkins 就等于 DevOps  
C. DevOps 只能用 Jenkins 实现  
D. Jenkins 和 CI/CD 没关系

答案：A

解析：Jenkins 可以支撑 DevOps 实践，但 DevOps 还包括协作、环境、运行、监控、反馈和治理。

### Q5

Jenkins 里最不应该怎么管理密钥？

A. 放进 Jenkins Credentials  
B. 通过受控方式注入流水线  
C. 直接写死在 Jenkinsfile 或仓库脚本里  
D. 限制凭据使用范围

答案：C

解析：密钥不应该进入代码仓库或流水线明文脚本，应使用凭据管理能力。
