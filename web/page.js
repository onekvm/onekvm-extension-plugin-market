(() => {
  const runtime = window.OneKVMPluginUI.v1
  const { computed, defineComponent, h, onMounted, ref, watch } = runtime.vue
  const {
    NAlert, NButton, NCard, NEmpty, NForm, NFormItem, NInput, NModal, NProgress, NSelect, NSpin, NSwitch, NTabPane, NTabs, NTag,
    useDialog, useMessage,
  } = runtime.naive
  const lucideIcons = runtime.icons || {}
  const ExtensionDetailsDialog = runtime.dialogs?.ExtensionDetails || null
  const InfoIcon = lucideIcons.Info || null
  const BoxIcon = lucideIcons.Box || null
  const DownloadIcon = lucideIcons.Download || null
  const TrashIcon = lucideIcons.Trash2 || lucideIcons.Trash || null
  const RefreshIcon = lucideIcons.RefreshCw || null
  const PlusIcon = lucideIcons.Plus || null
  const PencilIcon = lucideIcons.Pencil || lucideIcons.PenLine || null
  const PackageCheckIcon = lucideIcons.PackageCheck || lucideIcons.Package || BoxIcon
  const CheckCircleIcon = lucideIcons.CircleCheck
    || lucideIcons.CheckCircle2
    || lucideIcons.CheckCircle
    || lucideIcons.CircleCheckBig
    || PackageCheckIcon

  const labels = runtime.i18n.createMessages({
    'zh-TW': {
      packagesTab: '外掛',
      sourcesTab: '軟體包源',
      packagesDescription: '從軟體源直接安裝可用外掛。',
      storageLabel: '儲存空間已用 {used} / {total}',
      searchPlaceholder: '搜尋外掛',
      allStatuses: '全部狀態',
      allTypes: '全部類型',
      kindProtocol: '協定',
      kindService: '服務',
      kindNetwork: '組網與穿透',
      kindEnvironment: '執行環境',
      kindCloudProvider: '雲端服務',
      filteredCount: '顯示 {visible} / {total}',
      emptyFiltered: '沒有符合搜尋或篩選條件的外掛',
      packageSize: '下載 {size}',
      unpackedSize: '安裝後 {size}',
      sourcesDescription: '系統源由映像寫入，內容只讀，但可以停用。自訂源可停用、編輯或刪除。停用後該源不參與外掛列表。',
      builtinSource: '系統源',
      builtin: '內建',
      custom: '自訂',
      disabled: '已停用',
      addSource: '新增源',
      editSource: '編輯源',
      name: '名稱',
      namePlaceholder: '例如 內部鏡像',
      key: '識別',
      keyPlaceholder: '例如 mirror',
      keyHint: '只能使用小寫字母、數字和連字符',
      feeds: 'src 內容',
      placeholder: 'src onekvm-riscv64imafdc https://updates.example.org/nanokvm/0.2.0/riscv64imafdc',
      load: '重新整理',
      add: '新增',
      save: '儲存',
      remove: '刪除',
      edit: '編輯',
      details: '詳情',
      install: '安裝',
      update: '更新',
      updateAvailable: '有更新',
      checkUpdates: '檢查更新',
      updateConfirmTitle: '更新外掛',
      updateConfirm: '將「{name}」從 {current} 更新至 {latest}？更新期間外掛會暫時停止，設定和啟用狀態會保留。',
      updatingNamed: '正在更新 {name}',
      updatingDescription: '正在下載並更新，請勿關閉此視窗。',
      updateComplete: '外掛更新完成',
      updateCompleteDescription: '{name} 已更新至 {latest}。',
      preparingUpdate: '正在準備更新',
      uninstall: '解除安裝',
      cancel: '取消',
      installed: '已安裝',
      available: '可安裝',
      saved: '軟體包源已儲存',
      removed: '軟體包源已刪除',
      installOk: '外掛已安裝',
      removeOk: '外掛已解除安裝',
      installConfirmTitle: '安裝外掛',
      installConfirm: '確定安裝「{name}」？將從軟體包源下載並安裝到本機。',
      installingNamed: '正在安裝 {name}',
      installingDescription: '正在從軟體包源下載並安裝，請勿關閉此視窗。',
      downloadingNamed: '正在下載 {name}',
      downloadingDescription: '正在從軟體包源下載，請勿關閉此視窗。',
      preparingInstall: '正在準備安裝',
      progressBytes: '{received} / {total}',
      installComplete: '外掛安裝完成',
      installCompleteDescription: '{name} 已經可以使用。',
      done: '完成',
      uninstallConfirmTitle: '解除安裝',
      uninstallConfirm: '確定解除安裝「{name}」？外掛資料可能會保留。',
      removeSourceConfirmTitle: '刪除軟體包源',
      removeSourceConfirm: '確定刪除源「{name}」？',
      installing: '正在安裝 {name}…',
      uninstalling: '正在解除安裝 {name}…',
      emptyPackages: '尚無可用外掛',
      noPackageSource: '尚未設定可用的軟體包源，目前只能顯示已安裝外掛。請到「軟體包源」查看。',
      emptySources: '尚無軟體包源',
      pathHint: '檔案',
    },
    zh: {
      packagesTab: '插件',
      sourcesTab: '软件包源',
      packagesDescription: '从软件源直接安装可用插件。',
      storageLabel: '存储空间已用 {used} / {total}',
      searchPlaceholder: '搜索插件',
      allStatuses: '全部状态',
      allTypes: '全部类型',
      kindProtocol: '协议',
      kindService: '服务',
      kindNetwork: '组网与穿透',
      kindEnvironment: '运行环境',
      kindCloudProvider: '云服务',
      filteredCount: '显示 {visible} / {total}',
      emptyFiltered: '没有符合搜索或筛选条件的插件',
      packageSize: '下载 {size}',
      unpackedSize: '安装后 {size}',
      sourcesDescription: '系统源由镜像写入，内容只读，但可以停用。自定义源可停用、编辑或删除。停用后该源不参与插件列表。',
      builtinSource: '系统源',
      builtin: '内置',
      custom: '自定义',
      disabled: '已停用',
      addSource: '添加源',
      editSource: '编辑源',
      name: '名称',
      namePlaceholder: '例如 内部镜像',
      key: '标识',
      keyPlaceholder: '例如 mirror',
      keyHint: '只能使用小写字母、数字和连字符',
      feeds: 'src 内容',
      placeholder: 'src onekvm-riscv64imafdc https://updates.example.org/nanokvm/0.2.0/riscv64imafdc',
      load: '刷新',
      add: '添加',
      save: '保存',
      remove: '删除',
      edit: '编辑',
      details: '详情',
      install: '安装',
      update: '更新',
      updateAvailable: '有更新',
      checkUpdates: '检查更新',
      updateConfirmTitle: '更新插件',
      updateConfirm: '将「{name}」从 {current} 更新至 {latest}？更新期间插件会暂时停止，设置和启用状态会保留。',
      updatingNamed: '正在更新 {name}',
      updatingDescription: '正在下载并更新，请勿关闭此窗口。',
      updateComplete: '插件更新完成',
      updateCompleteDescription: '{name} 已更新至 {latest}。',
      preparingUpdate: '正在准备更新',
      uninstall: '卸载',
      cancel: '取消',
      installed: '已安装',
      available: '可安装',
      saved: '软件包源已保存',
      removed: '软件包源已删除',
      installOk: '插件已安装',
      removeOk: '插件已卸载',
      installConfirmTitle: '安装插件',
      installConfirm: '确定安装「{name}」？将从软件包源下载并安装到本机。',
      installingNamed: '正在安装 {name}',
      installingDescription: '正在从软件包源下载并安装，请勿关闭此窗口。',
      downloadingNamed: '正在下载 {name}',
      downloadingDescription: '正在从软件源下载，请勿关闭此窗口。',
      preparingInstall: '正在准备安装',
      progressBytes: '{received} / {total}',
      installComplete: '插件安装完成',
      installCompleteDescription: '{name} 已经可以使用。',
      done: '完成',
      uninstallConfirmTitle: '卸载插件',
      uninstallConfirm: '确定卸载「{name}」？插件数据可能会保留。',
      removeSourceConfirmTitle: '删除软件包源',
      removeSourceConfirm: '确定删除源「{name}」？',
      installing: '正在安装 {name}…',
      uninstalling: '正在卸载 {name}…',
      emptyPackages: '暂无可用插件',
      noPackageSource: '尚未配置可用的软件包源，目前只能显示已安装插件。请到「软件包源」查看。',
      emptySources: '暂无软件包源',
      pathHint: '文件',
    },
    en: {
      packagesTab: 'Extensions',
      sourcesTab: 'Package sources',
      packagesDescription: 'Install available extensions directly from the package source.',
      storageLabel: 'Storage {used} used / {total}',
      searchPlaceholder: 'Search extensions',
      allStatuses: 'All statuses',
      allTypes: 'All types',
      kindProtocol: 'Protocol',
      kindService: 'Service',
      kindNetwork: 'Networking & tunnels',
      kindEnvironment: 'Environment',
      kindCloudProvider: 'Cloud service',
      filteredCount: 'Showing {visible} of {total}',
      emptyFiltered: 'No extensions match the current search and filters',
      packageSize: 'Download {size}',
      unpackedSize: 'Installed {size}',
      sourcesDescription: 'The system source is written by the image. Its content is read-only here, but you can disable it. You can disable, edit, or remove custom sources. Disabled sources are not used for the package list.',
      builtinSource: 'System source',
      builtin: 'Built-in',
      custom: 'Custom',
      disabled: 'Disabled',
      addSource: 'Add source',
      editSource: 'Edit source',
      name: 'Name',
      namePlaceholder: 'e.g. Internal mirror',
      key: 'Key',
      keyPlaceholder: 'e.g. mirror',
      keyHint: 'Use lowercase letters, numbers, and hyphens',
      feeds: 'src content',
      placeholder: 'src onekvm-riscv64imafdc https://updates.example.org/nanokvm/0.2.0/riscv64imafdc',
      load: 'Refresh',
      add: 'Add',
      save: 'Save',
      remove: 'Remove',
      edit: 'Edit',
      details: 'Details',
      install: 'Install',
      update: 'Update',
      updateAvailable: 'Update available',
      checkUpdates: 'Check for updates',
      updateConfirmTitle: 'Update extension',
      updateConfirm: 'Update “{name}” from {current} to {latest}? The extension will stop briefly. Settings and enabled state will be kept.',
      updatingNamed: 'Updating {name}',
      updatingDescription: 'Downloading and updating. Do not close this window.',
      updateComplete: 'Extension updated',
      updateCompleteDescription: '{name} has been updated to {latest}.',
      preparingUpdate: 'Preparing to update',
      uninstall: 'Uninstall',
      cancel: 'Cancel',
      installed: 'Installed',
      available: 'Available',
      saved: 'Package source saved',
      removed: 'Package source removed',
      installOk: 'Extension installed',
      removeOk: 'Extension uninstalled',
      installConfirmTitle: 'Install extension',
      installConfirm: 'Install “{name}”? It will be downloaded from the package source and installed on this device.',
      installingNamed: 'Installing {name}',
      installingDescription: 'Downloading from the package source and installing. Do not close this window.',
      downloadingNamed: 'Downloading {name}',
      downloadingDescription: 'Downloading from the package source. Do not close this window.',
      preparingInstall: 'Preparing to install',
      progressBytes: '{received} / {total}',
      installComplete: 'Extension installed',
      installCompleteDescription: '{name} is ready to use.',
      done: 'Done',
      uninstallConfirmTitle: 'Uninstall extension',
      uninstallConfirm: 'Uninstall “{name}”? Extension data may be kept.',
      removeSourceConfirmTitle: 'Remove package source',
      removeSourceConfirm: 'Remove source “{name}”?',
      installing: 'Installing {name}…',
      uninstalling: 'Uninstalling {name}…',
      emptyPackages: 'No extensions available',
      noPackageSource: 'No package source is configured. Only installed extensions can be shown. Check Package sources.',
      emptySources: 'No package sources yet',
      pathHint: 'File',
    },
  })

  function formatLabel(template, values) {
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => {
      const value = values?.[key]
      return value == null ? '' : String(value)
    })
  }

  const styles = [`
.plugin-marketplace-page { display: grid; gap: 10px; }
.plugin-marketplace-heading {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted-foreground);
  font-size: 12px;
}
.plugin-marketplace-heading-meta {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}
.plugin-marketplace-storage-meter {
  display: grid;
  width: 210px;
  gap: 5px;
}
.plugin-marketplace-storage {
  color: var(--muted-foreground);
  font-size: 12px;
  white-space: nowrap;
}
.plugin-marketplace-catalog-tools {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 150px 150px auto;
  align-items: center;
  gap: 8px;
}
.plugin-marketplace-filter-count {
  color: var(--muted-foreground);
  font-size: 11px;
  text-align: right;
  white-space: nowrap;
}
.plugin-marketplace-size-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.plugin-marketplace-tab-body { display: grid; gap: 10px; padding-top: 2px; }
.plugin-marketplace-catalog-spin { min-height: 84px; }
.plugin-marketplace-catalog-spin.n-spin-container > .n-spin-body {
  top: var(--plugin-marketplace-spinner-top, 50%);
}
.plugin-marketplace-list {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
  background: var(--card);
  list-style: none;
}
.plugin-marketplace-item + .plugin-marketplace-item { border-top: 1px solid var(--border); }
.plugin-marketplace-row {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 9px;
  padding: 7px 12px;
  background: transparent;
}
.plugin-marketplace-row:hover { background: var(--accent); }
.plugin-marketplace-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  color: var(--muted-foreground);
}
.plugin-marketplace-icon img {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.plugin-marketplace-identity { display: grid; min-width: 0; flex: 1; gap: 2px; }
.plugin-marketplace-identity > div { display: flex; min-width: 0; align-items: center; gap: 7px; }
.plugin-marketplace-identity > .plugin-marketplace-version {
  display: block;
  color: var(--muted-foreground);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.plugin-marketplace-identity strong {
  overflow: hidden;
  color: var(--foreground);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plugin-marketplace-identity p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 11px;
  line-height: 1.35;
}
.plugin-marketplace-actions-inline {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
}
.plugin-marketplace-installer { width: min(500px, calc(100vw - 28px)); }
.plugin-marketplace-installer-stage { display: grid; gap: 16px; min-height: 220px; }
.plugin-marketplace-installer-preview { display: flex; align-items: center; gap: 14px; }
.plugin-marketplace-installer-icon {
  position: relative;
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  place-items: center;
  border-radius: 16px;
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}
.plugin-marketplace-installer-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.plugin-marketplace-installer-success {
  background: color-mix(in srgb, var(--success) 16%, transparent);
  color: var(--success);
}
.plugin-marketplace-installer-check {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 999px;
  background: var(--card);
  color: var(--success);
}
.plugin-marketplace-installer-identity { display: grid; min-width: 0; gap: 4px; }
.plugin-marketplace-installer-identity strong {
  overflow: hidden;
  color: var(--foreground);
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plugin-marketplace-installer-identity span { color: var(--muted-foreground); font-size: 12px; }
.plugin-marketplace-installer-copy,
.plugin-marketplace-installer-description {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 12px;
  line-height: 1.55;
}
.plugin-marketplace-installer-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 250px;
  text-align: center;
}
.plugin-marketplace-installer-centered > strong { color: var(--foreground); font-size: 16px; }
.plugin-marketplace-installer-centered > span:not(.plugin-marketplace-installer-icon) { color: var(--muted-foreground); font-size: 12px; }
.plugin-marketplace-progress,
.plugin-marketplace-installer-centered .n-progress,
.plugin-marketplace-indeterminate {
  width: 100%;
  max-width: 360px;
  align-self: stretch;
  margin-inline: auto;
}
.plugin-marketplace-installer-actions { display: flex; width: 100%; align-items: center; justify-content: flex-end; gap: 8px; }
.plugin-marketplace-details-action { margin-right: auto; }
.plugin-marketplace-indeterminate {
  position: relative;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--muted);
}
.plugin-marketplace-indeterminate > span {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 42%;
  border-radius: inherit;
  background: var(--primary);
  animation: plugin-marketplace-progress 1.15s ease-in-out infinite;
}
@keyframes plugin-marketplace-progress {
  0% { left: -45%; }
  100% { left: 105%; }
}
.plugin-marketplace-source {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
}
.plugin-marketplace-source.is-disabled .plugin-marketplace-source-identity,
.plugin-marketplace-source.is-disabled .plugin-marketplace-feeds {
  opacity: 0.55;
}
.plugin-marketplace-source-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.plugin-marketplace-source-identity {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
}
.plugin-marketplace-source-identity > div {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}
.plugin-marketplace-source-identity strong {
  overflow: hidden;
  color: var(--foreground);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plugin-marketplace-feeds {
  margin: 0;
  overflow: auto;
  padding: 8px 10px;
  border-radius: var(--radius, 6px);
  background: var(--onekvm-surface-inset);
  color: var(--foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-all;
}
.plugin-marketplace-source-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 4px; }
.plugin-marketplace-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--muted-foreground);
}
.plugin-marketplace-field-hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--muted-foreground);
}
.plugin-marketplace-sources { display: grid; gap: 8px; }
.plugin-marketplace-source-editor { width: min(500px, calc(100vw - 28px)); }
.plugin-marketplace-source-form { display: grid; gap: 14px; }
.plugin-marketplace-source-editor-actions {
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 8px;
}
.plugin-marketplace-source-form textarea {
  min-height: 140px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
@media (max-width: 760px) {
  .plugin-marketplace-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .plugin-marketplace-heading-meta,
  .plugin-marketplace-heading > .n-button {
    width: 100%;
  }
  .plugin-marketplace-storage-meter { width: 100%; }
  .plugin-marketplace-catalog-tools { grid-template-columns: 1fr 1fr; }
  .plugin-marketplace-catalog-tools > .n-input { grid-column: 1 / -1; }
  .plugin-marketplace-filter-count { grid-column: 1 / -1; text-align: left; }
  .plugin-marketplace-source-editor-actions { justify-content: stretch; }
  .plugin-marketplace-source-editor-actions .n-button { flex: 1; }
}
`]

  const SOURCE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,62}$/

  function blankDraft() {
    return { key: '', name: '', feeds_text: '', path: '', savedKey: '', savedText: '' }
  }

  function validSourceKey(value) {
    return SOURCE_KEY_RE.test(String(value || '').trim())
  }

  function validSourceDisplayName(value) {
    const name = String(value || '').trim()
    return name.length > 0 && [...name].length <= 64 && !/[\n\r]/.test(name)
  }

  function sourceRecord(item) {
    const key = String(item?.key || item?.name || '')
    const name = String(item?.name || item?.key || '')
    const feeds_text = typeof item?.feeds_text === 'string' ? item.feeds_text : ''
    return {
      key,
      name,
      feeds_text,
      path: typeof item?.path === 'string' ? item.path : '',
      builtin: Boolean(item?.builtin),
      enabled: item?.enabled !== false,
      savedKey: key,
      savedText: feeds_text,
    }
  }

  function languageCandidates() {
    const language = typeof runtime.language === 'function'
      ? String(runtime.language() || '')
      : (document.documentElement.lang || navigator.language || 'en')
    const normalized = language.trim()
    const short = normalized.split(/[_-]/)[0] || ''
    const aliases = []
    if (normalized) aliases.push(normalized)
    if (short === 'zh') {
      if (/tw|hk|hant/i.test(normalized)) aliases.push('zh-TW', 'zh')
      else aliases.push('zh', 'zh-CN', 'zh-TW')
    } else if (short) {
      aliases.push(short)
    }
    aliases.push('default', 'en')
    return [...new Set(aliases.filter(Boolean))]
  }

  function localizedFields(entry) {
    const i18n = entry.i18n && typeof entry.i18n === 'object' ? entry.i18n : {}
    for (const key of languageCandidates()) {
      const item = i18n[key]
      if (item && typeof item === 'object') {
        const name = String(item.name || '').trim()
        const description = String(item.description || '').trim()
        if (name || description) {
          return {
            name: name || entry.name || entry.id,
            description: description || entry.description || '',
          }
        }
      }
    }
    return {
      name: entry.name || entry.id,
      description: entry.description || '',
    }
  }

  function lucideComponent(icon) {
    if (!icon || icon.source !== 'lucide' || !icon.name) return BoxIcon
    const name = String(icon.name)
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
    return lucideIcons[name] || BoxIcon
  }

  function customIconDataUrl(entry) {
    const fromField = typeof entry?.icon_data_url === 'string' ? entry.icon_data_url.trim() : ''
    if (fromField.startsWith('data:image/')) return fromField
    const fromIcon = typeof entry?.icon?.data === 'string' ? entry.icon.data.trim() : ''
    if (fromIcon.startsWith('data:image/')) return fromIcon
    return ''
  }

  function renderPackageIcon(entry, size = 20) {
    const dataUrl = customIconDataUrl(entry)
    if (dataUrl) {
      return h('img', { src: dataUrl, alt: '' })
    }
    const Icon = lucideComponent(entry.icon)
    return Icon ? h(Icon, { size }) : null
  }

  function formatStorageBytes(bytes) {
    const value = Number(bytes)
    if (!Number.isFinite(value) || value < 0) return ''
    if (value >= 1_000_000_000) {
      const scaled = value / 1_000_000_000
      return `${scaled.toFixed(scaled >= 10 ? 1 : 2)} GB`
    }
    if (value >= 1_000_000) {
      const scaled = value / 1_000_000
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)} MB`
    }
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)} kB`
    return `${Math.round(value)} B`
  }

  function formatPackageSize(bytes) {
    const value = Number(bytes)
    if (!Number.isFinite(value) || value <= 0) return ''
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KiB`
    return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MiB`
  }

  function packageSizeTexts(entry) {
    return {
      packageSize: formatPackageSize(entry.size_bytes),
      unpackedSize: formatPackageSize(entry.installed_size_bytes),
    }
  }

  function renderSizeBadges(entry) {
    const { packageSize, unpackedSize } = packageSizeTexts(entry)
    const badges = []
    if (packageSize) {
      badges.push(h(NTag, {
        size: 'tiny',
        bordered: false,
        round: true,
        type: 'info',
      }, { default: () => formatLabel(labels.packageSize, { size: packageSize }) }))
    }
    if (unpackedSize) {
      badges.push(h(NTag, {
        size: 'tiny',
        bordered: false,
        round: true,
      }, { default: () => formatLabel(labels.unpackedSize, { size: unpackedSize }) }))
    }
    if (!badges.length) return null
    return h('div', { class: 'plugin-marketplace-size-badges' }, badges)
  }

  const CatalogSpin = defineComponent({
    name: 'PluginMarketplaceCatalogSpin',
    props: { show: Boolean },
    setup(props, { slots }) {
      const spin = ref(null)
      watch([() => props.show, spin], ([show, instance], _previous, onCleanup) => {
        const element = instance?.$el
        if (!show || !element) return
        let frame = 0
        const clippingParents = []
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) {
            clippingParents.push(parent)
          }
        }
        function updatePosition() {
          frame = 0
          const rect = element.getBoundingClientRect()
          let top = Math.max(0, rect.top)
          let bottom = Math.min(window.innerHeight, rect.bottom)
          for (const parent of clippingParents) {
            const bounds = parent.getBoundingClientRect()
            const contentTop = bounds.top + parent.clientTop
            top = Math.max(top, contentTop)
            bottom = Math.min(bottom, contentTop + parent.clientHeight)
          }
          // Follow the viewport center, keeping the indicator inside the visible list.
          if (bottom > top) {
            const halfHeight = (element.querySelector('.n-spin-body')?.offsetHeight || 0) / 2
            const center = bottom - top < halfHeight * 2
              ? (top + bottom) / 2
              : Math.max(top + halfHeight, Math.min(window.innerHeight / 2, bottom - halfHeight))
            element.style.setProperty('--plugin-marketplace-spinner-top', `${center - rect.top}px`)
          }
        }
        function schedulePosition() {
          if (!frame) frame = window.requestAnimationFrame(updatePosition)
        }
        const observer = new ResizeObserver(schedulePosition)
        observer.observe(element)
        for (const parent of clippingParents) observer.observe(parent)
        window.addEventListener('scroll', schedulePosition, true)
        window.addEventListener('resize', schedulePosition)
        schedulePosition()
        onCleanup(() => {
          observer.disconnect()
          window.removeEventListener('scroll', schedulePosition, true)
          window.removeEventListener('resize', schedulePosition)
          if (frame) window.cancelAnimationFrame(frame)
        })
      }, { flush: 'post' })
      return () => h(NSpin, { ref: spin, class: 'plugin-marketplace-catalog-spin', show: props.show }, slots)
    },
  })

  const Page = defineComponent({
    name: 'PluginMarketPage',
    props: { host: { type: Object, required: true } },
    setup(props) {
      const activeTab = ref('packages')
      const packages = ref([])
      const sources = ref([])
      const catalogLoaded = ref(false)
      const hasEnabledSource = computed(() => sources.value.some((source) =>
        source.enabled && /^\s*src(?:\/gz)?\s+\S+\s+https?:\/\/\S+/m.test(source.feeds_text)))
      const storage = ref({ total_bytes: 0, available_bytes: 0, used_bytes: 0 })
      const searchQuery = ref('')
      const statusFilter = ref('all')
      const kindFilter = ref('all')
      const editorOpen = ref(false)
      const editor = ref(blankDraft())
      const loading = ref(false)
      const saving = ref(false)
      const togglingKey = ref('')
      const busyPackage = ref('')
      const busyAction = ref('')
      const detailsEntry = ref(null)
      const detailsOpen = ref(false)
      const installerPhase = ref('idle')
      const installerEntry = ref(null)
      const installerError = ref('')
      const installerProgress = ref({
        phase: '',
        percent: null,
        bytes: 0,
        total_bytes: 0,
        message: '',
        status: '',
      })
      const error = ref('')
      const message = useMessage()
      const dialog = useDialog()
      const statusOptions = computed(() => [
        { label: labels.allStatuses, value: 'all' },
        { label: labels.installed, value: 'installed' },
        { label: labels.available, value: 'available' },
        { label: labels.updateAvailable, value: 'updates' },
      ])
      const kindOptions = computed(() => [
        { label: labels.allTypes, value: 'all' },
        { label: labels.kindNetwork, value: 'network' },
        { label: labels.kindEnvironment, value: 'environment' },
        { label: labels.kindCloudProvider, value: 'cloud-provider' },
        { label: labels.kindProtocol, value: 'protocol' },
        { label: labels.kindService, value: 'service' },
      ])
      const filteredPackages = computed(() => {
        const query = searchQuery.value.trim().toLocaleLowerCase()
        return packages.value.filter((entry) => {
          if (statusFilter.value === 'installed' && !entry.installed) return false
          if (statusFilter.value === 'available' && entry.installed) return false
          if (statusFilter.value === 'updates' && !entry.update_available) return false
          if (kindFilter.value !== 'all' && entry.kind !== kindFilter.value) return false
          if (!query) return true
          const localized = localizedFields(entry)
          return [entry.id, entry.package, localized.name, localized.description]
            .some((value) => String(value || '').toLocaleLowerCase().includes(query))
        })
      })
      const showEmptyPackages = computed(() => !loading.value && filteredPackages.value.length === 0)
      const showEmptySources = computed(() => !loading.value && sources.value.length === 0)
      const editingExisting = computed(() => Boolean(editor.value.savedKey))
      const editorValid = computed(() => (
        validSourceKey(editor.value.key)
        && validSourceDisplayName(editor.value.name)
        && Boolean(String(editor.value.feeds_text || '').trim())
      ))
      const isBusy = computed(() => Boolean(busyPackage.value) || saving.value || togglingKey.value || installerPhase.value === 'installing')
      const storageText = computed(() => {
        const total = Number(storage.value.total_bytes) || 0
        const used = Number(storage.value.used_bytes) || 0
        if (total <= 0) return ''
        return formatLabel(labels.storageLabel, {
          used: formatStorageBytes(used),
          total: formatStorageBytes(total),
        })
      })
      const storagePercentage = computed(() => {
        const total = Number(storage.value.total_bytes) || 0
        const used = Number(storage.value.used_bytes) || 0
        if (total <= 0) return 0
        return Math.max(0, Math.min(100, Math.round(used / total * 100)))
      })
      const storageStatus = computed(() => {
        if (storagePercentage.value >= 90) return 'error'
        if (storagePercentage.value >= 75) return 'warning'
        return 'success'
      })

      async function loadAll(showSpinner = true, refresh = false) {
        if (showSpinner) loading.value = true
        error.value = ''
        try {
          const [packageResponse, sourceResponse] = await Promise.all([
            props.host.invoke('list_packages', { refresh }),
            props.host.invoke('list_sources'),
          ])
          const list = Array.isArray(packageResponse?.packages) ? packageResponse.packages : []
          packages.value = list.map((item) => ({
            id: String(item?.id || ''),
            package: String(item?.package || ''),
            name: String(item?.name || item?.id || ''),
            description: String(item?.description || ''),
            version: String(item?.version || ''),
            kind: String(item?.kind || 'service'),
            installed: Boolean(item?.installed),
            installed_version: String(item?.installed_version || ''),
            package_version: String(item?.package_version || ''),
            installed_package_version: String(item?.installed_package_version || ''),
            update_available: Boolean(item?.installed && item?.update_available),
            i18n: item?.i18n && typeof item.i18n === 'object' ? item.i18n : {},
            icon: item?.icon && typeof item.icon === 'object' ? item.icon : null,
            icon_data_url: typeof item?.icon_data_url === 'string' ? item.icon_data_url : '',
            size_bytes: Number(item?.size_bytes) || 0,
            installed_size_bytes: Number(item?.installed_size_bytes) || 0,
          })).filter((item) => item.id && item.package)
          storage.value = {
            total_bytes: Number(packageResponse?.storage?.total_bytes) || 0,
            available_bytes: Number(packageResponse?.storage?.available_bytes) || 0,
            used_bytes: Number(packageResponse?.storage?.used_bytes) || 0,
          }
          const sourceList = Array.isArray(sourceResponse?.sources) ? sourceResponse.sources : []
          sources.value = sourceList.map(sourceRecord)
          catalogLoaded.value = true
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        } finally {
          if (showSpinner) loading.value = false
        }
      }

      function packageDisplayName(entry) {
        return localizedFields(entry).name || entry.name || entry.id || entry.package
      }

      function packageVersions(entry) {
        const sameVersion = entry.installed_version === entry.version
        return {
          current: (sameVersion && entry.installed_package_version) || entry.installed_version,
          latest: (sameVersion && entry.package_version) || entry.version,
        }
      }

      function packageVersionText(entry) {
        const { current, latest } = packageVersions(entry)
        return entry.update_available ? `${current} → ${latest}` : (entry.installed_version || entry.version)
      }

      function idleProgress() {
        return {
          phase: '',
          percent: null,
          bytes: 0,
          total_bytes: 0,
          message: '',
          status: '',
        }
      }

      function closeInstaller() {
        if (installerPhase.value === 'installing') return
        const completed = installerPhase.value === 'success'
        installerPhase.value = 'idle'
        installerError.value = ''
        if (completed) window.dispatchEvent(new Event('onekvm:extensions-changed'))
      }

      function afterInstallerLeave() {
        if (installerPhase.value !== 'idle') return
        installerEntry.value = null
        installerProgress.value = idleProgress()
      }

      function openInstaller(entry) {
        installerEntry.value = entry
        installerError.value = ''
        installerProgress.value = idleProgress()
        installerPhase.value = 'confirm'
      }

      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
      }

      function readProgressPercent(progress) {
        const raw = progress?.percent
        if (raw != null && raw !== '') {
          const value = Number(raw)
          if (Number.isFinite(value)) return Math.max(0, Math.min(100, value))
        }
        const bytes = Number(progress?.bytes) || 0
        const total = Number(progress?.total_bytes) || 0
        if (total > 0 && bytes >= 0) {
          return Math.max(0, Math.min(99, Math.round((bytes / total) * 100)))
        }
        return null
      }

      async function waitForInstallProgress(packageName) {
        const deadline = Date.now() + 20 * 60 * 1000
        let sawJob = false
        while (Date.now() < deadline) {
          if (installerPhase.value !== 'installing') return
          const progress = await props.host.invoke('install_progress')
          const currentPackage = String(progress?.package || '')
          if (currentPackage && currentPackage !== packageName) {
            await sleep(250)
            continue
          }
          if (!currentPackage || progress?.status === 'idle' || progress?.phase === 'idle') {
            await sleep(250)
            continue
          }
          installerProgress.value = {
            phase: String(progress?.phase || ''),
            percent: readProgressPercent(progress),
            bytes: Number(progress?.bytes) || 0,
            total_bytes: Number(progress?.total_bytes) || 0,
            message: String(progress?.message || ''),
            status: String(progress?.status || ''),
          }
          const phase = installerProgress.value.phase
          const status = installerProgress.value.status
          if (progress?.active || status === 'running' || phase === 'prepare' || phase === 'download' || phase === 'install') {
            sawJob = true
          }
          if ((status === 'ok' || phase === 'done') && (sawJob || currentPackage === packageName)) {
            return
          }
          if (status === 'error' || phase === 'error') {
            throw new Error(String(progress?.error || 'install failed'))
          }
          await sleep(250)
        }
        throw new Error('install timed out')
      }

      async function runInstallerInstall() {
        const entry = installerEntry.value
        if (!entry || installerPhase.value === 'installing') return
        installerError.value = ''
        installerProgress.value = {
          phase: 'prepare',
          percent: null,
          bytes: 0,
          total_bytes: Number(entry.size_bytes) || 0,
          message: entry.update_available ? labels.preparingUpdate : labels.preparingInstall,
          status: 'running',
        }
        installerPhase.value = 'installing'
        busyPackage.value = entry.package
        busyAction.value = 'install'
        try {
          const result = await props.host.invoke('install_package', {
            package: entry.package,
            wait: false,
            size_bytes: Number(entry.size_bytes) || 0,
          })
          if (result?.status === 'started' || result?.status === 'ok') {
            await waitForInstallProgress(entry.package)
          } else if (result?.status) {
            throw new Error(String(result.status))
          } else {
            await waitForInstallProgress(entry.package)
          }
          installerPhase.value = 'success'
          await loadAll()
        } catch (reason) {
          installerError.value = reason instanceof Error ? reason.message : String(reason)
          installerPhase.value = 'confirm'
        } finally {
          busyPackage.value = ''
          busyAction.value = ''
        }
      }

      function confirmInstall(entry) {
        openInstaller(entry)
      }

      async function confirmUninstall(entry) {
        const uninstall = props.host.uninstallExtension
        if (typeof uninstall !== 'function') {
          error.value = 'Host uninstallExtension is unavailable'
          return
        }
        error.value = ''
        try {
          const uninstalled = await uninstall({
            id: entry.id,
            name: packageDisplayName(entry),
          })
          if (uninstalled) await loadAll(false)
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        }
      }

      function sourceKey(entry) {
        return entry.builtin ? 'builtin:onekvm' : `custom:${entry.key || entry.savedKey}`
      }

      async function setSourceEnabled(entry, enabled) {
        if (Boolean(entry.enabled) === Boolean(enabled) || togglingKey.value) return
        togglingKey.value = sourceKey(entry)
        error.value = ''
        try {
          await props.host.invoke('set_source_enabled', {
            key: entry.builtin ? 'onekvm' : (entry.key || entry.savedKey),
            name: entry.builtin ? 'onekvm' : (entry.key || entry.savedKey),
            builtin: Boolean(entry.builtin),
            enabled: Boolean(enabled),
          })
          await loadAll(false)
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        } finally {
          togglingKey.value = ''
        }
      }

      async function saveSource(entry) {
        saving.value = true
        error.value = ''
        try {
          await props.host.invoke('set_source', {
            key: entry.key.trim(),
            name: entry.name.trim(),
            feeds_text: entry.feeds_text,
          })
          message.success(labels.saved)
          editorOpen.value = false
          editor.value = blankDraft()
          await loadAll()
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        } finally {
          saving.value = false
        }
      }

      function openAddSource() {
        editor.value = blankDraft()
        editorOpen.value = true
      }

      function openEditSource(entry) {
        editor.value = {
          key: entry.key,
          name: entry.name,
          feeds_text: entry.feeds_text,
          path: entry.path,
          savedKey: entry.savedKey || entry.key,
          savedText: entry.savedText,
        }
        editorOpen.value = true
      }

      function closeEditor() {
        if (saving.value) return
        editorOpen.value = false
        editor.value = blankDraft()
      }

      async function doRemoveSource(entry) {
        const key = entry.key
        const label = entry.name || entry.key
        saving.value = true
        error.value = ''
        const loadingToast = message.loading(formatLabel(labels.removeSourceConfirm, { name: label }), { duration: 0 })
        try {
          await props.host.invoke('remove_source', { key, name: key })
          message.success(labels.removed)
          await loadAll()
        } catch (reason) {
          error.value = reason instanceof Error ? reason.message : String(reason)
        } finally {
          if (loadingToast && typeof loadingToast.destroy === 'function') loadingToast.destroy()
          saving.value = false
        }
      }

      function confirmRemoveSource(entry) {
        const label = entry.name || entry.key
        dialog.warning({
          title: labels.removeSourceConfirmTitle,
          content: formatLabel(labels.removeSourceConfirm, { name: label }),
          positiveText: labels.remove,
          negativeText: labels.cancel,
          onPositiveClick: () => doRemoveSource(entry),
        })
      }

      onMounted(loadAll)

      function openDetails(entry) {
        detailsEntry.value = entry
        detailsOpen.value = true
      }

      function renderDetailsButton(entry, installer = false) {
        if (!ExtensionDetailsDialog) return null
        return h(NButton, {
          size: 'small',
          secondary: !installer,
          class: installer ? 'plugin-marketplace-details-action' : undefined,
          disabled: isBusy.value,
          onClick: () => openDetails(entry),
        }, {
          icon: InfoIcon ? () => h(InfoIcon) : undefined,
          default: () => labels.details,
        })
      }

      function renderDetailsModal() {
        if (!ExtensionDetailsDialog || !detailsEntry.value) return null
        return h(ExtensionDetailsDialog, {
          show: detailsOpen.value,
          id: detailsEntry.value.id,
          name: packageDisplayName(detailsEntry.value),
          'onUpdate:show': (show) => { detailsOpen.value = show },
        })
      }

      function renderInstallerModal() {
        const phase = installerPhase.value
        const entry = installerEntry.value
        const installing = phase === 'installing'
        const updating = Boolean(entry?.update_available)
        const versions = entry ? packageVersions(entry) : { current: '', latest: '' }
        const show = phase !== 'idle'
        let body = null
        if (entry && phase === 'installing') {
          const progress = installerProgress.value
          const progressPhase = progress.phase || 'prepare'
          const percent = progress.percent
          const determinate = percent != null
          const name = packageDisplayName(entry)
          const title = progressPhase === 'download'
            ? formatLabel(labels.downloadingNamed, { name })
            : progressPhase === 'prepare'
              ? (updating ? labels.preparingUpdate : labels.preparingInstall)
              : formatLabel(updating ? labels.updatingNamed : labels.installingNamed, { name })
          const description = progressPhase === 'download'
            ? labels.downloadingDescription
            : (updating ? labels.updatingDescription : labels.installingDescription)
          const bytesText = progress.bytes > 0 || progress.total_bytes > 0
            ? formatLabel(labels.progressBytes, {
              received: formatStorageBytes(progress.bytes),
              total: formatStorageBytes(progress.total_bytes || progress.bytes),
            })
            : ''
          const statusText = [progress.message, bytesText].filter(Boolean).join(' · ')
          const heroIcon = progressPhase === 'install'
            ? (PackageCheckIcon ? h(PackageCheckIcon, { size: 31 }) : renderPackageIcon(entry, 31))
            : (DownloadIcon ? h(DownloadIcon, { size: 31 }) : renderPackageIcon(entry, 31))
          body = h('div', { class: 'plugin-marketplace-installer-stage plugin-marketplace-installer-centered' }, [
            h('span', { class: 'plugin-marketplace-installer-icon' }, [heroIcon]),
            h('strong', null, title),
            h('span', null, description),
            statusText ? h('span', null, statusText) : null,
            renderSizeBadges(entry),
            determinate
              ? h(NProgress, {
                class: 'plugin-marketplace-progress',
                type: 'line',
                percentage: percent,
                showIndicator: false,
                processing: true,
              })
              : h('div', {
                class: 'plugin-marketplace-indeterminate',
                role: 'progressbar',
                'aria-label': title,
              }, [h('span')]),
            determinate ? h('span', null, `${percent}%`) : null,
          ])
        } else if (entry && phase === 'success') {
          const name = packageDisplayName(entry)
          body = h('div', { class: 'plugin-marketplace-installer-stage plugin-marketplace-installer-centered' }, [
            h('span', { class: 'plugin-marketplace-installer-icon plugin-marketplace-installer-success' }, [
              renderPackageIcon(entry, 32),
              CheckCircleIcon
                ? h('span', { class: 'plugin-marketplace-installer-check' }, [
                  h(CheckCircleIcon, { size: 16 }),
                ])
                : null,
            ]),
            h('strong', null, updating ? labels.updateComplete : labels.installComplete),
            h('span', null, formatLabel(updating ? labels.updateCompleteDescription : labels.installCompleteDescription, { name, ...versions })),
          ])
        } else if (entry) {
          const localized = localizedFields(entry)
          const name = packageDisplayName(entry)
          body = h('div', { class: 'plugin-marketplace-installer-stage' }, [
            h('div', { class: 'plugin-marketplace-installer-preview' }, [
              h('span', { class: 'plugin-marketplace-installer-icon' }, [
                renderPackageIcon(entry),
              ]),
              h('div', { class: 'plugin-marketplace-installer-identity' }, [
                h('strong', null, localized.name || entry.id),
                entry.version ? h('span', null, packageVersionText(entry)) : null,
              ]),
            ]),
            localized.description
              ? h('p', { class: 'plugin-marketplace-installer-description' }, localized.description)
              : null,
            renderSizeBadges(entry),
            installerError.value
              ? h(NAlert, { type: 'error', showIcon: false }, { default: () => installerError.value })
              : null,
            h('p', { class: 'plugin-marketplace-installer-copy' }, formatLabel(updating ? labels.updateConfirm : labels.installConfirm, { name, ...versions })),
          ])
        }
        const footerButtons = []
        if (entry && phase === 'confirm') {
          footerButtons.push(
            renderDetailsButton(entry, true),
            h(NButton, { onClick: closeInstaller }, { default: () => labels.cancel }),
            h(NButton, { type: 'primary', onClick: runInstallerInstall }, { default: () => updating ? labels.update : labels.install }),
          )
        } else if (entry && phase === 'success') {
          footerButtons.push(
            h(NButton, { type: 'primary', onClick: closeInstaller }, { default: () => labels.done }),
          )
        }
        return h(NModal, {
          show,
          maskClosable: !installing,
          closeOnEsc: !installing,
          autoFocus: false,
          onUpdateShow: (next) => { if (!next) closeInstaller() },
          onAfterLeave: afterInstallerLeave,
        }, {
          default: () => entry
            ? h(NCard, {
              class: 'plugin-marketplace-installer',
              title: updating ? labels.updateConfirmTitle : labels.installConfirmTitle,
              closable: !installing,
              bordered: false,
              size: 'small',
              role: 'dialog',
              'aria-modal': 'true',
              onClose: closeInstaller,
            }, {
              default: () => body,
              footer: () => h('div', { class: 'plugin-marketplace-installer-actions' }, footerButtons),
            })
            : null,
        })
      }

      function renderPackage(entry) {
        const localized = localizedFields(entry)
        const rowBusy = busyPackage.value === entry.package
        return h('li', { class: 'plugin-marketplace-item' }, [
          h('div', { class: 'plugin-marketplace-row' }, [
            h('span', { class: 'plugin-marketplace-icon' }, [
              renderPackageIcon(entry),
            ]),
            h('div', { class: 'plugin-marketplace-identity' }, [
              h('div', null, [
                h('strong', null, localized.name || entry.id),
                entry.version && !entry.update_available
                  ? h(NTag, { size: 'tiny', bordered: false }, { default: () => packageVersionText(entry) })
                  : null,
              ]),
              entry.update_available
                ? h('div', { class: 'plugin-marketplace-version' }, packageVersionText(entry))
                : null,
              localized.description
                ? h('p', null, localized.description)
                : null,
              renderSizeBadges(entry),
            ]),
            h(NTag, {
              size: 'small',
              bordered: false,
              type: entry.update_available ? 'warning' : entry.installed ? 'success' : 'default',
            }, { default: () => (entry.update_available ? labels.updateAvailable : entry.installed ? labels.installed : labels.available) }),
            h('div', { class: 'plugin-marketplace-actions-inline' }, [
              renderDetailsButton(entry),
              entry.update_available
                ? h(NButton, {
                  size: 'small',
                  type: 'primary',
                  disabled: loading.value || isBusy.value,
                  loading: rowBusy && busyAction.value === 'install',
                  onClick: () => confirmInstall(entry),
                }, {
                  icon: DownloadIcon ? () => h(DownloadIcon) : undefined,
                  default: () => labels.update,
                })
                : null,
              entry.installed
                ? h(NButton, {
                  size: 'small',
                  secondary: true,
                  disabled: loading.value || isBusy.value,
                  onClick: () => confirmUninstall(entry),
                }, {
                  icon: TrashIcon ? () => h(TrashIcon) : undefined,
                  default: () => labels.uninstall,
                })
                : h(NButton, {
                  size: 'small',
                  type: 'primary',
                  disabled: loading.value || isBusy.value,
                  loading: rowBusy && busyAction.value === 'install',
                  onClick: () => confirmInstall(entry),
                }, {
                  icon: DownloadIcon ? () => h(DownloadIcon) : undefined,
                  default: () => labels.install,
                }),
            ]),
          ]),
        ])
      }

      function renderSource(entry) {
        const title = entry.builtin ? labels.builtinSource : (entry.name || entry.key)
        const rowBusy = togglingKey.value === sourceKey(entry)
        return h('div', {
          class: ['plugin-marketplace-source', { 'is-disabled': !entry.enabled }],
        }, [
          h('div', { class: 'plugin-marketplace-source-header' }, [
            h('div', { class: 'plugin-marketplace-source-identity' }, [
              h('div', null, [
                h('strong', null, title),
                h(NTag, {
                  size: 'tiny',
                  bordered: false,
                  type: entry.builtin ? 'success' : 'default',
                }, { default: () => (entry.builtin ? labels.builtin : labels.custom) }),
                entry.enabled
                  ? null
                  : h(NTag, {
                    size: 'tiny',
                    bordered: false,
                    type: 'warning',
                  }, { default: () => labels.disabled }),
              ]),
              entry.builtin || !entry.key
                ? null
                : h('div', { class: 'plugin-marketplace-path' }, entry.key),
              entry.path
                ? h('div', { class: 'plugin-marketplace-path' }, `${labels.pathHint}: ${entry.path}`)
                : null,
            ]),
            h('div', { class: 'plugin-marketplace-source-actions' }, [
              h(NSwitch, {
                size: 'small',
                value: Boolean(entry.enabled),
                disabled: loading.value || (isBusy.value && !rowBusy),
                loading: rowBusy,
                'onUpdate:value': (value) => { setSourceEnabled(entry, value) },
              }),
              entry.builtin
                ? null
                : h(NButton, {
                  size: 'small',
                  quaternary: true,
                  disabled: loading.value || isBusy.value,
                  onClick: () => openEditSource(entry),
                }, {
                  icon: PencilIcon ? () => h(PencilIcon) : undefined,
                  default: () => labels.edit,
                }),
              entry.builtin
                ? null
                : h(NButton, {
                  size: 'small',
                  quaternary: true,
                  type: 'error',
                  disabled: loading.value || isBusy.value,
                  onClick: () => confirmRemoveSource(entry),
                }, {
                  icon: TrashIcon ? () => h(TrashIcon) : undefined,
                  default: () => labels.remove,
                }),
            ]),
          ]),
          entry.feeds_text
            ? h('pre', { class: 'plugin-marketplace-feeds' }, entry.feeds_text.trim())
            : null,
        ])
      }

      function renderSourceEditor() {
        return h(NModal, {
          show: editorOpen.value,
          maskClosable: !saving.value,
          closeOnEsc: !saving.value,
          autoFocus: false,
          onUpdateShow: (next) => { if (!next) closeEditor() },
        }, {
          default: () => h(NCard, {
            class: 'plugin-marketplace-source-editor',
            title: editingExisting.value ? labels.editSource : labels.addSource,
            closable: !saving.value,
            bordered: false,
            size: 'small',
            role: 'dialog',
            'aria-modal': 'true',
            onClose: closeEditor,
          }, {
            default: () => h(NForm, {
              class: 'plugin-marketplace-source-form',
              labelPlacement: 'top',
              showFeedback: false,
            }, {
              default: () => [
                h(NFormItem, { label: labels.name }, {
                  default: () => h(NInput, {
                    value: editor.value.name,
                    disabled: loading.value || isBusy.value,
                    placeholder: labels.namePlaceholder,
                    maxlength: 64,
                    'onUpdate:value': (value) => { editor.value.name = value },
                  }),
                }),
                h(NFormItem, { label: labels.key }, {
                  default: () => [
                    h(NInput, {
                      value: editor.value.key,
                      disabled: loading.value || isBusy.value || editingExisting.value,
                      placeholder: labels.keyPlaceholder,
                      maxlength: 63,
                      'onUpdate:value': (value) => { editor.value.key = value },
                    }),
                    h('div', { class: 'plugin-marketplace-field-hint' }, labels.keyHint),
                  ],
                }),
                h(NFormItem, { label: labels.feeds }, {
                  default: () => h(NInput, {
                    type: 'textarea',
                    value: editor.value.feeds_text,
                    disabled: loading.value || isBusy.value,
                    placeholder: labels.placeholder,
                    autosize: { minRows: 8, maxRows: 16 },
                    'onUpdate:value': (value) => { editor.value.feeds_text = value },
                  }),
                }),
              ],
            }),
            footer: () => h('div', { class: 'plugin-marketplace-source-editor-actions' }, [
              h(NButton, { disabled: saving.value, onClick: closeEditor }, { default: () => labels.cancel }),
              h(NButton, {
                type: 'primary',
                loading: saving.value,
                disabled: loading.value || isBusy.value || !editorValid.value,
                onClick: () => saveSource(editor.value),
              }, { default: () => (editingExisting.value ? labels.save : labels.add) }),
            ]),
          }),
        })
      }

      return () => h('section', { class: 'plugin-marketplace-page' }, [
        error.value ? h(NAlert, { type: 'error', showIcon: false }, { default: () => error.value }) : null,
        renderDetailsModal(),
        renderInstallerModal(),
        renderSourceEditor(),
        h(NTabs, {
          value: activeTab.value,
          type: 'line',
          size: 'small',
          'onUpdate:value': (value) => { activeTab.value = value },
        }, {
          default: () => [
            h(NTabPane, { name: 'packages', tab: labels.packagesTab }, {
              default: () => h('div', { class: 'plugin-marketplace-tab-body' }, [
                catalogLoaded.value && !hasEnabledSource.value
                  ? h(NAlert, { type: 'warning', showIcon: false }, { default: () => labels.noPackageSource })
                  : null,
                h('header', { class: 'plugin-marketplace-heading' }, [
                  h('span', null, labels.packagesDescription),
                  h('div', { class: 'plugin-marketplace-heading-meta' }, [
                    storageText.value
                      ? h('div', { class: 'plugin-marketplace-storage-meter' }, [
                        h('span', { class: 'plugin-marketplace-storage' }, storageText.value),
                        h(NProgress, {
                          type: 'line',
                          percentage: storagePercentage.value,
                          showIndicator: false,
                          height: 5,
                          borderRadius: 3,
                          status: storageStatus.value,
                        }),
                      ])
                      : null,
                    h(NButton, {
                      size: 'small',
                      secondary: true,
                      disabled: loading.value || isBusy.value,
                      onClick: () => loadAll(true, true),
                    }, {
                      icon: RefreshIcon ? () => h(RefreshIcon) : undefined,
                      default: () => labels.checkUpdates,
                    }),
                  ]),
                ]),
                h('div', { class: 'plugin-marketplace-catalog-tools' }, [
                  h(NInput, {
                    value: searchQuery.value,
                    size: 'small',
                    clearable: true,
                    placeholder: labels.searchPlaceholder,
                    'onUpdate:value': (value) => { searchQuery.value = value },
                  }),
                  h(NSelect, {
                    value: statusFilter.value,
                    size: 'small',
                    options: statusOptions.value,
                    'onUpdate:value': (value) => { statusFilter.value = value },
                  }),
                  h(NSelect, {
                    value: kindFilter.value,
                    size: 'small',
                    options: kindOptions.value,
                    'onUpdate:value': (value) => { kindFilter.value = value },
                  }),
                  h('span', { class: 'plugin-marketplace-filter-count' }, formatLabel(labels.filteredCount, {
                    visible: filteredPackages.value.length,
                    total: packages.value.length,
                  })),
                ]),
                h(CatalogSpin, { show: loading.value }, {
                  default: () => (
                    showEmptyPackages.value
                      ? h(NEmpty, { description: packages.value.length ? labels.emptyFiltered : labels.emptyPackages })
                      : h('ul', { class: 'plugin-marketplace-list' }, filteredPackages.value.map((entry) => renderPackage(entry)))
                  ),
                }),
              ]),
            }),
            h(NTabPane, { name: 'sources', tab: labels.sourcesTab }, {
              default: () => h('div', { class: 'plugin-marketplace-tab-body' }, [
                h('header', { class: 'plugin-marketplace-heading' }, [
                  h('span', null, labels.sourcesDescription),
                  h(NButton, {
                    size: 'small',
                    type: 'primary',
                    disabled: loading.value || isBusy.value,
                    onClick: openAddSource,
                  }, {
                    icon: PlusIcon ? () => h(PlusIcon) : undefined,
                    default: () => labels.addSource,
                  }),
                ]),
                h(CatalogSpin, { show: loading.value }, {
                  default: () => (
                    showEmptySources.value
                      ? h(NEmpty, { description: labels.emptySources })
                      : h('div', { class: 'plugin-marketplace-sources' }, sources.value.map((entry) => renderSource(entry)))
                  ),
                }),
              ]),
            }),
          ],
        }),
      ])
    },
  })

  runtime.register('plugin-marketplace', {
    apiVersion: 1,
    component: Page,
    styles,
  })
})()
