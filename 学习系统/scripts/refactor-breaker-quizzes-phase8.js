import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/技术破冰/cards/';

const filesToRefactor = [
  {
    path: path.join(baseDir, 'CLS 与视觉稳定.md'),
    replacements: [
      {
        old: `### Q2\n\n图片导致 CLS 的常见原因是什么？\n\nA. 没有预留宽高，加载后撑开布局\nB. alt 太短\nC. 图片文件名太长\nD. 使用了 HTTPS\n\n答案：A`,
        new: `### Q2\n\n图片导致 CLS 的常见原因是什么？\n\nA. 没有预留宽高，加载后撑开布局\nB. 图片在首屏未能启用懒加载（loading="lazy"）属性\nC. 资源未在服务端配置强缓存（max-age）导致重复拉取\nD. 网络协商缓存失效导致图片渲染失败\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, 'Long Task 与主线程让出.md'),
    replacements: [
      {
        old: `### Q3\n\n\`requestIdleCallback\` 最适合用来做什么？\n\nA. 立刻响应用户点击\nB. 在浏览器空闲时做不紧急的后台预处理，例如预取数据、统计上报\nC. 做关键交互\nD. 替代 setTimeout 0\n\n答案：B`,
        new: `### Q3\n\n\`requestIdleCallback\` 最适合用来做什么？\n\nA. 处理极度紧急且会阻塞首屏绘制的用户点击事件\nB. 在浏览器空闲时做不紧急的后台预处理，例如预取数据、统计上报\nC. 承接高频的核心交互以降低主线程的 long task 发生概率\nD. 替代微任务（microtask）队列以实现同步事件的回调拦截\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'Monorepo 工程.md'),
    replacements: [
      {
        old: `### Q1\n\nMonorepo 最核心解决的问题是什么？\n\nA. 让代码更短\nB. 多个相关包共享代码、协同发布、CI 不重复劳动\nC. 替代 Git\nD. 让所有项目必须用同一个框架\n\n答案：B`,
        new: `### Q1\n\nMonorepo 最核心解决的问题是什么？\n\nA. 解决跨仓库 Git 提交历史合并产生的物理冲突\nB. 多个相关包共享代码、协同发布、CI 不重复劳动\nC. 替代分布式版本控制系统以提供本地磁盘优化\nD. 强制限制多项目使用完全一致的底层运行时技术栈\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'Node 最小 HTTP 服务.md'),
    replacements: [
      {
        old: `### Q3\n\nExpress 中间件 \`app.use(express.json())\` 的作用是什么？\n\nA. 自动写测试\nB. 把 JSON 请求体解析到 \`req.body\`\nC. 让所有响应变成 JSON\nD. 替代数据库\n\n答案：B`,
        new: `### Q3\n\nExpress 中间件 \`app.use(express.json())\` 的作用是什么？\n\nA. 拦截所有请求并对其执行 TLS/SSL 链路解密\nB. 把 JSON 请求体解析到 \`req.body\`\nC. 自动将响应头 Content-Type 修正为 application/json\nD. 挂载持久化内存连接池以提供缓存代理\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'REST 与接口设计.md'),
    replacements: [
      {
        old: `### Q4\n\n接口列表分页，更推荐的做法是什么？\n\nA. 同一个项目里 \`page+pageSize\` 和 \`cursor+limit\` 混用\nB. 在同一个项目里固定一种分页风格，并保持响应结构一致\nC. 不分页\nD. 把所有数据塞 cookie\n\n答案：B`,
        new: `### Q4\n\n接口列表分页，更推荐的做法是什么？\n\nA. 在同一个项目里混用基于偏移量和基于游标的分页策略\nB. 在同一个项目里固定一种分页风格，并保持响应结构一致\nC. 取消分页，依靠前端在内存中分片缓存渲染\nD. 将当前页码与大小强制缓存至全局 HTTP Cookie 头中\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'TypeScript 进阶.md'),
    replacements: [
      {
        old: `### Q2\n\n\`satisfies\` 相比 \`as\` 的关键优势是什么？\n\nA. \`satisfies\` 会跳过类型检查\nB. \`satisfies\` 在通过类型检查的同时保留更精确的字面量类型\nC. \`satisfies\` 会自动写运行时校验\nD. \`satisfies\` 只能用于函数\n\n答案：B`,
        new: `### Q2\n\n\`satisfies\` 相比 \`as\` 的关键优势是什么？\n\nA. \`satisfies\` 会允许该变量强行绕过 Strict 选项校验\nB. \`satisfies\` 在通过类型检查的同时保留更精确的字面量类型\nC. \`satisfies\` 会在编译期自动向源码中注入运行时类型保护\nD. \`satisfies\` 能够直接对高阶函数的泛型参数执行静态断言\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'Vite.md'),
    replacements: [
      {
        old: `### Q1\n\nVite 开发阶段快的核心原因是什么？\n\nA. 完全不需要浏览器\nB. 开发阶段基于原生 ESM 按需服务源码，不先整体打包应用\nC. 所有代码都写进 HTML\nD. 不支持第三方依赖\n\n答案：B`,
        new: `### Q1\n\nVite 开发阶段快的核心原因是什么？\n\nA. 在后台启动了独立的 GPU 渲染加速服务\nB. 开发阶段基于原生 ESM 按需服务源码，不先整体打包应用\nC. 将所有第三方包物理拼接入主 HTML 的首屏内联脚本中\nD. 强行阻断了对项目源码中第三方 node_modules 的依赖加载\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '传统软件开发工作流.md'),
    replacements: [
      {
        old: `### Q1\n\n传统软件开发工作流最核心解决的问题是什么？\n\nA. 让所有人只写代码  \nB. 把软件从想法到上线和维护拆成清晰阶段，明确每个阶段 of 输入、输出和责任  \nC. 禁止测试  \nD. 让上线完全不需要验证\n\n答案：B`,
        new: `### Q1\n\n传统软件开发工作流最核心解决的问题是什么？\n\nA. 确保开发人员在整个研发生命周期中无需参与技术架构评审  \nB. 把软件从想法到上线和维护拆成清晰阶段，明确每个阶段的输入、输出和责任  \nC. 阻断自动化流水线，以便用纯人工操作替代全部安全测试  \nD. 强制缩减产品环境的部署时间，规避所有的回归验证流程\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '关系型数据库与 SQL.md'),
    replacements: [
      {
        old: `### Q2\n\n下面哪种情况最该首先怀疑"缺索引"？\n\nA. 数据少时很快，数据上量后某接口变慢，EXPLAIN 显示全表扫描\nB. 服务器主机名很长\nC. 接口名字拼错\nD. CSS 颜色不对\n\n答案：A`,
        new: `### Q2\n\n下面哪种情况最该首先怀疑"缺索引"？\n\nA. 数据少时很快，数据上量后某接口变慢，EXPLAIN 显示全表扫描\nB. 数据库服务器的主机域名字符长度超过限制\nC. 应用端发起的 SQL 请求中字段拼写错误\nD. 前端 UI 组件的样式主题定义未声明正确前缀\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '内部 NPM 包与库模式构建.md'),
    replacements: [
      {
        old: `### Q5\n\n看到一个内部包样式丢失，优先检查什么？\n\nA. 是否生成了独立 CSS，主工程是否引入了这个 CSS\nB. Git 用户名\nC. 浏览器书签\nD. 是否删除了 README\n\n答案：A`,
        new: `### Q5\n\n看到一个内部包样式丢失，优先检查什么？\n\nA. 是否生成了独立 CSS，主工程是否引入了这个 CSS\nB. 开发者本地的 Git 全局用户名配置是否正确\nC. 客户端浏览器的安全策略是否禁用了资源加载\nD. 依赖包在发布时是否不小心将 package.json 声明剔除\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '前端工程化.md'),
    replacements: [
      {
        old: `### Q2\n\n\`package-lock.json\`、\`pnpm-lock.yaml\` 这类 lockfile 的主要作用是什么？\n\nA. 记录页面路由\nB. 固定依赖解析结果，让不同环境安装到尽量一致的依赖版本\nC. 替代 Git 分支\nD. 自动生成组件文档\n\n答案：B`,
        new: `### Q2\n\n\`package-lock.json\`、\`pnpm-lock.yaml\` 这类 lockfile 的主要作用是什么？\n\nA. 记录单页应用（SPA）的前端路由拓扑路径\nB. 固定依赖解析结果，让不同环境安装到尽量一致的依赖版本\nC. 作为分布式版本管理系统来替代 Git 的核心版本控制能力\nD. 自动分析并为项目中的所有模块生成组件使用文档\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '前端性能优化.md'),
    replacements: [
      {
        old: `### Q1\n\n前端性能优化最正确的起手式是什么？\n\nA. 先把所有代码重写一遍\nB. 先采集指标，定位瓶颈，再针对问题优化\nC. 先把所有图片删掉\nD. 只看自己的电脑是否流畅\n\n答案：B`,
        new: `### Q1\n\n前端性能优化最正确的起手式是什么？\n\nA. 采用最先进 of 重构框架把业务源码全量重写一遍\nB. 先采集指标，定位瓶颈，再针对问题优化\nC. 阻断项目中所有图片与静态文件的网络加载\nD. 仅凭开发机或高配置设备的本地调试表现来评估性能\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '发布策略.md'),
    replacements: [
      {
        old: `### Q2\n\n金丝雀发布最核心的价值是什么？\n\nA. 节省服务器\nB. 用极小比例真实流量先验证新版本，把故障半径限制到最小\nC. 替代单元测试\nD. 让代码更短\n\n答案：B`,
        new: `### Q2\n\n金丝雀发布最核心的价值是什么？\n\nA. 节省物理或虚拟服务器容器的购买开销\nB. 用极小比例真实流量先验证新版本，把故障半径限制到最小\nC. 作为一种黑盒灰度测试来完全替代单元测试\nD. 利用压缩技术缩减线上构建包的物理代码长度\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '开发服务器.md'),
    replacements: [
      {
        old: `### Q2\n\n为什么浏览器不能直接处理 \`import { ref } from 'vue'\` 这种裸模块导入？\n\nA. 浏览器不知道 \`vue\` 应该对应哪个具体 URL\nB. 浏览器不支持任何 JavaScript\nC. \`vue\` 只能在服务端运行\nD. 因为代码没有压缩\n\n答案：A`,
        new: `### Q2\n\n为什么浏览器不能直接处理 \`import { ref } from 'vue'\` 这种裸模块导入？\n\nA. 浏览器不知道 \`vue\` 应该对应哪个具体 URL\nB. 现代浏览器完全不支持在客户端执行任何 JavaScript 脚本\nC. 响应式核心库（如 Vue）只能在 Node.js 服务端容器内运行\nD. 模块在加载前未能通过构建工具的混淆与体积压缩\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '微前端.md'),
    replacements: [
      {
        old: `### Q3\n\n子应用静态资源 404 时，最该先检查什么？\n\nA. 主应用主题色\nB. publicPath / 部署目录 / base 是否一致\nC. 数据库索引\nD. README 是否有截图\n\n答案：B`,
        new: `### Q3\n\n子应用静态资源 404 时，最该先检查什么？\n\nA. 主应用定义的 CSS 全局变量和配色主题\nB. publicPath / 部署目录 / base 是否一致\nC. 服务端容器中的数据库索引配置是否正确\nD. 项目根目录下的 README 配置文件是否包含相关截图\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '性能指标与度量.md'),
    replacements: [
      {
        old: `### Q2\n\n真实用户数据最适合回答什么问题？\n\nA. 真实用户在真实设备和网络下是否变快\nB. 哪个 CSS 文件名最好看\nC. Git 分支怎么命名\nD. 本地电脑 CPU 是否够新\n\n答案：A`,
        new: `### Q2\n\n真实用户数据最适合回答什么问题？\n\nA. 真实用户在真实设备和网络下是否变快\nB. 哪一种 CSS 选择器的命名更加符合 BEM 设计\nC. 代码仓库中多分支提交流水线的命名规范\nD. 本地开发机的 CPU 主频及物理配置是否满足编译要求\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '性能监控与性能预算.md'),
    replacements: [
      {
        old: `### Q1\n\n性能预算的作用是什么？\n\nA. 在发布前后约束性能指标，防止持续退化\nB. 自动替代业务需求\nC. 删除所有图片\nD. 让接口不用写\n\n答案：A`,
        new: `### Q1\n\n性能预算的作用是什么？\n\nA. 在发布前后约束性能指标，防止持续退化\nB. 阻断自动化需求变更以代替人工需求评审\nC. 强制在构建时把全部图片和多媒体资源物理剔除\nD. 让所有的异步网络请求均在服务端完成同构拦截\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '渲染流程与渲染性能.md'),
    replacements: [
      {
        old: `### Q1\n\nlayout 主要做什么？\n\nA. 计算元素位置和尺寸\nB. 下载 npm 包\nC. 提交 Git\nD. 发接口\n\n答案：A`,
        new: `### Q1\n\nlayout 主要做什么？\n\nA. 计算元素位置和尺寸\nB. 在后台网络通道下载依赖包\nC. 将当前工作区改动提交至 Git\nD. 向服务端发起网络请求\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '组件库设计.md'),
    replacements: [
      {
        old: `### Q1\n\n\`package.json\` 的 \`exports\` 字段最核心的作用是什么？\n\nA. 声明项目作者\nB. 精细控制每个 subpath 在不同条件下解析到哪个文件，避免类型丢失与解析歧义\nC. 替代 README\nD. 自动跑测试\n\n答案：B`,
        new: `### Q1\n\n\`package.json\` 的 \`exports\` 字段最核心的作用是什么？\n\nA. 声明依赖包的开发者信息和联系方式\nB. 精细控制每个 subpath 在不同条件下解析到哪个文件，避免类型丢失与解析歧义\nC. 作为轻量级文档来替代项目根目录下的 README\nD. 自动在本地运行多包测试用例进行校验\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '请求-响应全链路.md'),
    replacements: [
      {
        old: `### Q2\n\nDNS 的作用是什么？\n\nA. 把域名换成 IP 地址\nB. 给请求加密\nC. 替代 TCP\nD. 自动写后端代码\n\n答案：A`,
        new: `### Q2\n\nDNS 的作用是什么？\n\nA. 把域名换成 IP 地址\nB. 对客户端发送的 HTTP 报文进行非对称加密\nC. 替代传输层 TCP 协议以提供无连接服务\nD. 自动为应用生成对应的后端控制器逻辑\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, '资源加载与缓存策略.md'),
    replacements: [
      {
        old: `### Q3\n\n\`preconnect\` 主要优化什么？\n\nA. 提前建立跨域连接成本\nB. 自动压缩图片\nC. 自动删除 JS\nD. 自动修复接口错误\n\n答案：A`,
        new: `### Q3\n\n\`preconnect\` 主要优化什么？\n\nA. 提前建立跨域连接成本\nB. 在传输过程中对图像和视频进行物理压缩\nC. 自动删除主线程上的死代码\nD. 自动在客户端捕获并重试网络接口错误\n\n答案：A`
      }
    ]
  }
];

let totalApplied = 0;
for (const fileConfig of filesToRefactor) {
  if (!fs.existsSync(fileConfig.path)) {
    console.warn(`[WARN] 文件不存在: ${fileConfig.path}`);
    continue;
  }
  let content = fs.readFileSync(fileConfig.path, 'utf8');
  let fileApplied = 0;

  for (const replacement of fileConfig.replacements) {
    // 统一换行符为 \n 方便匹配
    const normContent = content.replace(/\r\n/g, '\n');
    const normOld = replacement.old.replace(/\r\n/g, '\n');
    
    if (normContent.includes(normOld)) {
      content = normContent.replace(normOld, replacement.new);
      fileApplied++;
      totalApplied++;
    } else {
      console.warn(`[WARN] 无法在文件 ${path.basename(fileConfig.path)} 中匹配到替换项。`);
    }
  }

  if (fileApplied > 0) {
    fs.writeFileSync(fileConfig.path, content, 'utf8');
    console.log(`[SUCCESS] 成功更新了文件: ${path.basename(fileConfig.path)}`);
  }
}

console.log(`[SUMMARY] 第八阶段技术破冰模块共替换了 ${totalApplied}/${filesToRefactor.length} 个文件。`);
