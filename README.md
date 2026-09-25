> This is an independently versioned plugin repository. Local builds use the stable Core SDK from this checkout; see [Core repository boundaries](../../docs/REPOSITORY-BOUNDARIES.md).

# 我的奇域插件

`my_wonderland` 是独立动态插件，用于查看并采集当前账号下奇域作品数据。它由自己的清单、契约、React UI 和 Rust stdio 后端组成；Core 不静态导入插件页面或业务实现。

## 功能

- 按当前账号和角色查看已采集的作品序列、统计与详情。
- 通过奇域官方接口更新作品信息，并把结果保存在插件私有目录。
- 只注册一个 Workspace Activity：`main`。插件 UI 直接填充 Core 提供的内容区，并通过 UI Host SDK 跟随宿主主题。

## Core 能力与账号边界

清单只申请 `account.read` 和 `account.authed_get`。账号快照与鉴权 GET 请求由 Core 代理，凭据不会交给插件；插件不能自行添加主机、读取 cookie 或绕过 Core 的主机白名单。

首次使用前，在插件管理页为该插件授予所申请的能力，并在 Core 登录一个账号。账号切换由 Core 管理，插件每次操作读取当前快照。

## 构建和安装

在仓库根目录运行：

```powershell
pnpm build
```

生成的 Windows x86_64 MSVC debug 包位于 `target/my-wonderland-plugin`。启动 debug Core，在“设置 → 插件管理”安装该目录并启用插件，然后从 Workspace 的“我的奇域”主入口打开。

## UI 开发

UI 源码由 Vite 编译到插件仓库内的 `ui/dist`，不会直接写入 Core 的用户数据或插件安装目录。修改后在插件仓库根目录运行 `pnpm build`，生成 `target/my-wonderland-plugin`，再通过 Core 的“设置 → 插件管理”安装。

Core 按插件版本管理安装目录。同一版本已经安装时，先在插件管理中移除旧插件再安装新包，或提升 `package/manifest.json` 的版本号；移除时保留插件数据即可。清单、契约和 Rust 后端改动也使用同一构建与安装流程。

## 数据

新数据位于 `%APPDATA%\com.wonderland.assistant\plugin-data\my_wonderland\series-v2\`。旧目录中的内容属于开发测试样本，不会导入；首次启用后插件会从空状态开始。移除插件包与清理插件数据是分开的操作。

## 目录与契约

- `package/manifest.json`：插件身份、兼容范围、唯一 Activity、UI 集成和 Core 能力声明。
- `package/contract.json`：`account_snapshot`、`series`、`collect` 的参数、结果与超时契约。
- `ui/src/main.tsx`：UI Host SDK 与插件后端之间的适配；业务页面在同目录的 React 组件中。
- `src/lib.rs`：不依赖 Tauri 的采集与本地序列业务逻辑。
- `src/main.rs`：协议后端及 Core 账号服务适配。

日常开发先改 contract 与对应适配，再同步更新前端 DTO。插件包由仓库根目录的 `scripts/build-plugin.mjs` 生成；debug 包不包含发布签名。
