# Git Submodule + pnpm Workspace：组件库私有复用的最佳实践

> 如何让一个独立的组件库，在不发布到 npm 的前提下，被多个项目无缝复用？本文以实际项目为例，介绍一种 **零成本、零发布** 的组件库共享方案。

## 一、问题背景

在实际的前端开发中，我们经常会遇到这样的需求：

- 团队/个人有一个 **通用 UI 组件库**（如 Loading、Modal、Toast 等）
- 这个组件库需要被 **多个不同的项目** 所引用
- **不想发布到公共 npm**（私有组件、内部使用）
- 又希望开发时能像 Monorepo 一样 **实时热更新**，修改组件库代码立即生效

### 常规方案对比

| 方案 | 优点 | 缺点 |
| :--- | :--- | :--- |
| 发布到公共 npm | 标准流程，任何人可用 | 代码公开暴露 |
| npm 付费私有包 | 标准流程 | 需要付费（$7/月起） |
| 搭建 Verdaccio 私有仓库 | 完整的 npm 体验 | 需要服务器资源，维护成本 |
| `npm link` / `pnpm link` | 零配置 | 仅限本机，团队协作困难 |
| `file:` 相对路径 | 简单直接 | 目录结构必须一致，CI/CD 困难 |
| **Git Submodule + Workspace** | **零成本、跨项目、实时热更新** | **需要理解 Submodule 概念** |

最后一种方案，正是本文要详细介绍的。

---

## 二、核心思路

> **一句话总结**：组件库是一个独立的 Git 仓库，通过 Git Submodule 嵌入到任何主项目中，再利用 pnpm Workspace 在本地建立软链接，实现零发布、实时开发的体验。

```
主项目 A（Monorepo）                主项目 B（Monorepo）
├── packages/                       ├── packages/
│   └── yuan-ui/ ← Submodule          │   └── yuan-ui/ ← 同一个 Submodule
├── 学习系统/     ← 应用 A            ├── app/          ← 应用 B  
├── pnpm-workspace.yaml             ├── pnpm-workspace.yaml
└── package.json                    └── package.json

                    ↕ 代码同步
            yuan-ui 独立 Git 仓库
            (github.com/xxx/yuan-ui)
```

### 关键概念

- **Git Submodule**：Git 原生支持的"仓库中嵌套仓库"机制。主项目只记录子模块的仓库地址和指向的 commit hash，不会复制子模块的代码历史。
- **pnpm Workspace**：pnpm 的 monorepo 工作区功能。通过 `workspace:*` 协议，pnpm 会自动将本地包之间建立软链接（symlink），让它们可以像安装了 npm 包一样互相引用。

---

## 三、实战：完整搭建流程

### 3.1 前置条件

```bash
# 确保已安装 pnpm
npm install -g pnpm

# 确保已安装 Git
git --version
```

### 3.2 准备组件库（yuan-ui）

假设你已经有一个组件库项目，其 `package.json` 的关键字段如下：

```json
{
  "name": "yuan-ui",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/yuan-ui.umd.js",
  "module": "./dist/yuan-ui.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/yuan-ui.es.js",
      "require": "./dist/yuan-ui.umd.js"
    },
    "./style.css": "./dist/style.css"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  }
}
```

> **注意**：`name` 字段非常重要，它就是其他项目中 `import` 时使用的包名。

确保组件库有自己的 Git 仓库：

```bash
cd yuan-ui
git init
git add -A
git commit -m "feat: 组件库初始化"

# 推送到远程（GitHub / GitLab / Gitee 均可，可以是私有仓库）
git remote add origin git@github.com:your-username/yuan-ui.git
git push -u origin master
```

### 3.3 在主项目中添加 Submodule

进入你的主项目（如前端学习系统）：

```bash
cd 个人中高级前端题库

# 创建 packages 目录并添加 submodule
mkdir -p packages
git submodule add git@github.com:your-username/yuan-ui.git packages/yuan-ui
```

执行成功后，你会发现：
1. `packages/yuan-ui/` 目录下出现了组件库的完整代码
2. 项目根目录生成了 `.gitmodules` 文件，记录了子模块信息

```ini
# .gitmodules 文件内容
[submodule "packages/yuan-ui"]
    path = packages/yuan-ui
    url = git@github.com:your-username/yuan-ui.git
```

