# onekvm-extension-plugin-market

Marketplace UI for browsing signed `onekvm-extension-*` packages from the
configured opkg feed, installing/updating/removing them, and managing custom feed
sources under `/etc/opkg/onekvm-ext-{name}.conf`.

The type filter follows the manifest's `kind`: `network` groups VPNs, mesh
networking, tunnels, and DDNS under **Networking & tunnels**. Media protocols,
cloud providers, and other services retain their own types.

Requires the `opkg-admin` sandbox permission. Package listing reads
`/data/pkg-state/opkg/lists`. Install/remove are executed by the extension
host (privileged), not inside the marketplace sandbox.

`web/shell.js` registers package listing, online installation, and installation
progress methods with the OneKVM Shell. Other first-party pages, such as Cloud
Services, consume those methods instead of receiving package-manager access.

System/default feeds stay in `/etc/opkg/onekvm-feed.conf` and are not edited by
this extension. The host loads both when applying signed-feed policy.

Choose **Check for updates** to refresh the signed package indexes. Installed
plugins with a newer package show an **Update** action and the current/target
versions; the status filter can show only updates. Version comparison follows
opkg ordering, including numeric components, epochs and recipe revisions.
An installed development package is not offered an older release as an update.
Updates use the regular download/install progress dialog, briefly stop the
plugin, and preserve its settings and enabled state.

The host's `list_packages` method accepts `{ "refresh": true }` and returns
`installed_version`, `package_version`, `installed_package_version` and
`update_available` for each entry. When package metadata is unavailable after
an OS slot switch, only a newer extension version is offered. Local-only
plugins remain listed without an online update action.
