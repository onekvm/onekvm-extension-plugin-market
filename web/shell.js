(() => {
  const runtime = window.OneKVMPluginUI.v1

  runtime.shell.register('plugin-marketplace', {
    apiVersion: 1,
    methods: {
      listPackages: (host, payload) => host.invoke('list_packages', payload ?? null),
      installPackage: (host, payload) => host.invoke('install_package', payload),
      installProgress: (host) => host.invoke('install_progress'),
    },
  })
})()
