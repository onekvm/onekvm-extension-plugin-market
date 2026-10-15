# OneKVM 插件市场扩展

[English](README.md) | 简体中文

在 OneKVM 中浏览已签名的 `onekvm-extension-*` 软件包，安装、更新或卸载
插件，并管理自定义软件包源。

> **构建说明：** 组件自带的 OpenEmbedded layer 位于
> `oe-recipes`。正式镜像组合与组件固定 revision 仍由
> `onekvm-distro` 管理。

## 功能

- 从已配置的 opkg 软件源浏览已签名的扩展软件包
- 安装、更新和卸载插件，并显示下载与安装进度
- 搜索插件，并按状态或 manifest 的 `kind` 筛选
- 将 VPN、组网、隧道和 DDNS 归入 **组网与穿透**
- 添加、启用、停用和删除自定义软件包源
- 其他 OneKVM 页面可以通过 Shell 列出并安装软件包
- 没有常驻服务

## 安装与启用

软件包名称是 `onekvm-extension-plugin-marketplace`。请通过 OneKVM 发行版的
软件包或镜像安装，然后使用插件管理器控制扩展：

```sh
onekvm-extension enable plugin-marketplace
onekvm-extension disable plugin-marketplace
```

扩展默认启用。打开 **插件市场** 即可使用。

## 使用

**扩展** 页列出已签名软件源中的插件。选择 **检查更新** 会刷新这些索引。
已安装且存在更新软件包的插件会显示 **更新**，以及当前版本和目标版本。
状态筛选可以只看已安装、可安装，或只看有更新的插件。

版本比较遵循 opkg 的顺序，包括数字分段、epoch 和配方 revision。已安装
的开发包不会把更旧的正式版本当作更新。更新使用同样的下载与安装对话框，
会短暂停止该插件，并保留它的设置和启用状态。

只存在于本机的插件仍会列出，但没有在线更新操作。切换 OS 槽位后，如果
软件包元数据不可用，则只在扩展版本更新时提供更新。

**软件包源** 页管理软件源。系统软件源由镜像写入，这里的 `src` 内容只读，
可以停用。自定义软件源可以添加、编辑、停用或删除。已停用的软件源不参与
软件包列表。自定义软件源保存在
`/etc/opkg/onekvm-ext-{name}.conf`。软件源标识只能使用小写字母、数字和
连字符，内容是一行或多行 opkg 的 `src` 或 `src/gz`。

## 实现说明

页面是 `web/page.js`。`web/shell.js` 向 OneKVM Shell 注册 `listPackages`、
`installPackage` 和 `installProgress`，因此云服务等第一方页面可以安装
软件包，而自身不获得软件包管理权限。

控制器是 `bin/onekvm-plugin-marketplace`，需要 `opkg-admin` 沙箱权限。
软件包列表读取 `/data/pkg-state/opkg/lists`。安装和卸载由扩展宿主在市场
沙箱之外执行。宿主在应用签名软件源策略时会同时加载系统软件源和自定义
软件源。系统软件源仍是 `/etc/opkg/onekvm-feed.conf`。

`list_packages` 接受 `{ "refresh": true }`，并为每个条目返回
`installed_version`、`package_version`、`installed_package_version` 和
`update_available`。

## 许可证

本项目使用 GNU General Public License v3.0，完整条款见
[`LICENSE`](LICENSE)。