### 3.4 配置 pnpm Workspace

在主项目根目录创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - '学习系统'        # 应用层（消费方）
  - 'packages/*'     # 组件库（提供方）
```

### 3.5 创建根级 package.json

在主项目根目录创建 `package.json`：

```json
{
  "name": "frontend-learning-system",
  "private": true,
  "version": "1.0.0",
  "description": "前端学习体系 — Monorepo 工作区",
  "scripts": {
    "dev": "pnpm -C 学习系统 dev",
    "build": "pnpm -C 学习系统 build",
    "build:ui": "pnpm -C packages/yuan-ui build"
  }
}
```

> 💡 `"private": true` 是 Monorepo 根包的标准做法，防止根目录被意外发布到 npm。

### 3.6 在应用中声明 Workspace 依赖

在学习系统的 `package.json` 中添加依赖：

```json
{
  "name": "learning-system",
  "dependencies": {
    "yuan-ui": "workspace:*"
  }
}
```

> 🔑 `workspace:*` 是 pnpm 的特殊协议，意思是"从当前工作区中查找名为 `yuan-ui` 的本地包"。pnpm 会自动建立软链接，**不需要发布到任何注册表**。

### 3.7 安装依赖

```bash
# 在项目根目录执行
pnpm install
```

pnpm 会：
1. 识别 workspace 中的所有包
2. 将 `packages/yuan-ui` 软链接到学习系统的 `node_modules/yuan-ui`
3. 安装其他第三方依赖

### 3.8 在代码中使用

```jsx
// 学习系统中的任意组件
import { Loading } from 'yuan-ui';
import 'yuan-ui/style.css';

function App() {
  return <Loading fullScreen text="正在加载..." />;
}
```

就像使用任何 npm 包一样！但所有代码都在本地，修改 `yuan-ui` 的源码后热更新即时生效。

---

## 四、日常开发工作流

### 4.1 修改组件库

```bash
# 直接编辑 packages/yuan-ui 下的源代码
# Vite dev server 会自动热更新

# 修改完成后，进入子模块目录提交
cd packages/yuan-ui
git add -A
git commit -m "feat(Loading): 新增 size 属性"
git push origin master
```

### 4.2 主项目记录子模块更新

```bash
# 回到主项目根目录
cd ../..

# 主项目会检测到子模块的 commit hash 变化
git add packages/yuan-ui
git commit -m "chore: 更新 yuan-ui 子模块到最新版本"
git push
```

### 4.3 其他项目获取最新组件库

如果主项目 B 也通过 Submodule 引用了 `yuan-ui`：

```bash
cd 主项目B

# 拉取子模块的最新代码
git submodule update --remote packages/yuan-ui

# 记录更新
git add packages/yuan-ui
git commit -m "chore: 同步 yuan-ui 最新版本"
```

### 4.4 新人克隆项目

新同事首次克隆项目时，需要同时初始化子模块：

```bash
# 方式一：克隆时一步到位
git clone --recurse-submodules git@github.com:xxx/frontend-learning-system.git

# 方式二：先克隆再初始化
git clone git@github.com:xxx/frontend-learning-system.git
cd frontend-learning-system
git submodule init
git submodule update
```

---

## 五、目录结构一览

```
个人中高级前端题库/                     ← Monorepo 根目录
├── .git/                              ← 主项目的 Git 仓库
├── .gitmodules                        ← 子模块配置文件
├── package.json                       ← 根级 package.json (private: true)
├── pnpm-workspace.yaml                ← 工作区配置
├── pnpm-lock.yaml                     ← 统一的锁文件
│
├── packages/
│   └── yuan-ui/                       ← Git Submodule（独立仓库）
│       ├── .git                       ← 指向独立仓库
│       ├── package.json               ← name: "yuan-ui"
│       ├── src/
│       │   └── components/
│       │       └── Loading/
│       ├── dist/                      ← 构建产物
│       └── vite.config.js
│
└── 学习系统/                           ← 应用层
    ├── package.json                   ← dependencies: { "yuan-ui": "workspace:*" }
    ├── src/
    └── vite.config.js
