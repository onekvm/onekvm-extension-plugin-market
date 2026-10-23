# OneKVM Plugin Marketplace Extension

English | [简体中文](README.zh-CN.md)

Browse signed `onekvm-extension-*` packages, install, update, or remove them,
and manage custom package sources from OneKVM.

> **Build note:** The component-owned OpenEmbedded layer is in
> `oe-recipes`. Release images and the fixed component
> revision are still composed by `onekvm-distro`.

## Features

- View extension details, including features, permissions, package dependencies, and kernel modules before installation
- Install an available extension from a signed package source, with download progress
- Update an installed extension when a newer package is published, keeping its settings and enabled state
- Uninstall an extension; its data may remain on the device
- Search extensions, and filter them by installed, available, update, or type
- Check the signed package index for updates
- Show how much storage the installed extensions use
- Add, edit, disable, or remove a custom package source, and disable the built-in system source

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

The **Extensions** tab lists extensions from the enabled package sources.
**Check for updates** refreshes the signed indexes. An extension with a newer
package shows **Update** and both versions. Status can be limited to
**Installed**, **Available**, or **Update available**. Filter by **Network**
(including OpenVPN), **Environment**, **Cloud service**, **Protocol**, or **Service**.

An update stops that extension briefly, then restores its settings and enabled
state. An installed development package is not offered an older release. An
extension present only on the device stays in the list and has no online
update.

The **Package sources** tab lists the system source and any custom sources.
The system source is written by the image. Its content is read-only here, and
it can be disabled. A custom source is stored as
`/etc/opkg/onekvm-ext-{name}.conf`. Its key uses lowercase letters, numbers,
and hyphens, and its content is one or more opkg `src` or `src/gz` lines. A
disabled source is left out of the extension list. With no enabled source, the
page lists only extensions that are already installed.

External sources require an ASCII-armored OpenPGP **public key**. Paste it into
**Signing public key**, choose **Check public key**, compare the fingerprint with
the provider, then **Save and trust source**. Private keys, expired keys and
multiple primary keys are rejected. Mirrors under built-in trusted URL prefixes
may leave the key blank.

The key and fingerprint are stored with the source and can be viewed or replaced
when editing it. Before refreshing indexes, the host rebuilds opkg's runtime
keyring from image keys and enabled custom sources. Changing a key, disabling or
deleting a source invalidates cached indexes; the next refresh drops keys no
longer in use. opkg uses a shared keyring, so adding a key trusts that provider's
package signatures.

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
each entry. Version comparison follows opkg ordering, including numeric
components, epochs, and recipe revisions. After an OS slot switch, when
package metadata is unavailable, only a newer extension version is offered.

## License

This project is licensed under the GNU General Public License v3.0. See
[`LICENSE`](LICENSE).
