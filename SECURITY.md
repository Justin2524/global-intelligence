# 安全设计与已知边界

## 信任边界

Issue 是不可信数据。GitHub 提供的事件元数据用来验证 repository.full_name、个人 Owner 的不可变数字 ID、Issue 创建者 ID 和当前事件 sender ID。必须全部匹配；PR、关闭状态、未知事件、错误模板结构均拒绝。

GitHub Issues webhook 没有不可伪造的模板 ID。本项目以固定字段顺序、三个字段标题、`[Publish]` 标题及 `publish-report` 标签识别表单契约，禁用空白模板；Owner 通过 API 构造完全相同的数据仍可通过。标签、标题都不是授权凭据，真正的发布权限由 Owner ID 决定。不能声称从服务端证明用户点击过某个网页模板。

## 输入与渲染

- 日期先验证正则再验证真实日历值；路径只由验证后的日期和固定枚举组成。
- 60 KB 长度限制；拒绝异常控制字符、缺失标题、非法分类和过量标签。
- MarkdownIt 禁用原始 HTML；链接经过协议限制；图片转换成文本；sanitize-html 二次过滤 HTML。
- KaTeX 只输出 MathML，trust=false，有限展开次数；不执行 LaTeX 或外部程序。
- Front Matter 使用 JSON 编码；用户 Markdown 不交给 Liquid。Jekyll 从生成的 JSON 读取已过滤 HTML，作为普通数据插入固定布局，不递归执行其中的 Liquid。
- 前端搜索使用 textContent 和 DOM API，不把搜索词或正文作为 innerHTML。
- CSP 仅允许本站静态脚本与样式；禁止对象、外部脚本、任意表单目标及基准 URL。

## 写入与发布

`wx` 独占创建防止覆盖；已有文件仅允许同一 Issue 且正文 SHA-256 相同的幂等重试。目录与目标文件不允许符号链接。归档阶段仅暂存经过校验的精确路径，main 漂移或 push 冲突会失败，绝不 force push。

工作流权限在 job 层分开：构建只读、归档仅 contents 写、部署仅 Pages/OIDC、通知仅 Issues 写和 Actions 读。不会把 Issue 正文插入 run 脚本或命令参数，不使用 pull_request_target，不需要 PAT、付费 API 或个人凭据。

归档与部署在同一次 workflow 内完成。只有 Pages action 成功并且线上首页、索引、文章及正文哈希通过检查后才评论成功。失败不会删 Issue；已归档但未上线时明确保持未完成状态。

## 运营边界

公开仓库不可存放私人资料。公共 Issue 可能消耗 Actions 队列；Owner 授权校验阻止内容发布，但不是反滥用服务。GitHub concurrency 只保留有限等待队列，可能取消旧的 pending run；原 Issue 仍存在，可以重跑。GitHub 服务故障、环境审批、仓库策略与账号限制不能由代码绕过。

维护者直接提交源码属于另一信任边界：维护者可以改变布局和工作流。不要自动合并陌生 PR；定期更新锁定依赖和 Action 引用。所有示例都标记 Demo。
