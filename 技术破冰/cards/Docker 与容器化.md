---
title: Docker 与容器化
category: 后端基础
tags:
  - backend
  - runtime
  - docker
  - container
  - deployment
difficulty: medium
status: draft
created: 2026-04-29
updated: 2026-04-29
---

# Docker 与容器化

## 1. 它属于哪个知识板块？

Docker 属于：

```txt
后端基础
→ 运行环境
→ 容器化
→ 镜像 / 容器 / Dockerfile / Registry / Compose
```

前端也会经常碰到 Docker，因为前端项目的构建、预览、Nginx 静态资源部署、CI/CD 发布镜像，都可能用到它。但 Docker 本身更核心的知识板块是**运行环境与应用交付**。

==**Docker** 解决的是“我的应用换一台机器就跑不起来”的问题。它把应用代码、运行时、系统依赖和启动命令封装成**镜像**，再用这个镜像启动**容器**，让不同环境尽量以同一种方式运行应用。==

它和 [[DevOps|DevOps]] 的关系是：

```txt
DevOps 关心代码如何稳定交付和运行
→ Docker 提供标准化的镜像和容器
→ CI/CD 可以构建、推送、部署这些镜像
→ [[K8s 与容器编排|K8s]] 可以在集群里编排、扩缩容和自愈这些容器
```

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

没有 Docker 时，一个项目要跑起来可能依赖很多隐含条件：

1. Node 版本。
2. pnpm / npm 版本。
3. 操作系统依赖。
4. Nginx 配置。
5. 环境变量。
6. 数据库、Redis、MQ 等外部服务。
7. 启动命令和端口约定。

这些东西如果只靠 README 手动配置，就很容易出现：

```txt
我本地能跑
→ 你电脑跑不起来
→ CI 跑不起来
→ 测试环境跑起来但生产环境异常
```

==Docker 的核心价值**不是“装一个虚拟机”**，而是把运行应用需要的环境和启动方式沉淀成**可构建、可分发、可重复运行**的交付单元。==

### 2.2 Docker 不是完整虚拟机

一个常见但不够准确的说法是：Docker 是轻量虚拟机。

更准确的理解是：

==Docker 是一个**容器化平台**。容器通常共享宿主机内核，不像传统虚拟机那样每个实例都带完整操作系统，所以启动更快、体积更小，更适合按应用维度交付。==

对你来说，先抓这个差别就够了：

| 对比 | 虚拟机 | Docker 容器 |
| --- | --- | --- |
| 隔离单位 | 一整台虚拟机器 | 一个应用进程及其运行环境 |
| 操作系统 | 通常有完整 Guest OS | 通常共享宿主机内核 |
| 启动速度 | 相对慢 | 相对快 |
| 交付内容 | 一台机器环境 | 一个应用镜像 |
| 常见用途 | 模拟完整服务器 | 打包、运行、部署应用 |

## 3. 核心流程

```txt
写 Dockerfile
→ docker build 构建镜像
→ docker run 启动容器
→ 应用在容器里监听端口或执行任务
→ docker push 推送镜像到仓库
→ 服务器或 CI/CD 拉取镜像部署
```

如果是本地多服务开发，通常会多一层 Compose：

```txt
写 compose.yaml
→ 定义 web / api / db / redis 等服务
→ docker compose up
→ 一次启动多个容器
→ 容器之间通过网络互相访问
```

==Docker 的主线是：**Dockerfile 描述怎么做镜像，image 是构建结果，container 是镜像运行起来的实例，registry 负责分发镜像，compose 负责编排多个容器。**==

## 4. 关键词清单

1. Dockerfile：构建镜像的说明书，描述基础镜像、复制哪些文件、安装什么依赖、执行什么命令。
2. image：镜像，按 Dockerfile 构建出来的只读模板。
3. container：容器，镜像运行起来后的实例，可以理解为一个带隔离环境的应用进程。
4. base image：基础镜像，例如 `node:20-alpine`、`nginx:alpine`。
5. layer：镜像层，每条构建指令可能生成一层，Docker 会利用层缓存加速构建。
6. build context：构建上下文，`docker build` 发送给 Docker 引擎的文件范围。
7. `.dockerignore`：排除不需要进入构建上下文的文件，例如 `node_modules`、`.git`、`dist`。
8. registry：镜像仓库，例如 Docker Hub、公司内部镜像仓库。
9. tag：镜像标签，例如 `my-app:1.2.3`、`my-app:latest`。
10. volume：数据卷，把数据放到容器生命周期之外，避免容器删除后数据一起丢失。
11. network：容器网络，决定容器之间、容器和宿主机之间如何通信。
12. port mapping：端口映射，例如 `-p 8080:80`，把宿主机 8080 端口映射到容器 80 端口。
13. environment variable：环境变量，用来注入配置，例如 `NODE_ENV`、数据库地址、服务端口。
14. compose.yaml：Docker Compose 配置文件，用来定义多容器应用。

