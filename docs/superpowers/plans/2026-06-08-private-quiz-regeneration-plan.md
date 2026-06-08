# 私密面试资源 180 道题目扩充与生成实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标**：将 `面试准备资料/` 目录下全部 12 篇最新的面试资源文档的测验题目扩充至每篇 15 道题（共 180 道），确保题目质量深度高、JSON 格式无损、题型配比（8单选 + 5多选 + 2判断）与排序正确，并同步推送到远程私有仓库。

**架构**：在 `学习系统/scratch/` 下提供一个 Node.js 验证脚本进行自动化校验。分 4 批（每批 3 个 Markdown 文件）指派题目研究员 Agent 进行题目的提取、研究与生成覆写。每一批完成后运行 Node.js 校验脚本，并在全部完成后进行 npm run build 和 git push 同步。

**技术栈**：Node.js、Regex、JSON parser。

---

## 1. 文件清单与职责

* **新增测试脚本**：`学习系统/scratch/check_quiz_json.js` — 负责读取指定的 Markdown 文件，提取 `<!-- quiz: [...] -->` 并进行 `JSON.parse` 校验，以及校验 8 单选 + 5 多选 + 2 判断 的比例和排序是否符合要求。
* **要修改的面试文档（共 12 篇）**：
  * `面试准备资料/AI-Agent前端面试准备.md`
  * `面试准备资料/公式规则循环引用问题.md`
  * `面试准备资料/前端通用技术亮点面试准备.md`
  * `面试准备资料/性能优化面试准备.md`
  * `面试准备资料/性能优化面试准备-面试版.md`
  * `面试准备资料/插件化架构面试准备.md`
  * `面试准备资料/插件开发全链路面试准备.md`
  * `面试准备资料/表单渲染引擎面试准备.md`
  * `面试准备资料/规则引擎面试准备.md`
  * `面试准备资料/面试复盘报告提升通过率.md`
  * `面试准备资料/项目证据链与开放方案题专项.md`
  * `面试准备资料/项目面试准备总索引.md`

---

## 2. 实现任务分解

### 任务 1：编写本地题目自动化校验脚本

