import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/技术破冰/cards/';

const filesToRefactor = [
  {
    path: path.join(baseDir, 'CI-CD.md'),
    replacements: [
      {
        old: `### Q1\n\nCI 最核心的价值是什么？\n\nA. 让代码提交后自动发朋友圈\nB. 每次代码变更后自动执行检查、测试和构建，尽早发现问题\nC. 替代所有人工代码评审\nD. 让项目不用写测试\n\n答案：B`,
        new: `### Q1\n\nCI 最核心的价值是什么？\n\nA. 强制阻断未通过格式化校验的拉取请求（PR）进入主干分支\nB. 每次代码变更后自动执行集成构建与自动化测试，实现软件集成问题的快速反馈和持续发现\nC. 完全替代人工的代码审查（Code Review）与静态安全审计（SAST）流程\nD. 让部署包在发布时能够直接共享宿主环境配置以避开依赖冲突\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'DevOps.md'),
    replacements: [
      {
        old: `### Q4\n\n下面哪个更像 DevOps 里的可观测性问题？\n\nA. 变量名是否足够短  \nB. 上线后错误率、接口失败率、性能指标是否异常，以及异常时能不能定位  \nC. 按钮颜色是否喜欢  \nD. README 字数是否足够多\n\n答案：B`,
        new: `### Q4\n\n下面哪个更像 DevOps 里的可观测性问题？\n\nA. 代码转译时的 JS 压缩包混淆变量名是否足够简短  \nB. 生产环境的错误率走势、网关接口失败率与性能指标实时追踪，以及突发异常时的调用栈（Trace）还原定位  \nC. 前端设计系统的组件选择器命名是否完全贴合 BEM 命名约束  \nD. 自动化流水线在归档日志文件（Archived Logs）中的注释字符总体冗余度评估\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'Docker 与容器化.md'),
    replacements: [
      {
        old: `### Q1\n\nDocker 最核心解决的问题是什么？\n\nA. 替代所有后端代码  \nB. 把应用及其运行依赖封装成可移植、可复现的运行单元  \nC. 自动写前端页面  \nD. 让数据库不需要备份\n\n答案：B`,
        new: `### Q1\n\nDocker 最核心解决的问题是什么？\n\nA. 彻底避开服务端操作系统的文件访问控制权限校验  \nB. 将应用连同其依赖的操作系统基础环境、共享库和配置文件封装成一个可一致性运行的轻量级物理隔离沙箱  \nC. 为客户端浏览器直接注入适配好的 AST 解析引擎以提升运行时响应  \nD. 在云原生集群中自动配置数据库的写时复制（Copy-on-write）持久化快照\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '包管理器.md'),
    replacements: [
      {
        old: `### Q3\n\nghost dependency 指的是什么？\n\nA. 一个没有名字的 npm 包\nB. 代码使用了没有在自己依赖声明中列出的包，只是因为依赖提升碰巧能访问到\nC. 一个只能晚上安装的依赖\nD. 一个浏览器内置 API\n\n答案：B`,
        new: `### Q3\n\nghost dependency 指的是什么？\n\nA. 由于 package.json 锁定的包在远端 Registry 物理下线导致的安装失败依赖\nB. 业务中导入了未在 package.json 依赖表显式声明的包，但在构建时因包管理器扁平化提升机制而碰巧能被解析引用\nC. 那些在多包 Monorepo 构建链路中仅用作本地软链接导出的虚拟包\nD. 浏览器在加载协商缓存静态资源时隐式生成的私有 DOM 模型引用包\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, '构建工具.md'),
    replacements: [
      {
        old: `### Q3\n\nloader、transform、plugin 这类机制的共同价值是什么？\n\nA. 扩展构建工具能力，处理不同类型文件或介入构建流程\nB. 让项目不能运行\nC. 替代 Git\nD. 删除所有业务代码\n\n答案：A`,
        new: `### Q3\n\nloader、transform、plugin 这类机制的共同价值是什么？\n\nA. 扩展构建工具能力，用于处理不同文件类型的转译，或者介入打包流程进行深度加工\nB. 绕过打包器的 AST 依赖分析流程直接将非标准的资源复制到最终的输出目录\nC. 完全替代客户端浏览器对非 ESM 代码的协商缓存解析与运行时转换\nD. 对项目中的无用导出（Unused Exports）自动注入运行时性能收集探针以进行死代码消除\n\n答案：A`
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

console.log(`[SUMMARY] 技术破冰模块共替换了 ${totalApplied}/${filesToRefactor.length} 个文件。`);
