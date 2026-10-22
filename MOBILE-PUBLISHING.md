# iPhone 投稿与日常使用

## 一次准备

1. 在 iPhone Safari 登录 GitHub，账户必须为仓库 Owner `Justin2524`。
2. 打开 [发布新闻报告](https://github.com/Justin2524/global-intelligence/issues/new?template=publish-report.yml)。
3. 可将表单加入 Safari 书签；将 [网站首页](https://justin2524.github.io/global-intelligence/)「添加到主屏幕」。

不需要安装开发工具，不需要输入密码或 Token 给自动化助手。

## 从 ChatGPT 复制一份日报

可把下面的格式要求附在你自己的日报请求之后：

> 请输出完整 Markdown 日报。以 `# YYYY-MM-DD 全球金融科技日报` 开头，然后一句话摘要。添加 `分类：macro, technology, markets, geopolitics` 和适用的 `标签：`。恰好十条新闻，每条使用 `## 1. 标题` 至 `## 10. 标题`；下设事件摘要、为什么重要、风险或不确定性、原始来源 Markdown 链接。区分事实与推断，不伪造新闻或来源。不要使用 HTML，不要将整篇包裹成代码块，不要输出 Front Matter。只输出可直接粘贴的正文。

这段要求本身不会提供实时新闻。请确认 ChatGPT 使用了可核实的当期来源，并自行检查日期、链接与事实。

1. 在 ChatGPT 复制完整 Markdown，确认标题 `#`、二级标题 `##`、链接 `[文字](https://...)` 保留。
2. 打开 [手机投稿表单](https://github.com/Justin2524/global-intelligence/issues/new?template=publish-report.yml)。
3. 保留 Issue 标题中的 `[Publish]`，无需另外编辑标题。
4. **报告类型**选择 `Daily`。
5. **报告日期**填写 `YYYY-MM-DD`，例如 `2026-10-22`。同一天只允许一份 Daily。
6. **报告正文**粘贴完整内容。不要粘贴 ChatGPT 的说明文字或整篇外围的三个反引号。
7. 提交 Issue。GitHub Actions 开始运行，通常需要数分钟。
8. 留在 Issue 页面，刷新查看评论。只有出现 **「发布成功：归档、Pages 部署与在线内容验证均通过」** 才算成功。
9. 点击评论中的文章链接。文章会同时进入首页、日报列表、分类与搜索索引。

## 周报

选择 `Weekly`，日期使用你希望归档的周报日期。正文至少两个 `##` 二级标题，可以自由使用三级标题、表格和公式。建议结构为核心问题、原创摘要、传导机制、风险与反向证据、延伸阅读。每篇需要来源链接。

只提交自己的摘要和分析；不要粘贴《经济学人》付费全文。可以注明具体文章标题与原文链接，引用保持必要且简短。本站不是《经济学人》官方产品。

## 标签、分类与公式

在一级标题后加入：

```markdown
分类：macro, technology
标签：AI, 生产率, Economics
```

支持的分类：`macro`、`technology`、`markets`、`geopolitics`，可多选，以逗号分隔。中文名称也可使用。标签最多 12 个。不写分类时，Daily 默认 macro，Weekly 默认 geopolitics。

行内公式示例：`$r \approx i - \pi$` 或 `$P = Y/L$`。块级公式使用下面形式：

```text
$$
P = \frac{Y}{L}
$$
```

公式不支持 HTML 或需要受信任执行的扩展。外部图片不加载，只保留替代文字。

## 失败处理

| 提示或情况 | 操作 |
| --- | --- |
| 只有 Owner 可以发布 | 切换到 Justin2524 账户。别人创建的 Issue 即使 Owner 编辑也不能发布。 |
| 表单结构不正确 | 使用指定表单，不删除三个字段标题、`[Publish]` 或标签。 |
| 日期不存在 | 在原 Issue 正文中修正日期，保持 YYYY-MM-DD。 |
| Daily 标题数不正确 | 检查恰好十个 `##` 标题且从 1 到 10 编号；额外小节用 `###`。 |
| 缺少来源 | 添加真实 `http(s)` Markdown 链接。 |
| 同日同类型已存在 | 不会覆盖原文。换一个真实的归档日期，或由 Owner 通过源码审阅进行更正。 |
| 已归档、部署或线上验证失败 | 保持原正文不变，打开评论中的 Actions → Re-run all jobs。不要另建重复报告。 |
| main changed during build | 重跑原工作流，以最新 main 重新校验构建。 |
| 很久没有结果评论 | 在 Actions 找对应 Issue run；GitHub 可能替换等待中的 run，重跑原始 run，或将仍打开的原 Issue 关闭后重新打开。 |
| Pages 权限/配置错误 | Settings → Pages 选择 GitHub Actions；检查 github-pages 环境允许 main、分支策略允许机器人归档。 |
| 页面仍是旧版本 | 查看工作流是否真正成功，再刷新 Safari；成功评论前不能当作发布完成。 |

未归档的格式错误可以直接编辑原 Issue，编辑事件会重新运行校验。已发布文章不会因后续编辑被静默覆盖。原始 Issue 始终保留；成功仅关闭，不删除。

## 手机阅读

顶部导航横向滑动可查看全部栏目；文章上方目录可展开，点击直接跳转章节。Archive 支持中文、英文、标签、正文、月份、类型及主题组合搜索。浏览器缩放保持可用。链接右侧的箭头表示可进入来源或文章。

实际部署与测试状态见 [TEST-RESULTS.md](TEST-RESULTS.md)。移动视口测试不等于真机 Safari 测试；首次使用建议自己完成一次 Demo 投稿确认账号与输入习惯。
