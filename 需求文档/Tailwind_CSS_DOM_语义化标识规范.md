# Tailwind CSS DOM 语义化标识规范

## 1. 背景与痛点
Tailwind CSS 的 "utility-first" 模式在大幅提升开发效率的同时，也会导致 DOM 树中充斥着大量的原子类名（如 `flex items-center gap-4 p-6 ...`）。这使得在浏览器 DevTools 中调试或定位元素时面临以下问题：
1. **元素难以识别**：分不清层层嵌套的 `div` 节点在组件中具体扮演什么角色。
2. **交流描述困难**：开发人员或测试人员在反馈 Bug、描述布局时，无法用唯一的类名或标记精确指代某个节点。
3. **定位与测试困难**：在调试或编写 E2E 测试（如 Playwright/Cypress）时，缺乏稳定的 DOM 选择器。

为解决此痛点，并参考一线大厂的成熟解决方案，本项目统一采用 **“组件化语义标识 (Component Semantic Identification)”** 规范。

---

## 2. 标识属性规范
在编写组件与页面模板时，严禁使用无意义的嵌套，必须在关键 DOM 节点上追加以下三类 `data-*` 自定义属性：

| 属性名 | 用途 | 适用节点 | 命名规范 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| `data-component` | 标识组件/页面的根节点 | 每个 React 组件或 Page 页面组件的最外层包裹元素。 | `kebab-case`（小写短横线） | `data-component="answer-card"` |
| `data-element` | 标识组件内部的核心/功能子元素 | 凡是具备明确语义、功能或布局角色的内部子节点（如头部、侧边、按钮、列表项等）。 | `kebab-case`（小写短横线） | `data-element="submit-btn"` |
| `data-state` | 标识动态交互状态 | 配合逻辑控制，在有 active, open, correct, wrong, loading 等状态变更的节点上动态挂载。 | 状态值字面量 | `data-state="active"` |

---

## 3. 命名约定与代码示例

### 3.1 命名约定
- **组件命名**：应与 React 文件名或业务语义对齐。例如 `Sidebar.jsx` 对应 `data-component="sidebar"`。
- **元素命名**：需表达其职责。例如根部的页脚使用 `data-element="footer"`，列表项使用 `data-element="list-item"`。
- **状态值命名**：常用的状态值包括：
  - `active` / `inactive` (激活/未激活)
  - `open` / `closed` (展开/收起)
  - `correct` / `wrong` / `selected` / `unanswered` (答题卡与选项状态)
  - `loading` / `success` / `error` (数据加载状态)

### 3.2 代码书写示例
以下是 React 组件书写的标准范式：

```jsx
// ❌ 错误示范：只有一堆样式类，结构晦涩难懂
function UserProfile({ user, isActive }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <img className="w-10 h-10 rounded-full" src={user.avatar} alt="avatar" />
        <div className="flex flex-col">
          <span className="font-semibold text-text-strong">{user.name}</span>
          <span className="text-xs text-text-secondary">{user.role}</span>
        </div>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-success' : 'bg-border'}`} />
    </div>
  );
}

// ✅ 正确示范：结构清晰，调试与测试友好，状态自表达
function UserProfile({ user, isActive }) {
  return (
    <div 
      data-component="user-profile" 
      className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg"
    >
      <div data-element="info-wrapper" className="flex items-center gap-3">
        <img data-element="avatar" className="w-10 h-10 rounded-full" src={user.avatar} alt="avatar" />
        <div data-element="meta-info" className="flex flex-col">
          <span data-element="username" className="font-semibold text-text-strong">{user.name}</span>
          <span data-element="user-role" className="text-xs text-text-secondary">{user.role}</span>
        </div>
      </div>
      <span 
        data-element="status-indicator" 
        data-state={isActive ? 'active' : 'inactive'} 
        className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-success' : 'bg-border'}`} 
      />
    </div>
  );
}
```

---

## 4. 后续开发强制要求
**所有后续需求开发与代码重构，在修改或新增 UI 相关的 React 组件、页面文件时，必须严格遵守本规范**。
在提交 Pull Request (PR) 或进行代码评审 (Code Review) 时，检查 DOM 语义化标识（即是否有正确的 `data-component` 与 `data-element` 标记）将作为合并的必要标准之一。
