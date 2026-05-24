import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/技术破冰/cards/';

const filesToRefactor = [
  {
    path: path.join(baseDir, 'Chrome Memory 与 Performance Monitor.md'),
    replacements: [
      {
        old: `### Q4\n\n判断内存泄漏时，为什么不能只看 JS heap size 短时间上涨？\n\nA. 因为浏览器可能还没有触发 GC\nB. 因为 JS 没有内存概念\nC. 因为 DevTools 不能打开\nD. 因为 CSS 会覆盖 JS\n\n答案：A`,
        new: `### Q4\n\n判断内存泄漏时，为什么不能只看 JS heap size 短时间上涨？\n\nA. 因为浏览器可能还没有触发 GC\nB. 因为 V8 引擎对新晋代内存采用了全停顿（Stop-The-World）算法\nC. 因为 Chrome 无法追踪主线程以外的微任务（Microtasks）内存开销\nD. 因为强引用（Strong Reference）在退出执行上下文时会被隐式销毁\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, 'INP 与交互响应.md'),
    replacements: [
      {
        old: `### Q2\n\n点击后页面无反馈 500ms，最可能先看哪里？\n\nA. 事件回调和主线程长任务\nB. README\nC. npm 包名\nD. 图片 alt\n\n答案：A`,
        new: `### Q2\n\n点击后页面无反馈 500ms，最可能先看哪里？\n\nA. 事件回调和主线程长任务\nB. 静态资源的 HTTP 头缓存配置错误\nC. 页面上的首屏图片未声明宽度与高度\nD. CDN 节点与源站之间的传输链路拥堵\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, 'Jenkins.md'),
    replacements: [
      {
        old: `### Q1\n\nJenkins 最核心解决的问题是什么？\n\nA. 替代所有业务代码  \nB. 把检查、测试、构建、部署等重复流程自动化、可追踪化  \nC. 自动设计页面  \nD. 替代 Git\n\n答案：B`,
        new: `### Q1\n\nJenkins 最核心解决的问题是什么？\n\nA. 替代生产环境的 CDN 服务来进行多节点资源缓存分发  \nB. 把检查、测试、构建、部署等重复流程自动化、可追踪化  \nC. 提供客户端运行时的性能监控与数据全链路追踪  \nD. 作为分布式版本管理系统来替代 Git 的核心版本控制能力\n\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'K8s 与容器编排.md'),
    replacements: [
      {
        old: `### Q3\n\nDeployment 最常见的作用是什么？\n\nA. 管理无状态应用副本、滚动更新和回滚  \nB. 保存数据库密码  \nC. 只负责域名解析  \nD. 自动写 CSS\n\n答案：A`,
        new: `### Q3\n\nDeployment 最常见的作用是什么？\n\nA. 管理无状态应用副本、滚动更新和回滚  \nB. 独占式管理持久化存储卷（PV）的自动装载与动态扩容  \nC. 承接外部流量，提供集群层面的域名解析与七层路由  \nD. 声明应用运行所需的敏感密钥与只读配置挂载\n\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, 'LCP 与首屏加载.md'),
    replacements: [
      {
        old: `### Q3\n\nLCP 图片下载完但迟迟不显示，优先怀疑什么？\n\nA. render delay，例如 CSS、JS、字体或客户端渲染阻塞\nB. npm 包名\nC. Git 分支名\nD. README 目录\n\n答案：A`,
        new: `### Q3\n\nLCP 图片下载完但迟迟不显示，优先怀疑什么？\n\nA. render delay，例如 CSS、JS、字体或客户端渲染阻塞\nB. 浏览器的网络请求排队（Queueing）时间过长\nC. 服务端响应没有正确设置 Content-Disposition 响应头\nD. TCP 连接握手时发生丢包重传\n\n答案：A`
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

console.log(`[SUMMARY] 第七阶段技术破冰模块共替换了 ${totalApplied}/${filesToRefactor.length} 个文件。`);
