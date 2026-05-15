---
title: K8s 与容器编排
category: 后端基础
tags:
  - backend
  - runtime
  - kubernetes
  - k8s
  - container
  - orchestration
difficulty: hard
status: draft
created: 2026-04-30
updated: 2026-04-30
---

# K8s 与容器编排

## 1. 它属于哪个知识板块？

K8s 属于：

```txt
后端基础
→ 运行环境
→ 容器编排
→ Cluster / Node / Pod / Deployment / Service / Ingress
```

K8s 是 Kubernetes 的常见缩写：K + 中间 8 个字母 + s。

==**K8s** 解决的是“当容器不止一个、机器不止一台、服务需要自动部署、扩缩容、自愈和滚动发布时，谁来统一管理这些容器”的问题。==

它不是 Docker 的替代品。更准确地说：

==[[Docker 与容器化|Docker]] 关注“如何把应用打包成镜像并启动容器”，K8s 关注“如何在一组机器上持续运行、调度、暴露、扩缩容和恢复这些容器化应用”。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

只在本地跑一个容器时，Docker 足够：

```bash
docker run -p 3000:3000 my-api:1.0.0
```

但真实生产环境会马上出现更多问题：

1. 服务要跑多个副本，不能只跑一个容器。
2. 某个容器挂了，要自动拉起来。
3. 某台机器资源不够，要把容器调度到别的机器。
4. 发布新版本时，不能一次性把旧版本全停掉。
5. 服务实例 IP 会变化，但调用方需要一个稳定入口。
6. 配置、密钥、环境变量不能写死在镜像里。
7. 流量入口、域名、HTTPS、路径转发要统一管理。
8. CPU、内存、扩缩容、健康检查都要有标准方式。

==K8s 的核心价值不是“让你多写 YAML”，而是提供一套**声明式 API**：你描述期望状态，K8s 持续把集群实际状态调整到这个期望状态。==

例如你声明：

```txt
我希望 my-api 永远有 3 个副本在运行
```

K8s 会持续检查：

```txt
当前有几个副本？
→ 少了就创建
→ 多了就删除
→ 有 Pod 挂了就重新拉起
→ 机器不合适就重新调度
```

这就是 K8s 的“期望状态 + 控制器调和”心智模型。

## 3. 核心流程

一次最小 K8s 发布可以这样理解：

```txt
应用代码
→ 构建 Docker / OCI 镜像
→ 推送到镜像仓库
→ 写 Kubernetes YAML
→ kubectl apply
→ API Server 接收声明
→ Scheduler 选择 Node
→ kubelet 在 Node 上拉镜像、启动 Pod
→ Service 提供稳定访问入口
→ Ingress 把外部 HTTP 流量转进 Service
```

更短的版本：

```txt
镜像是交付物
→ YAML 是期望状态
→ K8s 控制器负责让实际状态接近期望状态
```

==学 K8s 不要从命令背诵开始，要先抓住这条主线：**镜像、声明、调度、运行、暴露、监控、修复**。==

## 4. 关键词清单

1. Cluster：集群，一组运行 K8s 的机器和控制组件。
2. Control Plane：控制面，负责接收 API、调度、记录状态、运行控制器。
3. Node：工作节点，真正运行应用 Pod 的机器。
4. Pod：K8s 里最小的可调度单位，通常包含一个主容器，也可以包含 sidecar。
5. Container：Pod 里的容器，基于镜像运行。
6. Deployment：管理无状态应用副本、滚动更新和回滚的常用对象。
7. ReplicaSet：保证某个 Pod 模板有指定数量副本，通常由 Deployment 管理。
8. Service：给一组 Pod 提供稳定访问入口和负载均衡。
9. Ingress：管理 HTTP / HTTPS 外部访问规则，例如域名、路径转发。
10. Namespace：命名空间，用来隔离不同团队、环境或系统资源。
11. ConfigMap：保存非敏感配置，例如普通环境变量、配置文件片段。
12. Secret：保存敏感配置，例如 token、密码、证书。
13. Volume / PVC：持久化存储，让数据不随 Pod 删除而丢失。
14. HPA：Horizontal Pod Autoscaler，根据指标自动调整 Pod 副本数量。
15. kubectl：K8s 命令行工具，用来查看和修改集群资源。
16. manifest：资源声明文件，通常是 YAML。
17. kubelet：每个 Node 上的代理，负责根据控制面指令运行和汇报 Pod。
18. scheduler：调度器，决定 Pod 应该放到哪个 Node。
19. controller：控制器，持续对比期望状态和实际状态并进行修正。
20. container runtime：容器运行时，例如 containerd、CRI-O。

## 5. 最小 demo / 最小案例

