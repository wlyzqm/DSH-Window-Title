# DSH Window Title · 窗口标题

自定义 [DeepSeek Harness](https://github.com/deepseek-ai) Web GUI 浏览器标签页标题的插件。

Customize the browser-tab title of the DeepSeek Harness Web GUI.

## 功能 · Features

在 **设置 → 通用设置** 中新增一个「窗口标题」设置项（位于外观/字体设置附近）：

| 场景 | 默认标题 | 设置自定义标题 `AAA` 后 |
| --- | --- | --- |
| 无会话 / 非聊天主面板 | `DeepSeek Harness` | `AAA` |
| 会话进行中 | `会话标题 — DeepSeek Harness` | `AAA - 会话标题` |

- 自定义名称在前、会话标题在后（`自定义名称 - 会话标题`）。
- 留空即恢复默认标题。
- 值持久化在 profile 用户补丁层（`cordis.patch.yml`），重启、升级均不丢失，也可直接在补丁文件中修改。
- 不修改任何核心文件，停用插件即完全还原。

## 安装 · Install

**方式一：插件市场（推荐）** — 若安装了插件市场（如 dshmarket），搜索 `dsh-window-title` 一键安装。

**方式二：命令行**

```bash
dsh plugin --profile <你的 profile> add github:wlyzqm/DSH-Window-Title
```

然后在 GUI 的 **设置 → 插件 → 全局插件** 中启用 `dsh-window-title`，刷新页面。

**方式三：让 Agent 安装** — 在对话中让 Agent 通过 `plugin_manager` 的 `install_bundle` 安装 `github:wlyzqm/DSH-Window-Title` 并启用。

## 使用 · Usage

1. 打开 **设置 → 通用设置**，找到 **窗口标题**；
2. 输入想要的名称（如 `AAA`），按 Enter 或点击输入框外部提交；
3. 标签页标题立即生效；清空输入框提交则恢复默认。

## 工作原理 · How it works

- **Host 半边**（`index.js`）：声明单字段 Config（`title`，标记 `volatile` 以允许设置文档编辑），由宿主设置服务以 `dsh-window-title` 命名空间伺服。
- **Client 半边**（`client.js`）：
  - 通过 `settings.general.item` 插槽在通用设置页注册设置行，经 `ctx.configForms` 读写宿主配置；
  - 用 `MutationObserver` 监听 `dsh-client-ui-layout` 写入的 `document.title`（`DeepSeek Harness` / `会话标题 — DeepSeek Harness`），并按自定义偏好重投影为 `自定义名称` / `自定义名称 - 会话标题`；
  - 记录最近一次布局写入的原始标题，清空设置或停用插件时精确还原。

## 兼容性 · Compatibility

在 DeepSeek Harness `0.2.1-rc.2` 上开发与验证。

## 许可 · License

[MIT](./LICENSE)
