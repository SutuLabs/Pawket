import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

const messages = {
  en: {
    message: {
      lang: 'English',
      confirm: 'Confirm',
      password: 'Password',
      refresh: 'Refresh',
      receive: 'Receive',
      send: 'Send',
      export: 'Export',
      accountExport: 'Account Export',
      address: 'Address',
      amount: 'Amount',
      memo: 'Memo',
      cancel: 'Cancel',
      submit: 'Submit',
      asset: 'Asset',
      activity: 'Activity',
      configure: 'Configure',
      maxAddress: 'Max privacy addresses to search',
      listingCATs: 'Listing CATs',
      lockPrompt: 'Lock?',
      link: 'Links',
      changePassword: 'Change Password',
      addCAT: 'Add a CAT',
      showMnemonic: 'Show Mnemonic',
      showMnemonicPrompt: 'Mnemonic is very sensitive, make sure you are safe and continue, OK?',
      mnemonic: 'Mnemonic',
      close: 'Close',
      addBySerial: 'Add By Serial',
      addByPassword: 'Add By Password',
      addByLegacy: 'Import Chia 24 Mnemonic words',
      selfTestMsg: 'Passed',
      bundle: 'Bundle',
      sign: 'Sign',
    }
  },
  zhcn: {
    message: {
      lang: '中文',
      confirm: '确认',
      password: '密码',
      refresh: '刷新',
      receive: '接收',
      send: '发送',
      export: '导出',
      accountExport: '账户导出',
      address: '地址',
      amount: '数量',
      memo: '便签',
      cancel: '取消',
      submit: '提交',
      asset: '资产',
      activity: '活动',
      configure: '参数',
      maxAddress: '最大隐私地址搜索数量',
      listingCATs: 'CAT列表',
      lockPrompt: '锁定?',
      link: '链接',
      changePassword: '修改密码',
      addCAT: '添加CAT',
      showMnemonic: '展示助记词',
      showMnemonicPrompt: '助记词是敏感信息, 确认要展示吗?',
      mnemonic: '助记词',
      close: '关闭',
      addBySerial: '序列添加',
      addByPassword: '通过密码添加',
      addByLegacy: '导入Chia 24位助记词',
      selfTestMsg: '运行环境测试通过',
      bundle: '数据',
      sign: '签名',
    }
  }
}

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: 'zhcn', // set locale
  messages, // set locale messages
})

export default i18n;