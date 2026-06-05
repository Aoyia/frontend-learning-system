---
title: 低代码规则引擎与 DSL 编译原理设计（腾讯面试/大厂拷打）
difficulty: 困难
tags: [低代码, 规则引擎, 编译原理, 腾讯面试, 大厂拷打]
module: project-prep
sourceType: original
order: 4
---

# 🧭 低代码规则引擎与 DSL 编译原理设计

在腾讯等一线大厂的系统架构与中高级前端面试中，**“编译原理在前端工程的落地”** 往往是拉开差距的关键分水岭。如果你的项目里有一个“自研的轻量级规则引擎”，并且用到了 **Babel 插件、AST 转换、运算符重载、安全沙箱**，这足以让面试官眼前一亮。

本篇文档基于企业级规则引擎 `xdap-lib-rule-engine`，深度剖析规则引擎的设计与编译原理实践。

---

## 1. 为什么自研规则引擎？（为什么不用 eval/new Function）

### 1.1 业务背景
在低代码 aPaaS 平台中，业务人员需要可视化配置各种联动公式。例如：
*   **计算公式**：`金额 = 单价 * 数量 * (1 - 折扣率)`
*   **隐藏条件**：`当 报销金额 > 5000 且 级别 == '普通员工' 时，隐藏“直接批准”按钮`

### 1.2 为什么不能裸用 eval()？
1.  **安全后门**：如果直接使用 `eval` 或 `new Function` 执行用户配置的任意 JS 字符串，用户可以输入恶意脚本（如 `window.location.href = ...` 或窃取 Cookie），造成 XSS 攻击。
2.  **高精度缺失**：JavaScript 的经典浮点数精度 Bug（如 `0.1 + 0.2 === 0.30000000000000004`），这在计费、财务等业务公式计算中是绝对不能容忍的。
3.  **不支持特殊语义（运算符重载）**：例如在低代码中，用户希望执行“数组级运算”（如两个子表列数据对应相加），JS 默认的 `+` 运算符无法重载。
4.  **序列化与可视化困难**：直接存储一段 JS 代码，很难被拖拽编辑器解析并渲染为可视化拼装界面。

---

## 2. 规则引擎架构与编译链路

规则引擎的核心设计思想是：**“编译期做 AST 改写，运行期做安全治理与精度包装”**。

```
用户拖拽配置 ──▶ 规则元素栈 (ruleStack) ──▶ 生成表达式字符串 ──▶ Babel 编译 (RefactorOperator)
                                                                           │
                                                                           ▼
局部沙箱执行 ◄── 结合 BigNumber 精度包装类 ◄── 替换二元运算符为 _Op.add() ◄── AST 转换
```

### 2.1 规则数据结构设计 (DSL Schema)
我们将规则序列化存储为 `ruleStack` 栈结构，包含操作符、函数、组件 UUID 和静态值：

```typescript
class RuleElement {
  ruleType: 'FUNCTION' | 'STATIC' | 'COMPONENT_VALUE' | 'OPERATION';
  funcName?: string;     // 函数名，如 'xdapsum', 'xdapif'
  value?: string | number; // 静态值或表单组件 UUID
}
```

### 2.2 核心机制：Babel 插件实现运算符重载
由于 JS 原生不支持类似 Python 的运算符重载，我们通过一个自定义的 Babel 插件 `RefactorOperator` 在编译阶段进行 AST（抽象语法树）转换：

```javascript
// RefactorOperator.js - 运算符映射
const operatorMap = {
  '+': 'add', '-': 'sub', '*': 'mul', '/': 'div',
  '==': 'equal', '!=': 'notEqual', '<': 'less', '>': 'greater'
};

// AST 转换规则：将 BinaryExpression (如 a + b) 替换为 CallExpression (如 _Op.add(a, b))
export default function({ types: t }) {
  return {
    visitor: {
      BinaryExpression(path) {
        const { operator, left, right } = path.node;
        if (operator in operatorMap) {
          path.replaceWith(
            t.callExpression(
              t.memberExpression(t.identifier('_Op'), t.identifier(operatorMap[operator])),
              [left, right]
            )
          );
        }
      }
    }
  };
}
```

