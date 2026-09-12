(() => {
  const runtime = window.OneKVMPluginUI.v1
  const { computed, defineComponent, h, onMounted, ref } = runtime.vue
  const { NAlert, NButton, NInput, NSpace, NText, useMessage } = runtime.naive
  const labels = runtime.i18n.createMessages({
    'zh-TW': {
      title: '軟體包源',
      description: '編輯 /etc/opkg/onekvm-feed.conf。僅允許 src/gz 行；安裝與刷新仍走簽名 feed 與 onekvm-extension。跨版本升級請使用計劃中的 onekvm-upgrade。',
      placeholder: 'src/gz onekvm-metadata https://updates.onekvm.org/nanokvm/0.2.0/all\nsrc/gz onekvm-riscv64imafdc https://updates.onekvm.org/nanokvm/0.2.0/riscv64imafdc',
      load: '重新載入',
      save: '儲存軟體包源',
      saved: '軟體包源已儲存',
      empty: '尚未設定軟體包源',
    },
    zh: {
      title: '软件包源',
      description: '编辑 /etc/opkg/onekvm-feed.conf。只允许 src/gz 行；安装与刷新仍走签名 feed 与 onekvm-extension。跨版本升级请使用计划中的 onekvm-upgrade。',
      placeholder: 'src/gz onekvm-metadata https://updates.onekvm.org/nanokvm/0.2.0/all\nsrc/gz onekvm-riscv64imafdc https://updates.onekvm.org/nanokvm/0.2.0/riscv64imafdc',
      load: '重新加载',
      save: '保存软件包源',
      saved: '软件包源已保存',
      empty: '尚未配置软件包源',
    },
    en: {
      title: 'Package feed',
      description: 'Edit /etc/opkg/onekvm-feed.conf. Only src/gz lines are accepted. Install and refresh still use the signed feed through onekvm-extension. Cross-version upgrades use the planned onekvm-upgrade package.',
      placeholder: 'src/gz onekvm-metadata https://updates.onekvm.org/nanokvm/0.2.0/all\nsrc/gz onekvm-riscv64imafdc https://updates.onekvm.org/nanokvm/0.2.0/riscv64imafdc',
      load: 'Reload',
      save: 'Save feed',
      saved: 'Package feed saved',
      empty: 'No package feed configured yet',
    },
  })

  const styles = [`
.plugin-market-page { display: grid; gap: 12px; }
.plugin-market-page textarea { min-height: 180px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.plugin-market-actions { display: flex; justify-content: flex-end; gap: 8px; }
`]

  const Page = defineComponent({
    name: 'PluginMarketPage',
    props: { host: { type: Object, required: true } },
    setup(props) {
      const feedsText = ref('')
      const saved = ref('')
      const loading = ref(false)
      const saving = ref(false)
      const error = ref('')
      const message = useMessage()
      const dirty = computed(() => feedsText.value !== saved.value)

      async function loadFeeds() {
        loading.value = true
        error.value = ''
        try {
          const response = await props.host.invoke('get_feeds')
          const text = typeof response?.feeds_text === 'string' ? response.feeds_text : ''
          feedsText.value = text
          saved.value = text
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        } finally {
          loading.value = false
        }
      }

      async function saveFeeds() {
        saving.value = true
        error.value = ''
        try {
          await props.host.invoke('set_feeds', { feeds_text: feedsText.value })
          saved.value = feedsText.value
          message.success(labels.saved)
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        } finally {
          saving.value = false
        }
      }

      onMounted(loadFeeds)

      return () => h('section', { class: 'plugin-market-page' }, [
        h(NText, { strong: true }, { default: () => labels.title }),
        h(NText, { depth: 3 }, { default: () => labels.description }),
        error.value ? h(NAlert, { type: 'error', showIcon: false }, { default: () => error.value }) : null,
        h(NInput, {
          type: 'textarea',
          value: feedsText.value,
          disabled: loading.value || saving.value,
          placeholder: labels.placeholder,
          autosize: { minRows: 8, maxRows: 18 },
          'onUpdate:value': (value) => { feedsText.value = value },
        }),
        !feedsText.value && !loading.value
          ? h(NText, { depth: 3 }, { default: () => labels.empty })
          : null,
        h('div', { class: 'plugin-market-actions' }, [
          h(NSpace, null, {
            default: () => [
              h(NButton, { disabled: loading.value || saving.value, onClick: loadFeeds }, { default: () => labels.load }),
              h(NButton, {
                type: 'primary',
                loading: saving.value,
                disabled: loading.value || !dirty.value,
                onClick: saveFeeds,
              }, { default: () => labels.save }),
            ],
          }),
        ]),
      ])
    },
  })

  runtime.register('plugin-market', {
    apiVersion: 1,
    component: Page,
    styles,
  })
})()
