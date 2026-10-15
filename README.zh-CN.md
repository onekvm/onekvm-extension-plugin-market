# OneKVM 插件市场扩展

[English](README.md) | 简体中文

在 OneKVM 中浏览已签名的 `onekvm-extension-*` 软件包，安装、更新或卸载
插件，并管理自定义软件包源。

> **构建说明：** 组件自带的 OpenEmbedded layer 位于
> `oe-recipes`。正式镜像组合与组件固定 revision 仍由
> `onekvm-distro` 管理。

## 功能

- 从已签名的软件包源安装插件，并显示下载进度
- 已安装插件有更新的软件包时可以更新，并保留设置和启用状态
- 卸载插件；插件数据可能会留在设备上
- 搜索插件，并按已安装、可安装、有更新或类型筛选
- 对照已签名的软件包索引检查更新
- 显示已安装插件占用的存储空间
- 添加、编辑、停用或删除自定义软件包源，也可以停用内置系统源

## 安装与启用

软件包名称是 `onekvm-extension-plugin-marketplace`。请通过 OneKVM 发行版的
软件包或镜像安装，然后使用插件管理器控制扩展：

```sh
onekvm-extension enable plugin-marketplace
onekvm-extension disable plugin-marketplace
```

扩展默认启用。打开 **插件市场** 即可使用。

## 使用

**插件** 页列出已启用软件源中的插件。**检查更新** 会刷新已签名的索引。
有更新软件包的插件会显示 **更新**，以及当前版本和目标版本。状态可以限定为
**已安装**、**可安装** 或 **有更新**。类型来自各插件自己的 manifest：
**组网与穿透**、**云服务**、**协议** 或 **服务**。

更新会短暂停止该插件，然后恢复它的设置和启用状态。已安装的开发包不会把
更旧的正式版本当作更新。只存在于本机的插件仍会列出，但没有在线更新。

**软件包源** 页列出系统源和自定义源。系统源由镜像写入，这里的内容只读，
可以停用。自定义源保存在 `/etc/opkg/onekvm-ext-{name}.conf`。标识只能使用
小写字母、数字和连字符，内容是一行或多行 opkg 的 `src` 或 `src/gz`。
已停用的源不参与插件列表。没有任何已启用的源时，页面只列出已经安装的插件。

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
`update_available`。版本比较遵循 opkg 的顺序，包括数字分段、epoch 和配方
revision。切换 OS 槽位后，如果软件包元数据不可用，则只在扩展版本更新时
提供更新。

## 许可证

本项目使用 GNU General Public License v3.0，完整条款见
[`LICENSE`](LICENSE)。
