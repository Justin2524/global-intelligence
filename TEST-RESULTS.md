# 验收记录

最后更新：2026-10-23（Asia/Hong_Kong）。区分真实线上结果、受控事件测试和未执行的真机验收。

| 验收项 | 状态 | 实际证据 |
| --- | --- | --- |
| 本地 Jekyll 4.4.1 构建 | PASS | `npm run build`，最终 5 篇明确标记 Demo 的文章 |
| 自动测试 | PASS | `npm test`，12/12；同一套测试也在 Actions 中执行 |
| 日报/周报独立布局、中文、Markdown 表格、公式、来源 | PASS | `npm run verify`；浏览器查看真实周报，3 个 MathML 公式、1 张表格 |
| 中英文全文搜索、标签、类型与主题组合 | PASS | 单元测试；浏览器中文「生产率」与 weekly 筛选命中 1 篇；线上「投稿验收」与 daily 筛选命中已发布日报 |
| 目录展开与章节跳转 | PASS | 移动宽度默认折叠，展开后跳到 `#section-5` |
| 响应式布局 | PASS | 319px、390px 页面 scrollWidth 等于视口宽度；1440px 为日报/周报双栏，无页面横向溢出 |
| 非 Owner、伪造身份、非模板结构 | PASS | 受控事件单元测试，拒绝非 Owner 创建者和 sender；无文件写入。未借用第二个真实账户投稿 |
| HTML/脚本、危险 URL、Liquid 与 shell 字符串 | PASS | 内容处理测试；不执行文本，输出经过二次过滤 |
| 错误日期（真实 GitHub Issue） | PASS | Issue #3，错误日期被拒绝，Issue 仍 OPEN，错误评论明确；archive/deploy/verify 全部 skipped |
| 重复文章（真实 GitHub Issue） | PASS | Issue #4，同日同类型拒绝覆盖，Issue 仍 OPEN；archive/deploy/verify 全部 skipped |
| 同一 Issue 同内容幂等重试 | PASS | 本地测试验证 retry，无覆盖；不同 Issue 或不同正文拒绝 |
| Public 仓库与源码推送 | PASS | `Justin2524/global-intelligence`，main，完整源码与锁文件 |
| GitHub Pages 首次部署 | PASS | [首次部署 run](https://github.com/Justin2524/global-intelligence/actions/runs/39780201852) success；线上首页已浏览 |
| Daily 完整发布链路 | PASS | [Issue #1](https://github.com/Justin2524/global-intelligence/issues/1)、[run 39884118628](https://github.com/Justin2524/global-intelligence/actions/runs/39884118628)：build/archive/deploy/verify/notify 全部 success，Issue 自动关闭 |
| Weekly 完整发布链路 | PASS | [Issue #2](https://github.com/Justin2524/global-intelligence/issues/2)、[run 39884339464](https://github.com/Justin2524/global-intelligence/actions/runs/39884339464)：全部 success，Issue 自动关闭 |
| GITHUB_TOKEN 提交后的部署 | PASS | 两次 Issue run 在同一工作流中完成归档、Pages 部署与在线正文 SHA-256 验证，不依赖后续 push 触发 |
| npm 依赖审计 | PASS | 升级后 `npm audit --audit-level=low`：0 vulnerabilities，2026-10-22 检查 |
| 手机投稿入口 | PARTIAL | 固定 URL 可访问，未登录时正确进入 GitHub 登录页；表单结构自动测试通过，正文事件链路实际通过 |
| 真实 iPhone Safari 登录、粘贴与点击提交 | NOT RUN | 当前未连接真实 iPhone，内置浏览器未登录 GitHub；未索取密码或 Token |
| Pages 故障后的真实重试 | NOT RUN | 未人为破坏生产配置；同内容重试已通过本地测试，失败分支已通过两次真实负例 |

## 负例证据

- [非法日期 Issue #3](https://github.com/Justin2524/global-intelligence/issues/3) / [工作流](https://github.com/Justin2524/global-intelligence/actions/runs/39884516511)：工作流显示 failure 是**预期拒绝**，不是意外发布故障。
- [重复文章 Issue #4](https://github.com/Justin2524/global-intelligence/issues/4) / [工作流](https://github.com/Justin2524/global-intelligence/actions/runs/39884621277)：明确拒绝覆盖，未执行归档或部署。
- 两个失败 Issue 保持打开，保留原始输入与错误评论；未清理或伪装成成功。

## Demo 验收内容归档

两次端到端测试最初按 2026-10-23 归档并成功上线。验收完成后，为释放今天正式投稿的 Daily/Weekly 位置，Demo 文章移至 `2000-01-01` **示例归档日期**，正文哈希和来源 Issue 保持不变，`demo_original_date` 记录真实验收日期，页面明确说明该日期不是新闻日期。

当前示例：[Daily](https://justin2524.github.io/global-intelligence/reports/2000-01-01-daily/) / [Weekly](https://justin2524.github.io/global-intelligence/reports/2000-01-01-weekly/)。历史成功评论中的原测试 URL 可能为 404，或将来被真实同日文章使用；端到端证据以原工作流和归档提交历史为准。不要重跑已完成的测试 Issue，以免重新生成原测试日期。

## 剩余确认

Owner 在 iPhone Safari 登录 `Justin2524`，按照 MOBILE-PUBLISHING.md 提交第一篇正式报告，即可完成真实设备端的最后验收。GitHub 不提供可信模板 ID，系统验证 Owner 身份和表单契约，不能证明使用的是网页表单而非 API。普通使用不需要调整 Token 或开放额外权限。