### 5.1 Deployment：声明要跑几个副本

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-demo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-demo
  template:
    metadata:
      labels:
        app: web-demo
    spec:
      containers:
        - name: web
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
```

这段 YAML 表达的是：

1. 我声明一个 `Deployment`。
2. 它管理的应用叫 `web-demo`。
3. 我希望有 3 个副本。
4. 每个副本运行一个 `nginx:1.27-alpine` 容器。
5. 容器内部监听 80 端口。

执行：

```bash
kubectl apply -f deployment.yaml
```

K8s 会创建并维持 3 个 Pod。

### 5.2 Service：给 Pod 一个稳定入口

Pod 会被创建、删除、重建，它的 IP 不稳定。Service 解决的是“怎么稳定访问一组 Pod”的问题。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-demo
spec:
  selector:
    app: web-demo
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

这段 YAML 表达的是：

1. 创建一个名为 `web-demo` 的 Service。
2. 它通过 `selector` 找到标签为 `app: web-demo` 的 Pod。
3. 集群内部访问 `web-demo:80`，会被转发到后面的 Pod。
4. `ClusterIP` 表示只在集群内部暴露。

==Deployment 解决“跑几个副本”，Service 解决“怎么稳定访问这些副本”。==

### 5.3 Ingress：让外部 HTTP 流量进来

Ingress 负责把外部 HTTP / HTTPS 流量按域名或路径转发到 Service。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-demo
spec:
  rules:
    - host: demo.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-demo
                port:
                  number: 80
```

这段 YAML 表达的是：

```txt
访问 demo.example.com/
→ 进入 Ingress
→ 转发到 web-demo Service
→ Service 再转发到后面的 Pod
```

注意：Ingress 只是规则，还需要集群里安装 Ingress Controller，规则才会真正生效。

## 6. K8s 和 Docker 的关系

最容易混的是这两个问题：

```txt
Docker：我怎么打包和运行一个容器？
K8s：我怎么在很多机器上管理很多容器？
```

实际链路通常是：

```txt
Dockerfile
→ docker build 生成镜像
→ docker push 推到镜像仓库
→ K8s Deployment 引用这个镜像
→ Node 上的 container runtime 拉镜像
→ kubelet 启动 Pod
```

所以可以这样记：

==Docker 更像“造标准集装箱”，K8s 更像“管理港口和调度系统”：决定集装箱放在哪台机器、跑几个、坏了怎么补、升级怎么滚动、外部流量怎么进来。==

补充一个容易过时但很重要的点：

K8s 不等于一定直接使用 Docker Engine 作为运行时。现代 K8s 常通过 CRI 使用 containerd 或 CRI-O 运行容器。你仍然可以用 Docker 构建镜像，只要镜像符合 OCI 生态，K8s 就可以拉取和运行。

## 7. K8s 和 DevOps 的关系

[[DevOps|DevOps]] 关心的是代码如何稳定交付、运行、监控和反馈。

K8s 在 DevOps 里通常承担运行平台的角色：

```txt
CI 构建镜像
→ 推送镜像仓库
→ CD 更新 K8s Deployment 镜像版本
→ K8s 滚动发布
→ Service / Ingress 保持访问入口
→ 监控系统观察错误率、延迟和资源
→ 出问题回滚
```

所以 K8s 常和这些东西一起出现：

1. CI/CD。
2. Docker 镜像。
3. Helm。
4. Argo CD / GitOps。
5. Prometheus / Grafana。
6. 日志系统。
7. Service Mesh。
8. 云厂商托管 Kubernetes，例如 EKS、GKE、AKS。

## 8. 看到 K8s 配置时怎么读？

优先按这个顺序：

```txt
kind 是什么
→ metadata.name 叫什么
→ namespace 在哪
→ selector 选中了谁
→ image 是哪个镜像
→ replicas 要几个副本
→ ports 暴露什么端口
→ env / ConfigMap / Secret 从哪里注入配置
→ resources 有没有 CPU / memory 限制
→ probes 有没有健康检查
→ Service / Ingress 怎么把流量导进来
```

最常见的排查路径：

```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl get svc
kubectl get ingress
kubectl rollout status deployment/<name>
```

看不懂 YAML 时，先问四个问题：

1. **这个对象负责什么？** Deployment、Service、Ingress、ConfigMap、Secret 各司其职。
2. **它选中了谁？** 看 `selector` 和 `labels`。
3. **它引用了什么镜像和配置？** 看 `image`、`env`、`envFrom`、`volumeMounts`。
4. **它怎么被访问？** 看 Service、Ingress、端口和域名。

## 9. 常见坑

### 9.1 把 Pod 当成长期稳定机器

Pod 随时可能被删除和重建，不要把 Pod 当成固定服务器。真正稳定的是 Service、持久卷和声明式配置。

### 9.2 只写 Deployment，不写 Service

Deployment 能让 Pod 跑起来，但别人不一定能稳定访问它。服务访问通常要配 Service。

### 9.3 selector 和 labels 对不上