### 2.3 高精度与数组级运算包装类 (OpteratorWrapperData)
配合 AST 转换，我们将运行时的数据全部用 `OpteratorWrapperData` 包装。在包装类内部重载魔术方法并集成 `BigNumber.js`：

```javascript
class OpteratorWrapperData {
  constructor(value) {
    this.value = value;
  }

  // 接管 AST 转换后的加法 _Op.add(a, b)
  __add__(other) {
    // 1. 兼容子表场景：若左右操作数是数组，则执行逐元素对应相加
    if (Array.isArray(this.value) && Array.isArray(other.value)) {
      return new OpteratorWrapperData(
        this.value.map((v, i) => this.compute('+', v, other.value[i]))
      );
    }
    return new OpteratorWrapperData(this.compute('+', this.value, other.value));
  }

  compute(op, a, b) {
    // 内部通过 BigNumber 进行任意精度计算
    if (op === '+') return new BigNumber(a).plus(b).toNumber();
    // ... 其他运算符同理
  }
}
```

---

## 3. 运行期安全治理与性能缓存

### 3.1 运行期沙箱隔离与受限执行器 (Constrained Evaluator)
为了屏蔽全局恶意操作，我们在 `RuleRuntime` 实例化 `new Function` 执行编译后代码时，采取了如下安全措施：
1.  **入参白名单**：只允许 `ruleContext`（运行时上下文）和 `BigNumber` 传入。
2.  **局部变量劫持**：在函数体内强制将 `window`、`document`、`XMLHttpRequest` 等关键全局变量设为 `undefined`，防止非法获取。
3.  **表达式校验**：提交配置前，使用 Mock 上下文预跑一遍公式进行关键词和 AST 白名单匹配。

### 3.2 性能优化：编译缓存设计
Babel 进行 AST 转换和 `new Function` 解析是极耗 CPU 的操作。为了消除高频联动时的性能瓶颈，我们实现了**编译结果缓存**：

```javascript
class RuleEngine {
  // 缓存编译后的可执行函数，键为 ruleId
  ruleExecutorFuncMap = new Map();

  executeRule(rule) {
    let executor = this.ruleExecutorFuncMap.get(rule.ruleId);
    if (!executor) {
      // 1. 编译并转换表达式为 JS 代码
      const expr = RuleParser.parseToExpr(rule);
      const compiledCode = Babel.transform(expr, { plugins: [RefactorOperator] }).code;
      // 2. 构造闭包执行器
      executor = new Function('ruleContext', '_Op', `return (${compiledCode})`);
      this.ruleExecutorFuncMap.set(rule.ruleId, executor);
    }
    // 3. 复用执行器并注入当前表单实例的上下文
    return executor(this.currentContext, OpteratorWrapperData);
  }
}
```

---

## 4. 腾讯中高级前端面试真题拷打

### 🎤 问题 1：既然说 Babel 编译是性能瓶颈，那页面首次加载时，如果有 100 条规则同时需要编译，页面不会卡死吗？你做了哪些优化？
**腾讯面试官考核点：冷启动性能优化、编译持久化、计算密集任务分流。**

> **答题套路：**
> 1. **承认瓶颈并抛出度量**：一条中等复杂度的规则走 Babel 浏览器端编译（通常使用 `@babel/standalone`）大约需要 5-15ms，100 条并发会导致长达 1.5s 的 Long Task，造成页面明显的帧率下降。
> 2. **优化手段 1：按需惰性编译（Lazy Compilation）**：我们不在表单初始化时全量编译所有规则。只有当组件进入视口、或者用户第一次修改了联动源字段时，才触发对应规则的编译。
> 3. **优化手段 2：二级缓存（IndexedDB 持久化）**：由于低代码配置的 `ruleId` 和配置内容在发布后是静态的，我们将编译后的 JS 代码字符串以及 AST 快照存储在 **IndexedDB** 中。页面二次加载时直接从本地 DB 取出代码通过 `Function` 反序列化，避开 Babel 运行。
> 4. **优化手段 3：Node 端预编译（AOT - Ahead of Time）**：在低代码设计器“保存并发布”时，我们在 Node 服务端提前将 `ruleStack` 走 Babel 编译好并输出为产物静态字段。前端在运行时直接获取编译完成的代码字符串进行解析（JIT 执行），完全免去了前端运行 Babel 的性能开销。