## 5. 最小 demo / 最小案例

### 5.1 前端静态站点：Node 构建，Nginx 托管

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
```

这段 Dockerfile 表达的是：

1. 第一阶段用 Node 安装依赖并执行构建。
2. `npm run build` 生成 `dist`。
3. 第二阶段用 Nginx 托管静态资源。
4. 最终镜像里不需要 Node、源码和开发依赖，只需要 Nginx 与 `dist`。

构建镜像：

```bash
docker build -t frontend-demo:1.0.0 .
```

启动容器：

```bash
docker run --rm -p 8080:80 frontend-demo:1.0.0
```

浏览器访问：

```txt
http://localhost:8080
```

### 5.2 Node 服务：容器里监听端口

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

启动：

```bash
docker build -t node-api:1.0.0 .
docker run --rm -p 3000:3000 node-api:1.0.0
```

这里要注意：

1. `EXPOSE 3000` 是说明容器里服务使用 3000 端口。
2. `-p 3000:3000` 才是真正把宿主机端口映射到容器端口。
3. `CMD` 是容器启动后默认执行的命令。

### 5.3 Docker Compose：一次启动多个服务

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

启动：

```bash
docker compose up
```

这个例子里：

1. `api` 是你的 Node 服务。
2. `db` 是 PostgreSQL 数据库。
3. `api` 里访问数据库地址时用 `db`，因为 Compose 会给服务名创建内部网络解析。
4. `db-data` 是 volume，用来保存数据库数据。

## 6. 在前端项目里它通常怎么出现？

### 6.1 CI 构建镜像

```txt
push 代码
→ CI 安装依赖
→ npm run build
→ docker build
→ docker push
→ 部署系统拉镜像
```

这时 Docker 镜像就是 CI/CD 的 artifact。

### 6.2 前端静态资源部署

前端常见模式：

```txt
源码
→ Node 镜像构建 dist
→ Nginx 镜像托管 dist
→ 线上跑 Nginx 容器
```

它解决的是前端产物如何稳定部署到服务器的问题。

### 6.3 本地依赖服务

即使前端项目本身不用 Docker 部署，也可能用 Compose 启动：

1. Mock API。
2. MySQL / PostgreSQL。
3. Redis。
4. MinIO。
5. Kafka / RabbitMQ。
6. Nginx 反向代理。

### 6.4 公司内部脚手架

你可能会看到：

```bash
docker build -f Dockerfile.prod -t registry.company.com/web/app:1.2.3 .
docker push registry.company.com/web/app:1.2.3
```

这说明项目不是只交付 `dist`，而是交付一个可运行镜像。

## 7. 看到 Docker 文件时怎么读？

优先按这个顺序读：

```txt
Dockerfile
→ FROM 基础镜像
→ WORKDIR 工作目录
→ COPY 复制了哪些文件
→ RUN 安装了什么依赖或执行了什么构建
→ ENV / ARG 注入了什么配置
→ EXPOSE 暴露什么端口
→ CMD / ENTRYPOINT 容器启动时跑什么
→ compose.yaml 里如何传环境变量、端口、volume、network
```

重点问题：

1. **这个镜像最终跑什么命令？** 看 `CMD` / `ENTRYPOINT`。
2. **构建阶段和运行阶段是不是分开？** 看有没有 multi-stage build。
3. **是否把不该进镜像的东西复制进去了？** 看 `.dockerignore`。
4. **依赖安装是否可复现？** 看是否使用 `npm ci`、lockfile 是否进入构建上下文。
5. **端口怎么映射？** 看 `EXPOSE` 和 `docker run -p` / Compose `ports`。
6. **数据是否会丢？** 看数据库、上传文件是否使用 volume。
7. **配置从哪里来？** 看 `ENV`、Compose `environment`、CI secret。

## 8. 常见坑

### 8.1 忘了 `.dockerignore`

如果没有 `.dockerignore`，可能把这些东西一起发送进构建上下文：

```txt
node_modules
dist
.git
coverage
.env
```

这会导致构建变慢、镜像变大，甚至泄露敏感文件。

### 8.2 把 `latest` 当稳定版本

`latest` 不是“最新且稳定”的保证，只是一个普通标签。生产部署更适合使用明确版本号或 commit sha：

```txt
registry.company.com/app/web:1.2.3
registry.company.com/app/web:git-a1b2c3d
```

### 8.3 在镜像里塞太多东西

前端静态站点最终只需要 Nginx 和 `dist`，不需要源码、Node、devDependencies。用 multi-stage build 可以明显减小镜像。

### 8.4 容器删了数据也没了

数据库、上传文件、缓存持久化这类数据不要只放在容器内部文件系统里，要用 volume 或外部存储。

### 8.5 以为 `EXPOSE` 等于端口开放

`EXPOSE` 只是镜像说明。真正映射端口要用：

```bash
docker run -p 8080:80 image-name
```

### 8.6 把密钥写进 Dockerfile

不要把 token、密码、私钥写进 Dockerfile 或镜像层。敏感配置应该由 CI/CD secret、运行时环境变量或密钥管理系统注入。

## 9. 它和 CI/CD、K8s 的关系

Docker 更偏向“应用如何被打包成镜像并运行”。

CI/CD 更偏向“代码如何自动检查、构建、发布”。

[[K8s 与容器编排|K8s]] 更偏向“很多容器如何在集群里调度、扩缩容、滚动发布和自愈”。

可以这样串：

```txt
代码提交
→ CI 检查和测试
→ Docker 构建镜像
→ 推送到镜像仓库
→ CD 把镜像部署到服务器或 K8s
→ K8s 负责运行、扩缩容和故障恢复
```

==Docker 是容器化交付的基础，[[K8s 与容器编排|K8s]] 是大规模管理容器的编排系统。先理解 Docker，再学 K8s 会顺很多。==

## 10. 一句面试版

==Docker 是一个**容器化平台**，它通过 Dockerfile 构建镜像，再由镜像启动容器，把应用及其运行依赖封装成**可移植、可复现的运行单元**，常用于统一开发环境、CI 构建和服务部署。==

## 11. 是否值得深入？

值得，尤其当你开始接触 CI/CD、Node 服务、BFF、微服务、K8s、云部署时。

推荐深入顺序：

1. 先理解 Dockerfile、image、container、registry、volume、network。
2. 再手写一个前端静态站点 Dockerfile。
3. 然后手写一个 Node 服务 Dockerfile。
4. 接着用 Docker Compose 启动 Node + 数据库。
5. 最后再看镜像层缓存、multi-stage build、镜像安全、CI 构建镜像、K8s 部署。

优先看官方资料：Docker overview、Dockerfile overview、Dockerfile reference、Docker Compose overview、Compose file reference。

## 12. 选择题自测

### Q1

Docker 最核心解决的问题是什么？

A. 替代所有后端代码  
B. 把应用及其运行依赖封装成可移植、可复现的运行单元  
C. 自动写前端页面  
D. 让数据库不需要备份

答案：B

解析：Docker 的核心价值是应用运行环境和交付方式的一致性。

### Q2

Dockerfile 的作用是什么？

A. 描述如何构建镜像  
B. 描述 Git 分支合并规则  
C. 描述浏览器路由  
D. 描述接口返回字段

答案：A

解析：Dockerfile 是构建镜像的说明书。

### Q3

image 和 container 的关系更准确的是？

A. image 是运行中的进程，container 是源码  
B. image 是镜像模板，container 是镜像运行起来后的实例  
C. 两者完全无关  
D. container 只能运行一次

答案：B

解析：同一个镜像可以启动多个容器。

### Q4

`docker run -p 8080:80 nginx` 表示什么？

A. 把宿主机 8080 端口映射到容器 80 端口  
B. 把容器 8080 端口映射到宿主机 80 端口  
C. 删除 8080 端口  
D. 安装 80 个依赖

答案：A

解析：`-p hostPort:containerPort`，左边是宿主机端口，右边是容器端口。

### Q5

为什么前端静态站点 Dockerfile 常用 multi-stage build？

A. 为了让镜像里同时运行两个浏览器  
B. 构建阶段用 Node，运行阶段只保留 Nginx 和 dist，减少镜像体积和运行依赖  
C. 为了禁止缓存  
D. 为了自动生成数据库

答案：B

解析：multi-stage build 可以把构建环境和运行环境分开，只把必要产物复制到最终镜像。