Service 通过 selector 找 Pod。如果 label 写错，Service 后面可能没有任何后端。

### 9.4 没有 readiness / liveness probe

没有 readiness probe，没准备好的 Pod 可能提前接流量。

没有 liveness probe，进程卡死但没退出时，K8s 可能不知道要重启。

### 9.5 不写 resources

不写 CPU / memory requests 和 limits，调度、扩缩容、资源隔离都会变得不可控。

### 9.6 把 Secret 当成绝对安全

K8s Secret 是敏感配置对象，但不是“自动万无一失”。仍然要关注 RBAC 权限、etcd 加密、访问审计和密钥轮换。

### 9.7 以为 Ingress 自己就能工作

Ingress 是规则，真正执行规则的是 Ingress Controller。集群里没有 Controller，Ingress 只是一个对象。

## 10. 前端为什么也要懂一点 K8s？

前端不一定要会搭集群，但应该能看懂自己服务怎么上线。

你可能会在这些场景碰到 K8s：

1. 前端静态资源服务跑在 Nginx 容器里，由 K8s 部署。
2. Node BFF 跑在 K8s 里。
3. SSR 服务需要副本数、健康检查、资源限制。
4. 发布失败时要看 Pod 日志。
5. 接口或页面 502，需要判断是 Ingress、Service、Pod 还是应用本身的问题。
6. 灰度发布、金丝雀发布和 K8s Deployment / Ingress / Service Mesh 有关。
7. 线上白屏或接口错误，需要把前端监控和后端服务发布记录串起来。

==前端理解 K8s 的目标，不是成为集群管理员，而是能看懂“我的代码被打成什么镜像、跑在哪个服务里、怎么接流量、出问题去哪里看”。==

## 11. 一句面试版

==K8s 是一个开源容器编排平台，它通过声明式 API 管理容器化应用的部署、调度、服务发现、负载均衡、滚动更新、自愈和扩缩容；Docker 负责构建镜像和本地运行容器，而 K8s 负责在集群中长期稳定地运行和管理这些容器。==

## 12. 是否值得深入？

值得，但别一上来学安装集群。

推荐顺序：

1. 先理解 [[Docker 与容器化|Docker]]：镜像、容器、Dockerfile、registry。
2. 再理解 K8s 的期望状态模型。
3. 然后掌握 Pod、Deployment、Service、Ingress。
4. 接着看 ConfigMap、Secret、resources、probes。
5. 再看 rollout、rollback、HPA、Namespace。
6. 最后再深入 Helm、GitOps、RBAC、NetworkPolicy、StatefulSet、Operator、Service Mesh。

优先看官方资料：Kubernetes Concepts、Kubernetes Components、Pods、Deployments、Service、Ingress、ConfigMap、Secret。

## 13. 选择题自测

### Q1

K8s 最核心解决的问题是什么？

A. 替代所有业务代码  
B. 在集群里管理容器化应用的部署、调度、自愈、服务发现、扩缩容和滚动发布  
C. 让前端不用构建  
D. 自动设计数据库表

答案：B

解析：K8s 是容器编排平台，关注大量容器如何长期稳定运行。

### Q2

Pod 在 K8s 里是什么？

A. 最小可调度单位，里面可以包含一个或多个容器  
B. 镜像仓库  
C. 代码分支  
D. 浏览器缓存

答案：A

解析：K8s 调度的是 Pod，不是直接调度单个 Docker 命令。

### Q3

Deployment 最常见的作用是什么？

A. 管理无状态应用副本、滚动更新和回滚  
B. 保存数据库密码  
C. 只负责域名解析  
D. 自动写 CSS

答案：A

解析：Deployment 是部署无状态服务最常见的工作负载对象。

### Q4

Service 解决什么问题？

A. 让一组会变化的 Pod 拥有稳定访问入口  
B. 删除所有 Pod  
C. 替代 Dockerfile  
D. 修改 Git 历史

答案：A

解析：Pod IP 不稳定，Service 通过 selector 给一组 Pod 提供稳定入口。

### Q5

Ingress 和 Service 的关系更准确的是？

A. Ingress 管理外部 HTTP / HTTPS 规则，通常把流量转发到 Service  
B. Ingress 是数据库  
C. Service 只能在浏览器里运行  
D. Ingress 会自动生成业务代码

答案：A

解析：Ingress 处理域名、路径等 HTTP 入口规则，后端一般指向 Service。

### Q6

为什么说 K8s 不是 Docker 的简单替代？

A. 因为 K8s 不关心容器  
B. 因为 Docker 更关注镜像和容器，K8s 更关注集群里的容器编排和持续运行  
C. 因为 Docker 只能运行在浏览器里  
D. 因为 K8s 只能写前端

答案：B

解析：两者处在不同层级：Docker 偏容器构建和运行，K8s 偏集群编排和运行治理。