---

### 🎤 问题 2：你的规则引擎是如何实现子表逐行筛选计算的（例如：过滤出子表中“单价 > 10”的行，并将数量累加）？
**腾讯面试官考核点：作用域隔离、Babel 函数包装设计。**

> **答题套路：**
> 1. **核心痛点**：对于子表这类多行数据，计算公式需要逐行读取局部字段，如果直接求值会导致作用域错乱。
> 2. **Babel 自动惰性包装**：在编译子表函数（如 `xdaptablerowcal(tableData, filterCond, calcExpr)`）时，Babel 插件在 AST 层面会将第二、第三个参数（筛选条件和计算表达式）自动重构为**匿名箭头函数**：
>    `xdaptablerowcal(tableData, (row) => row.price > 10, (row) => row.quantity)`
> 3. **运行时迭代器执行**：在 `TableRowCalFunction` 策略实现中，我们迭代遍历子表行数据。每次循环中，将当前的 `row` 数据挂载到 `ruleContext.currentRow`（当前行作用域）上，然后依次执行筛选函数和计算函数，实现干净的行级作用域隔离。

---

### 🎤 问题 3：表单公式规则允许字段相互引用（如 B = A + 1, A = B + 1），若用户配置了循环依赖，会导致规则引擎无限循环运行。你是如何设计和实现循环依赖检测的？
**腾讯面试官考核点：有向无环图（DAG）构建、拓扑排序/DFS环检测、运行时熔断兜底机制。**

> **答题套路：**
> 1. **双层拦截防御策略**：我们采用了 **“配置期主动拦截 + 运行时阈值熔断”** 的双层防御体系，从根本上防止死循环和页面卡顿。
> 2. **配置期环检测（拓扑分析）**：
>    - **图的建模**：将每条公式抽象为有向图中的一条边。目标字段（被赋值的左值）指向它所依赖的字段（右值列表）。例如，公式 `B = A + 1` 建模为一条有向边 `B -> A`。
>    - **DFS 三色标记算法**：在用户保存公式配置前，前端将当前编辑的规则与全局已生效的规则合并，构建一张有向图。使用 **DFS 三色标记法** 进行检测：
>      - `0`（白色）：未访问节点。
>      - `1`（灰色）：访问中节点（处于当前的递归栈中）。
>      - `2`（黑色）：已完成访问节点。
>      - 在深度优先遍历中，若访问到一个状态为 `1` 的节点，说明遇到回边，即存在**循环依赖**。算法此时会记录 DFS 递归栈路径，并抛出清晰的错误提示（如 `检测到循环依赖：A -> C -> B -> A`），拒绝保存并阻止数据入库。
> 3. **运行时熔断（防御性设计）**：
>    - **最大执行轮次限制**：当公式规则在运行期因用户操作或动态事件触发联动时，我们设置了最大触发次数阈值（如最多迭代执行 10 轮）。
>    - **执行路径状态签名（Cycle Signature）**：我们会在执行上下文中记录当前这一轮次被修改字段的哈希签名。如果发现相同的字段修改组合再次出现，即判定存在环状死循环，立即抛出运行时中断异常，熔断计算，确保页面不会卡死崩溃。

---

## 5. STAR 技术亮点表达

*   **Situation (背景)**: 公司低代码 aPaaS 平台的表单需要支持高自由度的公式与隐藏联动。原系统采用裸 `eval()`，不仅存在致命的 XSS 安全隐患，且因 JS 浮点数计算误差导致计费表单出现财务偏差，甚至无法支持子表行级迭代计算。
*   **Task (任务)**: 设计并自研轻量级 DSL 编译规则引擎，消除安全隐患与精度缺失，支持复杂子表计算。
*   **Action (行动)**:
    1.  设计了基于 `ruleStack` 栈结构的可持久化 DSL，支持可视化解析。
    2.  编写了 **Babel AST 插件**，在编译期将加减乘除运算符重载为自定义魔术方法调用。
    3.  实现 `OpteratorWrapperData` 数据包装器，集成 `BigNumber.js` 解决高精度浮点问题，并兼容数组逐元素运算。
    4.  引入了沙箱环境屏蔽全局对象；并在 Node.js 服务端引入 **AOT 预编译机制**，将编译开销彻底从客户端抹去。