**文件**：
- 创建：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js`

- [ ] **步骤 1：编写校验脚本代码**
  在目标文件写入以下 Node.js 校验逻辑：
  ```javascript
  const fs = require('fs');
  const path = require('path');

  // 要检查的 12 个文件列表
  const files = [
    'AI-Agent前端面试准备.md',
    '公式规则循环引用问题.md',
    '前端通用技术亮点面试准备.md',
    '性能优化面试准备.md',
    '性能优化面试准备-面试版.md',
    '插件化架构面试准备.md',
    '插件开发全链路面试准备.md',
    '表单渲染引擎面试准备.md',
    '规则引擎面试准备.md',
    '面试复盘报告提升通过率.md',
    '项目证据链与开放方案题专项.md',
    '项目面试准备总索引.md'
  ];

  const baseDir = path.resolve(__dirname, '../../面试准备资料');
  let hasError = false;

  files.forEach(fileName => {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${fileName}`);
      hasError = true;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const quizMatch = content.match(/<!--\s*quiz:\s*([\s\S]*?)\s*-->/);
    
    if (!quizMatch) {
      console.warn(`⚠️  未找到 quiz 标记: ${fileName}`);
      return;
    }

    try {
      const quizData = JSON.parse(quizMatch[1].trim());
      if (!Array.isArray(quizData)) {
        throw new Error("解析出的内容不是数组");
      }
      
      console.log(`\n🔍 检查文件: ${fileName} (共 ${quizData.length} 道题)`);

      // 统计题型数量
      let singleCount = 0;
      let multipleCount = 0;
      let judgmentCount = 0;
      
      let lastType = 'single';
      
      quizData.forEach((q, idx) => {
        if (!q.type || !['single', 'multiple', 'judgment'].includes(q.type)) {
          throw new Error(`第 ${idx + 1} 题类型无效: ${q.type}`);
        }
        if (!q.question || !Array.isArray(q.options) || q.answer === undefined || !q.explain) {
          throw new Error(`第 ${idx + 1} 题字段缺失: 检查 question, options, answer, explain`);
        }

        // 类型检查与顺序检查 (single -> multiple -> judgment)
        if (q.type === 'single') {
          singleCount++;
          if (lastType !== 'single') {
            throw new Error(`第 ${idx + 1} 题位置错误，单选题必须全部排在最前面`);
          }
        } else if (q.type === 'multiple') {
          multipleCount++;
          if (lastType === 'judgment') {
            throw new Error(`第 ${idx + 1} 题位置错误，多选题必须排在判断题前面`);
          }
          lastType = 'multiple';
        } else if (q.type === 'judgment') {
          judgmentCount++;
          lastType = 'judgment';
        }
      });

      console.log(`   - 单选题: ${singleCount} 道, 多选题: ${multipleCount} 道, 判断题: ${judgmentCount} 道`);
      
      if (quizData.length !== 15) {
        throw new Error(`题目总量不符合要求，目前有 ${quizData.length} 题，要求刚好 15 题`);
      }
      if (singleCount !== 8 || multipleCount !== 5 || judgmentCount !== 2) {
        throw new Error(`题型数量比例错误，要求 8单选 + 5多选 + 2判断`);
      }
      
      console.log(`   ✅ 校验通过`);
    } catch (err) {
      console.error(`❌ 文件 ${fileName} 校验失败: ${err.message}`);
      hasError = true;
    }
  });

  if (hasError) {
    process.exit(1);
  } else {
    console.log('\n🎉 所有文件校验成功！');
    process.exit(0);
  }
  ```

- [ ] **步骤 2：本地运行校验脚本确认其能检测到已有文件的缺失/不足**
  运行：`node /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js`
  预期：输出显示多个文件 `未符合刚好 15 题` 或 `题型数量比例错误`（因为我们刚刚同步了新文档，题目数还没扩充）。

- [ ] **步骤 3：Commit**
  运行：
  ```bash
  git add /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js
  git commit -m "test: add check_quiz_json validator script"
  ```

---

### 任务 2：生成并处理第一批面试文档（文件 1 到 3）

**文件**：
- 修改：
  - `面试准备资料/AI-Agent前端面试准备.md`
  - `面试准备资料/公式规则循环引用问题.md`
  - `面试准备资料/前端通用技术亮点面试准备.md`

- [ ] **步骤 1：分派题目研究员子 Agent 补充生成第一批文档的题目**
  子 Agent 任务指令：
  针对这 3 篇文档进行题目研究，保留并提取现有的测验题，深挖核心技术点及大厂追问防御方案，额外生成题目直至每篇刚好达到 15 道题。题型必须严格配比（8单选 + 5多选 + 2判断），按照 单选 -> 多选 -> 判断 重新排序，并覆写回文件最底部的 `<!-- quiz: [...] -->`。

- [ ] **步骤 2：本地运行校验脚本验证第一批文件**
  运行：`node /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js`
  预期：显示这 3 个文件校验通过（显示为 `✅ 校验通过`）。

- [ ] **步骤 3：Commit**
  运行：
  ```bash
  git add /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/AI-Agent前端面试准备.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/公式规则循环引用问题.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/前端通用技术亮点面试准备.md
  git commit -m "feat: generate 15 quiz items for AI-Agent, cycle ref, and common frontend highlights"
  ```

---

### 任务 3：生成并处理第二批面试文档（文件 4 到 6）

**文件**：
- 修改：
  - `面试准备资料/性能优化面试准备.md`
  - `面试准备资料/性能优化面试准备-面试版.md`
  - `面试准备资料/插件化架构面试准备.md`

- [ ] **步骤 1：分派题目研究员子 Agent 补充生成第二批文档的题目**
  子 Agent 任务指令与任务 2 相同，处理这三个文档至每篇 15 道题。

- [ ] **步骤 2：本地运行校验脚本验证第二批文件**
  运行：`node /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js`
  预期：显示这 3 个文件同样校验通过。

- [ ] **步骤 3：Commit**
  运行：
  ```bash
  git add /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/性能优化面试准备.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/性能优化面试准备-面试版.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/插件化架构面试准备.md
  git commit -m "feat: generate 15 quiz items for performance optimization and plugin architecture"
  ```

---

### 任务 4：生成并处理第三批面试文档（文件 7 到 9）

**文件**：
- 修改：
  - `面试准备资料/插件开发全链路面试准备.md`
  - `面试准备资料/表单渲染引擎面试准备.md`
  - `面试准备资料/规则引擎面试准备.md`

- [ ] **步骤 1：分派题目研究员子 Agent 补充生成第三批文档的题目**
  处理这三个文档至每篇 15 道题，规格相同。

- [ ] **步骤 2：本地运行校验脚本验证第三批文件**
  运行：`node /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js`
  预期：显示这 3 个文件校验通过。

- [ ] **步骤 3：Commit**
  运行：
  ```bash
  git add /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/插件开发全链路面试准备.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/表单渲染引擎面试准备.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/规则引擎面试准备.md
  git commit -m "feat: generate 15 quiz items for plugin lifecycle, form engine, and rule engine"
  ```

---

### 任务 5：生成并处理第四批面试文档与复盘经验（文件 10 到 12）

**文件**：
- 修改：
  - `面试准备资料/面试复盘报告提升通过率.md`
  - `面试准备资料/项目证据链与开放方案题专项.md`
  - `面试准备资料/项目面试准备总索引.md`

- [ ] **步骤 1：分派题目研究员子 Agent 补充生成第四批文档的题目**
  针对这 3 篇新增的“面试复盘经验”、“项目证据链与开放方案”、“总索引”文档，研究并补充生成各自 15 道精选题目，规格相同。

- [ ] **步骤 2：本地运行校验脚本验证第四批文件**
  运行：`node /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/scratch/check_quiz_json.js`
  预期：全部 12 个文件显示 `🎉 所有文件校验成功！`。

- [ ] **步骤 3：Commit**
  运行：
  ```bash
  git add /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/面试复盘报告提升通过率.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/项目证据链与开放方案题专项.md \
          /Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料/项目面试准备总索引.md
  git commit -m "feat: generate 15 quiz items for interview review, project proof chain, and index"
  ```

---

### 任务 6：系统编译校验与私有云端同步推送

**文件**：
- 无

- [ ] **步骤 1：在学习系统执行项目打包编译校验**
  在 `/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统` 目录下运行：
  ```bash
  npm run build
  ```
  预期：编译成功，无任何 JS 报错或文件解析异常。

- [ ] **步骤 2：将全部修改推送到 GitHub 私有仓库**
  在 `/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/面试准备资料` 目录下运行：
  ```bash
  git push origin main
  ```
  预期：推送成功，远程私有仓库 `my-private-interview-docs` 已成功拥有包含 180 道精选题目的 12 篇最新面试文档。
