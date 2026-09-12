# OneKVM plugin marketplace

Configures the signed extension package feed by writing
`/etc/opkg/onekvm-feed.conf`. Requires the `opkg-admin` sandbox permission.

Cross-version upgrades (for example `nanokvm/0.1.0` → `0.2.0`) are not done by
retargeting this file alone; use the planned `onekvm-upgrade` package because
the jump may include kernel/ABI changes. See `docs/package-feeds.md`.

## Build

```sh
make
make install DESTDIR=/tmp/root PREFIX=/data/onekvm/apps/plugin-market/0.1.0 \
  VERSION=0.1.0 ARCH=riscv64
```

## Methods

- `get_feeds` → `{ "feeds_text": "..." }`
- `set_feeds` with `{ "feeds_text": "..." }` validates and atomically replaces the feed file
