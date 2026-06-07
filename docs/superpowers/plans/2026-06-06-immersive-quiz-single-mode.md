# 沉浸模式单题切题流与空题提交实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在“禅模式”（沉浸模式）中，一次只展示 5 题中的 1 题，并在单选题/判断题选择完后自动下一题，支持键盘左右键及手动图标切题，允许随时空题提交，且极简化提交按钮与解析框的底色。

**架构：** 统一数据源设计，在 `quizState` 中引入全局选中索引 `activeQuestionIdx`。`QuizPage` 依据 `activeQuestionIdx` 动态渲染单题。提供手动导航条和延时自动切题机制。在 CSS 与 DOM 层去除多余的置灰限制与实色背景。

**技术栈：** React, JavaScript, CSS, HTML5

---

### 任务 1：更新 `utils/quiz.js` 中的数据状态结构

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/utils/quiz.js`

- [ ] **步骤 1：添加全局焦点题号初始化参数**
  修改 [quiz.js](file:///Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/utils/quiz.js)，在 `createQuizState` 返回的对象中添加 `activeQuestionIdx: 0`。
  
  代码更改：
  ```javascript
  export function createQuizState(type, moduleId, docIdx, questions) {
    return {
      type,
      moduleId,
      docIdx,
      questions,
      pageSize: 5,
      currentPageIdx: 0,
      activeQuestionIdx: 0, // 新增：默认初始化为第 0 题
      selections: {},
      answers: {},
      submittedPages: [],
      score: 0,
    };
  }
  ```

- [ ] **步骤 2：Commit**
  ```bash
  git add 学习系统/src/utils/quiz.js
  git commit -m "feat: add activeQuestionIdx to quizState"
  ```

---

### 任务 2：更新 `App.jsx` 中的跳转与翻页联动逻辑

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/App.jsx:732-763`

- [ ] **步骤 1：在下一页 `nextPage` 中联动重置全局焦点索引**
  更新 `nextPage` 方法，使之在改变 `currentPageIdx` 时同步将 `activeQuestionIdx` 重置为下一页首题。
  
  ```javascript
  function nextPage() {
    setQuizState(prev => {
      const nextPageIdx = prev.currentPageIdx + 1;
      return {
        ...prev,
        currentPageIdx: nextPageIdx,
        activeQuestionIdx: nextPageIdx * prev.pageSize
      };
    });
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }
  ```

