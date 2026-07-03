# Qwen 智能模拟面试官诊断反馈优化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 优化智能面试反馈体验，通过修改 Qwen Prompt 和 Mock 降级数据，强制输出与面试场景匹配的“示范表达短句”。

**架构：** 在原有 fetch 大模型 API 的 `systemPrompt` 中追加高分示范格式约束；同时补充 Mock 数据以达到同样的效果。

**技术栈：** React, JavaScript, Fetch API, Qwen LLM.

---

### 任务 1：修改 MockInterviewPage.jsx 中的自我介绍与反问 Prompt 约束及降级数据

**文件：**
- 修改：[MockInterviewPage.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/MockInterviewPage.jsx#L170-L290)

- [ ] **步骤 1：修改自我介绍评估的 systemPrompt 约束**
  在 `handleEvaluateSelfIntro` 里的 `systemPrompt` 中，要求 `advice` 必须包含 『建议修改为：“……”』 格式的示范短句。
  
- [ ] **步骤 2：修改自我介绍评估的 Mock 降级数据**
  在 `handleEvaluateSelfIntro` 无 API Key 降级时的 `advice` 字符串中，补充示范表达短句。
  
- [ ] **步骤 3：修改模拟反问评估的 systemPrompt 约束**
  在 `handleEvaluateReverseQa` 里的 `systemPrompt` 中，要求 `review` 必须包含 『您可以这样提问：“……”』 格式的示范短句。
  
- [ ] **步骤 4：修改模拟反问评估的 Mock 降级数据**
  在 `handleEvaluateReverseQa` 无 API Key 降级时的 `review` 字符串中，补充示范提问短句。

- [ ] **步骤 5：提交 Git 变更**
  暂存并提交 MockInterviewPage.jsx 文件的修改。

---

### 任务 2：修改 OralDrillPanel.jsx 中的口试与追问 Prompt 约束

**文件：**
- 修改：[OralDrillPanel.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/OralDrillPanel.jsx#L125-L320)

- [ ] **步骤 1：修改普通口试大纲诊断的 systemPrompt 约束**
  在 `runAiEvaluation` 里的 `systemPrompt` 中，要求 `advice` 必须包含 『推荐表达：“……”』 格式的示范短句。

- [ ] **步骤 2：修改追问口试大纲诊断的 systemPrompt 约束**
  在 `runFollowupAiEvaluation` 里的 `systemPrompt` 中，要求 `advice` 必须包含 『推荐表达：“……”』 格式的示范短句。

- [ ] **步骤 3：提交 Git 变更**
  暂存并提交 OralDrillPanel.jsx 文件的修改。

---

### 任务 3：本地运行与验证

- [ ] **步骤 1：开启本地开发服务**
  在 `/Users/neoyuan/Desktop/aoyi/个人中高级前端题库` 下运行 `pnpm dev` 并在浏览器中打开页面。
  
- [ ] **步骤 2：测试自我介绍和反问的 Mock 降级数据渲染**
  测试在未提供 `VITE_DASHSCOPE_API_KEY` 时的 Mock 反馈，校验界面渲染出来的 `advice` 和 `review` 内容中是否已经正确包含带示例的句子。