*   **Result (结果)**: 实现了客户端编译的“零耗时”（全部使用 AOT 预编译或 IndexedDB 缓存），浮点精度误差降低为 **0**，彻底杜绝了 `eval` 的注入安全风险，稳定支撑了千万级财务公式计算。

---

## ## 📝 面试题自测

### Q1 [single]
在规则引擎中，使用 Babel 插件在编译期将 `a + b` 转换成 `_Op.add(a, b)`，这在程序设计中属于什么模式或原理的应用？
A. 装饰器模式 (Decorator Pattern)
B. 运算符重载 (Operator Overloading)
C. 原型链继承 (Prototype Inheritance)
D. 依赖注入模式 (Dependency Injection)
答案：B
解析：运算符重载是指重新定义程序中已有运算符在特定数据类型下的计算行为。在 JavaScript 中原生不支持这一特性，我们通过 Babel AST 插件在编译期将运算符替换为自定义的函数调用（如 `_Op.add`），并在底层根据操作数类型（如包装类或数组）决定计算语义，这属于运算符重载的编译期实现。

### Q2 [multiple]
为了在规则引擎执行动态配置的代码时防止用户输入恶意脚本（如窃取 cookie），下列属于有效安全防范措施的是？
A. 拒绝直接执行裸露的 JS 文本输入，由可视化拖拽生成结构化 `ruleStack` 再解析
B. 在 `new Function` 执行的环境中，将 `window`, `document`, `location` 等全局对象显式声明为 `undefined`
C. 过滤用户输入的关键词，包含 `alert`, `script` 等即拒绝发布
D. 在保存规则前，走 AST 白名单检测，任何非白名单内的函数调用或全局变量引用直接报错拦截
答案：ABD
解析：A 选项从源头限制了输入范围；B 选项和 D 选项在运行期和编译期构成了受限执行和白名单审计，是极为有效的沙箱防护措施。而 C 选项采用简单的黑名单字符过滤极易被混淆绕过（例如通过 `window['al' + 'ert']` 绕过），属于不安全的做法。

### Q3 [judgment]
为了解决规则引擎中的 Babel 编译耗时（通常为毫秒级），应当在设计器“发布表单”时，由 Node.js 服务端提前将 DSL 编译成 JS 表达式字符串（AOT），客户端运行时直接加载并执行编译后的代码，这是一种有效的性能优化策略。
答案：对
解析：Babel 编译是一个相对沉重的 AST 构建和转化过程。在运行时完全免去这一开销的最佳方案是“编译前置”。即在低代码设计器发布配置时，由服务端 Node 提前调用 Babel 编译好目标代码并存储，客户端运行时仅做 `new Function` 的反序列化（JIT 评估），能彻底消除客户端 of Babel 加载和编译耗时。

### Q4 [single]
在低代码规则引擎中，为了在配置期快速、无误地拦截循环依赖（如 A -> B -> C -> A），下列哪种建模与检测算法最适合在前端应用？
A. 将字段作为节点，依赖关系作为无向边，使用 Kruskal 最小生成树算法
B. 将字段作为节点，依赖关系作为有向边，使用有向图的 DFS 三色标记检测算法
C. 使用 Dijkstra 算法计算两个字段之间的最短路径
D. 在运行时裸奔执行，通过 setTimeout 超时来检测
答案：B
解析：字段公式依赖关系是有方向的（例如 B 的值取决于 A，为 B -> A），这构成了一个有向图。检测循环依赖即是寻找有向图中的环。DFS 三色标记算法通过将节点状态标记为未访问、访问中、已完成，能在 O(V + E) 的时间复杂度内极其高效地检测出回边（环），并输出完整的成环路径，非常适合在前端配置保存前进行实时校验。
