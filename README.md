# OneKVM Plugin Marketplace Extension

English | [简体中文](README.zh-CN.md)

Browse signed `onekvm-extension-*` packages, install, update, or remove them,
and manage custom package sources from OneKVM.

> **Build note:** The component-owned OpenEmbedded layer is in
> `oe-recipes`. Release images and the fixed component
> revision are still composed by `onekvm-distro`.

## Features

- Browse signed extension packages from the configured opkg feeds
- Install, update, and uninstall plugins, with download and install progress
- Search plugins and filter by status or manifest `kind`
- Group VPNs, mesh networking, tunnels, and DDNS under **Networking & tunnels**
- Add, enable, disable, and remove custom package sources
- Let other OneKVM pages list and install packages through the shell
- No resident service

## Install and enable

The package name is `onekvm-extension-plugin-marketplace`. Install it through
your OneKVM distribution package or image, then manage it with the plugin
manager:

```sh
onekvm-extension enable plugin-marketplace
onekvm-extension disable plugin-marketplace
```

The extension is enabled by default. Open **Plugin marketplace** to use it.

## Usage

The **Extensions** tab lists plugins from the signed feeds. Choose **Check for
updates** to refresh those indexes. An installed plugin with a newer package
shows **Update** together with the current and target versions. The status
filter can show installed plugins, available plugins, or only updates.

Version comparison follows opkg ordering, including numeric components, epochs,
and recipe revisions. An installed development package is not offered an older
release as an update. Updating uses the same download and install dialog,
briefly stops that plugin, and keeps its settings and enabled state.

Plugins that exist only on the device stay in the list and have no online
update action. After an OS slot switch, when package metadata is unavailable,
only a newer extension version is offered.

The **Package sources** tab manages feeds. The system source is written by the
image: its `src` content is read-only here, and it can be disabled. Custom
sources can be added, edited, disabled, or removed. A disabled source is left
out of the package list. Custom sources are stored as
`/etc/opkg/onekvm-ext-{name}.conf`. A source key uses lowercase letters,
numbers, and hyphens, and its content is one or more opkg `src` or `src/gz`
lines.

## How it works

The page is `web/page.js`. `web/shell.js` registers `listPackages`,
`installPackage`, and `installProgress` with the OneKVM Shell, so other
first-party pages, such as Cloud Services, can install packages without
package-manager access of their own.

The controller is `bin/onekvm-plugin-marketplace` and requires the
`opkg-admin` sandbox permission. Package listing reads
`/data/pkg-state/opkg/lists`. Install and remove run in the extension host,
outside the marketplace sandbox. The host loads the system feed and the custom
sources together when it applies signed-feed policy. The system feed remains
`/etc/opkg/onekvm-feed.conf`.

`list_packages` accepts `{ "refresh": true }` and returns `installed_version`,
`package_version`, `installed_package_version`, and `update_available` for
each entry.

## License

This project is licensed under the GNU General Public License v3.0. See
[`LICENSE`](LICENSE).
