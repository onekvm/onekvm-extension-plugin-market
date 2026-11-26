# OneKVM OE recipes for the plugin marketplace extension

This layer is pulled in through `onekvm-distro/kas/components.lock`.
For local builds before the GitHub remote exists:

```sh
ONEKVM_DEBUG_WORKTREES=onekvm-extension-plugin-marketplace make build extension plugin-marketplace
```
