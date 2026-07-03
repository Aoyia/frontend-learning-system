# Qwen 智能模拟面试官诊断反馈优化设计规格

本设计规格旨在优化“Qwen智能模拟面试官”功能的反馈体验。通过优化 AI 提示词（Prompt）约束以及降级模拟数据（Mock Data），使得面试官的诊断意见不仅指出好坏，还能针对不足提供具体的、与面试场景高度匹配的“示范表达短句”。

## 方案设计

采用**纯 Prompt 优化**方案，针对系统内调用的所有大模型评估环节，约束 AI 输出具体的口试/反问/自我介绍示范文本。

### 1. 修改自我介绍评估
*   **目标文件**：[MockInterviewPage.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/MockInterviewPage.jsx) 中的 `handleEvaluateSelfIntro` 方法。
*   **Prompt 调整**：约束返回的 `advice` 字段中必须包含格式为『建议修改为：“……”』的示范句式。
*   **降级 Mock 调整**：无 API Key 时返回的静态 `advice` 补全示范短句。

### 2. 修改反问环节评估
*   **目标文件**：[MockInterviewPage.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/MockInterviewPage.jsx) 中的 `handleEvaluateReverseQa` 方法。
*   **Prompt 调整**：约束返回的 `review` 字段中必须包含格式为『您可以这样提问：“……”』的示范句式。
*   **降级 Mock 调整**：无 API Key 时返回的静态 `review` 补全示范短句。

### 3. 修改口试答题评估
*   **目标文件**：[OralDrillPanel.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/OralDrillPanel.jsx) 中的 `runAiEvaluation` 方法。
*   **Prompt 调整**：约束返回的 `advice` 字段中必须包含格式为『推荐表达：“……”』的示范句式。

### 4. 修改追问答题评估
*   **目标文件**：[OralDrillPanel.jsx](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/OralDrillPanel.jsx) 中的 `runFollowupAiEvaluation` 方法。
*   **Prompt 调整**：约束返回的 `advice` 字段中必须包含格式为『推荐表达：“……”』的示范句式。

## 规格自检
*   **占位符扫描**：无占位符，所有字段和格式要求均已明确。
*   **内部一致性**：四个接口统一采用 Prompt 增强形式，且指定了明确的示范句式包裹符号（如『建议修改为：“……”』或『推荐表达：“……”』），以便在前端界面中具有高辨识度。
*   **范围检查**：修改仅限于两个 React 组件文件，范围适中，可在一个实现计划中完成。
