# 实战：搭建 AI Code Review 自动化流水线

- **来源**：掘金（作者：雨夜寻晴天）
- **原文链接**：[掘金文章](https://juejin.cn/post/7646348958055628850)
- **主题**：AI 自动门禁与 Code Review、CI/CD 集成

---

## 核心现成问答与方案总结

### 1. 团队落地 AI Code Review 的核心定位是什么？
AI Code Review 的目的并不是要彻底取代人工审查。
- **推荐方案**：采用“分层审查”。让 AI 提前拦截低级问题（例如类型定义 errors、硬编码警告、空指针异常、低级 Bug 模式、未处理的异常分支），让人工审查者（Reviewer）把精力集中在核心的业务架构和深层设计上，降低人工审查负担。

### 2. 自动化流水线架构是如何搭建的？
作者介绍了一套基于 Python + Flask + GitLab CI 的自动化 CR 架构：
- **AI Review Service**：基于 Flask 编写的后端服务。服务启动时会从中央 Git 仓库拉取最新代码审查规范，接收代码 Diff 并拼接“规范审查 + 专家审查”的 System Prompt 送给 LLM 进行分析。LLM 会对代码打分（100分制，并根据 P0/P1/P2 问题严重性扣分），以结构化的 JSON 格式返回。
- **GitLab CI 自动化集成**：在项目 `.gitlab-ci.yml` 中配置 `ai-review` 作业。当触发 `merge_request_event` 时，流水线启动该作业，通过 curl 将 Diff 传送给 AI 服务。
- **结果自动推送**：Python 脚本 `ai_review.py` 解析 AI 返回的 JSON，利用 GitLab PAT（个人访问令牌）调用 API 接口（`/merge_requests/:mr_iid/notes`）把精简格式化的 Markdown 结果（包含报错位置、问题类型、修改建议）直接以 MR 评论的形式贴在对应的合并请求上。

### 3. 大厂在落地 AI 自动门禁时的避坑指南
- **Token 权限问题**：GitLab 访问令牌（Token）必须分配 `api` 级别权限。如果只分配了 `read_api` 权限，会导致调用 GitLab 写评论接口时返回 401 失败。
- **非 TTY 终端 Payload 传递**：CI 容器中的命令行对于超长、复杂的 JSON 参数容易发生转义乱码。在执行 curl 时，建议使用 stdin 管道传入（如 `@-`），确保数据完整无误。
- **CI Artifact 存留期**：CI 临时生成的变更文件 artifacts 默认保留时间不宜过短（建议保留 1 周），避免下游客观因素超时导致的流水线故障。
