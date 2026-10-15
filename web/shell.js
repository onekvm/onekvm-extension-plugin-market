(() => {
  const runtime = window.OneKVMPluginUI.v1

  runtime.shell.register('plugin-marketplace', {
    apiVersion: 1,
    methods: {
      listPackages: (host) => host.invoke('list_packages'),
      installPackage: (host, payload) => host.invoke('install_package', payload),
      installProgress: (host) => host.invoke('install_progress'),
    },
  })
})()