```

---

## 六、进阶配置

### 6.1 开发时直接引用源码（推荐）

为了获得最佳的开发体验（热更新、源码调试），可以在学习系统的 `vite.config.js` 中配置别名，直接指向组件库的源码而不是构建产物：

```js
// 学习系统/vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // 开发时直接引用源码，享受 HMR
      'yuan-ui': resolve(__dirname, '../packages/yuan-ui/src/index.js'),
    },
  },
});
```

> 这样修改组件库源码时，Vite 能直接编译，无需先 `build` 再引用。

### 6.2 添加 prepare 脚本自动构建

在 `yuan-ui/package.json` 中添加：

```json
{
  "scripts": {
    "prepare": "npm run build"
  }
}
```

这样每次 `pnpm install` 时会自动触发组件库的构建。

### 6.3 同时在多个 Monorepo 中使用

```
桌面/
├── 项目A/
│   ├── packages/yuan-ui/  ← Submodule 指向同一个远程仓库
│   └── pnpm-workspace.yaml
│
├── 项目B/
│   ├── packages/yuan-ui/  ← Submodule 指向同一个远程仓库
│   └── pnpm-workspace.yaml
│
└── yuan-ui/               ← 独立开发时也可以单独使用
```

每个项目通过 `git submodule add` 独立引入，互不干扰。当在任意一个项目中修改了 `yuan-ui`，只需 `cd packages/yuan-ui && git push`，其他项目通过 `git submodule update --remote` 即可同步。

---

## 七、常见问题 FAQ

### Q1：Submodule 和 Subtree 有什么区别？

| 特性 | Git Submodule | Git Subtree |
| :--- | :--- | :--- |
| 独立 Git 历史 | ✅ 完全独立 | ❌ 合并到主仓库 |
| 独立开发/发布 | ✅ 可以独立 push | ⚠️ 可以但较麻烦 |
| 克隆复杂度 | 需要 `--recurse-submodules` | 直接 clone 即可 |
| 适合场景 | 组件库、SDK 等需要独立维护的项目 | 不太需要独立维护的代码 |

**推荐使用 Submodule**，因为组件库本身就是独立项目，需要独立的版本管理和发布周期。

### Q2：为什么选 pnpm 而不是 npm/yarn？

- **pnpm workspace** 是目前最成熟、性能最好的 Monorepo 工作区方案
- **硬链接 + 符号链接** 的存储策略，比 npm/yarn 节省 50%+ 的磁盘空间
- `workspace:*` 协议直观清晰
- 天然支持严格的依赖隔离（避免幽灵依赖问题）

### Q3：CI/CD 中如何处理子模块？

在 GitHub Actions 中：

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive   # 自动初始化并拉取所有子模块
```

### Q4：能否锁定子模块到特定版本？

可以。子模块本质上记录的是一个 commit hash。你可以通过 tag 来管理版本：

```bash
# 在 yuan-ui 中打 tag
cd packages/yuan-ui
git tag v1.0.0
git push origin v1.0.0

# 在主项目中锁定到该 tag
git checkout v1.0.0
cd ../..
git add packages/yuan-ui
git commit -m "chore: 锁定 yuan-ui 到 v1.0.0"
```

### Q5：如果以后想发布到 npm 怎么办？

完全兼容！由于 `yuan-ui` 的 `package.json` 已经按照标准 npm 包的格式配置（exports、main、module、types 等），未来随时可以执行 `npm publish` 发布到公共或私有 npm 注册表，不需要做任何改动。

---

## 八、总结

**Git Submodule + pnpm Workspace** 方案的核心优势：

1. ✅ **零成本** — 不需要搭建私有 npm 仓库或付费
2. ✅ **零发布** — 不需要 `npm publish`，代码通过 Git 同步
3. ✅ **独立维护** — 组件库有独立的 Git 仓库和版本历史
4. ✅ **多项目复用** — 任何 Monorepo 都可以通过 Submodule 引入同一个组件库
5. ✅ **开发体验极佳** — pnpm Workspace 提供与 Monorepo 完全一致的本地软链接体验
6. ✅ **未来兼容** — 随时可以切换到 npm publish 发布模式

这是中小团队和个人开发者在 **"私有组件库跨项目复用"** 场景下的最佳工程实践。