- [ ] **步骤 2：在跳转方法 `jumpToQuestion` 中保存全局焦点索引**
  修改 `jumpToQuestion` 方法，使之将 `activeQuestionIdx` 设为点击指定的 `globalIdx`。
  
  ```javascript
  function jumpToQuestion(globalIdx) {
    flushSync(() => {
      setQuizState(prev => {
        const targetPage = Math.floor(globalIdx / prev.pageSize);
        return { 
          ...prev, 
          currentPageIdx: targetPage,
          activeQuestionIdx: globalIdx // 同步更新单题焦点
        };
      });
    });
    // 在沉浸单题模式下，由于非活跃题不在 DOM 中，做一层防御
    const el = document.getElementById(`qq-${globalIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  ```

- [ ] **步骤 3：Commit**
  ```bash
  git add 学习系统/src/App.jsx
  git commit -m "feat: sync activeQuestionIdx in nextPage and jumpToQuestion"
  ```

---

### 任务 3：重构 `QuizPage.jsx` 支持单题流渲染与左右切题导航

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/QuizPage.jsx`

- [ ] **步骤 1：计算当前单题焦点索引，实现按需渲染单题**
  在 `QuizPage` 中，计算出当前题目在该页 questions 列表中的局部索引。在 `immersiveMode` 下仅渲染这一题，并传递 `immersiveMode` prop。
  
  代码更改 (约 77-130 行)：
  ```javascript
  const activeQuestionIdx = quizState.activeQuestionIdx !== undefined 
    ? quizState.activeQuestionIdx 
    : start;
  const activeLocalIdx = Math.max(0, Math.min(questions.length - 1, activeQuestionIdx - start));
  const currentQ = questions[activeLocalIdx];
  const globalActiveIdx = start + activeLocalIdx;
  ```
  
  并修改题目渲染逻辑为：
  ```javascript
  {immersiveMode ? (
    currentQ && (
      <QuestionBlock
        key={globalActiveIdx}
        question={currentQ}
        globalIdx={globalActiveIdx}
        isSubmitted={isSubmitted}
        selected={quizState.selections[globalActiveIdx]}
        answered={quizState.answers[globalActiveIdx]}
        onToggleOption={handleOptionSelect} // 下一步会定义 handleOptionSelect
        onReadChapter={onReadChapter}
        immersiveMode={immersiveMode}
      />
    )
  ) : (
    questions.map((q, li) => (
      <QuestionBlock
        key={start + li}
        question={q}
        globalIdx={start + li}
        isSubmitted={isSubmitted}
        selected={quizState.selections[start + li]}
        answered={quizState.answers[start + li]}
        onToggleOption={onToggleOption}
        onReadChapter={onReadChapter}
        immersiveMode={immersiveMode}
      />
    ))
  )}
  ```

- [ ] **步骤 2：添加单题极简导航条**
  在 `immersiveMode` 下渲染题目下方的手动切题控件。
  
  在题目组件下方插入：
  ```javascript
  {immersiveMode && (
    <div data-element="single-nav" className="flex items-center justify-between mt-5 mb-5 px-1 select-none">
      <button
        className={`flex items-center gap-1 bg-transparent border-0 p-1.5 cursor-pointer text-text-secondary transition-colors duration-150 rounded-full hover:text-primary ${
          activeLocalIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'
        }`}
        disabled={activeLocalIdx === 0}
        onClick={() => onJumpToQuestion(globalActiveIdx - 1)}
        title="上一题"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="text-[12px] font-semibold text-text-secondary/70">
        {activeLocalIdx + 1} / {questions.length}
      </span>

      <button
        className={`flex items-center gap-1 bg-transparent border-0 p-1.5 cursor-pointer text-text-secondary transition-colors duration-150 rounded-full hover:text-primary ${
          activeLocalIdx === questions.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'
        }`}
        disabled={activeLocalIdx === questions.length - 1}
        onClick={() => onJumpToQuestion(globalActiveIdx + 1)}
        title="下一题"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )}
  ```

- [ ] **步骤 3：在键盘监听器中添加左右键支持**
  在 `QuizPage.jsx` 的 `useEffect` 键盘事件中支持左右键切题：
  ```javascript
  if (immersiveMode) {
    if (e.key === 'ArrowLeft') {
      if (activeLocalIdx > 0) {
        e.preventDefault();
        onJumpToQuestion(globalActiveIdx - 1);
      }
      return;
    } else if (e.key === 'ArrowRight') {
      if (activeLocalIdx < questions.length - 1) {
        e.preventDefault();
        onJumpToQuestion(globalActiveIdx + 1);
      }
      return;
    }
  }
  ```

- [ ] **步骤 4：Commit**
  ```bash
  git add 学习系统/src/pages/QuizPage.jsx
  git commit -m "feat: render single question in immersiveMode with nav bar & keyboard arrow navigation"
  ```

---

### 任务 4：实现点击选项后的自动下一题与键盘切题传参

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/QuizPage.jsx`
- 导入：在文件顶部增加 `useRef` 导入。

- [ ] **步骤 1：导入 `useRef` 并声明自动跳转逻辑**
  在 `QuizPage` 组件内部声明一个 `timerRef` 并在组件卸载时进行清理。声明包装的 `handleOptionSelect` 函数。
  
  ```javascript
  import { useEffect, useRef } from 'react'; // 确保引入了 useRef
  ```
  
  在 `QuizPage` 函数起始位置：
  ```javascript
  const timerRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  
  const handleOptionSelect = (qIdx, optIdx) => {
    onToggleOption(qIdx, optIdx);
    
    const q = quizState.questions[qIdx];
    if (immersiveMode && q && (q.type === 'single' || q.type === 'judgment')) {
      const localIdx = qIdx - start;
      if (localIdx < questions.length - 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onJumpToQuestion(qIdx + 1);
        }, 300);
      }
    }
  };
  ```

- [ ] **步骤 2：向 `QuizPage` 的子组件调用传递 `onJumpToQuestion`**
  在 `App.jsx` 中，向 `<QuizPage>` 组件传参中注入 `onJumpToQuestion={jumpToQuestion}`。
  在 `QuizPage.jsx` 函数参数列表中解构接收 `onJumpToQuestion`。

- [ ] **步骤 3：Commit**
  ```bash
  git add 学习系统/src/pages/QuizPage.jsx 学习系统/src/App.jsx
  git commit -m "feat: implement auto-advance for single/judgment options"
  ```

---

### 任务 5：支持空题直接提交与优化按钮样式

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/pages/QuizPage.jsx`
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/index.css`

- [ ] **步骤 1：解绑提交按钮的禁用态，隐藏快捷键提示**
  修改 `QuizPage.jsx` 底部提交按钮与指示器渲染。
  不答完题目也将 `disabled={false}`。在沉浸模式下，底部不再显示键盘提示，且不再显示“还需回答 X 题”的灰色虚线置灰块，而直接显示可点击的“确认提交”。
  
  更改 `QuizPage.jsx` 动作区逻辑：
  ```javascript
  const submitBtnClass = immersiveMode
    ? "px-5 py-1.75 rounded-full border border-primary bg-transparent text-primary hover:bg-primary/5 cursor-pointer text-[13px] font-medium transition-all duration-180 select-none active:scale-[0.98]"
    : (allSelected 
      ? "px-5 py-1.75 rounded-lg border-0 cursor-pointer text-[13px] font-bold transition-all duration-180 bg-primary text-white hover:bg-primary-hover select-none active:scale-[0.98]"
      : "px-5 py-1.75 rounded-lg border border-dashed border-border cursor-not-allowed text-[13px] font-bold transition-all duration-180 bg-transparent text-text-secondary select-none opacity-40");
  ```
  
  修改下一题和查看结果按钮的类名（若在沉浸模式下使用极简圆角细线样式）：
  ```javascript
  {isSubmitted && !isLastPage && (
    <button 
      className={immersiveMode
        ? "px-5 py-1.75 rounded-full border border-border bg-transparent cursor-pointer text-[13px] font-medium text-text hover:border-primary hover:text-primary select-none transition-all active:scale-[0.98]"
        : "px-5 py-1.75 rounded-lg border border-border cursor-pointer text-[13px] font-bold transition-all duration-180 bg-surface text-text hover:border-primary hover:text-primary select-none active:scale-[0.98]"}
      onClick={onNextPage}
    >
      下一题 →
    </button>
  )}
  {isSubmitted && isLastPage && (
    <button 
      className={immersiveMode
        ? "px-5 py-1.75 rounded-full border border-primary bg-transparent cursor-pointer text-[13px] font-medium text-primary hover:bg-primary/5 select-none transition-all active:scale-[0.98]"
        : "px-5 py-1.75 rounded-lg border-0 cursor-pointer text-[13px] font-bold transition-all duration-180 bg-primary text-white hover:bg-primary-hover select-none active:scale-[0.98]"}
      onClick={onShowResult}
    >
      最终结果 →
    </button>
  )}
  ```
  
  修改提交按钮本身（允许随时提交）：
  ```javascript
  {!isSubmitted && (
    <button
      className={submitBtnClass}
      onClick={onSubmitPage}
    >
      确认提交
    </button>
  )}
  ```
  
  修改键盘提示显示，如果是沉浸模式则不显示键盘提示：
  ```javascript
  {!immersiveMode && (
    <div className="text-[11px] text-text-secondary opacity-35 hover:opacity-70 transition-opacity duration-200 flex items-center gap-3 select-none">
      {!isSubmitted ? (
        <>
          <span>[ A-D / 1-4 ] 选择</span>
          {allSelected && <span>[ Space / Enter ] 提交</span>}
        </>
      ) : (
        <span>[ Space / Enter / → ] {isLastPage ? '查看结果' : '下一题'}</span>
      )}
    </div>
  )}
  ```

- [ ] **步骤 2：优化沉浸模式侧边点阵卡片轨道默认透明样式**
  修改 `index.css`。让呼吸点轨道在默认下完全无背景、无描边、无投影，只保留极薄的不透明点悬浮。鼠标滑入轨道后才展现毛玻璃背景卡片。
  
  修改 `index.css` 对应的类：
  ```css
  .immersive-dots-track {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 8px;
    background: transparent !important;
    border: 1px solid transparent !important;
    border-right: none !important;
    border-radius: 14px 0 0 14px;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    pointer-events: auto;
    opacity: 0.25 !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: none !important;
  }
  
  .immersive-dots-track:hover,
  .immersive-dots-nav-container:hover .immersive-dots-track {
    opacity: 1 !important;
    background: rgba(15, 17, 23, 0.45) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-right: none !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    box-shadow: -4px 4px 20px rgba(0, 0, 0, 0.2) !important;
    transform: none !important;
    pointer-events: auto !important;
  }
  ```
  
  同时覆盖亮色模式下的轨道样式：
  ```css
  :root[data-theme="light"] .immersive-dots-track {
    background: transparent !important;
    border: 1px solid transparent !important;
    border-right: none !important;
    box-shadow: none !important;
  }
  
  :root[data-theme="light"] .immersive-dots-track:hover,
  :root[data-theme="light"] .immersive-dots-nav-container:hover .immersive-dots-track {
    background: rgba(248, 250, 252, 0.8) !important;
    border: 1px solid rgba(15, 17, 23, 0.08) !important;
    border-right: none !important;
    box-shadow: -4px 4px 20px rgba(0, 0, 0, 0.08) !important;
  }
  ```

- [ ] **步骤 3：Commit**
  ```bash
  git add 学习系统/src/pages/QuizPage.jsx 学习系统/src/index.css
  git commit -m "feat: enable empty submission, apply pill thin-line buttons & transparent sidebar track"
  ```

---

### 任务 6：解析盒样式无背景化

**文件：**
- 修改：`/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/src/components/QuestionBlock.jsx`

- [ ] **步骤 1：传递并解构接收 `immersiveMode` prop**
  修改 `QuestionBlock` 函数声明，增加接收 `immersiveMode` 属性。

- [ ] **步骤 2：对沉浸模式下的解析部分进行样式解构**
  修改第 85 行和第 103 行附近的解析渲染逻辑。在沉浸模式下，将顶部边框修改为 dashed 极虚线；将解析的背景色移除，换为左边细装饰线与缩进包装。
  
  修改第 85 行：
  ```javascript
  <div data-element="explanation-container" className={`mt-4 ${immersiveMode ? 'border-t border-dashed border-border/30 pt-3' : 'border-t border-border/40 pt-3'}`}>
  ```
  
  修改第 103 行：
  ```javascript
  <div 
    data-element="explanation" 
    className={`p-3.5 ${
      immersiveMode 
        ? 'bg-transparent border-l-2 border-primary/20 pl-4.5 rounded-none' 
        : 'bg-primary-muted rounded-lg'
    } text-[13px] text-text-secondary leading-relaxed flex flex-col gap-1.5 transition-all duration-300`}
  >
  ```

- [ ] **步骤 3：Commit**
  ```bash
  git add 学习系统/src/components/QuestionBlock.jsx
  git commit -m "feat: remove background and apply subtle left border for explanation in immersiveMode"
  ```

---

### 任务 7：静态构建与手动功能验证

**文件：**
- 测试：运行自动化打包

- [ ] **步骤 1：运行打包编译**
  运行：`npm run build`
  预期：没有任何报错，构建成功通过。

- [ ] **步骤 2：手动在浏览器中体验新版 Zen 单题流做题**
  在浏览器中打开 http://127.0.0.1:5173/：
  - 点击开始答题并进入专注模式。
  - 检查是否每次仅展示一题。
  - 点击选项查看是否自动切到下一题。
  - 检查有空题时是否能直接通过下方的极简按钮提交并查阅无背景的解析盒。

- [ ] **步骤 3：提交 Walkthrough 文档并完成任务**
